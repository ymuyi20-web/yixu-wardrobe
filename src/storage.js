const DB = 'yixu-private-wardrobe';
let dbPromise;
function database() {
  return dbPromise ||= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('state');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function readState() {
  const db = await database();
  return new Promise((resolve,reject) => { const r = db.transaction('state').objectStore('state').get('wardrobe'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
}
export async function saveState(state) {
  const db = await database();
  return new Promise((resolve,reject) => { const tx = db.transaction('state','readwrite'); tx.objectStore('state').put(state,'wardrobe'); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); });
}
export async function photoData(file) {
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('请选择 JPG、PNG 或 WebP 图片；HEIC 请先转换为 JPG。');
  if (file.size > 20 * 1024 * 1024) throw new Error('单张图片请小于 20 MB。');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas'); canvas.width = bitmap.width * scale; canvas.height = bitmap.height * scale;
  canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close();
  return canvas.toDataURL('image/webp', 0.85);
}
export function validateBackup(value) {
  const cats = ['上装','下装','连衣裙','外套','鞋履','包袋','配饰'];
  if (value?.version !== 1 || !Array.isArray(value.items) || value.items.length > 1000 || !Array.isArray(value.history) || !value.prefs) throw new Error('备份格式不正确，请选择衣序导出的 JSON 文件。');
  const imageOK = x => x == null || (typeof x === 'string' && /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(x));
  const snapshotOK = i => i && typeof i.name === 'string' && typeof i.color === 'string' && cats.includes(i.category) && typeof i.id === 'string' && imageOK(i.image) && /^#[0-9a-f]{6}$/i.test(i.hex);
  const outfitOK = o => o && typeof o.id === 'string' && (o.title == null || typeof o.title === 'string') && (o.occasion == null || typeof o.occasion === 'string') && (o.temperature == null || Number.isFinite(o.temperature)) && (o.reasons == null || Array.isArray(o.reasons) && o.reasons.every(r=>typeof r==='string')) && (o.warnings == null || Array.isArray(o.warnings) && o.warnings.every(r=>typeof r==='string'));
  const ids = new Set();
  for (const i of value.items) {
    if (!snapshotOK(i) || ids.has(i.id) || !['简约','通勤','休闲'].includes(i.style) || !Array.isArray(i.seasons) || !i.seasons.every(s => ['春','夏','秋','冬'].includes(s)) || !['可穿','待洗'].includes(i.status) || !Number.isFinite(i.min) || !Number.isFinite(i.max) || i.min > i.max) throw new Error('备份中包含无效衣物数据。');
    ids.add(i.id);
  }
  if ((value.prefs.name != null && typeof value.prefs.name !== 'string') || !imageOK(value.prefs.avatar) || !['简约','通勤','休闲'].includes(value.prefs.style) || !['怕冷','适中','怕热'].includes(value.prefs.feeling)) throw new Error('备份中的个人偏好无效。');
  for (const h of value.history) if (!outfitOK(h) || typeof h.date !== 'string' || !Array.isArray(h.itemIds) || !h.itemIds.every(id => typeof id === 'string') || (h.items && (!Array.isArray(h.items) || !h.items.every(snapshotOK)))) throw new Error('备份中的穿搭记录无效。');
  if (value.saved != null && (!Array.isArray(value.saved) || !value.saved.every(o => outfitOK(o) && (o.date == null || typeof o.date === 'string') && Array.isArray(o.items) && o.items.length > 0 && o.items.every(snapshotOK)))) throw new Error('备份中的收藏搭配无效。');
  return value;
}
