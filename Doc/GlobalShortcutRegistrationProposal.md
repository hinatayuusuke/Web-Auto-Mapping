# Global Shortcut 登録 UI 実装案

## 1. 概要

Tauri 版に、記録補助操作だけを対象にした Global Shortcut 登録 UI を追加する。
既存の移動ショートカット、Global Arrow Capture、`Ctrl+Alt+F12` による ON/OFF は現状仕様のまま維持する。

## 2. ゴール / 非ゴール

### ゴール

- Tauri 版で Forward Edge と Cell Icon 操作を Global Shortcut として登録できる
- 登録 UI の対象操作を限定し、地図移動の誤操作リスクを増やさない
- Global Shortcut は初期状態では無効にする
- 登録失敗や衝突を UI で確認できる
- 既存の Global Arrow Capture 仕様を壊さない

### 非ゴール

- 移動、向き変更、Global Arrow Capture の ON/OFF を新しい登録 UI の対象にすること
- `Cell Icon: forward cell に配置` を登録対象にすること
- Web 版で Global Shortcut を動作させること
- 任意コマンドを自由に追加できる汎用ホットキーエディタを作ること

## 3. 前提・仮定

- `@tauri-apps/plugin-global-shortcut` は既に導入済み
- `src-tauri/capabilities/default.json` には `isRegistered` / `register` / `unregister` の許可がある
- 現在の Global Arrow Capture は `App.tsx` に実装されている
- 追加 UI は Tauri 版のみ有効にし、Web 版では非表示または disabled 表示にする
- Global Shortcut のデフォルト候補は表示しても、初期状態では登録しない

## 4. 現状整理

- 既存のアプリ内ショートカット
  - Forward Edge: `1` / `2` / `3` / `4` / `0`
  - Cell Icon: `[` / `]`
  - Cell Icon 配置: `I`
  - Cell Icon 削除: `Backspace`
- 既存の Tauri Global Shortcut
  - `ArrowUp` / `ArrowDown` / `ArrowLeft` / `ArrowRight`
  - `Ctrl+Alt+F12` で Global Arrow Capture の ON/OFF
- 既存 UI
  - Map Canvas 上部に Global Arrow Capture の ON/OFF ボタンがある

## 5. 提案アーキテクチャ

### コンポーネント構成

- `src/lib/globalShortcutActions.ts`
  - Global Shortcut から実行可能な操作 ID と実行関数の対応を定義する
- `src/lib/globalShortcutPreferences.ts`
  - Tauri app local data への設定保存 / 読込を担当する
- `src/hooks/useGlobalShortcutRegistration.ts`
  - 登録、解除、衝突チェック、状態管理を担当する
- `src/App.tsx`
  - Workspace に入口ボタンと状態サマリーを追加する
- `src/components/GlobalShortcutSettingsDialog.tsx`
  - 詳細な登録 UI をアプリ内モーダルとして表示する

### データフロー

1. アプリ起動時に Tauri 版か判定する
2. Tauri 版なら Global Shortcut 設定を app local data から読み込む
3. master enabled が true の場合だけ、登録対象 shortcut を登録する
4. 登録失敗時は対象 action の status を error にする
5. UI で shortcut を変更したら、既存登録を解除してから新しい shortcut を登録する
6. 登録成功後に設定を保存する

### 既存パターンへの整合

- 地図データとは独立したユーザー環境設定として保存する
- `storageAdapter.ts` と同じく Tauri plugin を dynamic import する
- 既存の Global Arrow Capture 登録処理とは別系統にし、責務を混ぜない

## 6. インターフェース設計

### 登録対象 Action

```ts
type GlobalShortcutActionId =
  | 'forward-edge-wall'
  | 'forward-edge-door'
  | 'forward-edge-open'
  | 'forward-edge-closed-door'
  | 'forward-edge-unknown'
  | 'cell-icon-previous'
  | 'cell-icon-next'
  | 'cell-icon-place-current'
  | 'cell-icon-remove-current';
```

### 設定データ

```ts
type GlobalShortcutPreferences = {
  enabled: boolean;
  bindings: Array<{
    actionId: GlobalShortcutActionId;
    enabled: boolean;
    shortcut: string;
  }>;
};
```

### デフォルト候補

初期状態では `enabled: false` とし、候補 shortcut は登録しない。

- `forward-edge-wall`: `Ctrl+Alt+1`
- `forward-edge-door`: `Ctrl+Alt+2`
- `forward-edge-open`: `Ctrl+Alt+3`
- `forward-edge-closed-door`: `Ctrl+Alt+4`
- `forward-edge-unknown`: `Ctrl+Alt+0`
- `cell-icon-previous`: `Ctrl+Alt+[`
- `cell-icon-next`: `Ctrl+Alt+]`
- `cell-icon-place-current`: `Ctrl+Alt+I`
- `cell-icon-remove-current`: `Ctrl+Alt+Backspace`

WHY: 単独キーの Global Shortcut は他アプリ入力を妨げやすいため、候補は修飾キー付きにする。

