import test from 'node:test';import assert from 'node:assert/strict';
import {clearRetiredCollections} from '../web/collection-cleanup.js';
test('retired collection cleanup preserves current claims, pending transactions and preferences',()=>{
 const old='Bnbfish-bnb:56:0x84A26C7d59f600120653A41769CE08174e34642f:0xplayer:tx';
 const keep=['Bnbfish-bnb:56:0x60011EaC38503af422d0B9AFeC214a18aD99c11f:0xplayer:claim:1','bnbfish:claim200:deployment:hash','bnbfish:claim200:activate:current','language','audio','unrelated'];
 const map=new Map([old,...keep].map(k=>[k,'keep']));const storage={get length(){return map.size;},key:i=>[...map.keys()][i],removeItem:k=>map.delete(k)};
 assert.equal(clearRetiredCollections(storage),1);assert.deepEqual([...map.keys()],keep);assert.equal(clearRetiredCollections(storage),0);
});
