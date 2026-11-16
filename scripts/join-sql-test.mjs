import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
/** Runs migration 0017 on an in-process Postgres (PGlite) and checks the join-code rules. `npm run test:join:sql` */
const here = path.dirname(fileURLToPath(import.meta.url));
const db = new PGlite();
process.on("unhandledRejection", (e) => { console.log("CRASH:", String(e.message).slice(0, 200)); process.exit(1); });
await db.exec(`
create schema auth;
create role anon; create role authenticated;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
create type role as enum ('admin','teacher','student');
create type class_status as enum ('upcoming','active','finished','cancelled');
create table public.profiles(id uuid primary key, role role not null default 'student', full_name text);
create table public.classes(id uuid primary key default gen_random_uuid(), title text, teacher_id uuid references profiles(id), status class_status not null default 'active', capacity int);
create table public.enrollments(id uuid primary key default gen_random_uuid(), student_id uuid not null references profiles(id), class_id uuid not null references classes(id), level text, progress integer default 0, unique(student_id,class_id));
create function public.is_admin() returns boolean language sql stable security definer as $$ select coalesce((select role='admin' from public.profiles where id=auth.uid()),false) $$;
`);
const A="00000000-0000-0000-0000-00000000000a", T1="00000000-0000-0000-0000-0000000000c1", T2="00000000-0000-0000-0000-0000000000c2";
const S=(n)=>`00000000-0000-0000-0000-0000000001${String(n).padStart(2,"0")}`;
await db.exec(`insert into auth.users values ('${A}'),('${T1}'),('${T2}'); insert into profiles values ('${A}','admin','Admin'),('${T1}','teacher','T1'),('${T2}','teacher','T2');`);
// a class that exists BEFORE the migration -> must be backfilled
await db.exec(`insert into classes(id,title,teacher_id) values ('11111111-1111-1111-1111-111111111111','Old class','${T1}')`);
await db.exec(fs.readFileSync(path.join(here, "../supabase/migrations/0017_class_join_codes.sql"), "utf8"));
// the real profiles RLS from 0001, so the 0018 policy is tested against it
await db.exec(`alter table public.profiles enable row level security;
create policy "profiles read" on public.profiles for select using (role = 'teacher' or id = auth.uid() or public.is_admin());`);
await db.exec(fs.readFileSync(path.join(here, "../supabase/migrations/0018_teacher_student_links.sql"), "utf8"));
console.log("migration applied OK");

let pass=0, fail=0;
const ok=(n,c)=>{ if(c){pass++;console.log("  ✓",n)}else{fail++;console.log("  ✗ FAIL",n)} };
const throws=async(n,fn,m)=>{ try{await fn();fail++;console.log("  ✗ FAIL (no error)",n)}catch(e){const s=String(e.message); if(!m||s.toLowerCase().includes(m.toLowerCase())){pass++;console.log("  ✓",n,"→",s.slice(0,64))}else{fail++;console.log("  ✗ FAIL wrong error",n,s)}}};
const q=async(s)=>(await db.query(s)).rows;
const as=(u)=>db.exec(`select set_config('request.jwt.claim.sub','${u??""}',false)`);
for (let i=1;i<=14;i++) await db.exec(`insert into auth.users values ('${S(i)}'); insert into profiles values ('${S(i)}','student','S${i}')`);
const join=async(code)=>(await db.query(`select * from join_class_by_code('${code}')`)).rows[0];
const OLD="11111111-1111-1111-1111-111111111111";

// RLS needs a non-superuser role
await db.exec(`grant usage on schema public, auth to authenticated; grant all on all tables in schema public to authenticated; grant all on all sequences in schema public to authenticated; grant execute on all functions in schema public to authenticated;`);
const asRole=async(u,fn)=>{ await as(u); await db.exec(`set role authenticated`); try{ return await fn(); } finally{ await db.exec(`reset role`);} };

console.log("\n# codes");
const old=(await q(`select code from class_join_codes where class_id='${OLD}'`))[0];
ok("existing class was backfilled with a code",!!old&&/^[A-HJKMNP-TV-Z2-9]{8}$/.test(old.code));
const nc=(await q(`insert into classes(title,teacher_id,capacity) values ('New class','${T2}',2) returning id`))[0].id;
ok("new class gets a code from the trigger",(await q(`select count(*)::int n from class_join_codes where class_id='${nc}'`))[0].n===1);
const code=(id)=>q(`select code from class_join_codes where class_id='${id}'`).then(r=>r[0].code);
ok("codes are unique across classes",(await code(nc))!==old.code);

