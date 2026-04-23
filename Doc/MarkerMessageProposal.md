# Marker メッセージ機能 実装案

## 1. 概要

`marker` アイコンに短いメッセージを紐付けられるようにする。
Map 上では `marker` 内の文字をメッセージ先頭 1 文字で表示し、ダブルクリックで編集、マウスオーバーで `MapCanvas` 上段に全文を表示する。

## 2. ゴール / 非ゴール

### ゴール

- `marker` アイコンにメッセージ文字列を保存できる
- `marker` をダブルクリックするとメッセージを編集できる
- `marker` にマウスオーバーすると `MapCanvas` 上段に全文を表示できる
- `marker` の表示文字をメッセージ先頭 1 文字に変更できる

### 非ゴール

- `stairs` `pit` `chest` に同じメッセージ機能を広げること
- リッチテキスト、複数行整形、色分けなどの高機能メモを入れること
- モバイル / タッチ専用 UI を同時に設計すること
- マーカー一覧パネルや全文検索 UI を追加すること

## 3. 前提・仮定

- 初回対象は `marker` のみとする
- 表示文字は「先頭 1 文字」で固定し、英字限定にはしない
- 空文字の場合は既定表示として `M` を使う
- ダブルクリック編集はデスクトップ前提の操作とする

## 4. 現状整理

### 現行挙動

- `cellIcons` は `kind` と座標だけを持つ
- `marker` は他のセルアイコンと同じ扱いで、メッセージ属性を持たない
- `MapCanvas` はセルアイコンを共通 glyph で描いており、hover 時の情報表示領域はない

### 関連モジュール

- `src/types/map.ts`
  `CellIcon` 型の拡張先
- `src/lib/persistence.ts`
  保存 / 読込時に追加フィールドをそのまま通す必要がある
- `src/lib/mapModel.ts`
  `marker` 配置時の初期値や更新処理の追加先
- `src/components/MapCanvas.tsx`
  ダブルクリック、hover 判定、表示文字、上段メッセージ表示の実装先
- `src/App.tsx`
  追加 UI が必要なら編集用の補助状態を持つ候補

### 既存制約

- `cellIcons` の構造変更は保存データへ影響するため、互換を壊さない追加に留める
- hover 表示は `MapCanvas` 内オーバーレイとして完結させた方が実装が軽い
- ダブルクリック編集は既存のクリック編集と競合しないように整理が必要

## 5. 提案アーキテクチャ

### コンポーネント構成

- `CellIcon` に `message?: string` を追加する
- `MapCanvas` に
  - hover 中 marker の参照
  - 編集中 marker の参照
  - 入力用の小さいポップオーバー
  を持たせる

### データフロー / シーケンス

1. `marker` を配置した時点では `message` を空または未設定で持つ
2. `marker` をダブルクリックすると編集状態へ入る
3. 入力確定時に該当 marker の `message` を更新する
4. `MapCanvas` 描画時は `marker.message` の先頭 1 文字、なければ `M` を glyph として使う
5. hover 中の marker に `message` があれば、`MapCanvas` 上段オーバーレイへ全文を出す

### 既存パターンへの整合

- 既存の `cellIcons` 配置フローは維持し、`marker` だけ追加属性を持てるようにする
- 新しいデータは `cellIcons` 内へ閉じ込め、別テーブルや別 store は増やさない

## 6. インターフェース設計

### データ構造

- `CellIcon`
  - `message?: string` を追加

### 操作

- `double click`
  - 対象が `marker` のときだけメッセージ編集開始
- `hover`
  - 対象が `marker` かつ `message` があるときだけ全文表示

### 表示ルール

- `message` が空:
  - glyph は `M`
- `message` がある:
  - glyph は `message.trim().charAt(0)`
- 上段表示:
  - hover 中だけ表示
  - 長文は 1 行表示優先で、必要なら省略

### エラー / バリデーション

- 空入力は許可するが、結果的に glyph は `M` へ戻す
- 文字数上限は最初は 80〜120 文字程度に制限する案が妥当
- 改行は初回では単一空白へ正規化してよい

## 7. 実装手順

### Step 1

- `CellIcon` 型へ `message` を追加する
- `marker` 配置時に `message` を持てるように更新する

### Step 2

- `MapCanvas` の `marker` 描画を変更し、先頭 1 文字表示へ切り替える
- hover 状態を追加し、上段メッセージ表示オーバーレイを実装する

### Step 3

- `marker` ダブルクリックで編集開始できるようにする
- 入力欄と確定 / キャンセル処理を追加する

### Step 4

- 保存 / 読込で `message` が保持されることを確認する
- hover、編集、通常クリック編集の競合を調整する

## 8. 非機能要件チェック

### 性能

- hover 判定は既存の hit test を流用し、毎フレーム走査は避ける

### 可観測性

- 特別なログは不要
- ダブルクリックと通常クリックの競合回避理由はコメントで残す

### 互換性

- `message` は optional にし、既存保存データもそのまま読める形にする

### 操作性

- 通常クリック編集を壊さないことを最優先にする
- hover 文言は `MapCanvas` の視認を壊さない位置と長さに抑える

## 9. リスクと緩和策

- Risk: ダブルクリックと既存のシングルクリック編集が競合する
- Mitigation: `marker` かつ `Map` モード時だけダブルクリック編集を有効にし、通常クリックは現状維持にする

- Risk: 長文 hover 表示がマップを隠す
- Mitigation: 上段固定の 1 行表示にし、必要なら省略記号で切る

- Risk: 空文字や記号先頭で表示文字が分かりにくい
- Mitigation: 先頭文字が取れない場合は `M` を使う

## 10. 影響範囲

- `src/types/map.ts`
  `CellIcon` への `message` 追加
- `src/lib/mapModel.ts`
  `marker` 作成 / 更新処理
- `src/components/MapCanvas.tsx`
  hover、ダブルクリック、入力 UI、glyph 切替、上段メッセージ表示
- `src/lib/persistence.ts`
  既存保存データとの整合確認

## 11. Definition of Done

- `marker` にメッセージを保存できる
- `marker` をダブルクリックしてメッセージ編集できる
- `marker` に hover すると `MapCanvas` 上段へ全文が表示される
- `marker` の表示文字がメッセージ先頭 1 文字になる
- 空メッセージ時は `M` 表示へ戻る
- 保存 / 読込後もメッセージが保持される
