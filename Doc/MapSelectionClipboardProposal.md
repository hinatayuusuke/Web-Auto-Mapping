# Map 範囲選択 / Copy / Cut / Paste 実装案

## 1. 概要

Map Canvas 上で Cell 矩形範囲を選択し、その範囲内の Cell / Edge / Icon を copy / cut / paste できるようにする。
初期実装では OS clipboard 連携ではなく、アプリ内 clipboard として扱う。

## 2. ゴール / 非ゴール

### ゴール

- Cell 矩形範囲を Canvas 上で選択できる
- 選択範囲を copy / cut できる
- コピー済み範囲を別の Cell 位置へ paste できる
- 範囲内の Cell、外周を含む Edge、Cell Icon、Edge Icon をまとめて扱える
- copy / cut / paste は Undo / Redo の 1 操作として扱う

### 非ゴール

- OS clipboard との連携
- 複数範囲選択
- 非矩形選択
- 貼り付け preview
- プレイヤー位置のコピー / 貼り付け
- 範囲回転 / 反転

## 3. 前提・仮定

- `FloorState` は Cell と Edge を別配列で持つ
- Cell 範囲は `{ x, y, width, height }` の矩形で表現する
- Edge は Cell 境界に存在するため、選択範囲の外周 Edge も copy 対象に含める
- プレイヤー位置は地図パーツではなく現在操作位置なので copy 対象に含めない
- paste 先は左上 Cell 座標で指定する

## 4. 現状整理

- `MapCanvas` は click / drag paint で Cell / Edge 編集を行っている
- `appStore` は Undo / Redo 用の tracked mutation を持つ
- `expandFloorGrid` は右 / 下 / 左 / 上方向の拡張と座標シフトに対応している
- Cell Icon / Edge Icon は座標付き配列として保持している

## 5. 提案アーキテクチャ

### コンポーネント構成

- `src/types/map.ts`
  - selection / clipboard 用の型を追加する
- `src/lib/mapClipboard.ts`
  - copy / cut / paste の pure function を置く
- `src/store/appStore.ts`
  - selection state
  - internal clipboard state
  - copy / cut / paste actions
- `src/components/MapCanvas.tsx`
  - selection drag 操作
  - selection overlay 描画
  - paste target 決定
- `src/App.tsx`
  - keyboard shortcut 接続
  - selection status 表示が必要なら追加

### データフロー

1. `Shift + drag` で selection start / end Cell を更新する
2. mouseup で矩形範囲を確定する
3. `Ctrl+C` で現在 selection から clipboard payload を作成する
4. `Ctrl+X` で clipboard payload 作成後、元範囲を unknown / icon 削除する
5. `Ctrl+V` で現在 hover Cell、または最後にクリックした Cell を左上として paste する
6. paste が右 / 下にはみ出す場合は必要量だけ map を拡張する

### 既存パターンへの整合

- map model の pure function と store action を分ける
- Undo / Redo は既存の `applyTrackedMutation` 経路に乗せる
- Canvas は interaction と描画に集中し、copy payload の生成や paste は lib/store 側へ寄せる

## 6. インターフェース設計

### 型

```ts
type CellRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type MapClipboardPayload = {
  width: number;
  height: number;
  cells: CellState[][];
  hEdges: EdgeState[][]; // height + 1 rows, width columns
  vEdges: EdgeState[][]; // height rows, width + 1 columns
  cellIcons: CellIcon[];
  edgeIcons: EdgeIcon[];
};
```

### Copy 対象

Cell 範囲が `width x height` の場合:

- `cells`: `height x width`
- `hEdges`: `(height + 1) x width`
- `vEdges`: `height x (width + 1)`
- `cellIcons`: 範囲内 Cell にあるもの
- `edgeIcons`: copy 対象 Edge にあるもの

Icon 座標は clipboard 内では相対座標へ変換する。

### Cut 挙動

- `cells`: `unknown`
- `hEdges`: `unknown`
- `vEdges`: `unknown`
- `cellIcons`: 範囲内のものを削除
- `edgeIcons`: copy 対象 Edge 上のものを削除
- プレイヤー位置は変更しない

### Paste 挙動

- paste 先 Cell を左上として、clipboard payload を配置する
- 右 / 下にはみ出す場合は自動拡張する
- 左 / 上の負座標 paste は初期 UI では発生させない
- paste 先の既存 Cell / Edge / Icon は clipboard 内容で上書きする
- paste 後の Icon id は配置先座標で再生成する