### UI

- Section: `Global Shortcuts`
- 表示条件:
  - Tauri 版: 有効
  - Web 版: disabled 表示または非表示
- Workspace 上の表示:
  - master state: `On` / `Off`
  - active binding count
  - status summary
  - `Configure` ボタン
- `Configure` クリック時:
  - アプリ内モーダルを開く
  - 背景は軽く暗くし、Workspace から独立した設定画面として扱う
  - `Esc` / backdrop / `Close` で閉じられる
- モーダル内の controls:
  - master toggle
  - action ごとの enabled toggle
  - shortcut 表示
  - `Record` ボタン
  - `Clear` ボタン
  - `Reset defaults` ボタン
  - status 表示

WHY: 登録対象が多く Workspace に常時展開すると右ペインの視認性が落ちるため、通常時は入口だけにして詳細設定をモーダルへ逃がす。

### エラー / バリデーション

- 空 shortcut は登録しない
- 同一設定内の重複 shortcut は保存前にエラーにする
- `isRegistered(shortcut)` が true の場合は登録しない
- `register` 失敗時は UI に `register failed` を表示する
- shortcut 変更時は旧 shortcut を解除してから新 shortcut を登録する
- 新 shortcut 登録に失敗した場合は旧 shortcut の再登録を試みる

## 7. 実装手順

### Step 1

- Global Shortcut 対象 action と既定 binding を定義する
- action 実行関数を Zustand store の既存 action に接続する

### Step 2

- Tauri app local data 用の preferences 保存 / 読込関数を追加する
- 保存ファイル例: `$APPLOCALDATA/web-auto-mapping.preferences.json`

### Step 3

- Global Shortcut 登録 hook を追加する
- master enabled と action enabled に応じて register / unregister を行う

### Step 4

- Workspace に `Global Shortcuts` のサマリーと `Configure` ボタンを追加する
- 詳細 UI は `GlobalShortcutSettingsDialog` として実装する
- `Record` 中は次に押されたキー組み合わせを shortcut 候補として取り込む
- `Record` 中の `Esc` はモーダル close ではなく recording cancel を優先する

### Step 5

- 衝突、登録失敗、解除失敗、Reset defaults を確認する
- Web 版では操作できないことを確認する

## 8. 非機能要件チェック

### 性能

- 登録処理は設定変更時のみ行う
- 通常描画や Canvas 操作には影響させない

### セキュリティ

- Global Shortcut は OS 全体に作用するため、初期状態では無効にする
- 単独キーを既定候補にしない

### 互換性

- 地図保存データには含めない
- 既存の Global Arrow Capture と `Ctrl+Alt+F12` は変更しない

### 可観測性

- UI に action ごとの登録状態を表示する
- 失敗時は簡潔なエラー文を表示する

## 9. リスクと緩和策

- Risk: 他アプリや OS shortcut と衝突する
- Mitigation: `isRegistered` で確認し、失敗を UI に表示する

- Risk: Global Shortcut が誤操作を誘発する
- Mitigation: デフォルト無効、登録対象を記録補助操作に限定、移動操作は対象外にする

- Risk: 登録変更中に旧 shortcut も新 shortcut も使えなくなる
- Mitigation: 新規登録に失敗した場合は旧 shortcut の再登録を試み、UI に状態を出す

- Risk: `App.tsx` が肥大化する
- Mitigation: 登録処理と設定保存を hook / lib に分離する

## 10. 影響範囲

- `src/App.tsx`
  - Global Shortcut サマリーと `Configure` ボタンの追加
- `src/components/GlobalShortcutSettingsDialog.tsx`
  - 詳細設定モーダルの追加
- `src/lib/globalShortcutActions.ts`
  - action 定義と実行処理の追加
- `src/lib/globalShortcutPreferences.ts`
  - Tauri app local data への保存 / 読込
- `src/hooks/useGlobalShortcutRegistration.ts`
  - register / unregister / status 管理
- `src-tauri/capabilities/default.json`
  - preferences 保存先を追加する場合は fs allow path を追加

## 11. Definition of Done

- Tauri 版で Global Shortcut 登録 UI が表示される
- Web 版では登録 UI が無効または非表示になる
- Workspace には状態サマリーと `Configure` ボタンだけが表示される
- `Configure` クリックで詳細設定モーダルが開く
- `Esc` / backdrop / `Close` で詳細設定モーダルを閉じられる
- `Record` 中の `Esc` は recording cancel として動く
- master toggle が off の初期状態では何も登録されない
- Forward Edge の 5 操作を Global Shortcut 登録できる
- Cell Icon の previous / next / current 配置 / current 削除を Global Shortcut 登録できる
- 移動、向き変更、Global Arrow Capture ON/OFF は追加登録 UI の対象外である
- 既存の Global Arrow Capture と `Ctrl+Alt+F12` は従来どおり動く
- 衝突や登録失敗が UI に表示される
- Reset defaults で候補 shortcut と無効状態に戻せる
- `npm run build` が成功する
