import test from 'node:test';
import assert from 'node:assert/strict';
import { shareCeiling, validShare, validPLTransfer } from '../src/lib/accountingValidation.ts';
test('Company can independently allocate 0–100 with two-decimal precision',()=>{
 assert.equal(shareCeiling('company',85),100);
 for(const v of ['0','50','85','100','92.25']) assert.equal(validShare(v,100),true);
 for(const v of ['100.01','-1','NaN','1e2','1.001','']) assert.equal(validShare(v,100),false);
});
test('downline share validation fails closed and accepts equality',()=>{
 assert.equal(shareCeiling('admin',undefined),0);
 assert.equal(validShare('85',shareCeiling('superadmin',85)),true);
 assert.equal(validShare('90',shareCeiling('superadmin',85)),false);
});
test('signed P/L partial/full limits use exact displayed decimals',()=>{
 assert.equal(validPLTransfer('106783',106783),true);
 assert.equal(validPLTransfer('10',47415.98),true);
 assert.equal(validPLTransfer('-20',-50),true);
 assert.equal(validPLTransfer('-50',-50),true);
 for(const v of ['-50.01','20','0','NaN','-1.001']) assert.equal(validPLTransfer(v,-50),false);
});