### Keyboard

- `Shift + drag`: 範囲選択
- `Ctrl+C`: copy
- `Ctrl+X`: cut
- `Ctrl+V`: paste
- `Escape`: selection clear
- `Delete` / `Backspace`: selection contents clear

既存入力欄 focus 中は既存 keyboard handler と同様に無視する。

### Mouse

- `Shift + mouse down`: selection start
- `Shift + drag`: selection update
- `mouseup`: selection finalize
- selection 中の通常 click / drag paint との競合は selection を優先する

## 7. 実装手順

### Step 1: 型と pure function

- `CellRect` と `MapClipboardPayload` を追加する
- `copyMapRect(floor, rect)` を追加する
- `clearMapRect(floor, rect)` を追加する
- `pasteMapClipboard(floor, payload, destination)` を追加する

### Step 2: Store state / actions

- `selectedMapRect`
- `mapClipboard`
- `setSelectedMapRect`
- `clearSelectedMapRect`
- `copySelectedMapRect`
- `cutSelectedMapRect`
- `pasteMapClipboardAt`

### Step 3: Canvas selection UI

- `Shift + drag` で selection drag state を持つ
- selection 矩形 overlay を描画する
- mouse leave / mouseup の終了処理を整理する

### Step 4: Keyboard 操作

- `App.tsx` の keydown handler に copy / cut / paste / Escape / Delete を追加する
- input / textarea / select / contentEditable 中は無視する

### Step 5: 自動拡張

- paste 先が右 / 下にはみ出す場合に `expandFloorGrid` 相当の処理を使って拡張する
- 拡張後の destination に貼り付ける

### Step 6: 検証

- cells の copy / paste
- wall / door / open / unknown edge の copy / paste
- Cell Icon / Edge Icon の copy / paste
- cut 後の Undo
- paste 後の Undo
- 右 / 下はみ出し paste

## 8. 非機能要件チェック

### 性能

- 範囲 payload は選択時ではなく copy / cut 時に生成する
- 選択 overlay は Canvas の通常再描画に含める

### 互換性

- 保存形式は変更しない
- clipboard payload は app runtime 内だけの一時 state とする

### UI

- selection overlay は半透明塗り + 枠線にする
- 選択中でも既存マップ表示を読み取れる濃度に抑える
- paste preview は初期実装では入れない

### データ整合性

- Edge 配列サイズの違いを明示的に扱う
- Icon id は paste 先で再生成する
- 切り取り時にプレイヤー位置は変更しない

## 9. リスクと緩和策

- Risk: Edge 範囲の含め方が直感とずれる
- Mitigation: Cell 矩形の外周 Edge まで含める仕様に固定し、Doc とコメントで明記する

- Risk: paste によって既存 map を大きく上書きする
- Mitigation: Undo / Redo に 1 操作として積む

- Risk: selection drag と既存 drag paint が競合する
- Mitigation: `Shift + drag` 中は selection を優先し、paint / erase を開始しない

- Risk: cut 範囲に player が含まれると足元が unknown になる
- Mitigation: 初期実装では player は移動せず、Undo 可能な編集として扱う

- Risk: 右 / 下自動拡張時に Edge / Icon 座標がずれる
- Mitigation: 既存の拡張処理を再利用し、paste payload は拡張後座標へ適用する

## 10. 影響範囲

- `src/types/map.ts`
  - `CellRect` / `MapClipboardPayload` 型追加
- `src/lib/mapClipboard.ts`
  - copy / clear / paste pure function 追加
- `src/store/appStore.ts`
  - selection / clipboard state と actions 追加
- `src/components/MapCanvas.tsx`
  - selection interaction と overlay 描画追加
- `src/App.tsx`
  - keyboard shortcut 追加
- `.agent/changes.md`
  - 実装完了時の作業ログ追記

## 11. Definition of Done

- `Shift + drag` で Cell 矩形範囲を選択できる
- 選択範囲が Canvas 上に overlay 表示される
- `Ctrl+C` で選択範囲を app clipboard にコピーできる
- `Ctrl+X` で選択範囲をコピーし、元範囲を clear できる
- `Ctrl+V` で clipboard 内容を hover Cell または直近 Cell に貼り付けできる
- Cell / Edge / Cell Icon / Edge Icon がまとめて copy / cut / paste される
- paste が右 / 下にはみ出す場合に map が自動拡張される
- copy / cut / paste が Undo / Redo で戻せる
- `npm run build` が成功する
