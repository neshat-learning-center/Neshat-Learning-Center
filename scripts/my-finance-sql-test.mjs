import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
/** Runs migrations 0015 + 0019 on PGlite and checks students/teachers see only their own money. `npm run test:myfin:sql` */
const here = path.dirname(fileURLToPath(import.meta.url));
const db = new PGlite();
const mig = fs.readFileSync(path.join(here, "../supabase/migrations/0015_accounting.sql"), "utf8");

await db.exec(`
create schema auth; create schema storage;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
create table storage.buckets(id text primary key, name text, public boolean);
create table storage.objects(id serial primary key, bucket_id text, name text);
create type role as enum ('admin','teacher','student');
create table public.profiles(id uuid primary key, role role not null default 'student', full_name text);
create table public.courses(id uuid primary key default gen_random_uuid(), price integer);
create table public.classes(id uuid primary key default gen_random_uuid(), course_id uuid references public.courses(id), teacher_id uuid, title text, title_en text);
create table public.enrollments(id uuid primary key default gen_random_uuid(), student_id uuid references public.profiles(id), class_id uuid references public.classes(id), unique(student_id,class_id));
create table public.attendance(id uuid primary key default gen_random_uuid(), enrollment_id uuid references public.enrollments(id), session_date date not null);
create table public.books(id uuid primary key default gen_random_uuid(), title jsonb);
create function public.is_admin() returns boolean language sql stable security definer as $$ select coalesce((select role='admin' from public.profiles where id=auth.uid()),false) $$;
`);
await db.exec(`create role anon; create role authenticated;`);
await db.exec(mig);
await db.exec(fs.readFileSync(path.join(here, "../supabase/migrations/0019_my_finance.sql"), "utf8"));
console.log("migrations applied OK");


const A="00000000-0000-0000-0000-00000000000a", S1="00000000-0000-0000-0000-0000000000b1", S2="00000000-0000-0000-0000-0000000000b2", T1="00000000-0000-0000-0000-0000000000c1", T2="00000000-0000-0000-0000-0000000000c2";
await db.exec(`insert into auth.users values ('${A}'),('${S1}'),('${S2}'),('${T1}'),('${T2}');
insert into profiles values ('${A}','admin','Admin'),('${S1}','student','Sara'),('${S2}','student','Omid'),('${T1}','teacher','Reza'),('${T2}','teacher','Mina');`);
const course=(await db.query(`insert into courses(price) values (4000000) returning id`)).rows[0].id;
const cls=(await db.query(`insert into classes(course_id,teacher_id,title) values ('${course}','${T1}','Step 3') returning id`)).rows[0].id;
const cls2=(await db.query(`insert into classes(course_id,teacher_id,title) values ('${course}','${T2}','IELTS') returning id`)).rows[0].id;
const e1=(await db.query(`insert into enrollments(student_id,class_id) values ('${S1}','${cls}') returning id`)).rows[0].id;
const e1b=(await db.query(`insert into enrollments(student_id,class_id) values ('${S1}','${cls2}') returning id`)).rows[0].id;
const e2=(await db.query(`insert into enrollments(student_id,class_id) values ('${S2}','${cls}') returning id`)).rows[0].id;
const as=(u)=>db.exec(`select set_config('request.jwt.claim.sub','${u??""}',false)`);
let pass=0, fail=0;
const ok=(n,c)=>{ if(c){pass++;console.log("  ✓",n)}else{fail++;console.log("  ✗ FAIL",n)} };
const q=async(s)=>(await db.query(s)).rows;
const asRole=async(u,fn)=>{ await as(u); await db.exec(`set role authenticated`); try{ return await fn(); } finally{ await db.exec(`reset role`);} };
await db.exec(`grant usage on schema public to authenticated; grant select on all tables in schema public to authenticated; grant execute on all functions in schema public to authenticated;`);

