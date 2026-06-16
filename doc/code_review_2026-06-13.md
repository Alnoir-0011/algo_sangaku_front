# フロントエンド全体コードレビュー（2026-06-13）

- **対象**: `front/` main ブランチのコミット済みコード（`979b874` 時点）
- **観点**: コード品質・設計 / セキュリティ / パフォーマンス / テストカバレッジ
- **重要度の定義**:
  - **Blocker**: 仕様・データの根幹を壊す。早急な対応を推奨
  - **Major**: 障害・不整合・運用リスクに直結する
  - **Minor**: 品質・保守性の問題。計画的に対応
  - **Nit**: 些細な改善提案

---

## サマリー

| 重要度 | 件数 |
| ------ | ---- |
| Blocker | 2 |
| Major | 7 |
| Minor | 11 |
| Nit | 5 |

NextAuth の JWT セッション設計（絶対有効期限の二重化）、middleware による admin ルートガード、Server Actions 側での `requireAdmin` 二重チェック、`rehype-sanitize` による Markdown XSS 対策など、認証・認可まわりは丁寧に作られている。一方で **「模範解答ソースのクライアント露出（back と同一の根本原因）」と「PaizaIO を guest キーでブラウザ起点から直接叩く構造」** に重大な問題がある。

---

## Blocker

### B-1. 模範解答（`source`）が解答者のブラウザに露出する

`app/(main)/saved_sangakus/[id]/answer/create/page.tsx:24-30` / `app/lib/definitions.ts:7` / `app/ui/answer/create-form.tsx:1`

これは back レビューの B-1 とフロント側でつながっている同一問題。

```tsx
// page.tsx（Server Component）
const sangaku = await fetchSavedSangaku(id, "before_answer"); // attributes.source を含む
return <Form sangaku={sangaku} />;                            // create-form は "use client"
```

`Sangaku` 型は `attributes.source`（出題者の模範解答）を含み、それを丸ごと Client Component に props で渡している。Next.js は Server→Client の props を **RSC ペイロード（Flight データ）としてブラウザに送信**するため、画面に出していなくても DevTools の Network タブから解答前に正解コードが読める。クライアントシークレットによる API 直アクセス制限は「外部から API を直接叩けない」ことしか保証せず、正規フロント経由で配信される RSC ペイロードには無力。

**推奨対応**: 本命は API 側で解答者向けに `source` を除いたシリアライザを返すこと（back B-1）。フロント単独で対応する場合は Client Component へ渡す前に `source` を除去するが、規約依存で再発しやすいため API 側対応を優先する。

### B-2. PaizaIO を guest API キーでブラウザ起点から直接呼んでいる

`app/lib/actions/sangaku.ts`（`runSource` / `postSource` / `getStatus` / `getDetails`、`api_key: "guest"`）

`runSource` は `"use server"` だが、`SourceExecution.tsx`（Client Component）の実行ボタンから任意の `source` / `input` で呼び出せる。中身は `api.paiza.io` を `api_key: "guest"` で直接叩いている。問題点:

- **共有 guest キーの濫用リスク**: 認証済みユーザーなら誰でも、保存済み算額と無関係に任意の Ruby コードを PaizaIO 上で実行できる（実質的に無料のコード実行基盤として悪用可能）。レート制限もない
- **二重実装**: back にも `PaizaioApi`（採点用）があり、フロントにも実行ロジックがある。タイムアウトなしの `while` ポーリング（back M-1 と同じ問題）もフロントに複製されている
- guest キーはコード上ハードコードされており、PaizaIO の guest 制限に達するとサービス全体のコード実行が停止する

**推奨対応**: コード実行はバックエンド経由の API に集約し、フロントから PaizaIO を直接呼ばない。少なくとも「保存済み算額に紐づく実行のみ」「ユーザー単位のレート制限」を入れる。

---

## Major

### M-1. 解答結果ポーリングが二重に実装され、無限ループの可能性がある

`app/lib/data/answer.ts:64`（`fetchUserAnswerResult` 内の `while (true)`）と `app/ui/answer/Result.tsx:20`（`setInterval` 250ms）

- `Result.tsx` は 250ms ごとに `fetchUserAnswerResult` を呼ぶが、その関数自身も内部で `while (true)` ＋ 250ms スリープでポーリングしている。**二重ポーリング**になっており、status が pending のまま終わらない（back M-2: ジョブ失敗で pending 放置）と、サーバーアクションが返らずブラウザのリクエストが溜まり続ける
- `while (true)` には脱出上限がなく、401/404 以外でレスポンスが想定外だと `switch` のどの case にも入らず無限ループする

