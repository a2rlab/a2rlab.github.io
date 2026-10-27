import base from './lab-content.json';
export type EditorAccess=typeof base.editorAccess;
// The editor runs on a static host, so this is an access gate rather than server-side security.
// Only a salted PBKDF2 hash is published; the password itself is never stored.
const SESSION='a2r-editor-session';
const hex=(b:Uint8Array)=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
const bytes=(h:string)=>new Uint8Array((h.match(/../g)??[]).map(x=>parseInt(x,16)));
async function derive(password:string,salt:string,iterations:number){
 if(!globalThis.crypto?.subtle)throw Error('The editor password needs a secure connection. Open the editor through https:// or localhost.');
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:bytes(salt),iterations},key,256)));
}
export async function verifyPassword(password:string,access:EditorAccess){return (await derive(password,access.salt,Number(access.iterations)))===access.hash}
export async function createAccess(password:string):Promise<EditorAccess>{
 const salt=hex(crypto.getRandomValues(new Uint8Array(16))),iterations=210000;
 return {algorithm:'PBKDF2-SHA256',iterations:String(iterations),salt,hash:await derive(password,salt,iterations),updated:new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})};
}
// The published password always works. A password changed in this browser's saved draft also works here, before it is published.
export function acceptedAccess():EditorAccess[]{
 const list=[base.editorAccess];
 try{const draft=JSON.parse(localStorage.getItem('a2r-content-draft')??'null');if(draft?.editorAccess?.hash&&draft.editorAccess.hash!==base.editorAccess.hash)list.push(draft.editorAccess)}catch{/* Use the published password only. */}
 return list;
}
export async function unlock(password:string){
 for(const access of acceptedAccess())if(await verifyPassword(password,access)){remember(access);return true}
 return false;
}
export function remember(access:EditorAccess){try{sessionStorage.setItem(SESSION,access.hash)}catch{/* Unlock lasts until the page is closed. */}}
export function isUnlocked(){try{const hash=sessionStorage.getItem(SESSION);return !!hash&&acceptedAccess().some(a=>a.hash===hash)}catch{return false}}
export function lock(){try{sessionStorage.removeItem(SESSION)}catch{/* Nothing stored. */}}
