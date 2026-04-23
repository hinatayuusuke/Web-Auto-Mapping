# UI説明文の整理案

## 1. 概要

現在の UI は各セクションに説明文を広く持っており、レイアウトの縦方向を圧迫しています。  
この提案では、常時表示しなくてよい説明を削り、必要な情報だけを短文化または集約する方針を整理します。

## 2. ゴール / 非ゴール

### ゴール
- パネル内の縦占有を減らす
- 既に学習済みの操作説明を常時表示から外す
- 特殊操作や危険操作の説明だけを別導線へ逃がす

### 非ゴール
- 今回の提案段階では実装しない
- 機能名やセクション構成そのものは大きく変えない
- すべての説明を完全に消すことは目的にしない

## 3. 前提・仮定

- 現状の説明文は [src/App.tsx](/g:/Local%20App/Web-Auto-Mapping/src/App.tsx) の `PanelHeading.body` に集中している
- ユーザーは基本操作をすでに把握し始めており、毎回読む長文説明は価値が下がっている
- 一方で、ショートカットや Tauri 限定機能のような特殊情報は完全削除すると再発見性が落ちる

## 4. 現状整理

### 現在の説明文が多い箇所
- ヘッダー補足文
- `Floor Selector`
- `Expand Grid`
- `Movement`
- `Global Arrow Test`
- `Forward Edge`
- `Current Status`
- `Save / Load`
- `Undo / Redo`
- `Zoom / Pan`
- `Selected Floor`
- `Explore / Map`
- `Edit Tool`
- `Cell Icons`
- `Completion Level`
- `MapCanvas` 下の `Canvas Status`

### 問題
- セクション数に対して本文が多く、1つ1つは短くても総量が大きい
- 日常的に参照しない説明が常時表示されている
- 同じ種別の情報が分散していて、画面上の密度に対して学習効果が薄い

## 5. 提案アーキテクチャ

### 基本方針
- 常時表示の説明は最小化する
- タイトルだけで理解できるセクションは本文を削除する
- ショートカットや特殊条件は、専用の小さなヘルプ導線へ寄せる

### 分類

#### A. 本文を削除してよい
- ヘッダー補足文
- `Floor Selector`
- `Expand Grid`
- `Current Status`
- `Undo / Redo`
- `Selected Floor`
- `Explore / Map`
- `Completion Level`

理由:
- タイトルと中身の UI 自体で意味がほぼ伝わる
- 説明がなくても操作意図を失いにくい

#### B. 短文化すべき
- `Save / Load`
- `Global Arrow Test`
- `Zoom / Pan`
- `Edit Tool`

短文化イメージ:
- `Save / Load`: `Autosave + JSON import/export`
- `Global Arrow Test`: `Tauri only`
- `Zoom / Pan`: `Wheel zoom, drag pan`
- `Edit Tool`: `Map mode only`

#### C. 本文を消して別導線へ移すべき
- `Movement`
- `Forward Edge`
- `Cell Icons`
- `Canvas Status` の長文説明

理由:
- これらは操作説明やショートカット説明であり、毎回本文で見せるよりヘルプ集約の方が効率的
- 普段は不要だが、思い出したい時には参照したい情報である

## 6. インターフェース設計

### 画面上の扱い
- `PanelHeading`
  - `body` は optional にする
- 画面上の説明は以下の3種に整理する
  - なし
  - 1行の短文
  - 別ヘルプ導線

### ヘルプの置き場所候補
- `Shortcuts` セクションを新設する
- もしくは各セクション見出し右上に `?` ボタンを置く
- 最初の実装では、まず `Shortcuts` に集約する方が軽い

## 7. 実装手順

### Step 1
- `PanelHeading.body` を optional にする
- 説明本文を持たないセクションを許容する

### Step 2
- A分類の説明文を削除する

### Step 3
- B分類を1行へ短文化する

### Step 4
- C分類の説明を `Shortcuts / Help` セクションへ集約する
- `Movement`
- `Forward Edge`
- `Cell Icons`
- `Canvas Status`

## 8. 非機能要件チェック

### 性能
- 影響なし

### セキュリティ
- 影響なし

### 可観測性
- 影響なし

### 互換性
- 文言整理のみで、機能や保存形式には影響しない

### 運用
- 消した説明が必要になったら、ヘルプ集約先へ追加しやすい構成にする

## 9. リスクと緩和策

- Risk: 説明を削りすぎて初見ユーザーが迷う
- Mitigation: 常時不要な説明だけを削り、ショートカット系は別ヘルプへ残す

- Risk: 特殊操作の再発見性が落ちる
- Mitigation: `Shortcuts / Help` を1か所だけ用意し、情報を分散させない

## 10. 影響範囲

- `src/App.tsx`
  - `PanelHeading`
  - 各セクションの説明文
- 必要なら `MapCanvas` 側のステータス文

## 11. Definition of Done

- 常時表示の長文説明が大幅に減っている
- パネル内の縦占有が明確に減っている
- 特殊ショートカット情報が完全消失せず、どこかで参照可能である
- セクション名と中身だけで日常操作が成立する
