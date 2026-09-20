import fs from 'node:fs';import {keccak256,toUtf8Bytes} from 'ethers';
export const manifest=JSON.parse(fs.readFileSync(new URL('../config/species-v1.json',import.meta.url),'utf8'));
export const rulesHash=keccak256(toUtf8Bytes(JSON.stringify(manifest)));
export const catalog=manifest.species.filter(s=>s.enabled).sort((a,b)=>a.id-b.id).map(s=>({id:s.id,tier:manifest.tiers.findIndex(t=>t.id===s.rarity),waters:s.waters.reduce((n,w)=>n|(1<<w),0),weight:s.selectionWeight,minLength:s.lengthMinMm,maxLength:s.lengthMaxMm,referenceLength:s.referenceLengthMm,referenceMass:s.referenceMassGrams}));
export const artifact=name=>JSON.parse(fs.readFileSync(new URL('../artifacts/'+name+'.json',import.meta.url),'utf8'));
