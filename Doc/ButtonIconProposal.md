# ボタンのアイコン化実装案

## 1. 概要

現在の UI は `Navigator`、`Workspace`、`MapCanvas` にテキストボタンが多く、横幅と高さの両方を圧迫しています。  
この提案では、頻用で意味が固定されている操作を優先してアイコン化し、破壊的操作や意味が曖昧になりやすい操作はテキストを残す方針を整理します。

## 2. ゴール / 非ゴール

### ゴール
- ボタン占有面積を減らし、`MapCanvas` の表示領域を広げる
- 役割が明確な操作をアイコン化し、視認性と到達性を維持する
- 危険操作や学習コストが高い操作は、性急にアイコン化しない判断基準を作る

### 非ゴール
- 今回の提案段階では実装しない
- 独自 SVG アイコンセットの整備までは行わない
- 色だけで意味を区別する設計にはしない
- すべてのボタンを一律にアイコン化しない

## 3. 前提・仮定

- 現在の主要ボタンは [src/App.tsx](/g:/Local%20App/Web-Auto-Mapping/src/App.tsx) に集中している
- 既存 UI は `ActionButton`、`ShortcutButton`、`ToolbarButton` の 3 種に分かれている
- 将来的に Tauri 版を主運用にする可能性があるため、hover だけに依存せず tooltip や `aria-label` を前提にする
- アイコンはまず文字グリフや簡易 SVG で十分とし、外部アイコンライブラリ追加は必須にしない

## 4. 現状整理

### 現在の主要ボタン群
- `MapCanvas` 上部ツールバー
  - `Undo`
  - `Redo`
  - `Zoom -`
  - `Zoom +`
  - `Reset View`
- `Navigator > Floors`
  - `Add`
  - `Duplicate`
  - `Delete`
- `Navigator > Grid`
  - `+4 Left`
  - `+4 Up`
  - `+4 Right`
  - `+4 Down`
- `Navigator > Global Arrow Test`
  - `capture on / capture off`
- `Workspace > Save / Load`
  - `Save JSON`
  - `Load JSON`
- `Workspace > Undo / Redo`
  - `Undo`
  - `Redo`
- `Workspace > Zoom / Pan`
  - `Pan Up`
  - `Center`
  - `Pan Left`
  - `Zoom -`
  - `Zoom +`
  - `Pan Right`
  - `Pan Down`
- `Workspace > Mode / Auto Map / Tool / Icon`
  - 状態切替ボタン群
- `Movement Controls`
  - `forward`
  - `turn left`
  - `turn right`
  - `turn back`

### 問題
- 同じ意味のボタンが複数箇所でテキスト重複している
- `MapCanvas` 上部の頻用操作が特に横幅を消費している
- 方向系ボタンは意味が比較的固定なので、テキストのコストに対して情報量が低い
- `Delete` や `Load JSON` のように誤操作コストが高いものは、アイコンのみだと判断しづらい

## 5. 提案アーキテクチャ

### 基本方針
- 頻用で意味が固定されるものだけを先にアイコン化する
- 危険操作、保存系、編集対象が分かりにくいものはテキストを残す
- アイコンのみボタンには必ず `title` と `aria-label` を付ける
- Active / Disabled / Hover / Focus の状態差は形だけでなく色とコントラストでも見せる

### ボタンの分類

#### A. 先にアイコン化してよい
- `Undo`
- `Redo`
- `Zoom -`
- `Zoom +`
- `Reset View`
- `Pan Up / Down / Left / Right`
- `forward`
- `turn left`
- `turn right`
- `turn back`
- `+4 Left / Up / Right / Down`

#### B. テキスト併用に留める
- `Add`
- `Duplicate`
- `Delete`
- `Save JSON`
- `Load JSON`
- `capture on / capture off`

#### C. 原則テキストのまま
- `Mode`
- `Auto Map`
- `Tool`
- `Icon`

理由:
- これらは選択肢が多く、アイコンだけで意味を覚えさせると認知負荷が上がる
- 現状は「認識しながら選ぶ」UI であり、記憶依存に寄せるべきではない

### アイコン候補
- `Undo` : 左向き戻し矢印
- `Redo` : 右向き戻し矢印
- `Zoom -` : 虫眼鏡マイナス、または単純な `−`
- `Zoom +` : 虫眼鏡プラス、または単純な `＋`
- `Reset View` : ターゲット / 中央寄せマーク
- `Pan` : 矢印 4 方向
- `forward` : 上矢印
- `turn left` : 左回転矢印
- `turn right` : 右回転矢印
- `turn back` : U ターン矢印
- `+4 Left / Up / Right / Down` : 矢印 + `4`

## 6. インターフェース設計

### 新しいボタンコンポーネント方針
- `IconButton`
  - 入力
    - `label`
    - `icon`
    - `onClick`
    - `disabled?`
    - `active?`
    - `tone?`
  - 出力
    - アイコン主体の正方形または小型横長ボタン
- `TextIconButton`
  - `Delete` や `Save JSON` など、アイコンと短いラベルを併記する用途

### 実装ルール
- アイコンのみボタンには `aria-label={label}` を必須にする
- アイコンのみボタンには `title={label}` を付け、学習コストを下げる
- `Delete` は text 併用のままにして、他ボタンより危険色を残す
- `capture on / off` はスイッチ寄り UI に寄せ、アイコン単独にはしない

## 7. 実装手順

### Step 1
- `ToolbarButton` を `IconButton` へ置き換える
- 対象:
  - `MapCanvas` 上部の `Undo / Redo / Zoom - / Zoom + / Reset View`

### Step 2
- `Workspace > Zoom / Pan` と `Movement Controls` をアイコン化する
- 方向系を同一の視覚言語に揃える

### Step 3
- `Grid` の `+4` 拡張を小型アイコンボタンへ変える
- `+4` の数字は小さな補助ラベルで残す

### Step 4
- `Add / Duplicate / Delete / Save / Load` を再評価する
- 必要なら `TextIconButton` に留め、完全なアイコン単独化は見送る

## 8. 非機能要件チェック

### 性能
- SVG 直書きまたは文字グリフで十分で、性能影響は小さい

### セキュリティ
- 影響なし

### 可観測性
- 影響なし

### 互換性
- ボタンの意味は変えず、見た目だけを圧縮する

### 運用
- tooltip と `aria-label` を必須にし、学習コストを段階的に下げる

## 9. リスクと緩和策

- Risk: アイコンだけで意味が伝わらず、誤操作が増える
- Mitigation: 頻用で意味が固定された操作だけを先に対象にし、tooltip と hover 表示を付ける

- Risk: 危険操作までアイコン化して、削除や読込の判断がしづらくなる
- Mitigation: `Delete`、`Load JSON`、`Save JSON` は text 併用を維持する

- Risk: ボタン種別が増えて実装が散る
- Mitigation: `IconButton` と `TextIconButton` に集約し、既存 `ActionButton` / `ToolbarButton` を整理する

## 10. 影響範囲

- `src/App.tsx`
  - ボタン利用箇所の差し替え
- 必要なら `src/components/` に新規ボタンコンポーネントを追加
- 必要なら `src/styles.css`
  - アイコンボタンのサイズ、focus、tooltip 補助スタイルを追加

## 11. Definition of Done

- `MapCanvas` 上部の頻用ボタンがアイコン化され、横幅占有が減っている
- 方向操作系ボタンがアイコン主体に揃っている
- アイコンのみボタンに `title` と `aria-label` が付いている
- `Delete`、`Save JSON`、`Load JSON` は可読性を落とさず残す判断が反映されている
- キーボード操作と見た目の対応関係が大きく壊れていない
