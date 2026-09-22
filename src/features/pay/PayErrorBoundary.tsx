import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

// 계산기에서 에러가 나도 TO-DO 화면(부모)은 정상 동작해야 하므로, 계산기 화면만 여기서 감싼다.
export default class PayErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[pay] 계산기 화면에서 에러 발생:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-500 dark:text-gray-400">
          계산기 화면에 문제가 생겼어요. 집 아이콘을 눌러 TO-DO로 돌아가거나 새로고침해주세요.
        </main>
      );
    }
    return this.props.children;
  }
}
