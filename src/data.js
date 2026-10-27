export const categories = ['上装', '下装', '连衣裙', '外套', '鞋履', '包袋', '配饰'];
export const seasons = ['春', '夏', '秋', '冬'];
export const occasions = ['日常休闲', '上班通勤', '周末约会', '户外散步'];
const garment = (id, name, category, color, hex, shape, season, style, min, max) => ({id, name, category, color, hex, shape, seasons: season.split(''), style, min, max, status: '可穿', demo: true, favorite: false});
export const demoItems = [
  garment('d1', '奶油白针织衫', '上装', '米白', '#e4dfd1', 'sweater', '春秋冬', '简约', 8, 25),
  garment('d2', '雾蓝牛津衬衫', '上装', '蓝色', '#97afc0', 'shirt', '春夏秋', '通勤', 15, 30),
  garment('d3', '纯白棉质 T 恤', '上装', '白色', '#f0eeea', 'tee', '春夏秋', '休闲', 19, 38),
  garment('d4', '苔绿圆领卫衣', '上装', '绿色', '#89967b', 'sweater', '春秋冬', '休闲', 8, 24),
  garment('d5', '经典条纹长袖', '上装', '条纹', '#eee9dc', 'stripe', '春秋', '简约', 14, 26),
  garment('d6', '深蓝直筒牛仔裤', '下装', '蓝色', '#3d5265', 'pants', '春夏秋冬', '休闲', 4, 30),
  garment('d7', '燕麦垂感长裤', '下装', '米色', '#bcb29c', 'pants', '春秋冬', '通勤', 6, 27),
  garment('d8', '墨黑 A 字半裙', '下装', '黑色', '#383d3d', 'skirt', '春夏秋', '简约', 15, 32),
  garment('d9', '浅卡其短裤', '下装', '卡其', '#b9b099', 'shorts', '夏', '休闲', 24, 40),
  garment('d10', '鼠尾草衬衫裙', '连衣裙', '绿色', '#99a591', 'dress', '春夏秋', '简约', 18, 31),
  garment('d11', '卡其短款风衣', '外套', '卡其', '#b3a38a', 'coat', '春秋冬', '通勤', 6, 23),
  garment('d12', '石墨灰羊毛大衣', '外套', '灰色', '#646b6c', 'coat', '秋冬', '通勤', -15, 14),
  garment('d13', '白色休闲板鞋', '鞋履', '白色', '#e9e6dc', 'shoes', '春夏秋冬', '休闲', -10, 40),
  garment('d14', '黑色乐福鞋', '鞋履', '黑色', '#373a35', 'shoes', '春夏秋冬', '通勤', -5, 35),
  garment('d15', '焦糖色单肩包', '包袋', '棕色', '#976b47', 'bag', '春夏秋冬', '简约', -20, 45),
  garment('d16', '自然色帆布袋', '包袋', '米白', '#d6d0bd', 'tote', '春夏秋冬', '休闲', -20, 45),
  garment('d17', '羊毛格纹围巾', '配饰', '棕色', '#9d8b77', 'scarf', '秋冬', '简约', -20, 17),
  garment('d18', '复古棒球帽', '配饰', '绿色', '#606e56', 'hat', '春夏秋冬', '休闲', -20, 45),
];
export const defaultPrefs = { name: '', style: '简约', feeling: '适中', avatar: null, demo: true };
export const todayKey = () => new Intl.DateTimeFormat('sv-SE', {timeZone: 'Asia/Shanghai'}).format(new Date());
