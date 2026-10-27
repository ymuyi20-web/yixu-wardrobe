import {inferItem} from './model.js';
import {todayKey} from './data.js';
const neutralNames=['米白','白色','米色','卡其','黑色','灰色','棕色'];
export function effectiveTemperature(o={}) {
  const thermal=(o.feedback||[]).filter(f=>['太冷','太热'].includes(f.type)).slice(-8).reduce((n,f)=>n+(f.type==='太冷'?-1:1),0);
  return Number(o.temperature??22)+(o.feeling==='怕冷'?-3:o.feeling==='怕热'?3:0)+Math.max(-3,Math.min(3,thermal));
}
function hue(i) {
  const rgb=(i.hex||'#888888').match(/[a-f\d]{2}/ig)?.map(x=>parseInt(x,16)/255)||[.5,.5,.5];
  const [r,g,b]=rgb,max=Math.max(...rgb),min=Math.min(...rgb),d=max-min;
  if(neutralNames.includes(i.color)||d<.16||max<.24)return null;
  const h=max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;
  return (h*60+360)%360;
}
export function colorAssessment(items) {
  const clothing=items.filter(i=>['上装','下装','连衣裙','外套'].includes(i.category)),colors=clothing.map(hue).filter(h=>h!=null);
  if(clothing.some(i=>i.color==='自定'))return {score:0,text:'有单品未填写颜色，暂不判断整套配色'};
  if(!colors.length)return {score:10,text:'主衣物以中性或低饱和色为主，按易组合的配色规则筛选'};
  if(colors.length===1)return {score:9,text:'主衣物以中性色衬托一处彩色重点'};
  const distances=colors.flatMap((a,n)=>colors.slice(n+1).map(b=>Math.min(Math.abs(a-b),360-Math.abs(a-b))));
  return distances.every(d=>d<=45)?{score:8,text:'主衣物色相接近，按同色系或邻近色规则组合'}:{score:colors.length>2?-9:-3,text:'主衣物包含多种色相，建议对照实物确认是否喜欢'};
}
export function describeOutfit(raw, o={}) {
  const items=raw.map(inferItem),temp=effectiveTemperature(o),color=colorAssessment(items),warnings=[];
  const thick=items.filter(i=>['上装','外套','连衣裙'].includes(i.category)&&i.thickness==='厚款').length;
  const target=o.occasion==='上班通勤'?'通勤':o.occasion==='户外散步'?'休闲':o.style||'简约';
  const formal=items.reduce((n,i)=>n+(i.style==='通勤'?2:i.style==='简约'?1:0),0)/Math.max(1,items.length);
  const formFeedback=(o.feedback||[]).filter(f=>f.occasion===o.occasion).slice(-8).reduce((n,f)=>n+(f.type==='太正式'?-1:f.type==='太随意'?1:0),0);
  const occasionTarget=Math.max(0,Math.min(2,(o.occasion==='上班通勤'?1.8:o.occasion==='户外散步'?.2:o.occasion==='周末约会'?1.1:.6)+formFeedback*.12));
  const occasion=10-Math.abs(formal-occasionTarget)*6+items.filter(i=>i.style===target).length*2;
  const recent=new Set((o.history||[]).slice().sort((a,b)=>a.date.localeCompare(b.date)).slice(-3).flatMap(h=>h.itemIds));
  const liked=new Set((o.feedback||[]).filter(f=>f.type==='喜欢这套').flatMap(f=>f.itemIds));
  const freshness=items.reduce((n,i)=>n+(recent.has(i.id)?-4:2),0);
  const upper=items.find(i=>i.category==='上装'),lower=items.find(i=>i.category==='下装');
  const balanced=upper&&lower&&[upper.fit,lower.fit].includes('宽松')&&[upper.fit,lower.fit].includes('修身');
  const comfort=12-(temp>25?thick*7:0)+(temp<19&&items.some(i=>i.category==='外套')?4:0)+(balanced?2:0);
  const preference=items.reduce((n,i)=>n+(i.favorite?2:0)+(liked.has(i.id)?1:0),0);
  if(temp<19&&!items.some(i=>i.category==='外套'))warnings.push('缺少适温外套，出门前请补充保暖层');
  if(temp>25&&thick)warnings.push('包含厚款衣物，可能偏热');
  if(items.some(i=>temp<i.min||temp>i.max||!i.seasons.includes(o.season||'秋')))warnings.push('固定或保留单品超出当前季节或适温范围，请确认');
  if(o.weather?.rain>=50)warnings.push(items.some(i=>i.category==='鞋履'&&i.waterSafe==='是')?'降雨概率较高，优先考虑标记可应对小雨的鞋履；记得带伞':'降雨概率较高；鞋履防雨信息不足，出门前确认并带伞');
  if(o.weather&&o.weather.max-o.weather.min>=8)warnings.push('今日温差较大，建议随身带一件可穿脱的外层');
  const rainScore=o.weather?.rain>=50?items.filter(i=>i.category==='鞋履').reduce((n,i)=>n+(i.waterSafe==='是'?5:i.waterSafe==='否'?-5:0),0):0;
  const reasons=[color.text,`${o.occasion||'日常休闲'}：按${target}偏好与正式程度评分`,`${o.temperature??22}°C，结合厚薄、穿着角色和个人体感判断层次`];
  if(preference)reasons.push('适度优先你标记喜欢的衣物');
  if(balanced)reasons.push('根据自填版型，参考一松一收的上下装组合；并非身材判断');
  return {reasons,warnings,metrics:{color:color.score,comfort:comfort+rainScore,occasion,preference,freshness}};
}
export function recommend(rawItems,o={}) {
  const {season='秋',lockedId,seed=0}=o,temp=effectiveTemperature(o),items=rawItems.map(inferItem),locked=items.find(i=>i.id===lockedId);
  if(lockedId&&(!locked||locked.status!=='可穿'))return [];
  if(locked?.category==='上装'&&locked.role==='外穿')return [];
  const usable=items.filter(i=>i.status==='可穿'&&(i.id===lockedId||i.seasons.includes(season)&&temp>=i.min&&temp<=i.max));
  const pool=c=>locked?.category===c?[locked]:usable.filter(i=>i.category===c&&(c!=='上装'||i.role!=='外穿')).sort((a,b)=>(b.favorite?1:0)-(a.favorite?1:0)||a.id.localeCompare(b.id)).slice(0,10);
  const bases=[];
  if(locked?.category!=='连衣裙')for(const t of pool('上装'))for(const b of pool('下装'))bases.push([t,b]);
  if(!['上装','下装'].includes(locked?.category))for(const d of pool('连衣裙'))bases.push([d]);
  const needsInnerLayer=pool('上装').some(i=>i.role==='内搭');
  const outer=temp<19||locked?.category==='外套'?pool('外套').slice(0,3):needsInnerLayer?[null,...pool('外套').slice(0,3)]:[null];if(!outer.length)outer.push(null);
  const bags=locked?.category==='包袋'?[locked]:[null,...pool('包袋').slice(0,2)];
  const accessories=temp<14||locked?.category==='配饰'?pool('配饰').slice(0,2):[null];if(!accessories.length)accessories.push(null);
  const dismissed=new Set((o.feedback||[]).filter(f=>f.type==='今天不想穿'&&f.date===(o.today||todayKey())).map(f=>f.outfitId));
  const candidates=[];
  for(const base of bases)for(const shoe of pool('鞋履'))for(const coat of outer)for(const bag of bags)for(const accessory of accessories){
    const selected=[...base,shoe,coat,bag,accessory].filter(Boolean);if(base.some(i=>i.role==='内搭')&&!coat)continue;if(locked&&!selected.some(i=>i.id===locked.id))continue;
    const id=selected.map(i=>i.id).sort().join('|');if(dismissed.has(id))continue;
    candidates.push({id,items:selected,...describeOutfit(selected,o),core:base.map(i=>i.id).sort().join('|')});
  }
  const profiles=[['舒适优先',{comfort:3,color:1,occasion:.5,preference:1,freshness:.3}],['场合优先',{comfort:1,color:1,occasion:3,preference:1,freshness:.4}],['尝试新组合',{comfort:1,color:1,occasion:1,preference:.5,freshness:3}]],result=[];
  const tie=id=>[...id].reduce((n,c)=>((n*31+c.charCodeAt(0))>>>0),seed+1)%1000/100000;
  for(const [title,weights] of profiles){
    const eligible=candidates.filter(c=>!result.some(r=>r.core===c.core));if(!eligible.length)continue;
    const score=c=>Object.entries(weights).reduce((n,[k,w])=>n+c.metrics[k]*w,0)+tie(c.id);
    eligible.sort((a,b)=>score(b)-score(a));result.push({...eligible[0],title,score:Math.round(score(eligible[0])),occasion:o.occasion,temperature:Number(o.temperature??22)});
  }
  return result;
}
export function recommendationGaps(items,o={}) {
  if(items.some(i=>i.id===o.lockedId&&i.category==='上装'&&i.role==='外穿'))return '固定的上装标记为外穿，请把类别改为外套，或将穿法改为单穿后重试。';
  const t=effectiveTemperature(o),u=items.filter(i=>i.status==='可穿'&&(i.id===o.lockedId||i.seasons.includes(o.season||'秋')&&t>=i.min&&t<=i.max)),has=c=>u.some(i=>i.category===c);
  return [!has('鞋履')?'缺少适合当前条件的鞋履':null,!has('连衣裙')&&(!has('上装')||!has('下装'))?'需要适温的上装＋下装，或一件连衣裙':null].filter(Boolean).join('；')||'有效主衣物组合有限，调整条件或补充不同上装、下装可增加选择。';
}
export function alternatives(items,item,o) {const t=effectiveTemperature(o);return items.map(inferItem).filter(i=>i.id!==item.id&&i.category===item.category&&i.status==='可穿'&&i.id!==o.lockedId&&i.seasons.includes(o.season)&&t>=i.min&&t<=i.max);}
