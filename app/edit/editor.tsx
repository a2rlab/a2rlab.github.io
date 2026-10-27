'use client';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Download, Upload, Save, Eye, Plus, Lock, KeyRound, Search, Copy, Trash2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, X, ExternalLink, Wand2, Settings } from 'lucide-react';
import base from '@/lib/lab-content.json';
import { validateContent, upgradeContent, type LabContent } from '@/lib/content-validation';
import { isUnlocked, unlock, lock, remember, createAccess, verifyPassword } from '@/lib/editor-access';

type Row=Record<string,unknown>;
type Section={id:string;name:string;where:string;anchor?:string;page?:string;newFirst?:boolean};
// Sections are grouped by where they appear on the website.
const groups:{title:string;sections:Section[]}[]=[
 {title:'Home & lab',sections:[
  {id:'lab',name:'Lab & contact',where:'Lab name, introduction, contact details, and links used across the site.',anchor:'about'},
  {id:'heroSlides',name:'Opening photo gallery',where:'Rotating photos at the top of the home page.',anchor:'home'},
  {id:'collaboration',name:'Collaboration options',where:'The options in “06 / Collaborate” and the enquiry form.',anchor:'collaborate'}]},
 {title:'Research',sections:[
  {id:'research',name:'Research directions',where:'The four research directions shown together in “01 / Research”.',anchor:'research'},
  {id:'projects',name:'Projects & platforms',where:'Project cards in “02 / Projects & platforms” and their detail windows.',anchor:'projects'},
  {id:'devices',name:'Device catalogue',where:'Device cards in “Research infrastructure”.',anchor:'devices'},
  {id:'facilities',name:'Facilities',where:'The expandable list in “03 / Facilities”.',anchor:'facilities'},
  {id:'facilityGallery',name:'Lab photo gallery',where:'The photo strip below the facilities.',anchor:'facilities'},
  {id:'videos',name:'Films',where:'“See the research in action” and films linked from projects and student activities.',anchor:'films'}]},
 {title:'People',sections:[
  {id:'pi',name:'Principal investigator',where:'The principal investigator profile.',anchor:'pi'},
  {id:'team',name:'Team profiles',where:'People cards in “04 / People”.',anchor:'team'},
  {id:'advisors',name:'Advisory committee',where:'The international advisory committee.',anchor:'advisory'},
  {id:'alumni',name:'Alumni',where:'The alumni list, filtered by year.',anchor:'alumni'}]},
 {title:'Research output',sections:[
  {id:'publications',name:'Scientific publications',where:'The publication archive. New entries are added at the top.',anchor:'publications',newFirst:true},
  {id:'grants',name:'Projects & grants',where:'Grant cards in “Projects & grants”.',anchor:'grants'}]},
 {title:'News & recent activities',sections:[
  {id:'activityNews',name:'Latest news & updates',where:'“05 / News & recent activities”, first category. New entries are added at the top.',anchor:'news',newFirst:true},
  {id:'students',name:'Student activities & competitions',where:'“05 / News & recent activities”, student category.',anchor:'students'},
  {id:'visits',name:'International collaborations & visits',where:'“05 / News & recent activities”, international category. New entries are added at the top.',anchor:'visits',newFirst:true}]},
 {title:'Student guidelines page',sections:[
  {id:'guidelines',name:'Student guidelines',where:'The separate student guidelines page, linked from the home page.',page:'/guidelines/'}]},
];
const sections=groups.flatMap(g=>g.sections);
const labels:Record<string,string>={id:'Stable ID',shortName:'Short name',imageAlt:'Image description for accessibility',alt:'Image description for accessibility',src:'Video file path or YouTube link',people:'Team members',related:'Related projects',movies:'Linked films',gallery:'Gallery images',image:'Image',poster:'Poster image',bio:'Biography',prompt:'Enquiry prompt',category:'Category',project:'Linked project',dateLabel:'Date shown on the card',date:'Date (used for ordering)',rankings:'CV rankings',focus:'Focus areas',items:'List items',points:'Key points',features:'Features',topics:'Topics',photoCredit:'Portrait source link',imageCaption:'Image caption',doi:'DOI',publication:'Related publication DOI',mtmt:'MTMT profile link',scholar:'Google Scholar link',short:'Short label'};
const hints:Record<string,string>={id:'Links records together. Use lowercase letters, digits, and hyphens. Avoid changing the ID of an existing entry.',image:'A file in public/media, e.g. /media/new-photo.webp, or an https:// link.',poster:'A file in public/media, e.g. /media/new-film-poster.webp.',gallery:'One image per row. The first image is shown first.',src:'A file in public/media, e.g. /media/new-film.mp4, or a YouTube link.',number:'Two digits, e.g. 01.',year:'Four digits, e.g. 2026.',doi:'Only the DOI, e.g. 10.1016/j.trip.2025.101828.',email:'Leave blank to use the lab email.',source:'An https:// link, or a short note about the source.',dateLabel:'Free text, e.g. 25 September 2026 · Upcoming event.'};
const multiline=['description','about','summary','bio','text','research','leadership','supervision','prompt'];
const narrow=['id','number','short','shortName','category','type','date','dateLabel','year','duration','group','country','location','tag','status','amount','lead','founded','updated','email','role','funder'];
const suggest=['category','group','country','location','tag','type','status','funder','role'];
type Ref={from:keyof LabContent;multi:boolean};
const refs:Record<string,Record<string,Ref>>={projects:{category:{from:'research',multi:false},people:{from:'team',multi:true},movies:{from:'videos',multi:true}},research:{related:{from:'projects',multi:true}},students:{movies:{from:'videos',multi:true}},devices:{project:{from:'projects',multi:false}}};
const DRAFT='a2r-content-draft';
const titleOf=(r:Row)=>String(r.title||r.name||r.label||r.alt||r.id||'Untitled');
const metaOf=(r:Row)=>['dateLabel','date','year','category','type','tag','role','group','country','location','funder','duration'].map(k=>r[k]).filter(v=>typeof v==='string'&&v).slice(0,2).join(' · ');
const thumbOf=(r:Row)=>String(r.image||r.poster||(Array.isArray(r.gallery)?r.gallery[0]??'':''));
const labelFor=(key:string)=>labels[key]??key.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase());
const slug=(text:string)=>text.normalize('NFKD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)||'entry';
const today=()=>new Date().toISOString().slice(0,10);

export default function Editor(){
 const [open,setOpen]=useState(isUnlocked);
 return open?<Workspace onLock={()=>{lock();setOpen(false)}}/>:<Gate onUnlock={()=>setOpen(true)}/>;
}

function Gate({onUnlock}:{onUnlock:()=>void}){
 const [password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[fails,setFails]=useState(0);
 async function submit(e:React.FormEvent){e.preventDefault();if(busy||!password)return;setBusy(true);setError('');try{if(await unlock(password)){onUnlock();return}const n=fails+1;setFails(n);setPassword('');setError('Incorrect password. Please try again.');if(n>=5)await new Promise(r=>setTimeout(r,Math.min(n*1000,15000)))}catch(err){setError(err instanceof Error?err.message:'Unable to check the password.')}setBusy(false)}
 return <div className="editor-page"><header className="editor-header"><a href="/" className="text-link"><ArrowLeft size={17}/> Back to the lab</a><span>A²R / CONTENT EDITOR</span><span className="local-badge">PROTECTED</span></header><main className="editor-gate"><form className="editor-gate-card" onSubmit={submit}><span className="editor-gate-icon"><Lock size={24}/></span><p className="eyebrow blue">RESTRICTED AREA</p><h1>Content editor</h1><p>Enter the editor password to continue.</p><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" autoFocus required maxLength={200}/></label><button className="button button-blue" type="submit" disabled={busy}>{busy?'Checking…':'Unlock editor'} <KeyRound size={16}/></button>{error&&<p className="editor-gate-error" role="alert">{error}</p>}</form></main></div>;
}

function Workspace({onLock}:{onLock:()=>void}){
 const [data,setData]=useState<LabContent>(base),[section,setSection]=useState('lab'),[index,setIndex]=useState<number|null>(null),[query,setQuery]=useState(''),[message,setMessage]=useState(''),[issues,setIssues]=useState<string[]>([]),[dirty,setDirty]=useState(false);const upload=useRef<HTMLInputElement>(null);
 useEffect(()=>{try{const raw=localStorage.getItem(DRAFT);if(raw){const d=upgradeContent(JSON.parse(raw));if(!validateContent(d).length){setData(d as LabContent);setMessage('Your local draft has been restored.')}}}catch{setMessage('Local draft storage is unavailable. You can still edit and export an update.')}},[]);
 useEffect(()=>{function leave(e:BeforeUnloadEvent){if(dirty){e.preventDefault();e.returnValue=''}}window.addEventListener('beforeunload',leave);return()=>window.removeEventListener('beforeunload',leave)},[dirty]);
 useEffect(()=>{function key(e:KeyboardEvent){if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save()}}window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)});
 const info=sections.find(s=>s.id===section);const block=data[section as keyof LabContent];const list=Array.isArray(block)?block as Row[]:null;
 const record=(list?index===null?null:list[index]:section==='settings'?null:block) as Row|null;
 function go(id:string,i:number|null=null){setSection(id);setIndex(i);setQuery('');window.scrollTo({top:0})}
 function commit(next:LabContent,note='Unsaved changes'){setData(next);setDirty(true);setMessage(note);setIssues([])}
 function edit(fn:(d:Record<string,unknown>)=>void,note?:string){const next=structuredClone(data) as unknown as Record<string,unknown>;fn(next);commit(next as unknown as LabContent,note)}
 function change(key:string,value:unknown){edit(d=>{const target=Array.isArray(d[section])?(d[section] as Row[])[index!]:d[section] as Row;target[key]=value})}
 function validate(){const errors=validateContent(data);setIssues(errors);return !errors.length}
 function save(){if(!validate()){setMessage('Draft not saved. Please fix the fields listed below.');return false}try{localStorage.setItem(DRAFT,JSON.stringify(data));setMessage('Local draft saved at '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'. The live site is unchanged until you publish.');setDirty(false);return true}catch{setMessage('Draft storage is unavailable. Export your update to keep it.');return false}}
 function preview(){if(!save())return;const url=info?.page?info.page+'?draft=1':'/?draft=1'+(info?.anchor?'#'+info.anchor:'');window.open(url,'_blank')}
 function exportData(){if(!validate())return;const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='lab-content.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('Exported lab-content.json. Replace lib/lab-content.json with it, push to GitHub, then run the deploy action.');setDirty(false)}
 async function importFile(file:File){try{if(file.size>2_000_000)throw Error('Please use a content file smaller than 2 MB.');const d=upgradeContent(JSON.parse(await file.text()));const errors=validateContent(d);if(errors.length){setIssues(errors);return}commit(d as LabContent,'Update imported. Review it, then save or export the draft.');setIndex(null)}catch(e){setIssues([e instanceof Error?e.message:'Unable to read the update.'])}}
 function discard(){if(!confirm('Discard the local draft and return to the published content? Unexported changes will be lost.'))return;try{localStorage.removeItem(DRAFT)}catch{/* Nothing stored. */}setData(base);setDirty(false);setIssues([]);setIndex(null);setMessage('Local draft discarded. You are editing the published content.')}
 function blank(rows:Row[]):Row{const t:Row={};for(const r of rows)for(const [k,v] of Object.entries(r))if(!(k in t))t[k]=Array.isArray(v)?[]:'';t.id='new-'+Date.now().toString(36);for(const k of ['title','name','label'])if(k in t)t[k]='New entry';if('number' in t)t.number=String(rows.length+1).padStart(2,'0');if(section==='activityNews')t.date=today();if('year' in t)t.year=String(new Date().getFullYear());return t}
 function add(){if(!list)return;const at=info?.newFirst?0:list.length;edit(d=>{(d[section] as Row[]).splice(at,0,blank(list))},'New entry added. Complete its fields, then save.');setIndex(at)}
 function duplicate(i:number){if(!list)return;const copy=structuredClone(list[i]);copy.id=slug(String(copy.id)+'-copy-'+Date.now().toString(36).slice(-4));for(const k of ['title','name'])if(typeof copy[k]==='string')copy[k]+=' (copy)';edit(d=>{(d[section] as Row[]).splice(i+1,0,copy)},'Entry duplicated. Edit the copy, then save.');setIndex(i+1)}
 function remove(i:number){if(!list||!confirm('Delete “'+titleOf(list[i])+'”? Links to this entry from other sections will need updating.'))return;edit(d=>{(d[section] as Row[]).splice(i,1)},'Entry deleted. Save the draft to keep this change.');setIndex(null)}
 function move(i:number,step:number){if(!list||i+step<0||i+step>=list.length)return;edit(d=>{const rows=d[section] as Row[];[rows[i],rows[i+step]]=[rows[i+step],rows[i]]},'Order changed. Save the draft to keep it.');if(index!==null)setIndex(i+step)}
 // Validation messages that start with a section path, e.g. "projects[3].image …", link to that entry.
 function locate(issue:string){const m=/^\.?([a-zA-Z]+)(?:\[(\d+)\])?/.exec(issue);return m&&sections.some(s=>s.id===m[1])?{id:m[1],i:m[2]===undefined?null:Number(m[2])}:null}
 const visible=list?list.map((r,i)=>({r,i})).filter(({r})=>`${titleOf(r)} ${metaOf(r)} ${r.id}`.toLowerCase().includes(query.toLowerCase())):[];
 const count=(id:string)=>{const v=data[id as keyof LabContent];return Array.isArray(v)?v.length:null};

 return <div className="editor-page"><header className="editor-header"><a href="/" className="text-link"><ArrowLeft size={17}/> Back to the lab</a><span>A²R / CONTENT EDITOR</span><div className="editor-header-actions"><span className={'local-badge'+(dirty?' unsaved':'')}>{dirty?'UNSAVED CHANGES':'LOCAL DRAFT'}</span><button className="text-link" onClick={()=>{if(!dirty||confirm('You have unsaved changes. Lock the editor anyway?'))onLock()}}><Lock size={15}/> Lock</button></div></header>
 <main className="editor-main"><div className="editor-intro"><p className="eyebrow blue">KEEP THE LAB UP TO DATE</p><h1>Edit the content.<br/>Keep the design.</h1><p>Choose a section, pick an entry, and edit its fields. Changes stay in this browser until you export and publish them.</p></div>
 <ol className="editor-steps"><li><strong>1</strong> Edit & save draft</li><li><strong>2</strong> Preview the draft</li><li><strong>3</strong> Export lab-content.json</li><li><strong>4</strong> Replace lib/lab-content.json, push, and run the deploy action</li></ol>
 <div className="editor-toolbar"><button className="button button-blue" onClick={save}><Save size={16}/> Save draft</button><button className="button button-outline" onClick={preview}><Eye size={16}/> Preview</button><button className="button button-outline" onClick={exportData}><Download size={16}/> Export update</button><button className="text-link blue" onClick={()=>upload.current?.click()}><Upload size={15}/> Import update</button><input type="file" accept="application/json,.json" ref={upload} hidden onChange={e=>{const f=e.target.files?.[0];if(f)void importFile(f);e.target.value=''}}/></div>
 <p className="editor-status" role="status">{message||'All fields contain the current site content. Ctrl+S saves the draft.'}</p>
 {issues.length>0&&<div className="editor-errors" role="alert"><strong>Please fix these fields before saving:</strong><ul>{issues.map(issue=>{const at=locate(issue);return <li key={issue}>{at?<button onClick={()=>go(at.id,at.i)}>{issue}</button>:issue}</li>})}</ul></div>}
 <div className="editor-layout"><aside><nav className="editor-nav" aria-label="Content sections">{groups.map(g=><div key={g.title}><p>{g.title}</p>{g.sections.map(s=><button key={s.id} className={section===s.id?'active':''} aria-current={section===s.id?'page':undefined} onClick={()=>go(s.id)}><span>{s.name}</span>{count(s.id)!==null&&<small>{count(s.id)}</small>}</button>)}</div>)}<div><p>Editor</p><button className={section==='settings'?'active':''} aria-current={section==='settings'?'page':undefined} onClick={()=>go('settings')}><span>Password & draft</span><Settings size={15}/></button></div></nav><p className="editor-help">Images and videos must already be in public/media. Add new files there before publishing, then use paths like /media/new-photo.webp.</p><a href="/editor-guide.txt" className="text-link blue" download>Download editing guide <Download size={14}/></a></aside>
 <section className="editor-fields" aria-label={(info?.name??'Editor settings')+' editor'}>
 {section==='settings'?<SettingsPanel data={data} onChange={(access,note)=>commit({...data,editorAccess:access},note)} onDiscard={discard}/>
 :list&&index===null?<><div className="editor-panel-head"><div><p className="card-meta">{groups.find(g=>g.sections.includes(info!))?.title}</p><h2>{info?.name}</h2><p>{info?.where}</p></div><button className="button button-blue" onClick={add}><Plus size={16}/> Add new entry</button></div>
  {list.length>6&&<label className="editor-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={'Search '+list.length+' entries…'} aria-label="Search entries"/>{query&&<button onClick={()=>setQuery('')} aria-label="Clear search"><X size={14}/></button>}</label>}
  <ol className="editor-entries">{visible.map(({r,i})=><li key={String(r.id)+i}><button className="editor-entry" onClick={()=>setIndex(i)}><span className="editor-entry-index">{String(i+1).padStart(2,'0')}</span>{thumbOf(r)?<img src={thumbOf(r)} alt="" loading="lazy"/>:<span className="editor-entry-blank"/>}<span><strong>{titleOf(r)}</strong><small>{metaOf(r)||String(r.id)}</small></span></button><div className="editor-entry-actions">{!query&&<><button onClick={()=>move(i,-1)} disabled={i===0} aria-label={'Move '+titleOf(r)+' up'}><ChevronUp size={16}/></button><button onClick={()=>move(i,1)} disabled={i===list.length-1} aria-label={'Move '+titleOf(r)+' down'}><ChevronDown size={16}/></button></>}<button onClick={()=>duplicate(i)} aria-label={'Duplicate '+titleOf(r)}><Copy size={15}/></button><button onClick={()=>remove(i)} aria-label={'Delete '+titleOf(r)}><Trash2 size={15}/></button></div></li>)}</ol>
  {!visible.length&&<p className="compact-empty">No entries match “{query}”.</p>}</>
 :record&&<><div className="editor-panel-head">{list?<div><button className="text-link blue" onClick={()=>setIndex(null)}><ArrowLeft size={16}/> All {info?.name.toLowerCase()}</button><h2>{titleOf(record)}</h2><p>Entry {index!+1} of {list.length} · {info?.name}</p></div>:<div><p className="card-meta">{groups.find(g=>g.sections.includes(info!))?.title}</p><h2>{info?.name}</h2><p>{info?.where}</p></div>}
  {list&&<div className="editor-record-actions"><button onClick={()=>setIndex(index!-1)} disabled={index===0} aria-label="Previous entry"><ChevronLeft size={17}/></button><button onClick={()=>setIndex(index!+1)} disabled={index===list.length-1} aria-label="Next entry"><ChevronRight size={17}/></button><button onClick={()=>duplicate(index!)}><Copy size={15}/> Duplicate</button><button className="danger" onClick={()=>remove(index!)}><Trash2 size={15}/> Delete</button></div>}</div>
  <div className="editor-form">{fieldsOf(section,list,record).map(key=><Field key={section+index+key} section={section} name={key} value={record[key]} data={data} record={record} siblings={list} onChange={v=>change(key,v)}/>)}</div>
  <div className="editor-form-foot"><button className="button button-blue" onClick={save}><Save size={16}/> Save draft</button><button className="button button-outline" onClick={preview}><Eye size={16}/> Preview</button>{list&&<button className="text-link blue" onClick={()=>setIndex(null)}>Back to all entries</button>}</div></>}
 </section></div></main></div>;
}

// Every field used by any entry in the section, so optional fields can be filled in on entries that lack them.
// projects[].video is legacy data the site no longer displays (project films use "movies").
const hidden:Record<string,string[]>={projects:['video']};
function fieldsOf(section:string,list:Row[]|null,record:Row){const keys:string[]=[];for(const r of list??[record])for(const k of Object.keys(r))if(!keys.includes(k)&&!hidden[section]?.includes(k))keys.push(k);return keys}

function Field({section,name,value,data,record,siblings,onChange}:{section:string;name:string;value:unknown;data:LabContent;record:Row;siblings:Row[]|null;onChange:(v:unknown)=>void}){
 const ref=refs[section]?.[name];const hint=hints[name];const listValue=Array.isArray(value)?value as string[]:[];const id='field-'+name;
 const wide=!narrow.includes(name)||Array.isArray(value)||!!ref?.multi;const group=Array.isArray(value)||!!ref?.multi;
 let control:React.ReactNode;
 if(ref){const options=(data[ref.from] as Row[]).map(r=>({id:String(r.id),label:titleOf(r)}));
  control=ref.multi?<Checklist options={options} value={listValue} onChange={onChange}/>:<select id={id} value={String(value??'')} onChange={e=>onChange(e.target.value)}>{(name!=='category'||!value)&&<option value="">{name==='category'?'Choose…':'None'}</option>}{options.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}{!!value&&!options.some(o=>o.id===value)&&<option value={String(value)}>{String(value)} · not found</option>}</select>}
 else if(name==='rankings')control=<Checklist options={['D1','Q1','Q2','Q3','Q4'].map(id=>({id,label:id}))} value={listValue} onChange={onChange} compact/>;
 else if(Array.isArray(value))control=<ListField value={listValue} images={name==='gallery'} onChange={onChange}/>;
 else if(multiline.includes(name))control=<textarea id={id} rows={name==='bio'||name==='description'?6:3} value={String(value??'')} onChange={e=>onChange(e.target.value)} maxLength={5000}/>;
 else if(name==='date'&&section==='activityNews')control=<input id={id} type="date" value={String(value??'')} onChange={e=>onChange(e.target.value)}/>;
 else{const options=suggest.includes(name)&&siblings?[...new Set(siblings.map(r=>r[name]).filter((v):v is string=>typeof v==='string'&&!!v))]:[];
  control=<><input id={id} value={String(value??'')} onChange={e=>onChange(e.target.value)} maxLength={3000} list={options.length?'options-'+name:undefined} type={name==='email'?'email':'text'}/>{options.length>0&&<datalist id={'options-'+name}>{options.map(o=><option key={o} value={o}/>)}</datalist>}</>}
 const isImage=(name==='image'||name==='poster')&&typeof value==='string'&&!!value;
 function idFromTitle(){const start=slug(titleOf({...record,id:''}));const taken=new Set(siblings?.filter(r=>r!==record).map(r=>r.id));let next=start,n=2;while(taken.has(next))next=start+'-'+n++;onChange(next)}
 return <div className={'editor-field'+(wide?' wide':'')}><div className="editor-field-label"><label htmlFor={group?undefined:id} id={id+'-label'}>{labelFor(name)}</label>{name==='id'&&<button type="button" className="text-link blue" onClick={idFromTitle}><Wand2 size={13}/> Create from title</button>}</div>
  {group?<div role="group" aria-labelledby={id+'-label'}>{control}</div>:control}{isImage&&<img className="editor-preview" src={value as string} alt="" onError={e=>{e.currentTarget.style.display='none'}} onLoad={e=>{e.currentTarget.style.display=''}}/>}{hint&&<small>{hint}</small>}</div>;
}

function Checklist({options,value,onChange,compact}:{options:{id:string;label:string}[];value:string[];onChange:(v:string[])=>void;compact?:boolean}){
 const [filter,setFilter]=useState('');const missing=value.filter(id=>!options.some(o=>o.id===id));
 const shown=[...options,...missing.map(id=>({id,label:id+' · not found'}))].filter(o=>o.label.toLowerCase().includes(filter.toLowerCase()));
 return <div className={'editor-checklist'+(compact?' compact':'')}>{options.length>10&&<div className="editor-checklist-head"><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter…" aria-label="Filter options"/><span>{value.length} selected</span></div>}<div className="editor-checklist-items">{shown.map(o=><label key={o.id}><input type="checkbox" checked={value.includes(o.id)} onChange={e=>onChange(e.target.checked?[...value,o.id]:value.filter(v=>v!==o.id))}/>{o.label}</label>)}</div></div>;
}

function ListField({value,images,onChange}:{value:string[];images:boolean;onChange:(v:string[])=>void}){
 const set=(i:number,v:string)=>onChange(value.map((x,j)=>j===i?v:x));const swap=(i:number,j:number)=>{const next=[...value];[next[i],next[j]]=[next[j],next[i]];onChange(next)};
 return <div className="editor-list">{value.map((item,i)=><div className="editor-list-row" key={i}>{images&&(item?<img src={item} alt=""/>:<span className="editor-entry-blank"/>)}<input value={item} onChange={e=>set(i,e.target.value)} aria-label={'Item '+(i+1)} maxLength={3000}/><button type="button" onClick={()=>swap(i,i-1)} disabled={i===0} aria-label="Move up"><ChevronUp size={15}/></button><button type="button" onClick={()=>swap(i,i+1)} disabled={i===value.length-1} aria-label="Move down"><ChevronDown size={15}/></button><button type="button" onClick={()=>onChange(value.filter((_,j)=>j!==i))} aria-label="Remove item"><X size={15}/></button></div>)}<button type="button" className="text-link blue" onClick={()=>onChange([...value,''])}><Plus size={15}/> Add {images?'image':'item'}</button></div>;
}

function SettingsPanel({data,onChange,onDiscard}:{data:LabContent;onChange:(access:LabContent['editorAccess'],note:string)=>void;onDiscard:()=>void}){
 const [current,setCurrent]=useState(''),[next,setNext]=useState(''),[confirmNext,setConfirmNext]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setError('');setDone(false);if(next.length<10)return setError('Use at least 10 characters for the new password.');if(next!==confirmNext)return setError('The new passwords do not match.');setBusy(true);try{if(!await verifyPassword(current,data.editorAccess)){setError('The current password is incorrect.');return}const access=await createAccess(next);remember(access);onChange(access,'Password changed in this draft. Save the draft, then export and publish it to apply it on the live editor.');setCurrent('');setNext('');setConfirmNext('');setDone(true)}catch(err){setError(err instanceof Error?err.message:'Unable to change the password.')}finally{setBusy(false)}}
 const published=data.editorAccess.hash===base.editorAccess.hash;
 return <><div className="editor-panel-head"><div><p className="card-meta">Editor</p><h2>Password & draft</h2><p>Manage access to this editor and the draft stored in this browser.</p></div></div>
 <form className="editor-settings-card" onSubmit={submit}><h3><KeyRound size={18}/> Editor password</h3><p>{published?'The published password was set on '+data.editorAccess.updated+'.':'A new password was set in this draft on '+data.editorAccess.updated+'. It applies to the live editor once the update is published.'}</p>
 <div className="editor-form"><div className="editor-field wide"><label htmlFor="pw-current"><span>Current password</span></label><input id="pw-current" type="password" value={current} onChange={e=>setCurrent(e.target.value)} autoComplete="current-password" required/></div><div className="editor-field"><label htmlFor="pw-new"><span>New password</span></label><input id="pw-new" type="password" value={next} onChange={e=>setNext(e.target.value)} autoComplete="new-password" required minLength={10}/></div><div className="editor-field"><label htmlFor="pw-confirm"><span>Confirm new password</span></label><input id="pw-confirm" type="password" value={confirmNext} onChange={e=>setConfirmNext(e.target.value)} autoComplete="new-password" required/></div></div>
 {error&&<p className="editor-gate-error" role="alert">{error}</p>}{done&&<p className="editor-success" role="status">Password changed in this draft. Save the draft, then export the update and publish it. Until then, the live editor keeps the previous password.</p>}
 <button className="button button-blue" type="submit" disabled={busy}>{busy?'Updating…':'Change password'}</button>
 <small>Only a secure hash of the password is stored in the content file. The website is static, so this password keeps casual visitors out of the editor; publishing still requires access to the GitHub repository.</small></form>
 <div className="editor-settings-card"><h3><RotateCcw size={18}/> Local draft</h3><p>Discard the draft saved in this browser and start again from the published content.</p><button className="button button-outline" onClick={onDiscard}>Discard local draft</button></div>
 <div className="editor-settings-card"><h3><ExternalLink size={18}/> Publishing an update</h3><ol><li>Save and preview your draft.</li><li>Click <strong>Export update</strong> to download <code>lab-content.json</code>.</li><li>Replace <code>lib/lab-content.json</code> in the repository with the downloaded file.</li><li>Add any new images or videos to <code>public/media/</code>.</li><li>Commit, push to GitHub, and run the deploy action.</li></ol></div></>;
}
