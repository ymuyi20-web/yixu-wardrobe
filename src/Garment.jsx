import React, { useId } from 'react';

export default function Garment({item, hanger = false, className = ''}) {
  const uid = useId().replaceAll(':','');
  if (item.image) return <div className={`garment-photo ${className}`}><img src={item.image} alt={item.name}/></div>;
  const shape = item.shape || ({上装:'shirt',下装:'pants',连衣裙:'dress',外套:'coat',鞋履:'shoes',包袋:'bag',配饰:'hat'}[item.category]);
  const paths = {
    tee: 'M81 52 L111 43 Q130 57 149 43 L179 52 L208 90 L183 111 L168 94 L173 207 Q130 215 87 207 L92 94 L77 111 L52 90 Z',
    sweater: 'M83 53 L111 43 Q130 54 149 43 L177 53 L204 160 L181 169 L164 102 L170 205 Q130 212 90 205 L96 102 L79 169 L56 160 Z',
    stripe: 'M83 53 L111 43 Q130 54 149 43 L177 53 L204 160 L181 169 L164 102 L170 205 Q130 212 90 205 L96 102 L79 169 L56 160 Z',
    shirt: 'M84 52 L111 40 L130 52 L149 40 L176 52 L205 166 L181 174 L164 100 L170 211 Q149 220 130 211 Q111 220 90 211 L96 100 L79 174 L55 166 Z',
    pants: 'M93 43 L167 43 L177 222 L139 222 L130 105 L121 222 L83 222 Z',
    skirt: 'M102 46 L158 46 L188 215 Q130 226 72 215 Z',
    shorts: 'M93 63 L167 63 L180 166 L139 166 L130 106 L121 166 L80 166 Z',
    dress: 'M100 43 L116 40 Q130 50 144 40 L160 43 L175 87 L155 98 L151 119 L188 224 Q130 235 72 224 L109 119 L105 98 L85 87 Z',
    coat: 'M85 50 L112 37 L130 49 L148 37 L175 50 L209 181 L182 190 L163 109 L178 226 L82 226 L97 109 L78 190 L51 181 Z',
    bag: 'M78 101 Q130 90 182 101 L190 201 Q130 219 70 201 Z',
    tote: 'M77 91 L183 91 L176 213 Q130 219 84 213 Z',
    scarf: 'M80 46 Q129 33 173 52 L163 113 L153 211 L123 207 L126 95 L115 95 L111 220 L78 215 L90 107 Z',
    hat: 'M81 149 Q70 75 132 74 Q183 75 183 148 L205 168 Q144 194 65 164 Z',
    shoes: 'M55 128 Q69 109 85 102 L109 128 L141 126 L152 142 L205 156 Q218 166 209 183 L57 183 Q41 168 55 128 Z',
  };
  return <svg className={`garment-art ${className}`} viewBox="0 0 260 270" role="img" aria-label={`${item.name}（示例插画）`}>
    <defs>
      <linearGradient id={`fabric${uid}`} x1="0" x2="1" y1="0" y2=".3"><stop stopColor="#101e14" stopOpacity=".12"/><stop offset=".32" stopColor="#fff" stopOpacity=".04"/><stop offset=".55" stopColor="#fff" stopOpacity=".17"/><stop offset=".7" stopColor="#16231a" stopOpacity=".04"/><stop offset="1" stopColor="#16231a" stopOpacity=".15"/></linearGradient>
      <filter id={`shadow${uid}`} x="-40%" y="-30%" width="180%" height="170%"><feDropShadow dx="3" dy="9" stdDeviation="5" floodColor="#172b22" floodOpacity=".15"/></filter>
      <clipPath id={`cut${uid}`}><path d={paths[shape] || paths.tee}/></clipPath>
    </defs>
    {hanger && !['shoes','bag','tote','scarf','hat'].includes(shape) && <g fill="none" strokeLinecap="round"><path d="M130 24 C149 23 141 5 131 9 Q123 10 124 15 M130 24 L130 33" stroke="#5b6059" strokeWidth="2.4"/><path d="M130 32 L80 60 Q75 65 84 66 L176 66 Q185 65 180 60 Z" stroke="#987747" strokeWidth="5"/></g>}
    {['bag','tote'].includes(shape) && <path d={shape === 'bag' ? 'M92 110 Q86 29 131 30 Q177 30 168 110' : 'M101 103 L103 46 Q130 29 157 46 L159 103'} stroke={item.hex} fill="none" strokeWidth="11"/>}
    <g filter={`url(#shadow${uid})`}>
      <path d={paths[shape] || paths.tee} fill={item.hex || '#c0b7a4'}/>
      <path d={paths[shape] || paths.tee} fill={`url(#fabric${uid})`} stroke="#27322c" strokeOpacity=".13" strokeWidth="1"/>
      <g clipPath={`url(#cut${uid})`} fill="none" stroke="#25332d" strokeOpacity=".14">
        {['shirt','coat'].includes(shape) && <><path d="M111 40 L101 66 L119 82 L130 53 L141 82 L159 66 L149 40 M130 53 L130 226" strokeWidth="1.5"/><path d="M144 101 L160 101 L159 121 L144 121 Z"/>{[96,122,148,174,200].map(y=><circle key={y} cx="131" cy={y} r="1.9" fill="#544c40"/>)}</>}
        {['tee','sweater','stripe'].includes(shape) && <><path d="M110 43 Q130 66 150 43" strokeWidth="5"/><path d="M89 198 Q130 204 171 198 M95 103 L101 179 M165 103 L159 179"/></>}
        {shape === 'stripe' && Array.from({length:12},(_,n)=><path key={n} d={`M50 ${65+n*12} H210`} stroke="#304551" strokeWidth="4" strokeOpacity=".85"/>)}
        {['pants','shorts'].includes(shape) && <><path d="M93 52 H168 M130 44 V105 M95 61 Q114 68 113 83 M165 61 Q146 68 147 83 M102 90 L96 218 M158 90 L164 218"/><path d="M120 44 L120 69 L131 73"/><circle cx="134" cy="48" r="2" fill="#877d64"/></>}
        {shape === 'skirt' && <path d="M100 54 H161 M112 66 L96 215 M130 62 V222 M148 66 L164 215"/>}
        {shape === 'coat' && <path d="M95 147 L114 149 L112 167 L92 165 M147 149 L167 147 L170 165 L149 167"/>}
        {shape === 'shoes' && <><path d="M48 172 H214" strokeWidth="10" stroke="#f7f4e9" strokeOpacity="1"/><path d="M109 137 L138 138 M115 145 L145 146 M120 153 L151 154" stroke="#fff" strokeOpacity=".8" strokeWidth="3"/></>}
        {shape === 'bag' && <><path d="M78 108 Q130 120 183 108 M81 115 L85 197 Q130 208 176 197 L180 115"/><rect x="121" y="113" width="18" height="13" rx="2" stroke="#d9c391" strokeWidth="4"/></>}
        {shape === 'tote' && <path d="M89 96 L94 204 H166 L172 96 M108 140 Q131 129 154 140"/>}
        {shape === 'scarf' && <>{[70,94,118,142,166,190,214].map(y=><path key={y} d={`M70 ${y} H180`} strokeWidth="7" strokeOpacity=".3"/>)}<path d="M100 40 V230 M143 40 V220" strokeWidth="7" strokeOpacity=".3"/></>}
        {shape === 'hat' && <path d="M129 75 Q156 96 150 151 M80 148 Q133 160 182 148 M118 116 l10 -14 10 14"/>}
      </g>
    </g>
  </svg>;
}
