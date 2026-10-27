'use client';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Guidelines } from '@/components/lab-expansion';
import { useLabContent } from '@/lib/use-lab-content';
export default function GuidelinesPage(){
 const [content,draft]=useLabContent();const {lab}=content;
 return <>
 <a className="skip-link" href="#main">Skip to content</a>
 {draft&&<div className="draft-banner">Local draft preview <a href="/edit/">Return to editor</a><a href="/guidelines/">View published content</a></div>}
 <header className="site-header"><a className="wordmark" href="/" aria-label="A squared R Research Lab home"><img src="/media/logo.webp" alt="A²R Autonomous and Assistive Robotics Research Group" className="brand-logo" width="94" height="75"/><span>RESEARCH LAB</span></a><a className="text-link" href={draft?'/?draft=1':'/'}><ArrowLeft size={17}/> Back to the lab</a></header>
 <main id="main" className="guidelines-page"><Guidelines content={content} page/><section className="section guidelines-next"><div><p className="eyebrow blue">STUDENTS AT A²R</p><h2>Ready to start building?</h2><p>See what students are working on, from competitions to research projects, or ask about a thesis topic.</p></div><div><a className="button button-blue" href={(draft?'/?draft=1':'/')+'#students'}>Student activities & competitions <ArrowUpRight size={18}/></a><a className="text-link blue" href={'mailto:'+lab.email+'?subject=A2R%20student%20enquiry'}>Contact the lab <ArrowUpRight size={18}/></a></div></section></main>
 <footer><div className="footer-bottom"><span>© {new Date().getFullYear()} A²R Research Lab</span><span>{lab.department}</span><span className="footer-links"><a href="/">Home</a><a href="/edit/">Content editor</a></span></div></footer>
 </>;
}
