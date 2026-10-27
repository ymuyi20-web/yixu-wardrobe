import test from 'node:test';
import assert from 'node:assert/strict';
import {recommend, alternatives} from '../src/recommend.js';
import {demoItems} from '../src/data.js';
import {validateBackup} from '../src/storage.js';

test('all recommended items exist in the wardrobe, are available, and meet season/temperature constraints',()=>{
  for (const season of ['春','夏','秋','冬']) for (const temperature of [0,12,22,30,38]) {
    const items=demoItems.map(i=>({...i,status:i.id==='d1'?'待洗':i.status}));
    const result=recommend(items,{season,temperature});
    assert.ok(result.length<=3);
    assert.equal(new Set(result.map(o=>o.id)).size,result.length);
    for (const outfit of result) {
      assert.ok(outfit.items.some(i=>i.category==='鞋履'));
      assert.ok(outfit.items.some(i=>i.category==='连衣裙') || (outfit.items.some(i=>i.category==='上装') && outfit.items.some(i=>i.category==='下装')));
      for(const item of outfit.items){assert.ok(items.some(i=>i.id===item.id));assert.equal(item.status,'可穿');assert.ok(item.seasons.includes(season));assert.ok(item.min<=temperature&&temperature<=item.max);}
    }
  }
});
test('every outfit keeps a locked garment, including dresses and accessories',()=>{
  for (const item of demoItems) {
    const result=recommend(demoItems,{lockedId:item.id,temperature:22,season:'秋'});
    assert.ok(result.length>0,`no result for ${item.name}`);
    assert.ok(result.every(o=>o.items.some(i=>i.id===item.id)));
    if(item.category==='连衣裙') assert.ok(result.every(o=>!o.items.some(i=>i.category==='上装'||i.category==='下装')));
  }
});
test('washing, deleted locks and incomplete wardrobes never produce phantom outfits',()=>{
  assert.deepEqual(recommend(demoItems,{lockedId:'missing'}),[]);
  assert.deepEqual(recommend(demoItems.map(i=>({...i,status:i.id==='d1'?'待洗':'可穿'})),{lockedId:'d1'}),[]);
  assert.deepEqual(recommend(demoItems.filter(i=>i.category==='上装')),[]);
  assert.deepEqual(recommend([]),[]);
});
test('replacement respects category, availability and temperature',()=>{
  const result=alternatives(demoItems,demoItems[0],{temperature:22,season:'秋'});
  assert.ok(result.length>0);assert.ok(result.every(i=>i.category==='上装' && i.id!=='d1' && i.status==='可穿' && i.min<=22 && i.max>=22));
});
test('backup validator rejects corrupt and remote-image payloads',()=>{
  const backup={version:1,items:demoItems,history:[],prefs:{style:'简约',feeling:'适中',avatar:null}};
  assert.equal(validateBackup(backup),backup);
  assert.throws(()=>validateBackup({...backup,items:[{...demoItems[0],image:'https://third-party.example/photo'}]}));
  assert.throws(()=>validateBackup({...backup,items:[demoItems[0],demoItems[0]]}));
  assert.throws(()=>validateBackup({...backup,items:[{...demoItems[0],min:40,max:10}]}));
  assert.throws(()=>validateBackup({...backup,prefs:{...backup.prefs,name:{unexpected:true}}}));
  assert.throws(()=>validateBackup({...backup,saved:[{id:'bad',items:[demoItems[0]],reasons:'not-an-array'}]}));
  assert.throws(()=>validateBackup({...backup,saved:[{id:'remote',items:[{...demoItems[0],image:'https://third-party.example/photo'}]}]}));
});
