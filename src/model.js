export function inferItem(item) {
  const thickness=item.thickness||(/大衣|羊毛|围巾/.test(item.name)?'厚款':/T 恤|短裤|衬衫裙/.test(item.name)?'薄款':'适中');
  return {...item,thickness,role:item.role||(item.category==='外套'?'外穿':'单穿'),fit:item.fit||'常规',tempMode:item.tempMode||'manual',waterSafe:item.waterSafe||'未知'};
}
export function suggestedRange(thickness,role,category) {
  if(['鞋履','包袋','配饰'].includes(category))return {min:-20,max:45};
  if(role==='外穿'||category==='外套')return thickness==='厚款'?{min:-15,max:15}:thickness==='薄款'?{min:12,max:26}:{min:4,max:23};
  return thickness==='薄款'?{min:18,max:40}:thickness==='厚款'?{min:-5,max:20}:{min:8,max:28};
}
export function migrateState(state) {return {...state,version:2,items:(state.items||[]).map(inferItem),prefs:{name:'',style:'简约',feeling:'适中',...state.prefs},history:state.history||[],saved:state.saved||[],feedback:state.feedback||[],lastBackupAt:state.lastBackupAt||null};}
export const feedbackTypes=['喜欢这套','太正式','太随意','太冷','太热','今天不想穿'];
