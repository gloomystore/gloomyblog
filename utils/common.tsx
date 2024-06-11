import NodeRSA from 'node-rsa'
function getDates() {
  // 1. 현재 시간(Locale)
  const curr = new Date()

  // 2. UTC 시간 계산
  const utc = curr.getTime() + curr.getTimezoneOffset() * 60 * 1000

  // 3. UTC to KST (UTC + 9시간)
  const KR_TIME_DIFF = 9 * 60 * 60 * 1000

  const today = new Date(utc + KR_TIME_DIFF) // 오늘
  const year = today.getFullYear()
  let month = (today.getMonth() + 1).toString()
  let date = today.getDate().toString()

  if (month.length === 1) month = '0' + month
  if (date.length === 1) date = '0' + date
  const fullDate = `${year}-${month}-${date}`

  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const yesterdayYear = yesterday.getFullYear()
  let yesterdayMonth = (yesterday.getMonth() + 1).toString()
  let yesterdayDate = yesterday.getDate().toString()

  if (yesterdayMonth.length === 1) yesterdayMonth = '0' + yesterdayMonth
  if (yesterdayDate.length === 1) yesterdayDate = '0' + yesterdayDate
  const fullYesterday = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDate}`

  // 시간 구하기
  let hour = today.getHours().toString()
  let minute = today.getMinutes().toString()
  let second = today.getSeconds().toString()
  if (hour.length === 1) hour = '0' + hour
  if (minute.length === 1) minute = '0' + minute
  if (second.length === 1) second = '0' + second
  const fullDateTime = `${fullDate} ${hour}:${minute}:${second}`

  return [fullDate, fullYesterday, fullDateTime]
}

function removeTags(input: string, allowed?: string) {
  // HTML 태그를 제거하거나 특정 태그만 허용하는 함수
  try {
    return input.replace(/<[^>]*>?/gm, '')
  } catch (err) {
    console.log(err);
    return input;
  }
}

type Param = {
  id: string,
  pw: string
}

function encryptParam(param:Param, key:string){
  const str = `${param.id}|${param.pw}`
  const pubKey = new NodeRSA(key)
  const encryptedInfo = pubKey.encrypt(str, 'base64')
  return encryptedInfo
}

const htmlEntitiesMap:any = {
  '&nbsp;': ' ',
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
  '&quot;': '"',
  '&apos;': "'"
};

// 함수: HTML 엔티티를 실제 문자로 변환
function decodeHtmlEntities(text:string) {
  return text.replace(/&[a-zA-Z]+;/g, (match:string) => htmlEntitiesMap[match] || match);
}


/**
 * HTML 태그를 제거하는 함수
 * @param {string} htmlString - HTML 태그가 포함된 문자열
 * @returns {string} - HTML 태그가 제거된 문자열
 */
// 함수: HTML 태그 제거, 특정 태그는 유지
function removeTagsExceptCode(htmlString: string): string  {
  if (!htmlString) return ''; // 빈 문자열 처리

  let result = '';
  let inPreCode = false;
  let preCodeBuffer = ''; // pre와 code 안의 내용을 담는 버퍼
  const tagRegex = /<\/?[^>]+(>|$)/g; // HTML 태그를 매칭하는 정규 표현식
  let lastIndex = 0;
  let match;

  while ((match = tagRegex.exec(htmlString)) !== null) {
    const tag = match[0];
    const tagStart = match.index;
    const beforeTag = htmlString.slice(lastIndex, tagStart); // 태그 이전의 텍스트

    if (inPreCode) {
      preCodeBuffer += tag; // 태그를 preCodeBuffer에 추가
      if (/<\/pre>|<\/code>/.test(tag)) { // pre 또는 code 태그가 닫히면
        inPreCode = false;
        result += preCodeBuffer; // preCodeBuffer의 내용을 결과에 추가
        preCodeBuffer = ''; // preCodeBuffer 초기화
      }
    } else {
      // pre나 code 태그 밖에 있는 텍스트는 엔티티 변환 후 결과에 추가
      result += decodeHtmlEntities(beforeTag);

      if (/<pre\b|<code\b/.test(tag)) {
        inPreCode = true;
        preCodeBuffer += beforeTag + tag; // preCodeBuffer에 태그 이전의 텍스트와 태그 자체 추가
      }
    }

    lastIndex = tagRegex.lastIndex;
  }

  // 마지막 태그 이후의 남은 텍스트 처리
  if (!inPreCode) {
    result += decodeHtmlEntities(htmlString.slice(lastIndex));
  } else {
    preCodeBuffer += htmlString.slice(lastIndex);
    result += preCodeBuffer;
  }

  return result;
}


export { getDates, encryptParam, removeTags, removeTagsExceptCode }
