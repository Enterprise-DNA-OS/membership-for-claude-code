import {readFileSync} from 'node:fs';
import {parse} from 'csv-parse/sync';
function pick(r,...names){for(const n of names){const k=Object.keys(r).find(k=>k.trim().toLowerCase()===n.toLowerCase());if(k&&r[k].trim())return r[k].trim();}return '';}
function yes(s){return ['yes','true','1'].includes(s.toLowerCase());}
function date(s,order){if(!s)return null;let iso=s;if(!/^\d{4}-\d{2}-\d{2}$/.test(s)){const m=s.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);if(!m||!['DMY','MDY'].includes(order))throw Error(`Date ${s}: export ISO dates or supply --date-order=DMY or MDY`);iso=`${m[3]}-${(order==='DMY'?m[2]:m[1]).padStart(2,'0')}-${(order==='DMY'?m[1]:m[2]).padStart(2,'0')}`;}const d=new Date(iso+'T00:00:00Z');if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==iso)throw Error('Invalid date '+s);return iso;}
export async function importMembers(db,file,opts={}){
 const raw=parse(readFileSync(file,'utf8'),{bom:true,columns:headers=>{const h=headers.map(x=>x.trim());if(new Set(h.map(x=>x.toLowerCase())).size!==h.length)throw Error('Duplicate CSV headers');return h;},skip_empty_lines:true,trim:true});
 if(!raw.length)throw Error('No contact rows found');const seen=new Set();
 const rows=raw.map((r,i)=>{
  const external=pick(r,'User ID','Contact ID'),name=[pick(r,'First name'),pick(r,'Last name')].filter(Boolean).join(' ')||pick(r,'Organization');
  if(!external||!name)throw Error(`Row ${i+2}: User ID and a name required`);if(seen.has(external))throw Error('Duplicate User ID '+external);seen.add(external);
  const vendorStatus=pick(r,'Membership status').toLowerCase();const statuses={'active':'active','lapsed':'lapsed','pending - new':'pending','pending - renewal':'pending','pending - level change':'pending','suspended':'suspended','':'contact'};
  if(!(vendorStatus in statuses))throw Error(`Row ${i+2}: unknown membership status ${vendorStatus}`);
  const status=yes(pick(r,'Archived'))?'archived':pick(r,'Membership enabled').toLowerCase()==='no'?'contact':statuses[vendorStatus];
  return {external,name,status,email:pick(r,'Email')||null,organisation:pick(r,'Organization')||null,level:pick(r,'Membership level'),joined:date(pick(r,'Member since'),opts.dateOrder),renewal:date(pick(r,'Renewal due'),opts.dateOrder),marketing:yes(pick(r,'Subscribed to emails'))&&['opted in','opt-in','yes'].includes(pick(r,'Opt-in status').toLowerCase()),raw:r};
 });
 await db.exec('BEGIN');let inserted=0,updated=0;
 try{
  for(const r of rows){
   let level=null;if(r.level){const [l]=await db.query('insert into levels(name) values($1) on conflict(name) do update set name=excluded.name returning id',[r.level]);level=l.id;}
   const existing=await db.query('select id from members where external_id=$1',[r.external]);
   if(existing.length)updated++;else inserted++;
   await db.query(`insert into members(external_id,name,email,organisation,level_id,status,joined_on,renewal_due,marketing_consent,source_data) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict(external_id) do update set name=excluded.name,email=excluded.email,organisation=excluded.organisation,level_id=excluded.level_id,status=excluded.status,joined_on=excluded.joined_on,renewal_due=excluded.renewal_due,marketing_consent=excluded.marketing_consent,source_data=excluded.source_data`,[r.external,r.name,r.email,r.organisation,level,r.status,r.joined,r.renewal,r.marketing,JSON.stringify(r.raw)]);
  }
  if(opts.dryRun)await db.exec('ROLLBACK');else{await db.query("insert into audit(name,detail) values('import wild-apricot',$1)",[JSON.stringify({inserted,updated})]);await db.exec('COMMIT');}
  return [{inserted,updated,dry_run:!!opts.dryRun,warning:'Confirm imported level fees and membership consent evidence. Balances, gifts, bundles and attachments remain in source_data until mapped.'}];
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
