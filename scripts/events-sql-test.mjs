import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
/** Runs migration 0016 on an in-process Postgres (PGlite) and checks the registration rules. `npm run test:events:sql` */
const here = path.dirname(fileURLToPath(import.meta.url));
const db = new PGlite();
process.on("unhandledRejection", (e) => { console.log("CRASH:", String(e.message).slice(0, 200)); process.exit(1); });
await db.exec(`
create schema auth; create schema storage;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
create table storage.buckets(id text primary key, name text, public boolean);
create table storage.objects(id serial primary key, bucket_id text, name text);
create type role as enum ('admin','teacher','student');
create table public.profiles(id uuid primary key, role role not null default 'student', full_name text);
create function public.is_admin() returns boolean language sql stable security definer as $$ select coalesce((select role='admin' from public.profiles where id=auth.uid()),false) $$;
`);
await db.exec(fs.readFileSync(path.join(here, "../supabase/migrations/0016_events.sql"), "utf8"));
console.log("migration applied OK");

const A="00000000-0000-0000-0000-00000000000a", U1="00000000-0000-0000-0000-0000000000b1";
await db.exec(`insert into auth.users values ('${A}'),('${U1}'); insert into profiles values ('${A}','admin','Admin'),('${U1}','student','Sara');`);
let pass=0, fail=0;
const ok=(n,c)=>{ if(c){pass++;console.log("  ✓",n)}else{fail++;console.log("  ✗ FAIL",n)} };
const throws=async(n,fn,m)=>{ try{await fn();fail++;console.log("  ✗ FAIL (no error)",n)}catch(e){const s=String(e.message); if(!m||s.toLowerCase().includes(m.toLowerCase())){pass++;console.log("  ✓",n,"→",s.slice(0,64))}else{fail++;console.log("  ✗ FAIL wrong error",n,s)}}};
const q=async(s)=>(await db.query(s)).rows;
const as=(u)=>db.exec(`select set_config('request.jwt.claim.sub','${u??""}',false)`);
const cat=(await q(`select id from event_categories where slug='speaking-clubs'`))[0].id;
ok("9 categories seeded",(await q(`select count(*)::int n from event_categories`))[0].n===9);

const mk=async(o={})=>{ const cols={slug:"ev-"+Math.random().toString(36).slice(2,8),title:`{"fa":"رویداد","en":"Event"}`,starts:"now() + interval '7 days'",status:"published",capacity:"3",paid:"false",price:"0",deadline:"null",auto:"true",wl:"true",maxp:"5",...o};
  return (await q(`insert into events(slug,category_id,title,starts_at,status,capacity,is_paid,price,registration_deadline,auto_confirm,allow_waitlist,max_per_registration)
   values ('${cols.slug}','${cat}','${cols.title}',${cols.starts},'${cols.status}',${cols.capacity},${cols.paid},${cols.price},${cols.deadline},${cols.auto},${cols.wl},${cols.maxp}) returning id`))[0].id; };
const reg=(ev,name,phone,n=1,email=null)=>db.query(`select * from event_register('${ev}','${name}','${phone}',${email?`'${email}'`:"null"},false,${n},'')`);

console.log("\n# registration & capacity (capacity 3)");
await as(null);
const e1=await mk();
const r1=(await reg(e1,"Sara Ahmadi","0912 345 6789",2)).rows[0];
ok("free event auto-confirms",r1.out_status==="confirmed"&&/^NSH-[A-Z2-9]{6}$/.test(r1.out_code));
ok("phone stored normalised (9123456789)",(await q(`select phone from event_registrations`))[0].phone==="9123456789");
await throws("same phone typed in another format → duplicate",()=>reg(e1,"Sara Again","+98 912 345 6789"),"already registered");
await throws("Persian digits of same number → duplicate",()=>reg(e1,"Sara Again","۰۹۱۲۳۴۵۶۷۸۹"),"already registered");
const r2=(await reg(e1,"Ali Karimi","09351112233",1)).rows[0];
ok("second registration takes the last seat",r2.out_status==="confirmed");
const r3=(await reg(e1,"Nima Rad","09361112233",2)).rows[0];
ok("full event → waitlisted, position 1",r3.out_status==="waitlisted"&&r3.out_position===1);
const r4=(await reg(e1,"Mina Soltani","09371112233",1)).rows[0];
ok("next in line is position 2",r4.out_status==="waitlisted"&&r4.out_position===2);
const av=(await q(`select * from event_availability(array['${e1}']::uuid[])`))[0];
ok("availability: 3 taken, 3 waitlisted participants",av.out_taken===3&&av.out_waitlisted===3);
await throws("more participants than the event can ever hold",()=>reg(e1,"Big Group","09381112233",5),"too many participants for this event");
await throws("over per-registration limit",async()=>reg(await mk({capacity:"null",maxp:"2"}),"Group Of Three","09391112233",3),"participants must be between");
await throws("invalid phone",()=>reg(e1,"Bad Phone","12345"),"invalid phone");
await throws("invalid name",()=>reg(e1,"X","09121110000"),"invalid name");
await throws("invalid email",()=>reg(e1,"Mr Email","09121110001",1,"nope"),"invalid email");