console.log("\n# who can read codes (RLS)");
ok("a student cannot read any join code",(await asRole(S(1),()=>q(`select * from class_join_codes`))).length===0);
ok("the class's own teacher sees only their class code",(await asRole(T1,()=>q(`select * from class_join_codes`))).length===1);
ok("another teacher does not see it",(await asRole(T2,()=>q(`select class_id from class_join_codes`))).every(r=>r.class_id!==OLD));
ok("admin sees all codes",(await asRole(A,()=>q(`select * from class_join_codes`))).length===2);
await asRole(S(1),()=>db.exec(`update class_join_codes set code='AAAAAAAA'`)).catch(()=>{});
ok("a student cannot overwrite a code directly",(await q(`select count(*)::int n from class_join_codes where code='AAAAAAAA'`))[0].n===0);

console.log("\n# joining with a code");
await as(S(1));
let r=await join(old.code.slice(0,4)+"-"+old.code.slice(4).toLowerCase());
ok("lower-case + dash formatted code joins instantly",r.out_status==="joined"&&r.out_class_id===OLD);
ok("enrollment row created",(await q(`select count(*)::int n from enrollments where student_id='${S(1)}' and class_id='${OLD}'`))[0].n===1);
r=await join(old.code); ok("joining again → already (no duplicate)",r.out_status==="already"&&(await q(`select count(*)::int n from enrollments`))[0].n===1);
r=await join("ZZZZZZZZ"); ok("wrong code → invalid",r.out_status==="invalid");

console.log("\n# capacity (class holds 2)");
const ncode=await code(nc);
await as(S(2)); ok("seat 1",(await join(ncode)).out_status==="joined");
await as(S(3)); ok("seat 2",(await join(ncode)).out_status==="joined");
await as(S(4)); ok("third student → full",(await join(ncode)).out_status==="full");
ok("no extra enrollment created",(await q(`select count(*)::int n from enrollments where class_id='${nc}'`))[0].n===2);

console.log("\n# finished class");
const fin=(await q(`insert into classes(title,teacher_id,status) values ('Done','${T1}','finished') returning id`))[0].id;
await as(S(5)); ok("finished class → closed",(await join(await code(fin))).out_status==="closed");

console.log("\n# approval mode");
await as(T1); await db.query(`select set_join_approval('${OLD}', true)`);
await as(S(6)); r=await join(old.code);
ok("approval on → pending, not enrolled",r.out_status==="pending"&&(await q(`select count(*)::int n from enrollments where student_id='${S(6)}'`))[0].n===0);
await as(S(7)); await throws("a student cannot approve",()=>db.query(`select decide_join_request((select id from class_join_requests where student_id='${S(6)}'),true)`),"not allowed");
await as(T2); await throws("another teacher cannot approve",()=>db.query(`select decide_join_request((select id from class_join_requests where student_id='${S(6)}'),true)`),"not allowed");
await as(T1);
const reqId=(await q(`select id from class_join_requests where student_id='${S(6)}'`))[0].id;
ok("the class teacher approves → enrolled",(await db.query(`select decide_join_request('${reqId}',true) r`)).rows[0].r==="approved"&&(await q(`select count(*)::int n from enrollments where student_id='${S(6)}' and class_id='${OLD}'`))[0].n===1);
ok("deciding twice is harmless",(await db.query(`select decide_join_request('${reqId}',false) r`)).rows[0].r==="approved");
await as(S(8)); await join(old.code);
await as(A); const r8=(await q(`select id from class_join_requests where student_id='${S(8)}'`))[0].id;
ok("admin can reject",(await db.query(`select decide_join_request('${r8}',false) r`)).rows[0].r==="rejected"&&(await q(`select count(*)::int n from enrollments where student_id='${S(8)}'`))[0].n===0);

console.log("\n# no-code request");
await as(S(9)); ok("student requests a class → pending",(await db.query(`select request_join_class('${OLD}') r`)).rows[0].r==="pending");
ok("requesting twice keeps one request",(await db.query(`select request_join_class('${OLD}') r`)).rows[0].r==="pending"&&(await q(`select count(*)::int n from class_join_requests where student_id='${S(9)}'`))[0].n===1);
ok("student sees only their own request",(await asRole(S(9),()=>q(`select * from class_join_requests`))).length===1);
ok("teacher sees requests for their class",(await asRole(T1,()=>q(`select * from class_join_requests`))).length>=2);
ok("other teacher sees none of them",(await asRole(T2,()=>q(`select * from class_join_requests`))).length===0);
await as(S(9)); await db.query(`select cancel_join_request('${OLD}')`);
ok("student can cancel own pending request",(await q(`select count(*)::int n from class_join_requests where student_id='${S(9)}'`))[0].n===0);
ok("requesting a finished class → closed",(await db.query(`select request_join_class('${fin}') r`)).rows[0].r==="closed");
await as(S(1)); ok("already enrolled → already",(await db.query(`select request_join_class('${OLD}') r`)).rows[0].r==="already");
await as(T1); await db.query(`select set_join_approval('${OLD}', false)`);
await as(S(9)); await db.query(`select request_join_class('${OLD}')`);
const fullReq=(await q(`select id from class_join_requests where student_id='${S(9)}'`))[0].id;
await db.query(`update classes set capacity=1 where id='${OLD}'`);
await as(T1); await throws("approving into a full class is refused",()=>db.query(`select decide_join_request('${fullReq}',true)`),"full");
await db.query(`update classes set capacity=null where id='${OLD}'`);

