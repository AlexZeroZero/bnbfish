import fs from 'node:fs';import path from 'node:path';import solc from 'solc';import {build} from 'esbuild';import {keccak256,toUtf8Bytes} from 'ethers';
const source=Object.fromEntries(['Bnbfish.sol','MockVRF.sol'].map(f=>[f,{content:fs.readFileSync('contracts/'+f,'utf8')}]));
const out=JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources:source,settings:{optimizer:{enabled:true,runs:200},viaIR:true,evmVersion:'paris',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object','evm.deployedBytecode.immutableReferences','metadata']}}}}),{import:p=>{try{const content=fs.readFileSync(path.join('node_modules',p),'utf8');source[p]={content};return {contents:content};}catch{return {error:'Missing import '+p};}}}));
for(const e of out.errors||[])if(e.severity==='error')throw Error(e.formattedMessage);
fs.mkdirSync('artifacts',{recursive:true});
for(const [file,name] of [['Bnbfish.sol','Bnbfish'],['MockVRF.sol','MockVRF']]){const c=out.contracts[file][name];if(c.evm.deployedBytecode.object.length/2>24576)throw Error('Contract exceeds EIP-170');fs.writeFileSync('artifacts/'+name+'.json',JSON.stringify({abi:c.abi,bytecode:'0x'+c.evm.bytecode.object,runtimeBytes:c.evm.deployedBytecode.object.length/2,runtimeBytecode:'0x'+c.evm.deployedBytecode.object,immutableReferences:c.evm.deployedBytecode.immutableReferences,compiler:solc.version()},null,2));}
const rules=JSON.parse(fs.readFileSync('config/species-v1.json','utf8'));const hash=keccak256(toUtf8Bytes(JSON.stringify(rules)));fs.writeFileSync('artifacts/rules-hash.json',JSON.stringify({hash}));
fs.copyFileSync('artifacts/Bnbfish.json','web/contract-abi.json');
if(fs.existsSync('web/app.js'))await build({entryPoints:['web/app.js'],bundle:true,format:'esm',outfile:'web/app.bundle.js',minify:true,target:['chrome100','safari16']});
console.log('Compiled contracts; rules hash:',hash);

if(fs.existsSync('web/deployment-integrity.js'))await build({entryPoints:['web/deploy.js'],bundle:true,format:'esm',outfile:'web/deploy.bundle.js',minify:true,target:['chrome100','safari16']});

fs.writeFileSync('artifacts/verification-input.json',JSON.stringify({language:'Solidity',sources:source,settings:{optimizer:{enabled:true,runs:200},viaIR:true,evmVersion:'paris',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object']}}}},null,2));

if(fs.existsSync('web/activation-config.js'))await build({entryPoints:['web/activate.js'],bundle:true,format:'esm',outfile:'web/activate.bundle.js',minify:true,target:['chrome100','safari16']});