console.log("\n# waiting list promotion");
await as(A);
await db.query(`select event_set_registration_status('${r2.out_id}','rejected','no show')`);
let rows=await q(`select full_name, status from event_registrations where event_id='${e1}' order by created_at`);
ok("rejecting Ali frees 1 seat — but Nima needs 2, so Mina (1 seat) is promoted, Nima keeps waiting",
   rows.find(x=>x.full_name==="Mina Soltani").status==="confirmed" && rows.find(x=>x.full_name==="Nima Rad").status==="waitlisted");
await throws("manually confirming Nima without room fails",()=>db.query(`select event_set_registration_status('${r3.out_id}','confirmed')`),"not enough seats");
await db.query(`select event_set_registration_status('${r1.out_id}','cancelled')`);
rows=await q(`select full_name, status from event_registrations where event_id='${e1}'`);
ok("cancelling Sara (2 seats) promotes Nima from the waiting list",rows.find(x=>x.full_name==="Nima Rad").status==="confirmed");
await as(null);
const lk=(await q(`select * from event_lookup('${r4.out_code}','09371112233')`))[0];
ok("registrant can look up status with code + phone",lk&&lk.out_status==="confirmed");
ok("wrong phone finds nothing",(await q(`select * from event_lookup('${r4.out_code}','09000000000')`)).length===0);
await db.query(`select event_cancel_own('${r4.out_code}','09371112233')`);
ok("registrant can cancel themselves",(await q(`select status from event_registrations where id='${r4.out_id}'`))[0].status==="cancelled");
const again=(await reg(e1,"Mina Soltani","09371112233",1)).rows[0];
ok("a cancelled person may register again",["confirmed","waitlisted"].includes(again.out_status));

console.log("\n# deadlines, status, no-waitlist");
await throws("registration closed after the deadline",async()=>reg(await mk({starts:"now() + interval '2 days'",deadline:"now() - interval '1 hour'"}),"Late Comer","09121110002"),"closed");
await throws("event already started",async()=>reg(await mk({starts:"now() - interval '1 hour'"}),"Too Late","09121110003"),"closed");
await throws("draft events are not open",async()=>reg(await mk({status:"draft"}),"Early Bird","09121110004"),"not open");
await throws("cancelled events are not open",async()=>reg(await mk({status:"cancelled"}),"Hopeful","09121110005"),"not open");
const nw=await mk({capacity:"1",wl:"false"}); await reg(nw,"First Person","09121110006");
await throws("full event without waiting list rejects",()=>reg(nw,"Second Person","09121110007"),"full");
const un=await mk({capacity:"null"}); for(let i=0;i<4;i++) await reg(un,"Person "+i,"091211200"+i+"0");
ok("unlimited capacity never waitlists",(await q(`select count(*)::int n from event_registrations where event_id='${un}' and status='confirmed'`))[0].n===4);
await throws("check constraint: paid event needs a price",()=>db.query(`insert into events(slug,title,starts_at,is_paid,price) values ('p','{}',now(),true,0)`),"check");
await throws("check constraint: deadline after the event",()=>db.query(`insert into events(slug,title,starts_at,registration_deadline) values ('q','{}',now(),now()+interval '1 day')`),"check");

