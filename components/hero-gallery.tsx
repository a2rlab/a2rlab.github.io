'use client';
import { useEffect, useState } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
export default function HeroGallery({onPlay,duration,slides}:{onPlay:()=>void;duration:string;slides:{id:string;image:string;alt:string;label:string}[]}){
 const [active,setActive]=useState(0),[playing,setPlaying]=useState(false),[hover,setHover]=useState(false);
 useEffect(()=>{const preference=window.matchMedia('(prefers-reduced-motion: reduce)');setPlaying(!preference.matches);const change=()=>setPlaying(!preference.matches);preference.addEventListener('change',change);return()=>preference.removeEventListener('change',change)},[]);
 useEffect(()=>{if(!playing||hover)return;const timer=setInterval(()=>setActive(i=>(i+1)%slides.length),6500);return()=>clearInterval(timer)},[playing,hover,slides.length]);
 const move=(n:number)=>{setActive(i=>(i+n+slides.length)%slides.length);setPlaying(false)};
 return <figure className="hero-image hero-gallery" aria-label="Life at A²R photo gallery" aria-roledescription="carousel" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocusCapture={()=>setHover(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setHover(false)}}>
 {slides.map((slide,i)=><img key={slide.image} className={'hero-slide '+(active===i?'is-active':'')} src={slide.image} alt={active===i?slide.alt:''} aria-hidden={active!==i} fetchPriority={i===0?'high':'auto'} loading={i===0?'eager':'lazy'} width="1600" height="1200"/>)}
 <div className="hero-gallery-controls"><button onClick={()=>move(-1)} aria-label="Previous lab photo"><ChevronLeft size={19}/></button><span aria-live={playing?'off':'polite'}>{String(active+1).padStart(2,'0')} / {String(slides.length).padStart(2,'0')}</span><button onClick={()=>move(1)} aria-label="Next lab photo"><ChevronRight size={19}/></button><button onClick={()=>setPlaying(!playing)} aria-label={playing?'Pause automatic photo rotation':'Start automatic photo rotation'} aria-pressed={playing}>{playing?<Pause size={17}/>:<Play size={17}/>}</button></div>
 <button className="hero-play" onClick={onPlay}><span><Play size={21} fill="currentColor"/></span><div>Inside A²R<small>WATCH THE LAB FILM · {duration}</small></div></button>
 <figcaption><span>{slides[active].label}</span><span>A²R / DEBRECEN</span></figcaption>
 </figure>
}
