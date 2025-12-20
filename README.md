# 簡易駐車場管理フロントエンド

## 概要

本プロジェクトはシンプルな駐車場管理システムのフロントエンド実装です。Vue 3 と Vite を用いて構築されており、ユーザー認証、車両の入出庫操作、利用履歴表示などの基本的な管理機能を提供します。

## 主な機能

- ユーザー認証（ログイン / 登録）
- ダッシュボード表示
- 車両の入庫/出庫操作
- 車両検索・一覧表示
- 利用履歴の表示
- ユーザー管理

## 技術スタック

- フロントエンド: Vue 3
- ビルドツール: Vite
- 言語: TypeScript
- 状態管理: Pinia（想定）

## 環境要件

- Node.js 16 以上を推奨
- npm または yarn

## ローカル開発の始め方

依存をインストールして開発サーバを起動します。

```bash
npm install
npm run dev
```

ビルドとプレビュー:

```bash
npm run build
npm run preview
```

## プロジェクト構成（概要）

- `index.html`, `vite.config.ts`, `package.json`, `tsconfig.json` など（ルート）
- `src/`
  - `main.ts` / `App.vue` — エントリポイント
  - `router/` — ルーティング定義（`src/router/index.ts`）
  - `stores/` — ストア（`src/stores/auth.ts`, `src/stores/carStore.ts`, `src/stores/userStore.ts`）
  - `utils/` — ユーティリティ（`src/utils/dateFormatter.ts`, `src/utils/jwt.ts`, `src/utils/request.ts`）
  - `views/` — 画面コンポーネント
    - `CarOperationView.vue` — 車両操作画面
    - `CarQueryView.vue` — 車両検索画面
    - `DashboardLayout.vue` — ダッシュボードレイアウト
    - `LoginView.vue` / `RegisterView.vue` — 認証画面
    - `UsageHistoryView.vue` — 利用履歴画面
    - `UserView.vue` — ユーザー管理画面

詳細は各ファイルを参照してください：

- [src/router/index.ts](src/router/index.ts)
- [src/stores/auth.ts](src/stores/auth.ts)
- [src/utils/request.ts](src/utils/request.ts)

## 環境変数

バックエンド API のベース URL やその他機密情報は、`.env` または Vite の環境変数（例: `VITE_API_BASE_URL`）で管理してください。`src/utils/request.ts` に API 呼び出しの集中ロジックがあるため、ここを参照して設定を調整してください。

## 開発のヒント

- API 呼び出しは `src/utils/request.ts` に集約すると保守が容易です。
- ストアは `src/stores/` にまとめ、UI からの操作をここで扱うと状態管理が分かりやすくなります。

## 貢献

バグ修正や機能追加は歓迎します。Pull Request を作成する際は、変更内容を簡潔に記述してください。

## ライセンス

リポジトリのルートに `LICENSE` がない場合は、`package.json` を参照するか、別途ライセンスを追加してください。

---

作業環境やトーン調整（技術的／カジュアル／商用向け）など希望があれば教えてください。