// admin sets up the money
await as(A);
await db.query(`select fin_set_student_fee('${e1b}', 3000000)`);
const pay=(e,amt,kind='payment',st='completed')=>db.query(`select fin_record_student_payment('${e}',${amt},'${kind}','${st}','card',current_date,'ref','',null)`);
await pay(e1,1000000); await pay(e1,500000,'payment','pending'); await pay(e1,200000,'refund');
await pay(e2,4000000);
const voidMe=(await q(`select fin_record_student_payment('${e1}',999,'payment','completed','cash',current_date,'','',null) id`))[0].id;
await db.query(`select fin_void_student_payment('${voidMe}','mistake')`);
const st=(await q(`select fin_save_salary_statement('${T1}','1405-07','2026-09-23','2026-10-22','per_class',200000,6,540,0,1200000,false) id`))[0].id;
await db.query(`select fin_save_salary_statement('${T2}','1405-07','2026-09-23','2026-10-22','hourly',100000,3,270,0,450000,false)`);
await db.query(`select fin_record_salary_payment('${st}',500000,'bank_transfer',current_date,'ref','',null)`);

console.log("\n# student: own account");
const acc=await asRole(S1,()=>q(`select * from my_student_account()`));
ok("student sees only their own two enrollments",acc.length===2);
const a1=acc.find(r=>r.out_class_title==="Step 3"), a2=acc.find(r=>r.out_class_title==="IELTS");
ok("fee falls back to the course price",Number(a1.out_fee)===4000000);
ok("fee override wins",Number(a2.out_fee)===3000000);
ok("received counts completed payments only",Number(a1.out_paid)===1000000);
ok("refund shown separately",Number(a1.out_refunded)===200000);
ok("pending shown separately, not as received",Number(a1.out_pending)===500000);
ok("voided payment is invisible",Number(a1.out_paid)+Number(a1.out_pending)===1500000);
const pays=await asRole(S1,()=>q(`select * from my_student_payments()`));
ok("payment list excludes voided + other students (3 rows)",pays.length===3&&!pays.some(p=>Number(p.out_amount)===4000000||Number(p.out_amount)===999));
const other=await asRole(S2,()=>q(`select * from my_student_account()`));
ok("another student sees only their own",other.length===1&&Number(other[0].out_paid)===4000000);
ok("student cannot read the finance tables directly",(await asRole(S1,()=>q(`select * from student_payments`))).length===0);
ok("student has no salary data",(await asRole(S1,()=>q(`select * from my_salary()`))).length===0);

console.log("\n# teacher: own salary");
const sal=await asRole(T1,()=>q(`select * from my_salary()`));
ok("teacher sees only their own statement",sal.length===1&&sal[0].out_period_key==="1405-07"&&Number(sal[0].out_gross)===1200000);
ok("paid so far is summed",Number(sal[0].out_paid)===500000);
ok("sessions & minutes included",sal[0].out_sessions===6&&sal[0].out_minutes===540);
const sp=await asRole(T1,()=>q(`select * from my_salary_payments()`));
ok("payment history is their own",sp.length===1&&Number(sp[0].out_amount)===500000);
ok("another teacher sees only theirs",(await asRole(T2,()=>q(`select out_gross from my_salary()`))).every(r=>Number(r.out_gross)===450000));
ok("teacher cannot read salary tables directly",(await asRole(T1,()=>q(`select * from salary_statements`))).length===0);
ok("teacher has no student account",(await asRole(T1,()=>q(`select * from my_student_account()`))).length===0);
await as(A); await db.query(`select fin_void_salary_payment((select id from salary_payments limit 1),'oops')`);
ok("voided salary payment disappears",Number((await asRole(T1,()=>q(`select out_paid from my_salary()`)))[0].out_paid)===0);
ok("signed-out caller gets nothing",(await asRole(null,()=>q(`select * from my_salary()`))).length===0&&(await asRole(null,()=>q(`select * from my_student_account()`))).length===0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
