import fs from 'node:fs';import {build} from 'esbuild';import {createHash} from 'node:crypto';
const plan=JSON.parse(fs.readFileSync('artifacts/claim200/deployment-candidate.json'));
const verified=fs.existsSync('artifacts/claim200/verified-deployment.json')?JSON.parse(fs.readFileSync('artifacts/claim200/verified-deployment.json')):null;
plan.disabled=!!verified;plan.stage=verified?'deployed-awaiting-activation':'wallet-signature-required';if(verified){plan.contract=verified.contract;plan.transactionHash=verified.transactionHash;}
plan.releaseHold=['Deploy paused; verify on chain before activation','Configure dedicated settlement service and fee-funded gas budget','Pin verified address and runtime hash in frontend before activation'];
fs.writeFileSync('web/claim200-deployment-plan.json',JSON.stringify(plan,null,2));
fs.writeFileSync('web/claim200-integrity.js','export const EXPECTED_DATA_HASH='+JSON.stringify(plan.dataHash)+';');
for(const [entry,out,html] of [['web/app.js','web/app.bundle.js','web/index.html'],['web/claim200-deploy.js','web/claim200-deploy.bundle.js','web/claim200-deploy.html'],...(verified?[["web/claim200-activate.js","web/claim200-activate.bundle.js","web/claim200-activate.html"]]:[])]){
 await build({entryPoints:[entry],bundle:true,format:'esm',minify:true,target:['chrome100','safari16'],outfile:out});
 const hash='sha384-'+createHash('sha384').update(fs.readFileSync(out)).digest('base64'),name=out.split('/').at(-1);
 let text=fs.readFileSync(html,'utf8');const re=new RegExp('<script type="module" src="'+name.replaceAll('.','\\.')+'[^"]*"[^>]*>');
 if(!re.test(text))throw Error('Missing module script '+html);
 text=text.replace(re,'<script type="module" src="'+name+'?v='+createHash('sha256').update(fs.readFileSync(out)).digest('hex').slice(0,12)+'" integrity="'+hash+'" crossorigin="anonymous">');fs.writeFileSync(html,text);
}
const banner={js:"import {createRequire as __c} from 'node:module';const require=__c(import.meta.url);"};
await build({entryPoints:['service/server.mjs'],bundle:true,platform:'node',format:'esm',outfile:'.runtime/claim200/server.mjs',banner});
await build({entryPoints:['scripts/keeper-claim200.mjs'],bundle:true,platform:'node',format:'esm',outfile:'.runtime/claim200/keeper-claim200.mjs',banner});
console.log('Candidate release built; no chain transactions sent');
