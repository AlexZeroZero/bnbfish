import test from 'node:test';import assert from 'node:assert/strict';
import {verificationBudget} from '../scripts/verification-budget.mjs';
const input={estimate:374547n,gasPrice:50000000n,income:20000000000000n,lifetime:0n,balance:1000000000000000n,maxTx:300000000000000n,maxDay:200000000000000000n,spent:0n};
test('wallet funding works even with zero fee income and previously spent income',()=>{const b=verificationBudget({...input,income:0n,lifetime:999999999n});assert.ok(b.ok);assert.equal(b.gasLimit,(input.estimate*120n+99n)/100n);});
test('wallet balance caps reserved gas without requiring the full preferred margin',()=>{const b=verificationBudget({...input,balance:20000000000000n});assert.ok(b.ok);assert.equal(b.gasLimit,400000n);assert.equal(b.reserved,20000000000000n);assert.equal(verificationBudget({...input,balance:0n}).code,'needs-funding');});
test('daily and transaction spending limits still apply',()=>{for(const overrides of [{maxTx:10000000000000n},{spent:input.maxDay-10000000000000n}])assert.equal(verificationBudget({...input,...overrides}).ok,false);});