console.log("\n# paid events & payments");
const pe=await mk({paid:"true",price:"500000",capacity:"10"});
const p1=(await reg(pe,"Reza Paid","09121110010",2)).rows[0];
ok("paid events start pending (never auto-confirmed)",p1.out_status==="pending");
await as(A);
const pay=(amt,kind="payment",key=null)=>db.query(`select event_record_payment('${p1.out_id}','${kind}',${amt},'card','ref1',current_date,'',${key?`'${key}'`:"null"}) id`);
await pay(400000,"payment","k1"); await pay(400000,"payment","k1");
ok("idempotent payment key",(await q(`select count(*)::int n from event_payments`))[0].n===1);
await throws("overpayment (due 1,000,000) rejected",()=>pay(700000),"exceeds");
ok("partially paid stays pending",(await q(`select status from event_registrations where id='${p1.out_id}'`))[0].status==="pending");
await pay(600000);
ok("fully paid → auto-confirmed",(await q(`select status from event_registrations where id='${p1.out_id}'`))[0].status==="confirmed");
await throws("refund above paid rejected",()=>pay(1000001,"refund"),"exceeds");
await pay(250000,"refund");
const pid=(await q(`select id from event_payments order by created_at limit 1`))[0].id;
await throws("payment rows are immutable",()=>db.query(`update event_payments set amount=1 where id='${pid}'`),"immutable");
await throws("payments cannot be deleted",()=>db.query(`delete from event_payments`),"cannot be deleted");
await db.query(`select event_void_payment('${pid}','typo')`);
await throws("void needs a reason",()=>db.query(`select event_void_payment('${pid}','')`),"reason");
await throws("free events refuse payments",async()=>db.query(`select event_record_payment('${(await reg(await mk({capacity:"5"}),"Free One","09121110011")).rows[0].out_id}','payment',1000,'cash','',current_date,'',null)`),"free");

console.log("\n# attendance");
await db.query(`select event_set_attendance('${p1.out_id}',1)`);
ok("check-in saved",(await q(`select attended_participants a from event_attendance`))[0].a===1);
await throws("cannot check in more than registered",()=>db.query(`select event_set_attendance('${p1.out_id}',3)`),"invalid attendance");
await throws("cannot check in a rejected registration",()=>db.query(`select event_set_attendance('${r2.out_id}',1)`),"only confirmed");

console.log("\n# permissions (RLS as a visitor / student)");
await db.exec(`create role app_user; grant usage on schema public, auth to app_user; grant all on all tables in schema public to app_user; grant all on all functions in schema public to app_user; grant select on auth.users to app_user;`);
await db.exec(`set role app_user`);
await as(null);
ok("anonymous can read published events",(await q(`select count(*)::int n from events`))[0].n>0);
ok("anonymous cannot see draft events",(await q(`select count(*)::int n from events where status='draft'`))[0].n===0);
ok("anonymous cannot read registrations",(await q(`select count(*)::int n from event_registrations`))[0].n===0);
ok("anonymous cannot read payments",(await q(`select count(*)::int n from event_payments`))[0].n===0);
await throws("anonymous cannot insert a registration directly",()=>db.query(`insert into event_registrations(event_id,code,full_name,phone) values ('${e1}','X','Hacker','9120000000')`),"row-level security");
await throws("anonymous cannot create events",()=>db.query(`insert into events(slug,title,starts_at) values ('h','{}',now())`),"row-level security");
await throws("anonymous cannot approve registrations",()=>db.query(`select event_set_registration_status('${r3.out_id}','rejected')`),"forbidden");
await throws("anonymous cannot record payments",()=>db.query(`select event_record_payment('${p1.out_id}','payment',1,'cash','',current_date,'',null)`),"forbidden");
const openEv=await (async()=>{await db.exec(`reset role`); await as(A); const id=await mk({capacity:"9"}); await db.exec(`set role app_user`); return id; })();
await as(U1);
await throws("a student is not an admin either",()=>db.query(`select event_set_registration_status('${r3.out_id}','rejected')`),"forbidden");
ok("registering still works for a signed-in user",(await reg(openEv,"Sara Student","09121119999")).rows[0].out_status==="confirmed");
await as(A);
ok("admin sees registrations",(await q(`select count(*)::int n from event_registrations`))[0].n>5);
ok("admin sees draft events",(await q(`select count(*)::int n from events where status='draft'`))[0].n>0);
await db.exec(`reset role`);

console.log("\n# data safety");
await throws("a registration cannot be deleted",()=>db.query(`delete from event_registrations`),"cannot be deleted");
await throws("an event with registrations cannot be deleted",()=>db.query(`delete from events where id='${e1}'`),"restrict");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
