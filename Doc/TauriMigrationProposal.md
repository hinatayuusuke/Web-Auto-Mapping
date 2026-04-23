# Tauri 移植実装案

## 1. 概要

現在の React + Vite ベースの Web アプリを、Tauri を使ったデスクトップ向け Window アプリへ移植する。

初回は UI と状態管理をなるべくそのまま維持し、最小構成で Tauri 上に載せる。その後、保存 / 読込や設定保存をブラウザ依存の `localStorage` / download / file input から、Tauri の `fs` / `dialog` API へ段階的に切り替える。

## 2. ゴール / 非ゴール

### ゴール

- 現行の React アプリを Tauri のウインドウアプリとして起動できる
- 既存の `npm run dev` に加えて、Tauri 用の開発 / ビルド導線を追加できる
- 保存 / 読込周りを将来的に Tauri ネイティブ I/O へ切り替えやすい構造に整理する
- 現在の `MapCanvas`、Zustand store、描画ロジックを大きく壊さずに移行できる

### 非ゴール

- 初回で全機能を Rust 側へ寄せること
- 自動更新、インストーラ署名、OS 通知などの配布機能を同時に仕上げること
- モバイル版や Web 版との差分 UI を同時に作ること
- 永続化方式を最初から全面刷新すること

## 3. 前提・仮定

- 現行フロントエンドは React + Vite + TypeScript のまま維持する
- Tauri は v2 系を前提にする
- 既存の描画は Canvas ベースなので、WebView へ載せるだけで基本動作は継続できる
- 初回は `localStorage` を暫定利用してもよいが、最終的にはアプリデータディレクトリ配下のファイル保存へ寄せる

## 4. 現状整理

### 現行挙動

- フロントは Vite 開発サーバー / 静的ビルドで成立している
- 保存は `localStorage` と JSON export / import に依存している
- `MapCanvas` はホイール、ドラッグ、右クリックなどブラウザイベント前提で動作している

### 関連モジュール

- `src/App.tsx`
  アプリ全体の UI と import / export 導線を持つ
- `src/lib/persistence.ts`
  保存データの入出力をまとめている。Tauri 移植時の差し替え中心
- `src/store/appStore.ts`
  起動時復元、自動保存、履歴管理を持つ
- `package.json`
  Tauri 用スクリプト追加先

### 既存制約

- いまの保存導線はブラウザ API と密結合している
- Tauri 化しても Web 版を壊さない方が開発効率が高い
- 将来配布を考えるなら、保存先やファイルダイアログはネイティブ API へ寄せた方が自然

## 5. 提案アーキテクチャ

### コンポーネント構成

- フロントエンド:
  - 現行 React + Vite を維持
- デスクトップホスト:
  - Tauri
- 永続化:
  - 初期段階: 現行 `localStorage` を維持
  - 次段階: Tauri の `fs` / `path` / `dialog` を使う I/O adapter を追加

### データフロー / シーケンス

#### Phase A: 最小 Tauri 化

1. `src-tauri/` を追加し Tauri 初期化
2. Vite アプリを Tauri ウインドウ内で起動
3. 現行 `localStorage` ベースの自動保存をそのまま使う

#### Phase B: 保存 I/O 抽象化

1. `persistence.ts` のブラウザ依存部分を adapter 化
2. Web 版では `localStorage` / download / file input を使う
3. Tauri 版ではネイティブの save dialog / open dialog / app data file を使う

#### Phase C: デスクトップ仕上げ

1. Window サイズや初期サイズを Tauri 側で設定
2. アイコン、タイトル、配布設定を追加
3. 必要なら最近使ったファイルや終了時保存確認を追加

### 既存パターンへの整合

- Zustand store は維持する
- `MapCanvas` や UI コンポーネントは原則そのまま使う
- Tauri 固有の処理は adapter 層へ閉じ込め、React 側への侵入を最小にする

## 6. インターフェース設計

### 追加するレイヤ

- `src/lib/runtime.ts`
  - 実行環境判定 (`web` / `tauri`)
- `src/lib/storageAdapter.ts`
  - `loadDocument()`
  - `saveDocument()`
  - `exportDocument()`
  - `importDocument()`

### Tauri 側 API 利用候補

- `@tauri-apps/plugin-dialog`
  - Save / Open ダイアログ
- `@tauri-apps/plugin-fs`
  - JSON 保存 / 読込
- `@tauri-apps/api/path`
  - app data dir 解決
- 必要に応じて `window` API
  - 初期サイズや最小サイズ設定

### バリデーション

- 読込データは現行 `parsePersistedDocument()` を再利用する
- 保存時は既存の `createPersistedDocument()` を再利用する
- Tauri 環境でも invalid JSON は現行同様に fail fast で扱う

## 7. 実装手順

### Step 1

- Tauri を導入し、`src-tauri/` と `package.json` スクリプトを追加する
- 現行アプリが Tauri ウインドウ内で起動することを確認する

### Step 2

- 実行環境判定を追加する
- 保存 / 読込 / export / import の呼び出し点を adapter 経由へ寄せる

### Step 3

- Web 用 adapter を現行挙動で実装する
- Tauri 用 adapter を追加し、JSON ファイル保存 / 読込をネイティブ API へ切り替える

### Step 4

- 起動時復元や autosave の保存先を、Tauri 版では app data file へ寄せる
- `localStorage` のみに依存しない永続化へ移行する

### Step 5

- Window サイズ、タイトル、アイコン、配布用設定を整える

## 8. 非機能要件チェック

### 性能

- Tauri 採用により Electron より軽量な配布を目指す
- 描画処理は既存 Canvas 実装のまま維持するため、フロント側の性能特性は大きく変えない

### セキュリティ

- 初回はローカル完結アプリとして、不要な shell 実行や広い権限を避ける
- Tauri plugin は保存 / ダイアログなど必要最小限に留める

### 可観測性

- import / export 失敗時の UI 通知は現行パターンを再利用する
- Tauri 固有のエラーは adapter 層でメッセージ化する

### 互換性

- Web 版の起動手順は維持する
- 保存データ形式は現行 `PersistedDocument` を維持する

## 9. リスクと緩和策

- Risk: 保存処理を早い段階で Tauri 固有 API に寄せすぎると Web 版が壊れやすい
- Mitigation: adapter を切って、呼び出し元は環境差を知らない形にする

- Risk: `localStorage` とファイル保存の二重管理で挙動差が出る
- Mitigation: `PersistedDocument` の生成 / 解析は既存関数に一本化し、保存先だけ差し替える

- Risk: Tauri plugin 導入数が増えるとメンテ対象が広がる
- Mitigation: 初回は `dialog` と `fs` 中心に絞る

## 10. 影響範囲

- `package.json`
  Tauri 用スクリプト追加
- `src-tauri/*`
  Tauri 設定と Rust 側最小セット追加
- `src/lib/persistence.ts`
  永続化 adapter への切り出し候補
- `src/store/appStore.ts`
  起動時復元 / autosave 呼び出しの差し替え候補
- `src/App.tsx`
  export / import UI 呼び出し先の差し替え候補

## 11. Definition of Done

- Tauri 版をローカルで起動できる
- 既存の主要画面と `MapCanvas` 操作が Tauri 上でも動く
- Web 版の起動手順を維持できる
- JSON 保存 / 読込を Tauri 経由で行える
- 保存データ形式は既存 `PersistedDocument` と互換を保つ
- Tauri 固有処理が adapter 層へ分離されている