**推奨対応**: ポーリングはどちらか一方（クライアントの `setInterval`）に統一し、最大試行回数・タイムアウトを設ける。`fetchUserAnswerResult` は 1 回の取得だけ行う関数にする。

### M-2. 一覧データ取得系のエラーハンドリングが握りつぶしになっている

`app/lib/data/admin.ts`（各 `catch { return ... }`）/ `app/lib/data/sangaku.ts` ほか

多くのデータ取得関数が `catch` で空配列や `null` を返すだけでログを出さない。バックエンド障害・ネットワークエラーと「データが 0 件」がフロントで区別できず、ユーザーには常に「0 件」が表示される。原因調査も困難。

**推奨対応**: 失敗時は最低限 `console.error` でログを残し、UI 側で「取得失敗」と「0 件」を区別できる返り値にする。

### M-3. admin ユーザー検索の `query` がバックエンドで未対応（機能していない）

`app/lib/data/admin.ts:33`（`params.set("query", query)`）/ back `admin/users_controller.rb`

フロントは `/admin/users?query=...` を送るが、バックエンドの `UsersController#index` は `pagy(::User.all)` で `query` を一切参照していない。検索 UI が動いているように見えて結果が絞り込まれない。

**推奨対応**: バックエンドに検索を実装するか、未実装なら UI から検索欄を外す。仕様を確定させる。

### M-4. Server Action のエラー時に Server Component の取得失敗が握られ、画面が壊れる

`app/(main)/saved_sangakus/[id]/answer/create/page.tsx:11-15`（`generateMetadata`）

`generateMetadata` で `fetchSavedSangaku(id)`（type 指定なし＝answered 側も含む）を呼び、`Page` 本体では `fetchSavedSangaku(id, "before_answer")` を呼んでいる。**同一ページで 2 回別条件で API を叩いており**、metadata 側が解答済み算額を取得できてしまうと、本体の `notFound()` と挙動が食い違う。また 1 ページ表示で API 往復が増える。

**推奨対応**: 取得を 1 回にまとめ、metadata と本体で結果を共有する（または metadata でも同じ type を使う）。

### M-5. `env.template` の `API_URL` が実際のポートと不一致

`env.template`（`API_URL=http://localhost:3000`）/ CLAUDE.md（バックエンドは nginx 経由でポート 80）

