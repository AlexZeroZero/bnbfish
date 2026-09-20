import test from 'node:test';import assert from 'node:assert/strict';
import {translate,setLanguage,getLanguage,speciesLabel} from '../web/i18n.js';
import {translations} from '../web/locales.js';
test('UI translations preserve identifiers and translate all supported languages',()=>{
 for(const lang of ['en','ru','ja']){for(const source of ['抛竿','我的鱼篓','鱼获记录','确认抛竿','极其罕见','NFT 没有任何经济价值属性，仅作为收藏娱乐。'])assert.notEqual(translate(source,lang),source);const hash='0x84A26C7d59f600120653A41769CE08174e34642f';assert.equal(translate(hash,lang),hash);assert.equal(translate('0.00001 BNB',lang),'0.00001 BNB');assert.ok(translate('垂钓 #123 · 区块 456',lang).includes('123'));}
 for(const [source,row]of translations)for(const lang of ['en','ru','ja'])assert.ok(row[lang],source+' '+lang);
});
test('language round trip and scientific fallback do not change catalog data',()=>{setLanguage('ja');assert.equal(getLanguage(),'ja');setLanguage('invalid');assert.equal(getLanguage(),'ja');setLanguage('zh');assert.equal(translate('鱼获记录'),'鱼获记录');const species={id:99,name:'未命名物种',scientificName:'Example species'};assert.equal(speciesLabel(species,'en'),'Example species');assert.equal(species.name,'未命名物种');});
