import { RecoilRoot, atom } from 'recoil';

// 로컬 스토리지에서 값을 가져오는 함수
const getDefaultValueFromLocalStorage = (key: string, defaultValue: any) => {
  if(typeof window === 'undefined') return defaultValue
  const storedValue = localStorage.getItem(key);
  return storedValue !== null ? storedValue : defaultValue;
};

// Recoil atom 생성 시 기본 값을 로컬 스토리지에서 가져와 설정
export const LoadAtom = atom({
  key: 'LoadAtom',
  default: false
});

export const ScrollBlockAtom = atom({
  key: 'ScrollBlockAtom',
  default: false
});


// const localStorageEffect = (key:string) => ({setSelf, onSet}:any) => {
//   const savedValue = (typeof window !== 'undefined') ? localStorage.getItem(key) : 'false'
//   if (savedValue != null) {
//     setSelf(savedValue);
//   }

//   onSet((newValue:any, _:any, isReset:boolean) => {
//     isReset
//       ? localStorage.removeItem(key)
//       : localStorage.setItem(key, JSON.stringify(newValue));
//   });
// };

const localStorageEffect = (key:string) => ({setSelf, onSet}:any) => {
  const savedValue = (typeof window !== 'undefined') ? localStorage.getItem(key) : undefined
  // localstorage의 user_list에 해당되는 값 -> savedValue가 null	이라면 
  if (savedValue != null) {
    setSelf(savedValue);
   }
    // setSelf() 함수 내에서는 Promise를 사용하거나 데이터를 비동기적으로 호출할 때 사용할 수 있다.

  // setting함수가 변화되었을 때 즉, component에서
  // setUserList(변화한 값);을 코드에 작성했을 때
  // localStorage.setItem(key, JSON.stringify(newValue)); 가 실행되어
  // localStorage에 키-값 형태로 들어가게 된다!
  onSet((newValue:any, _:any, isReset:boolean) => {
    // newValue 값의 길이가 0일 때
    // userlist에 대한 값을 삭제해주면 된다.
      const confirm = newValue === null;
      confirm ? localStorage.removeItem(key) : localStorage.setItem(key, JSON.stringify(newValue));
  });
};

export const IsAdminAtom = atom({
  key: 'IsAdminAtom',
  default: getDefaultValueFromLocalStorage('isAdmin', false),
  effects: [
    localStorageEffect('isAdmin'),
  ]
});

export const MyInfoAtom = atom({
  key: 'MyInfoAtom',
  default: getDefaultValueFromLocalStorage('accessToken', null),
  effects: [
    localStorageEffect('accessToken'),
  ]
});
export {ProfileModalAtom, ProfileModalActiveAtom} from './ModalAtom'


// RecoilContextProvider 구성 요소
export default function RecoilContextProvider({ children }: { children: React.ReactNode }) {
  return <RecoilRoot>{children}</RecoilRoot>;
}