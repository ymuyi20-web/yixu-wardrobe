import {migrateState,feedbackTypes} from './model.js';
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
  return new Promise((resolve,reject) => { const r=db.transaction('state').objectStore('state').get('wardrobe'); r.onerror=()=>reject(r.error);r.onsuccess=()=>{const old=r.result;if(!old){resolve(undefined);return;}if(old.version===2){resolve(migrateState(old));return;}const tx=db.transaction('state','readwrite');tx.objectStore('state').put(old,'pre-v2');tx.oncomplete=()=>resolve(migrateState(old));tx.onerror=()=>reject(tx.error);}; });
}
export async function readLegacyBackup() {const db=await database();return new Promise((resolve,reject)=>{const r=db.transaction('state').objectStore('state').get('pre-v2');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
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
  if (![1,2].includes(value?.version) || !Array.isArray(value.items) || value.items.length > 1000 || !Array.isArray(value.history) || !value.prefs) throw new Error('备份格式不正确，请选择衣序导出的 JSON 文件。');
  const imageOK = x => x == null || (typeof x === 'string' && /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(x));
  const snapshotOK = i => i && typeof i.name === 'string' && typeof i.color === 'string' && cats.includes(i.category) && typeof i.id === 'string' && imageOK(i.image) && /^#[0-9a-f]{6}$/i.test(i.hex);
  const outfitOK = o => o && typeof o.id === 'string' && (o.title == null || typeof o.title === 'string') && (o.occasion == null || typeof o.occasion === 'string') && (o.temperature == null || Number.isFinite(o.temperature)) && (o.reasons == null || Array.isArray(o.reasons) && o.reasons.every(r=>typeof r==='string')) && (o.warnings == null || Array.isArray(o.warnings) && o.warnings.every(r=>typeof r==='string'));
  const ids = new Set();
  for (const i of value.items) {
    if (!snapshotOK(i) || ids.has(i.id) || !['简约','通勤','休闲'].includes(i.style) || !Array.isArray(i.seasons) || !i.seasons.every(s => ['春','夏','秋','冬'].includes(s)) || !['可穿','待洗'].includes(i.status) || !Number.isFinite(i.min) || !Number.isFinite(i.max) || i.min > i.max) throw new Error('备份中包含无效衣物数据。');
    ids.add(i.id);
    for(const [key,allowed] of Object.entries({thickness:['薄款','适中','厚款'],role:['内搭','单穿','外穿'],tempMode:['auto','manual'],fit:['常规','修身','宽松'],waterSafe:['未知','是','否']}))if(i[key]!=null&&!allowed.includes(i[key]))throw new Error('备份中包含无效衣物标签。');
  }
  if ((value.prefs.name != null && typeof value.prefs.name !== 'string') || !imageOK(value.prefs.avatar) || !['简约','通勤','休闲'].includes(value.prefs.style) || !['怕冷','适中','怕热'].includes(value.prefs.feeling)) throw new Error('备份中的个人偏好无效。');
  for (const h of value.history) if (!outfitOK(h) || typeof h.date !== 'string' || !Array.isArray(h.itemIds) || !h.itemIds.every(id => typeof id === 'string') || (h.items && (!Array.isArray(h.items) || !h.items.every(snapshotOK)))) throw new Error('备份中的穿搭记录无效。');
  if (value.saved != null && (!Array.isArray(value.saved) || !value.saved.every(o => outfitOK(o) && (o.date == null || typeof o.date === 'string') && Array.isArray(o.items) && o.items.length > 0 && o.items.every(snapshotOK)))) throw new Error('备份中的收藏搭配无效。');
  if(value.feedback!=null&&(!Array.isArray(value.feedback)||value.feedback.length>5000||!value.feedback.every(f=>f&&typeof f.id==='string'&&typeof f.outfitId==='string'&&typeof f.date==='string'&&typeof f.occasion==='string'&&feedbackTypes.includes(f.type)&&Array.isArray(f.itemIds)&&f.itemIds.every(id=>typeof id==='string'))))throw new Error('备份中的偏好反馈无效。');
  const city=value.prefs.city;if(city!=null&&(typeof city.name!=='string'||!Number.isFinite(city.latitude)||Math.abs(city.latitude)>90||!Number.isFinite(city.longitude)||Math.abs(city.longitude)>180||(city.label!=null&&typeof city.label!=='string')))throw new Error('备份中的城市信息无效。');
  if(value.lastBackupAt!=null&&!Number.isFinite(value.lastBackupAt))throw new Error('备份时间无效。');
  return value;
}
