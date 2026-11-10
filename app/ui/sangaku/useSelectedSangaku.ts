import { startTransition, useState } from "react";
import type { Sangaku } from "@/app/lib/definitions";

// 選択した算額と、その詳細を取得する Promise。モーダルには分けずに1つで渡す。
// 別々の props にすると、算額があるのに詳細が無い、といった食い違う組み合わせを
// 型の上で作れてしまう。Detail が null を取りうるモーダル（reorder 以外は詳細を
// 取得しない奉納の確認画面）では、「詳細が無い」ことが意図した状態になる。
export type SelectedSangaku<Detail> = {
  sangaku: Sangaku;
  detail: Detail;
};

// 選択した算額と、その詳細を取得する Promise をまとめて持つ。
//
// 選択した算額は、id ではなくオブジェクトで持つ。一覧は再取得で差し替わるため、
// id から一覧を find すると、算額が一覧から消えた時（奉納した直後など）にモーダルが
// 閉じてしまう。
export function useSelectedSangaku<Detail>(
  fetchDetail: (sangaku: Sangaku) => Detail,
) {
  const [selected, setSelected] = useState<SelectedSangaku<Detail> | null>(
    null,
  );

  // Promise は render 中ではなくクリックで生成する。Suspense 内の子で生成すると、
  // 初回 mount で suspend した際に state が破棄され、毎回作り直されてしまう。
  // Server Function は Transition 内で呼ぶ（React のドキュメントの注意事項）。
  // Transition が待つのは state の更新だけで、取得の完了は Suspense が待つ。
  const select = (sangaku: Sangaku) => {
    startTransition(() => {
      setSelected({ sangaku, detail: fetchDetail(sangaku) });
    });
  };

  // 再試行は、選択中の算額を選び直すのと同じ（新しい Promise に差し替える）。
  // 取得の完了を待ってから state を更新する書き方にしない。待っている間にモーダルが
  // 閉じられると、完了したときにモーダルが開き直ってしまう。
  const retry = () => {
    if (selected) {
      select(selected.sangaku);
    }
  };

  const close = () => {
    setSelected(null);
  };

  return { selected, select, retry, close };
}
