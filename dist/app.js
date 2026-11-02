/* HORIZON — a local, dependency-free photographic exhibition. */
'use strict';
const { selected, archive } = window.PHOTOS;
const $ = selector => document.querySelector(selector);
const chapters = [
  ['山海与日式风景','WHERE THE HORIZON BEGINS','水面、远山与天光。让旅途在此停一停。',4],
  ['樱花与森林','IN THE QUIET OF NATURE','穿过花影与林间，遇见另一种速度。',11],
  ['城市与建筑','LINES OF THE CITY','建筑勾勒秩序，车身划过城市的留白。',18],
  ['夜色与动态','AFTER THE LIGHT FADES','当夜幕落下，光成为速度的形状。',24],
  ['跨车型与合影','BETTER TOGETHER','不同的轮廓，同一段旅程。',32],
  ['车型专题','PORTRAITS OF MACHINES','走近一些，看见每一条线条的性格。',40],
  ['视觉实验','BEYOND THE REAL','AI 视觉实验 · 在现实的边缘，想象另一种可能。',54],
  ['游戏界面','ON THE VIRTUAL TRACK','游戏画面 · 记录赛道上的一个瞬间。',58]
];
$('#hero-image').src = selected[4].src;
$('#selected-count').textContent = `${selected.length} WORKS / 08 CHAPTERS`;
$('#archive-count').textContent = String(archive.length).padStart(3,'0');
const pad = n => String(n).padStart(2,'0');
function shortTitle(photo) { return photo.title.replace(/^\d{4}-\d{2}-\d{2} /,''); }
function photoCard(photo, index, list, lead=false) {
  const figure = document.createElement('figure');
  figure.className = `photo reveal ${photo.width < photo.height ? 'portrait' : 'landscape'}${lead?' lead':''}`;
  const button = document.createElement('button');button.className='image-wrap';
  button.setAttribute('aria-label',`查看：${photo.title}`);
  const img = document.createElement('img');img.src=lead?photo.src:photo.thumb;img.alt=photo.title;
  img.width=photo.width;img.height=photo.height;img.loading='lazy';img.decoding='async';
  if (!lead) { img.srcset=`${photo.thumb} 640w, ${photo.src} ${Math.min(2400,photo.width)}w`; img.sizes=photo.width<photo.height?'(max-width:650px) 42vw, 28vw':'(max-width:650px) 86vw, 43vw'; }
  button.append(img);button.addEventListener('click',()=>openViewer(list,index));
  const caption = document.createElement('figcaption');
  const name = document.createElement('span');name.className='photo-name';name.textContent=shortTitle(photo);
  const number = document.createElement('span');number.className='photo-id';number.textContent=`NO. ${pad(index+1)}`;
  caption.append(name,number);figure.append(button,caption);return figure;
}
chapters.forEach(([title,en,description,cover],chapterIndex)=>{
  const list=selected.filter(p=>p.category===title);
  const coverPhoto=selected[cover];
  if(list.includes(coverPhoto)){list.splice(list.indexOf(coverPhoto),1);list.unshift(coverPhoto);}
  const anchor=document.createElement('a');anchor.href=`#chapter-${chapterIndex+1}`;
  anchor.innerHTML=`<small>${pad(chapterIndex+1)}</small>${title}`;$('#chapter-nav').append(anchor);
  const section=document.createElement('section');section.className=`chapter${chapterIndex===3?' night':''}`;section.id=`chapter-${chapterIndex+1}`;
  section.innerHTML=`<div class="chapter-heading"><div class="chapter-title"><span class="chapter-number">${pad(chapterIndex+1)}</span><h3>${title}<span class="english">${en}</span></h3></div><p class="chapter-description">${description}</p></div><div class="gallery"></div>`;
  const gallery=section.querySelector('.gallery');
  const initial=Math.min(list.length,chapterIndex===5?5:4);
  list.slice(0,initial).forEach((photo,i)=>gallery.append(photoCard(photo,i,list,i===0&&photo.width>photo.height)));
  const foot=document.createElement('div');foot.className='chapter-more';
  const count=document.createElement('span');count.textContent=`${pad(list.length)} FRAMES / ${title==='视觉实验'?'AI VISUAL EXPERIMENT':title==='游戏界面'?'GAME CAPTURE':'SELECTED WORKS'}`;foot.append(count);
  if(list.length>initial){
    const more=document.createElement('button');more.className='outline-button';more.textContent=`展开本章全部 ${list.length} 张 +`;
    let expanded=false;
    more.addEventListener('click',()=>{
      expanded=!expanded;
      if(expanded){list.slice(initial).forEach((photo,i)=>gallery.append(photoCard(photo,i+initial,list)));more.textContent='收起本章 −';observeReveals();}
      else{[...gallery.children].slice(initial).forEach(n=>n.remove());more.textContent=`展开本章全部 ${list.length} 张 +`;section.scrollIntoView({behavior:'instant'});}
    });foot.append(more);
  }
  section.append(foot);$('#chapters').append(section);
});
// Archive keeps every unique source file, including the selected works.
const categories=[...new Set(archive.map(p=>p.category))];
categories.forEach(category=>{const option=document.createElement('option');option.value=category;option.textContent=category;$('#category').append(option);});
let filtered=archive, shown=0;
function renderArchive(reset=true){
  if(reset){
    const q=$('#search').value.trim().toLocaleLowerCase(), category=$('#category').value;
    filtered=archive.filter(p=>(category==='all'||p.category===category)&&`${p.title} ${p.category} ${p.collection}`.toLocaleLowerCase().includes(q));
    shown=0;$('#archive-grid').replaceChildren();
  }
  const next=Math.min(shown+32,filtered.length);
  for(let i=shown;i<next;i++)$('#archive-grid').append(photoCard(filtered[i],i,filtered));
  shown=next;$('#result-count').textContent=`${filtered.length} 张影像`;
  $('#empty-state').hidden=filtered.length>0;$('#load-more').hidden=shown>=filtered.length;
  $('#load-more').textContent=`继续浏览 · 已展示 ${shown} / ${filtered.length} ↓`;
  observeReveals();
}
$('#search').addEventListener('input',()=>renderArchive());$('#category').addEventListener('change',()=>renderArchive());$('#load-more').addEventListener('click',()=>renderArchive(false));
let archiveReady=false;
function route(){
  const hash=location.hash;const isArchive=hash==='#archive';
  $('#archive-view').hidden=!isArchive;$('#exhibition-view').hidden=isArchive;
  document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',hash===`#${a.dataset.nav}`));
  document.title=isArchive?'完整档案 — HORIZON / stellia':'HORIZON / 地平线 — stellia';
  if(isArchive){if(!archiveReady){renderArchive();archiveReady=true;}window.scrollTo({top:0,behavior:'instant'});}
  else if(hash){requestAnimationFrame(()=>document.getElementById(hash.slice(1))?.scrollIntoView());}
  else window.scrollTo({top:0,behavior:'instant'});
  observeReveals();
}
window.addEventListener('hashchange',route);
const dialog=$('#lightbox');let viewerList=[],viewerIndex=0,slideTimer=null,lastFocus=null;
function showPhoto(){
  const p=viewerList[viewerIndex];const img=$('#viewer-image');img.src=p.src;img.alt=p.title;
  $('#viewer-caption').textContent=`${p.category} / ${p.title}`;$('#viewer-counter').textContent=`${pad(viewerIndex+1)} / ${pad(viewerList.length)}`;$('#open-photo').href=p.src;
  const next=viewerList[(viewerIndex+1)%viewerList.length];if(next){const preload=new Image();preload.src=next.src;}
}
function openViewer(list,index){lastFocus=document.activeElement;viewerList=list;viewerIndex=index;showPhoto();dialog.showModal();document.body.classList.add('viewing');$('#close-viewer').focus();}
function stopSlideshow(){clearInterval(slideTimer);slideTimer=null;$('#slideshow').textContent='自动播放 ▷';$('#slideshow').setAttribute('aria-pressed','false');}
function step(direction){viewerIndex=(viewerIndex+direction+viewerList.length)%viewerList.length;showPhoto();}
$('#close-viewer').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{stopSlideshow();document.body.classList.remove('viewing');lastFocus?.focus({preventScroll:true});});
$('#prev-photo').addEventListener('click',()=>{stopSlideshow();step(-1);});$('#next-photo').addEventListener('click',()=>{stopSlideshow();step(1);});
$('#slideshow').setAttribute('aria-pressed','false');
$('#slideshow').addEventListener('click',()=>{if(slideTimer)stopSlideshow();else{slideTimer=setInterval(()=>step(1),4500);$('#slideshow').textContent='暂停 Ⅱ';$('#slideshow').setAttribute('aria-pressed','true');}});
dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();stopSlideshow();step(e.key==='ArrowLeft'?-1:1);}});
let touchStart=null;
$('#viewer-image').addEventListener('touchstart',e=>{if(e.touches.length===1)touchStart=e.touches[0].clientX;},{passive:true});
$('#viewer-image').addEventListener('touchend',e=>{if(touchStart!==null){const diff=e.changedTouches[0].clientX-touchStart;if(Math.abs(diff)>55){stopSlideshow();step(diff<0?1:-1);}touchStart=null;}},{passive:true});
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const observer='IntersectionObserver' in window&&!reducedMotion?new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.remove('pending');observer.unobserve(e.target);}}),{rootMargin:'0px 0px 40px 0px',threshold:0.03}):null;
if(observer)document.documentElement.classList.add('js-motion');
function observeReveals(){if(!observer)return;document.querySelectorAll('.reveal:not([data-observed])').forEach(el=>{el.dataset.observed='true';el.classList.add('pending');observer.observe(el);});}
route();