テンプレートのポートが実際の構成（80）と合っておらず、`CLIENT_SECRET`・`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 等の必須変数も記載がない。新規セットアップで動かない。

**推奨対応**: `env.template` を実構成に合わせ、必要な環境変数を網羅する。

### M-6. `next.config.ts` にセキュリティヘッダ・本番設定がない

`next.config.ts`（`experimental.testProxy` のみ）

CSP、`X-Frame-Options`、`Strict-Transport-Security` 等のセキュリティヘッダが未設定。ユーザー生成コンテンツ（Markdown 問題文）を表示するアプリなので、多層防御として `headers()` での CSP 設定を推奨。

### M-7. テストカバレッジの計測基盤がない

`package.json` / `.github/workflows/ci.yml`

CI で components テスト・E2E・build・lint は回しているが、カバレッジ計測（Playwright の coverage 取得や istanbul 等）がなく、プロジェクト要件「新規コード 80%」が検証されていない。`tests/e2e/example.spec.ts` などサンプルも残存。

**推奨対応**: カバレッジ計測を導入し CI で閾値チェック。サンプルテストを削除。

---

## Minor

### m-1. Server Actions / data 層に大量の重複コード

`app/lib/actions/*.ts` の各関数が `auth()` → `fetch` → `switch(res.status)` → `setFlash` → `customSignOut` の同一パターンを繰り返している。共通の fetch ラッパー（401 で自動サインアウト、エラー整形）に切り出すと保守性が大きく上がる。

### m-2. `runSource` の引数配列を破壊的に変更している

`app/lib/actions/sangaku.ts`（`if (!fixedInputs.length) { fixedInputs.push(""); }`）。呼び出し元の配列を mutate する副作用。`const inputs = fixedInputs.length ? fixedInputs : [""]` にする。

### m-3. `auth.ts` の session callback で `accessToken` が undefined になり得る

`auth.ts:121`（`session.accessToken = token.accessToken as string`）。`signIn` が失敗したケースなどで `as string` で型を偽装している。型安全性が崩れ、後続の `buildHeaders` に undefined が渡る。

### m-4. `middleware.ts` の `publicRoutes` 正規表現が部分一致で広すぎる

`routes.ts`（`/\/shrines\/.*\/sangakus/` など）。`test()` はアンカーなしのため、想定外パス（例: `/foo/shrines/x/sangakus/bar`）もマッチする。`^...$` でアンカーするか厳密化する。

### m-5. `fetchSavedSangaku` の catch で何も返さないパスがある

`app/lib/data/sangaku.ts:213-217`。`isRedirectError` でない場合に `return` がなく `undefined` を返すが、他の関数は `null` を返しており不統一。呼び出し側の `if (!sangaku)` 判定に依存しているが明示すべき。

### m-6. クライアントの Result ポーリングがアンマウント後も走り得る

`app/ui/answer/Result.tsx`。`setInterval` 内の async が解決する前にアンマウントすると `setResult` が呼ばれ警告になる可能性。`isMounted` フラグか AbortController で対処。

### m-7. `definitions.ts` の型が API レスポンスと手動同期

`latitude`/`longitude` が `string`（Shrine）だが back では `float`。JSONAPI シリアライザの出力と型定義が手書きで乖離リスクがある。OpenAPI スキーマ（back に rspec-openapi あり）からの型生成を検討。

### m-8. `console.error` と本番ログの方針が不統一

`postSource`/`getStatus`/`getDetails` は `console.error` するが、data 層の多くは無言。ログ方針を統一する。

### m-9. マジックナンバー・ハードコード

ポーリング間隔（200ms / 250ms）、`SESSION_MAX_AGE`（auth.ts と jwt callback で重複定義）、`api_key: "guest"` 等が散在。定数化する。

### m-10. ファイル命名規則が混在

`create-form.tsx`（kebab-case）と `SourceExecution.tsx`（PascalCase）、`SourseResult.tsx`（typo: Sourse）が混在。規約を定めて統一する。

### m-11. `app/lib/actions/sangaku.ts` の `case 200` 直後に `redirect` 後の `return` がない

`switch` で `case 200: redirect(...)` の後 `case 401:` が続く。`redirect` は例外を投げるので実害はないが、フォールスルーに見えて読みにくい。各 case の終端を明示する。

---

## Nit

- `SourseResult.tsx` のファイル名 typo（Sourse → Source）
- `app/ui/answer/LoadingCirclars.tsx` の typo（Circlars → Circulars）
- `middleware.ts:16` のコメントアウトされた旧 `isPublicRoute` 実装が残存
- `actions/sangaku.ts` 内の大量のコメントアウトされた `message:` 行
- `next.config.ts` の `/* config options here */` テンプレコメント残り

---

## 良い点（維持してほしいところ）

- **セッション設計が堅い**: JWT に `signedInAt` を焼き込み、`maxAge` とローリング無効化（updateAge 同値）＋ jwt callback での 7 日強制無効化の二重化（`auth.ts`）
- **認可の多層防御**: middleware で admin ルートをガードしつつ、Server Action 側でも `requireAdmin` で再チェック（クライアント改ざんに強い）
- **Markdown XSS 対策**: `rehype-sanitize` を適用（`MarkdownPreview.tsx`）。ユーザー生成コンテンツを扱う上で重要
- **flash cookie が `httpOnly` + `sameSite: lax` + 型ガード**（`flash.ts` の `isFlash`）
- **`buildHeaders` で `X-Client-Secret` と `Bearer` を一元管理**し、各 fetch に散らばらせていない
- **TypeScript strict: true**
- **テスト構成が網羅的**: 主要ページの E2E と主要コンポーネントの CT が揃い、mock も整理されている

---

## テストカバレッジ所見（まとめ）

- E2E（`tests/e2e/`）は admin / user / shrine / answer の主要ページを網羅。CT（`tests/components/`）も admin・navigation・sangaku 系を一通りカバー
- mock（`tests/__mocks__/`）が actions / data / monaco-editor まで整備されており構成は良好
- 一方で **計測基盤がない**（M-7）ため 80% 要件の達成は数値確認できない
- 未カバーの目立つ箇所:
  - `runSource` / PaizaIO 連携（B-2）のエラー系・タイムアウト系
  - `fetchUserAnswerResult` の無限ループ条件（M-1）
  - middleware のルート分岐（特に admin 非権限リダイレクト）
  - `tests/e2e/example.spec.ts` などサンプルの削除

## 推奨対応順序

1. **B-1**（模範解答露出）→ back B-1 とセットでシリアライザ分離。最優先
2. **B-2**（PaizaIO 直叩き）→ コード実行をバックエンド集約 or レート制限。濫用・課金リスク
3. **M-1**（二重ポーリング）→ 採点結果表示の信頼性。back M-2 とセットで
4. **M-3 / M-5**（検索未対応・env 不一致）→ 小さく直せて体験・セットアップに直結
5. **M-7**（カバレッジ基盤）→ 以降の安全網
6. Minor / Nit は通常の改善サイクルで