console.log("\n# listing requests for the teacher");
await as(T1); ok("teacher lists pending requests with student names",(await q(`select * from list_join_requests('${OLD}')`)).some(x=>x.out_name==="S9"));
await as(T2); await throws("another teacher cannot list them",()=>db.query(`select * from list_join_requests('${OLD}')`),"not allowed");
await as(S(1)); await throws("a student cannot list them",()=>db.query(`select * from list_join_requests('${OLD}')`),"not allowed");

console.log("\n# regenerate");
await as(T1); const newCode=(await db.query(`select regenerate_join_code('${OLD}') c`)).rows[0].c;
ok("new code differs",newCode!==old.code);
await as(S(10)); ok("old code stops working",(await join(old.code)).out_status==="invalid");
ok("new code works",(await join(newCode)).out_status==="joined");
await as(S(11)); await throws("a student cannot regenerate",()=>db.query(`select regenerate_join_code('${OLD}')`),"not allowed");
await as(T2); await throws("another teacher cannot regenerate",()=>db.query(`select regenerate_join_code('${OLD}')`),"not allowed");

console.log("\n# brute-force limit");
await as(S(12));
for (let i=0;i<8;i++) await join("BAD"+i+"BAD0");
await throws("9th guess is blocked",()=>join("ABCDEFGH"),"too many attempts");
await throws("even the right code is blocked while locked out",()=>join(ncode),"too many attempts");
await as(S(13)); ok("another student is unaffected",(await join("QQQQQQQQ")).out_status==="invalid");
await as(null); await throws("signed-out user cannot join",()=>join(ncode),"not signed in");

console.log("\n# 0018: teacher can read only their own students' profiles");
const names=(u)=>asRole(u,()=>q(`select full_name from profiles where role='student' order by full_name`)).then(r=>r.map(x=>x.full_name));
const t1=await names(T1), t2=await names(T2);
ok("teacher T1 sees students enrolled in their class (S1, S6, S10)",["S1","S6","S10"].every(n=>t1.includes(n)));
ok("teacher T1 does not see students outside their classes",!t1.includes("S13")&&!t1.includes("S11"));
ok("teacher T2 sees only their own class's students (S2, S3)",t2.includes("S2")&&t2.includes("S3")&&!t2.includes("S1"));
ok("a student still cannot read another student",(await asRole(S(1),()=>q(`select full_name from profiles where role='student'`))).length===1);

console.log("\n# 0018: level & progress");
const enr=(await q(`select id from enrollments where student_id='${S(1)}' and class_id='${OLD}'`))[0].id;
await as(T1); await db.query(`select set_enrollment_progress('${enr}','  B1 ',55)`);
ok("class teacher sets level + progress",(await q(`select level, progress from enrollments where id='${enr}'`))[0].level==="B1"&&(await q(`select progress from enrollments where id='${enr}'`))[0].progress===55);
await as(A); await db.query(`select set_enrollment_progress('${enr}','',70)`);
ok("admin can too; blank level clears it",(await q(`select level, progress from enrollments where id='${enr}'`))[0].level===null);
await as(T2); await throws("another teacher cannot",()=>db.query(`select set_enrollment_progress('${enr}','A1',1)`),"not allowed");
await as(S(1)); await throws("the student cannot grade themselves",()=>db.query(`select set_enrollment_progress('${enr}','C2',100)`),"not allowed");
await as(T1); await throws("progress over 100 rejected",()=>db.query(`select set_enrollment_progress('${enr}','B1',101)`),"invalid progress");
await throws("negative progress rejected",()=>db.query(`select set_enrollment_progress('${enr}','B1',-1)`),"invalid progress");

console.log("\n# 0018: the PUBLIC teacher directory (signed-out visitors) must keep working");
await db.exec(`grant usage on schema public to anon; grant select on public.profiles to anon`);
await as(null);
let anonRows=null, anonErr=null;
try { await db.exec(`set role anon`); anonRows=(await q(`select full_name from profiles where role='teacher' order by full_name`)); } catch(e){ anonErr=String(e.message); } finally { await db.exec(`reset role`); }
ok("signed-out visitor can still list teachers (no permission error)"+(anonErr?" — "+anonErr:""),!anonErr&&anonRows.length===2);
ok("…and still cannot see any student",await (async()=>{ await db.exec(`set role anon`); try{ return (await q(`select 1 from profiles where role='student'`)).length===0; } finally { await db.exec(`reset role`);} })());

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
