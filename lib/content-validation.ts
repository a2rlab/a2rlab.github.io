import base from './lab-content.json';
export type LabContent=typeof base;
// Updates exported before the editor password existed keep the current published password.
export function upgradeContent(value:unknown):unknown{
 if(typeof value==='object'&&value!==null&&!Array.isArray(value)&&!('editorAccess' in value))return {...value,editorAccess:base.editorAccess};
 return value;
}
export function validateContent(value:unknown):string[]{
 const errors:string[]=[];
 const object=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v);
 if(!object(value))return ['The update must be a JSON object.'];
 function check(sample:unknown,current:unknown,path:string){
  if(typeof sample==='string'){if(typeof current!=='string')errors.push(path+' must be text.');return;}
  if(Array.isArray(sample)){
   if(!Array.isArray(current)){errors.push(path+' must be a list.');return;}
   if(current.length>500){errors.push(path+' has too many entries.');return;}
   if(!current.length&&['research','team','videos','collaboration','heroSlides'].includes(path))errors.push(path+' needs at least one entry.');
   current.forEach((v,i)=>check(sample.length?sample[0]:'',v,`${path}[${i}]`));return;
  }
  if(object(sample)){
   if(!object(current)){errors.push(path+' must be an object.');return;}
   for(const [key,field] of Object.entries(sample)){
    if(path.startsWith('projects[')&&key==='video'&&current[key]===undefined)continue;
    check(field,current[key],path?path+'.'+key:key);
   }
  }
 }
 for(const key of Object.keys(base))check(base[key as keyof LabContent],value[key],key);
 if(errors.length)return errors.slice(0,12);
 const d=value as LabContent;
 for(const [key,list] of Object.entries(d))if(Array.isArray(list)){
  const ids=list.map(item=>item.id);
  if(ids.some(id=>!id||!/^[a-z0-9-]+$/.test(id)))errors.push(key+': use unique IDs containing lowercase letters, digits, and hyphens.');
  if(new Set(ids).size!==ids.length)errors.push(key+' contains duplicate IDs.');
 }
 const rIds=d.research.map(r=>r.id),pIds=d.projects.map(p=>p.id),tIds=d.team.map(t=>t.id),vIds=d.videos.map(v=>v.id);
 for(const p of d.projects){
  if(!rIds.includes(p.category))errors.push(p.title+': unknown research category.');
  if(p.people.some(id=>!tIds.includes(id)))errors.push(p.title+': unknown team member.');
  if(p.movies.some(id=>!vIds.includes(id)))errors.push(p.title+': unknown project film.');
  if(!p.gallery.length)errors.push(p.title+': add at least one gallery image.');
 }
 for(const r of d.research)if(r.related.some(id=>!pIds.includes(id)))errors.push(r.title+': unknown related project.');
 for(const s of d.students)if(s.movies.some(id=>!vIds.includes(id)))errors.push(s.title+': unknown activity film.');
 for(const device of d.devices)if(device.project&&!pIds.includes(device.project))errors.push(device.title+': unknown linked project.');
 for(const p of d.publications)if(p.rankings.some(r=>!['D1','Q1','Q2','Q3','Q4'].includes(r)))errors.push(p.title+': use the CV ranking labels D1 or Q1–Q4.');
 for(const a of d.alumni)if(!/^20\d{2}$/.test(a.year))errors.push(a.name+': enter a four-digit alumni year.');
 const access=d.editorAccess;
 if(!/^[0-9a-f]{32}$/.test(access.salt)||!/^[0-9a-f]{64}$/.test(access.hash)||!(Number(access.iterations)>=100000))errors.push('editorAccess: the editor password record is damaged. Set a new password in Editor settings.');
 const email=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 if(!email.test(d.lab.email))errors.push('Enter a valid lab email.');
 for(const p of d.team)if(p.email&&!email.test(p.email))errors.push(p.name+': enter a valid email or leave it blank.');
 const linkKeys=new Set(['linkedin','facebook','scholar','mtmt','official','profile','source','photoCredit']);
 function paths(v:unknown,path=''){
  if(Array.isArray(v)){v.forEach((item,i)=>paths(item,path+'['+i+']'));return;}
  if(!object(v))return;
  for(const [key,field] of Object.entries(v)){
   if(typeof field==='string'){
    if(linkKeys.has(key)&&field&&(key!=='source'||field.startsWith('http'))&&!/^https:\/\//.test(field))errors.push(path+'.'+key+' must be an HTTPS link.');
    if(['image','poster','src'].includes(key)&&field&&!/^(\/media\/[a-zA-Z0-9_./-]+|https:\/\/)/.test(field))errors.push(path+'.'+key+' must be a media path or HTTPS link.');
   }else if(key==='gallery'&&Array.isArray(field)){
    for(const entry of field)if(typeof entry==='string'&&!/^(\/media\/[a-zA-Z0-9_./-]+|https:\/\/)/.test(entry))errors.push(path+'.gallery must contain media paths or HTTPS links.');
   }else paths(field,path+'.'+key);
  }
 }
 paths(d);
 return errors.slice(0,12);
}
