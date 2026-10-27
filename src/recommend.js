// All recommendation results reference actual wardrobe records; no generated items.
export function recommend(items, { temperature = 22, occasion = '日常休闲', season = '秋', style = '简约', feeling = '适中', lockedId = null, seed = 0, history = [] } = {}) {
  const temp = Number(temperature) + (feeling === '怕冷' ? -3 : feeling === '怕热' ? 3 : 0);
  const locked = items.find(i => i.id === lockedId);
  if (lockedId && (!locked || locked.status !== '可穿')) return [];
  const usable = items.filter(i => i.status === '可穿' && (i.id === lockedId || ((!i.seasons?.length || i.seasons.includes(season)) && temp >= Number(i.min ?? -20) && temp <= Number(i.max ?? 45))));
  const recentlyWorn = new Set(history.slice(-3).flatMap(h => h.itemIds));
  const targetStyle = occasion === '上班通勤' ? '通勤' : occasion === '户外散步' ? '休闲' : style;
  const score = i => (i.style === targetStyle ? 5 : 0) + (i.favorite ? 2 : 0) - (recentlyWorn.has(i.id) ? 3 : 0);
  const pick = (category, n) => {
    if (locked?.category === category) return locked;
    const pool = usable.filter(i => i.category === category).sort((a,b) => score(b) - score(a) || a.id.localeCompare(b.id));
    return pool.length ? pool[((n + seed) % pool.length + pool.length) % pool.length] : null;
  };
  const outfits = [], signatures = new Set();
  for (let n = 0; n < 18 && outfits.length < 3; n++) {
    let base;
    const dress = pick('连衣裙', n);
    if (locked?.category === '连衣裙' || (dress && n % 3 === 2 && !['上装','下装'].includes(locked?.category))) base = [dress];
    else base = [pick('上装', n), pick('下装', Math.floor(n / 2))];
    const shoes = pick('鞋履', n);
    if (base.some(i => !i) || !shoes) continue;
    let selected = [...base, shoes];
    if (temp < 19 || locked?.category === '外套') selected.push(pick('外套', n));
    selected.push(pick('包袋', n));
    if (temp < 14 || locked?.category === '配饰') selected.push(pick('配饰', n));
    selected = selected.filter(Boolean);
    if (locked && !selected.some(i => i.id === locked.id)) continue;
    const signature = selected.map(i => i.id).sort().join('|');
    if (signatures.has(signature)) continue;
    signatures.add(signature);
    const neutral = ['米白','白色','米色','卡其','黑色','灰色','棕色'];
    const accents = selected.filter(i => !neutral.includes(i.color));
    const reasons = [`${temperature}°C · ${temp < 19 ? '加入外套，方便应对温差' : temp > 27 ? '优先轻薄单品，减少层叠' : '以舒适的轻层次为主'}`, accents.length ? `用${accents[0].color}单品作为视觉重点` : '中性色组合，整体更协调', `${occasion} · ${targetStyle}取向`];
    const warnings = [];
    if (temp < 19 && !selected.some(i => i.category === '外套')) warnings.push('衣柜暂缺适温外套，出门前请补充保暖层');
    if (locked && (temp < locked.min || temp > locked.max || !locked.seasons?.includes(season))) warnings.push('固定单品超出所设季节或温度范围，请确认适合今天');
    outfits.push({ id: signature, items: selected, reasons, warnings, title: ['把舒适穿在身上', '日常，也有好心情', '换一种轻松的节奏'][outfits.length] });
  }
  return outfits;
}

export function alternatives(items, item, { lockedId, temperature, season }) {
  return items.filter(i => i.id !== item.id && i.category === item.category && i.status === '可穿' && i.id !== lockedId && i.seasons.includes(season) && Number(temperature) >= Number(i.min) && Number(temperature) <= Number(i.max));
}
