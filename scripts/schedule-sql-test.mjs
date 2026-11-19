import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
/** Runs migration 0021 on PGlite: existing classes must be backfilled with per-day slots. `npm run test:schedule:sql` */
const here = path.dirname(fileURLToPath(import.meta.url));
const db = new PGlite();
await db.exec(`create table public.classes(id serial primary key, title text, schedule_days text[], start_time time, end_time time);
insert into public.classes(title,schedule_days,start_time,end_time) values
 ('two days','{sat,mon}','18:00','19:30'),
 ('no times','{wed}',null,null),
 ('no days',null,'10:00','11:00'),
 ('empty days','{}','10:00','11:00');`);
await db.exec(fs.readFileSync(path.join(here, "../supabase/migrations/0021_class_schedule_slots.sql"), "utf8"));
await db.exec(fs.readFileSync(path.join(here, "../supabase/migrations/0021_class_schedule_slots.sql"), "utf8")); // re-run safe
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log("  ✓",n)}else{fail++;console.log("  ✗ FAIL",n)} };
const row=async(t)=>(await db.query(`select schedule_slots s from classes where title='${t}'`)).rows[0].s;
const a=await row("two days");
ok("each existing day gets a slot with the class's current time",a.length===2&&a.every(x=>x.start==="18:00"&&x.end==="19:30")&&a.map(x=>x.day).sort().join()==="mon,sat");
ok("class without times is left null",(await row("no times"))===null);
ok("class without days is left null",(await row("no days"))===null);
ok("empty days array is left null",(await row("empty days"))===null);
ok("migration is safe to run twice",(await row("two days")).length===2);
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail?1:0);
