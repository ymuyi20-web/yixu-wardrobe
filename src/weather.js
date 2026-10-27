async function json(url,signal) {
  const response=await fetch(url,{signal:signal||AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error('天气服务暂不可用，请重试或手动设置气温。');
  return response.json();
}
export async function searchCities(name,signal) {
  const params=new URLSearchParams({name:name.trim(),count:'8',language:'zh',format:'json'});
  const data=await json(`https://geocoding-api.open-meteo.com/v1/search?${params}`,signal);
  return (data.results||[]).filter(c=>Number.isFinite(c.latitude)&&Number.isFinite(c.longitude)).map(c=>({name:c.name,label:[c.name,c.admin1,c.country].filter((x,n,a)=>x&&a.indexOf(x)===n).join(' · '),latitude:c.latitude,longitude:c.longitude,timezone:c.timezone}));
}
export function parseWeather(data,now=Date.now()) {
  const c=data.current,d=data.daily;
  if(!Number.isFinite(c?.temperature_2m)||!Number.isFinite(c.time)||!Number.isFinite(d?.time?.[0])||!Number.isFinite(d?.temperature_2m_min?.[0])||!Number.isFinite(d?.temperature_2m_max?.[0])||!Number.isFinite(d?.precipitation_probability_max?.[0])||d.temperature_2m_min[0]>d.temperature_2m_max[0]||d.precipitation_probability_max[0]<0||d.precipitation_probability_max[0]>100)throw new Error('天气数据不完整，请手动设置气温。');
  if(now-c.time*1000>3*3600000||c.time*1000-now>3600000)throw new Error('天气数据已过期，请刷新或手动设置气温。');
  const day=new Intl.DateTimeFormat('sv-SE',{timeZone:data.timezone||'Asia/Shanghai'});if(day.format(now)!==day.format(d.time[0]*1000))throw new Error('当日预报日期已过期，请刷新或手动设置气温。');
  return {temperature:Math.round(c.temperature_2m),min:Math.round(d.temperature_2m_min[0]),max:Math.round(d.temperature_2m_max[0]),rain:d.precipitation_probability_max[0],wind:c.wind_speed_10m,observedAt:c.time*1000,fetchedAt:now,timezone:data.timezone||'Asia/Shanghai'};
}
export async function fetchWeather(city,signal) {
  const params=new URLSearchParams({latitude:String(city.latitude),longitude:String(city.longitude),current:'temperature_2m,wind_speed_10m',daily:'temperature_2m_max,temperature_2m_min,precipitation_probability_max',timezone:'auto',forecast_days:'1',timeformat:'unixtime'});
  return parseWeather(await json(`https://api.open-meteo.com/v1/forecast?${params}`,signal));
}
