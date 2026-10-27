import { useEffect, useState } from 'react';
import initialContent from './lab-content.json';
import { upgradeContent, validateContent, type LabContent } from './content-validation';
// Published content, or this browser's saved editor draft when the page is opened with ?draft=1.
export function useLabContent():[LabContent,boolean]{
 const [content,setContent]=useState<LabContent>(initialContent),[draft,setDraft]=useState(false);
 useEffect(()=>{if(new URLSearchParams(window.location.search).get('draft')==='1'){try{const value=localStorage.getItem('a2r-content-draft');if(value){const parsed=upgradeContent(JSON.parse(value));if(!validateContent(parsed).length){setContent(parsed as LabContent);setDraft(true)}}}catch{/* Use published content if a draft cannot be read. */}}},[]);
 return [content,draft];
}
