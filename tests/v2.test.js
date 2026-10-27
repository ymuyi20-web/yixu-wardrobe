import test from 'node:test';
import assert from 'node:assert/strict';
import {demoItems,defaultPrefs} from '../src/data.js';
import {migrateState,suggestedRange} from '../src/model.js';
import {recommend,colorAssessment,describeOutfit,effectiveTemperature,recommendationGaps} from '../src/recommend.js';
import {parseWeather} from '../src/weather.js';
import {validateBackup} from '../src/storage.js';
test('legacy migration preserves photos, ranges, records and saved outfits without mutating input',()=>{
 const old={version:1,items:demoItems,history:[{date:'2026-10-26',itemIds:['d1']}],saved:[{id:'s',items:[demoItems[0]]}],prefs:defaultPrefs};
 const before=JSON.stringify(old),v2=migrateState(old);
 assert.equal(v2.version,2);assert.equal(v2.items[0].min,old.items[0].min);assert.equal(v2.items[0].tempMode,'manual');assert.deepEqual(v2.history,old.history);assert.deepEqual(v2.saved,old.saved);assert.equal(JSON.stringify(old),before);assert.deepEqual(migrateState(v2),v2);
 assert.equal(validateBackup({...v2,history:[],saved:[]}).version,2);
});
test('temperature suggestions distinguish thick outerwear and thin standalone pieces',()=>{assert.ok(suggestedRange('厚款','外穿','外套').max<suggestedRange('薄款','单穿','上装').max);});
test('recommendation profiles have distinct main garments and never pad results with shoes-only changes',()=>{
 const out=recommend(demoItems,{temperature:22,season:'秋'});
 assert.deepEqual(out.map(o=>o.title),['舒适优先','场合优先','尝试新组合']);assert.equal(new Set(out.map(o=>o.core)).size,out.length);
 const minimal=demoItems.filter(i=>['d1','d6','d13','d14'].includes(i.id));assert.equal(recommend(minimal,{temperature:22,season:'秋'}).length,1);
});
test('color assessment penalizes multiple unrelated accent colors and acknowledges missing labels',()=>{
 const selected=[demoItems[0],demoItems[5],demoItems[10]];
 const loud=selected.map((i,n)=>({...i,color:['红色','绿色','蓝色'][n],hex:['#ff0000','#00ff00','#0000ff'][n]}));
 assert.ok(colorAssessment(selected).score>colorAssessment(loud).score);
 assert.equal(colorAssessment([{...selected[0],color:'自定'}]).score,0);
});
test('temporary dismissal expires; preference and thermal feedback remain bounded and reversible',()=>{
 const options={temperature:22,season:'秋',today:'2026-10-27'},first=recommend(demoItems,options)[0];
 const f={id:'f',outfitId:first.id,itemIds:first.items.map(i=>i.id),date:'2026-10-27',type:'今天不想穿',occasion:'日常休闲'};
 assert.ok(recommend(demoItems,{...options,feedback:[f]}).every(o=>o.id!==first.id));
 assert.ok(recommend(demoItems,{...options,today:'2026-10-28',feedback:[f]}).some(o=>o.id===first.id));
 assert.equal(effectiveTemperature({temperature:22,feedback:Array(20).fill({...f,type:'太冷'})}),19);
 const liked=describeOutfit(first.items,{...options,feedback:[{...f,type:'喜欢这套'}]});assert.ok(liked.metrics.preference>describeOutfit(first.items,options).metrics.preference);
 assert.equal(effectiveTemperature({temperature:22,feedback:[]}),22);
});
test('weather parser rejects stale and incomplete data, accepts valid fresh data',()=>{
 const now=1793115000000,data={timezone:'Asia/Shanghai',current:{temperature_2m:14.2,time:now/1000},daily:{time:[1793030400],temperature_2m_min:[14],temperature_2m_max:[21],precipitation_probability_max:[60]}};
 assert.equal(parseWeather(data,now).temperature,14);assert.equal(parseWeather(data,now).rain,60);
 assert.throws(()=>parseWeather(data,now+4*3600000));assert.throws(()=>parseWeather({...data,current:{}},now));
});
test('rain and temperature difference warnings are tied to actual weather data',()=>{
 const o=recommend(demoItems,{temperature:22,season:'秋',weather:{min:12,max:23,rain:80}})[0];
 assert.ok(o.warnings.some(w=>w.includes('降雨')));assert.ok(o.warnings.some(w=>w.includes('温差')));
 assert.ok(recommendationGaps([],{}).includes('鞋履'));
});
test('an inner layer cannot be recommended alone, and an outer-only top has actionable guidance',()=>{
 const inner=demoItems.filter(i=>['d1','d6','d13'].includes(i.id)).map(i=>i.id==='d1'?{...i,role:'内搭'}:i);
 assert.deepEqual(recommend(inner,{temperature:22,season:'秋'}),[]);
 const outer=inner.map(i=>i.id==='d1'?{...i,role:'外穿'}:i);
 assert.deepEqual(recommend(outer,{temperature:22,season:'秋',lockedId:'d1'}),[]);
 assert.ok(recommendationGaps(outer,{lockedId:'d1'}).includes('类别改为外套'));
});
