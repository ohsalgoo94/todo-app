// 이 브라우저가 어떤 계정과 이미 한 번 "게스트 데이터 처리" 선택을 끝냈는지 기억해둔다.
// (같은 계정으로 다시 로그인할 때마다 선택창이 또 뜨지 않게 하기 위함. 로그아웃하면 지운다.)
const KEY = "todo-app:linked-account-id";

export function getLinkedAccountId(): string | null {
  return localStorage.getItem(KEY);
}

export function setLinkedAccountId(userId: string) {
  localStorage.setItem(KEY, userId);
}

export function clearLinkedAccountId() {
  localStorage.removeItem(KEY);
}
