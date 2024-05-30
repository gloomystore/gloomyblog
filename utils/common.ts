function getDates(){
  // 1. 현재 시간(Locale)
  const curr = new Date();

  // 2. UTC 시간 계산
  const utc = 
        curr.getTime() + 
        (curr.getTimezoneOffset() * 60 * 1000);

  // 3. UTC to KST (UTC + 9시간)
  const KR_TIME_DIFF = 9 * 60 * 60 * 1000;

  const today = new Date(utc + (KR_TIME_DIFF)); // 오늘
  const year = today.getFullYear();
  let month = (today.getMonth()+1).toString();
  let date = today.getDate().toString();
  
  if(month.length === 1) month = '0'+ month;
  if(date.length === 1) date = '0'+ date;
  const fullDate = `${year}-${month}-${date}`
  
  const yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000));
  const yesterdayYear = yesterday.getFullYear();
  let yesterdayMonth = (yesterday.getMonth()+1).toString();
  let yesterdayDate = yesterday.getDate().toString()
  
  if(yesterdayMonth.length === 1) yesterdayMonth = '0'+ yesterdayMonth;
  if(yesterdayDate.length === 1) yesterdayDate = '0'+ yesterdayDate;
  const fullYesterday = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDate}`

  // 시간 구하기
  let hour = today.getHours().toString()
  let minute = today.getMinutes().toString()
  let second = today.getSeconds().toString()
  if(hour.length === 1) hour = '0'+ hour;
  if(minute.length === 1) minute = '0'+ minute;
  if(second.length === 1) second = '0'+ second;
  const fullDateTime = `${fullDate} ${hour}:${minute}:${second}`
  
  return [fullDate, fullYesterday, fullDateTime]
}

export { getDates }