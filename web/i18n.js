import {claim200Rows} from './claim200-locales.js';
import {globalFishRows} from './global-fish-locales.js';
import {extraRows} from './locale-extra.js';
import {speciesRows} from './species-locales.js';
import {translations,languageNames,locales} from './locales.js';
import {protocolTranslations} from './protocol-locales.js';
for(const [source,values] of protocolTranslations)translations.set(source,values);
for(const row of (speciesRows+extraRows+globalFishRows+claim200Rows).trim().split('\n').filter(Boolean)){const [source,en,ru,ja]=row.split('|');translations.set(source,{en,ru,ja});}
let language='zh';
try{const saved=localStorage.getItem('bnbfish:language');if(Object.hasOwn(languageNames,saved))language=saved;}catch{}
const originalText=new WeakMap(),originalAttributes=new WeakMap();
let terms=[...translations.keys()].sort((a,b)=>b.length-a.length);
export function getLanguage(){return language;}
export function getLocale(){return locales[language];}
export function translate(source,lang=language){
 if(lang==='zh'||!Object.hasOwn(languageNames,lang))return source;
 if(translations.has(source))return translations.get(source)[lang]||source;
 // Single-pass matching prevents translated output from becoming input again.
 let result='',offset=0;while(offset<source.length){const match=terms.find(k=>source.startsWith(k,offset));if(match){result+=translations.get(match)[lang]||match;offset+=match.length;}else result+=source[offset++];}return result;
}
export function speciesLabel(species,lang=language){if(lang==='zh')return species.name;return translations.get(species.name)?.[lang]||species.scientificName||species.name;}
function text(node){const before=node.nodeValue;if(!before?.trim())return;const prior=originalText.get(node),source=prior&&before===prior.rendered?prior.source:before;const rendered=translate(source);originalText.set(node,{source,rendered});if(before!==rendered)node.nodeValue=rendered;}
function attributes(el){if(el.matches('time[datetime]')){const d=new Date(el.getAttribute('datetime'));if(Number.isFinite(d.getTime())){const value=el.dataset.dateStyle==='date'?d.toLocaleDateString(getLocale()):d.toLocaleString(getLocale());if(el.textContent!==value)el.textContent=value;}}let values=originalAttributes.get(el);if(!values){values={};originalAttributes.set(el,values);}for(const key of ['aria-label','placeholder','title']){if(!el.hasAttribute(key))continue;const before=el.getAttribute(key),prior=values[key],source=prior&&before===prior.rendered?prior.source:before;const rendered=translate(source);values[key]={source,rendered};if(before!==rendered)el.setAttribute(key,rendered);}}
function ignored(el){return !el||!!el.closest('script,style,textarea,[data-no-translate]');}
function render(root){if(root.nodeType===3){if(!ignored(root.parentElement))text(root);return;}if(root.nodeType!==1||ignored(root))return;attributes(root);const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{acceptNode(node){return ignored(node.nodeType===1?node:node.parentElement)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}});while(walker.nextNode()){const node=walker.currentNode;if(node.nodeType===3)text(node);else attributes(node);}}
let observer;
function observe(){observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','title']});}
export function setLanguage(lang){if(!Object.hasOwn(languageNames,lang))return;language=lang;try{localStorage.setItem('bnbfish:language',lang);}catch{}if(typeof document==='undefined')return;document.documentElement.lang=locales[lang];document.documentElement.dataset.language=lang;observer?.disconnect();render(document.body);if(observer)observe();const select=document.querySelector('#language-select');if(select)select.value=lang;window.dispatchEvent(new CustomEvent('bnbfish:language',{detail:{language:lang}}));}
export function startLocalization(){
 // Preserve canonical species names/IDs for models and on-chain lookup. Only captions change.
 for(const s of window.FishGuide?.species||[])if(!translations.has(s.name)&&s.scientificName)translations.set(s.name,{en:s.scientificName,ru:s.scientificName,ja:s.scientificName});terms=[...translations.keys()].sort((a,b)=>b.length-a.length);
 const label=document.createElement('label');label.className='language-picker';label.dataset.noTranslate='';label.innerHTML='<span aria-hidden="true">◎</span><select id="language-select" aria-label="Language / 语言 / Язык / 言語">'+Object.entries(languageNames).map(([id,name])=>`<option value="${id}">${name}</option>`).join('')+'</select>';document.querySelector('.game-header').appendChild(label);label.querySelector('select').onchange=e=>setLanguage(e.target.value);
 observer=new MutationObserver(records=>{observer.disconnect();const roots=new Set();for(const r of records){if(r.type==='childList')r.addedNodes.forEach(n=>roots.add(n));else roots.add(r.target);}roots.forEach(render);observe();});setLanguage(language);
}
