function getDates() {
  // 1. 현재 시간(Locale)
  const curr = new Date();

  // 2. UTC 시간 계산
  const utc = curr.getTime() + curr.getTimezoneOffset() * 60 * 1000;

  // 3. UTC to KST (UTC + 9시간)
  const KR_TIME_DIFF = 9 * 60 * 60 * 1000;

  const today = new Date(utc + KR_TIME_DIFF); // 오늘
  const year = today.getFullYear();
  let month = (today.getMonth() + 1).toString();
  let date = today.getDate().toString();

  if (month.length === 1) month = '0' + month;
  if (date.length === 1) date = '0' + date;
  const fullDate = `${year}-${month}-${date}`;

  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayYear = yesterday.getFullYear();
  let yesterdayMonth = (yesterday.getMonth() + 1).toString();
  let yesterdayDate = yesterday.getDate().toString();

  if (yesterdayMonth.length === 1) yesterdayMonth = '0' + yesterdayMonth;
  if (yesterdayDate.length === 1) yesterdayDate = '0' + yesterdayDate;
  const fullYesterday = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDate}`;

  // 시간 구하기
  let hour = today.getHours().toString();
  let minute = today.getMinutes().toString();
  let second = today.getSeconds().toString();
  if (hour.length === 1) hour = '0' + hour;
  if (minute.length === 1) minute = '0' + minute;
  if (second.length === 1) second = '0' + second;
  const fullDateTime = `${fullDate} ${hour}:${minute}:${second}`;

  return [fullDate, fullYesterday, fullDateTime];
}

function strip_tags(input: string, allowed?: string) {
  // 문자열에서 HTML 태그 제거하기
  // i 와 b 태그만 허용하고 그 외의 태그는 모두 제거할 때 아래와 같이 하면 됩니다.
  // var str = strip_tags('<p>Kevin</p> <b>van</b> <i>Zonneveld</i>', '<i><b>');

  try {
    // 허용된 태그를 소문자로 변환하고 배열로 만들기
    let allowedStr = (
      ((allowed || '') + '').toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []
    ).join('');

    let tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
    let commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
    let nbsp = /&nbsp;/gi;

    return input
      .replace(commentsAndPhpTags, '')
      .replace(tags, function ($0, $1) {
        return allowedStr.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
      })
      .replace(nbsp, ' ')  // &nbsp; 제거
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
  } catch (err) {
    console.log(err);
    return input;
  }
}

export { getDates, strip_tags };
