import React,{useState} from 'react';
import {seasons} from '../data';
export default function BatchEditor({count,onApply}) {
 const [chosen,setChosen]=useState([]),[style,setStyle]=useState(''),[error,setError]=useState('');
 return <form onSubmit={e=>{e.preventDefault();if(!chosen.length&&!style){setError('请至少选择一个季节或风格。');return;}onApply({...chosen.length?{seasons:chosen}:{},...style?{style}:{}});}}><p className="editor-hint">选中了 {count} 件衣物。未设置的字段会保留原值；选择季节会替换这些衣物的原季节。</p><div className="choice-row">{seasons.map(s=><button type="button" key={s} className={chosen.includes(s)?'active':''} aria-pressed={chosen.includes(s)} onClick={()=>setChosen(v=>v.includes(s)?v.filter(x=>x!==s):[...v,s])}>{s}</button>)}</div><label className="field">统一风格<select value={style} onChange={e=>setStyle(e.target.value)}><option value="">保留原风格</option>{['简约','通勤','休闲'].map(s=><option key={s}>{s}</option>)}</select></label>{error&&<p className="form-error">{error}</p>}<button className="button primary full">应用到选中衣物</button></form>;
}
