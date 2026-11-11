"use client";

import { createContext, useContext, useState } from "react";
import { keepScreenOnFailure } from "@/app/lib/keep-screen-on-failure";
import { SUBMIT_FAILURE_MESSAGE } from "@/app/lib/constants";
import FlashMessagePresentation from "@/app/ui/flash/FlashMessagePresentation";

const NotifyFailureContext = createContext<(() => void) | null>(null);

// 通知はクライアントの state だけで出す。consumeFlash（cookie 経由）に乗せると、
// サーバー側のフラッシュと二重表示になりうるうえ、書き込み経路が増えるため採らない。
export function SubmitFailureNoticeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // key は、連続して失敗したときに FlashMessagePresentation を作り直して、
  // 閉じた状態を戻すためのもの。
  const [noticeKey, setNoticeKey] = useState<number | null>(null);

  return (
    <NotifyFailureContext.Provider
      value={() => setNoticeKey((previous) => (previous ?? 0) + 1)}
    >
      {children}
      {noticeKey !== null && (
        <FlashMessagePresentation
          key={noticeKey}
          type="error"
          message={SUBMIT_FAILURE_MESSAGE}
        />
      )}
    </NotifyFailureContext.Provider>
  );
}

// Provider の外では何もしない関数にフォールバックせず、例外にする。
// フォールバックすると、設定ミスで失敗が再び握りつぶされることに気づけない。
export function useKeepScreenOnFailure() {
  const notifyFailure = useContext(NotifyFailureContext);
  if (!notifyFailure) {
    throw new Error(
      "useKeepScreenOnFailure は SubmitFailureNoticeProvider の中で使う必要があります",
    );
  }

  return (task: () => Promise<void>) =>
    keepScreenOnFailure(task, notifyFailure);
}
