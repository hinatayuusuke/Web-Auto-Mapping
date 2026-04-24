# Edit Tool から `cell icon` を外す実装案

## 1. 概要

`Edit Tool` から `cell icon` ボタンを削除し、セルアイコン配置の入口を `Cell Icons` パレット側へ寄せる。  
これにより、`Edit Tool` はセル状態と境界状態の編集だけに責務を絞り、右ペインの重複を減らす。

## 2. ゴール / 非ゴール

### ゴール

- `Edit Tool` から `cell icon` ボタンを削除する
- `Cell Icons` を「置くアイコン選択」だけでなく、実質的なアイコン配置モードの入口にする
- 既存のマウス配置フローを壊さず、UI 上の重複だけを解消する

### 非ゴール

- `MapCanvas` のアイコン描画ロジック変更
- `I` / `Alt+I` / `Backspace` / `[` `]` のショートカット仕様変更
- `Cell` / `Edge` の大分類リファクタ

## 3. 前提・仮定

- 現行実装では、マウスでセルアイコンを置くには `selectedTool === 'cell-icon'` が必要
- `Cell Icons` パレットは現在「何を置くか」を選ぶ UI であり、「今アイコン配置モードであること」は明示していない
- 利用者は右ペイン内で `Edit Tool` と `Cell Icons` を連続して使う前提が多い

## 4. 現状整理

- `Edit Tool` には以下が存在する
  - `cell floor`
  - `cell unknown`
  - `edge wall`
  - `edge open door`
  - `edge closed door`
  - `edge open`
  - `edge unknown`
  - `cell icon`
- `Cell Icons` には以下が存在する
  - `stairs`
  - `down stairs`
  - `pit`
  - `chest`
  - `marker`
- つまり、セルアイコン操作だけが
  - 編集モード選択
  - 置くアイコン選択
  の 2 段階になっており、他の編集操作より冗長

## 5. 提案アーキテクチャ

### コンポーネント構成

- `Edit Tool`
  - `cell floor`
  - `cell unknown`
  - `edge wall`
  - `edge open door`
  - `edge closed door`
  - `edge open`
  - `edge unknown`
- `Cell Icons`
  - `stairs`
  - `down stairs`
  - `pit`
  - `chest`
  - `marker`

### データフロー / シーケンス

1. 利用者が `Cell Icons` のいずれかをクリックする
2. `selectedCellIconKind` を更新する
3. 同時に `selectedTool` を `cell-icon` に切り替える
4. 以後、`MapCanvas` 上のセルクリックでそのアイコンを配置する

### 既存パターンへの整合

- store 内の `selectedTool: 'cell-icon'` は維持する
- UI からだけ `cell-icon` 単体ボタンを外し、内部状態としては残す
- これにより `MapCanvas` やキーボードショートカットの既存分岐を大きく崩さない

## 6. インターフェース設計

### UI 変更

- `Edit Tool` から `cell icon` を削除
- `Cell Icons` クリック時の挙動を次に変更
  - `setSelectedCellIconKind(kind)`
  - `setSelectedTool('cell-icon')`

### 状態遷移

- `selectedTool`
  - `Cell Icons` クリック時のみ自動で `cell-icon` へ切替
- `selectedCellIconKind`
  - 従来どおり選択値だけを更新

### エラー / バリデーション

- 特別なバリデーション追加は不要
- `Cell Icons` から `cell-icon` モードへ遷移するため、UI から `cell-icon` に入れない状態は作らない

## 7. 実装手順

### Step 1

- `EDIT_TOOL_OPTIONS` から `cell-icon` を除外

### Step 2

- `CellIconChoiceButton` の `onClick` を変更し、`selectedCellIconKind` 更新と同時に `selectedTool('cell-icon')` へ切り替える

### Step 3

- 必要なら `Cell Icons` 見出し文を短く調整し、「選択すると配置モードに入る」ことを示す

### Step 4

- `npm run build` で型・UI 崩れを確認

## 8. 非機能要件チェック

### 性能

- 影響は軽微

### セキュリティ

- 影響なし

### 可観測性

- 追加ログは不要

### 互換性

- 内部状態の `cell-icon` は残すため、既存ロジックとの互換は高い

### 運用

- 追加運用なし

## 9. リスクと緩和策

- Risk: `Cell Icons` をクリックした瞬間に `selectedTool` が変わることが直感に反する可能性
- Mitigation: `Cell Icons` 側の active 状態と `MapCanvas` の配置結果を一致させ、動作を一貫させる

- Risk: `cell-icon` を UI から消した結果、現在どの編集モードか分かりにくくなる可能性
- Mitigation: 既存ヘッダーやツールの active 表示で `selectedTool` を確認できる状態を維持する

## 10. 影響範囲

- `src/App.tsx`
  - `EDIT_TOOL_OPTIONS`
  - `CellIconChoiceButton`
  - 必要なら見出し文言
- 必要に応じて `changes.md`

## 11. Definition of Done

- `Edit Tool` に `cell icon` が表示されない
- `Cell Icons` のいずれかをクリックすると、対象アイコン選択と同時にアイコン配置モードへ入る
- `MapCanvas` 上で従来どおりアイコンをセル配置できる
- `npm run build` が成功する
