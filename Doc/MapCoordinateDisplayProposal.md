# Map 座標表示 実装案

## 1. 概要

Map canvas のヘッダーにプレイヤー座標とマウス hover 座標を表示する。
座標は現行データ構造に合わせ、現在のマップ左上を `(0, 0)` とする。

## 2. ゴール / 非ゴール

### ゴール

- Map Canvas ヘッダーでプレイヤー座標を確認できる
- Map Canvas ヘッダーでマウスオーバー中の Cell 座標を確認できる
- マップ拡張後も現行の座標体系と一致した値を表示する
- Canvas 上の描画領域や Cell Icon message overlay を邪魔しない

### 非ゴール

- 旧原点を維持する絶対座標系を追加すること
- 保存形式に origin offset を追加すること
- Edge 座標を hover 表示すること
- Canvas 内の四辺に座標数字を描画すること

## 3. 前提・仮定

- 現在の `FloorState` は左上を `(0, 0)` とする配列座標で管理している
- `expandFloorGrid` は上 / 左拡張時に既存セル、プレイヤー、アイコン座標を同量だけシフトする
- そのため、上 / 左拡張後は既存セルの表示座標も増える
- 今回はこの現行仕様をそのまま表示する

## 4. 現状整理

- `MapCanvas` はマウス位置から Cell / Edge target を判定している
- App ヘッダーには `Mode`、`Floor`、`Auto Map`、`Tool`、`Icon`、`Zoom` などの状態表示がある
- Map Canvas 右側には `16 x 20` のような現在のマップサイズ表示がある
- Canvas 上部 overlay は Cell Icon message 表示で使っている

## 5. 提案アーキテクチャ

### コンポーネント構成

- `App.tsx`
  - hover Cell 座標 state を持つ
  - `selectedFloor.player.x/y` と hover 座標を Map Canvas ヘッダーに表示する
- `MapCanvas.tsx`
  - `onHoverCoordinateChange` callback prop を受け取る
  - `mousemove` で hover Cell 座標を通知する
  - `mouseleave` で `null` を通知する

### データフロー

1. `App.tsx` が `hoveredMapCoordinate` state を持つ
2. `MapCanvas` に `onHoverCoordinateChange={setHoveredMapCoordinate}` を渡す
3. `MapCanvas` の `mousemove` で canvas local 座標から Cell 座標を計算する
4. マップ範囲内なら `{ x, y }`、範囲外なら `null` を親へ通知する
5. `App.tsx` の Map Canvas ヘッダーに `Player x,y` と `Hover x,y` を表示する

### 既存パターンへの整合

- 座標表示は Canvas 描画ではなく UI 状態表示として扱う
- Canvas overlay を増やさず、既存の Cell Icon message 表示と競合させない
- 既存の `selectedFloor.player` と hover 計算結果をそのまま使い、座標補正は追加しない

## 6. インターフェース設計

### 型

```ts
type MapCanvasProps = {
  onHoverCoordinateChange?: (coordinate: CellCoordinate | null) => void;
};
```

### 表示

Map Canvas ヘッダーの右側、現在の `16 x 20` 表示の手前に置く。

```text
Player 8,12   Hover 10,12   16 x 20
```

hover がマップ外の場合:

```text
Player 8,12   Hover -   16 x 20
```

selected floor が無い場合:

```text
Player -   Hover -   0 x 0
```

### 座標基準

- 表示する `x/y` は `FloorState` 内の現在座標をそのまま使う
- 左上セルは常に `(0, 0)`
- 上 / 左拡張で既存セルの座標が変わることは現行仕様として許容する

## 7. 実装手順

### Step 1

- `App.tsx` に `hoveredMapCoordinate` state を追加する
- `MapCanvas` 呼び出しに `onHoverCoordinateChange` を渡す

### Step 2

- `MapCanvas` に props 型を追加する
- `mousemove` で hover Cell 座標を計算する helper を追加する
- `mouseleave` 時に `onHoverCoordinateChange(null)` を呼ぶ

### Step 3

- Map Canvas ヘッダーへ `Player` / `Hover` 表示を追加する
- 既存の `16 x 20` 表示の手前へ配置する
- 横幅不足時に折り返してもボタン群と重ならないようにする

### Step 4

- `npm run build` で型と build を確認する
- 通常サイズ、縮小 zoom、マップ外 hover、上 / 左拡張後の表示を手動確認する

## 8. 非機能要件チェック

### 性能

- `mousemove` ごとに Cell 座標を計算するが、既存の hover 処理と同程度の軽量処理に留める
- 同じ座標が続く場合の state 更新抑制は必要に応じて検討する

### 互換性

- 保存形式は変更しない
- `FloorState` に origin offset は追加しない

### UI

- Canvas 内に追加 overlay を置かない
- Header 内の状態表示として、既存の `16 x 20` と近い位置に表示する
- モバイル / 縦長レイアウトでも折り返し可能な小さいテキストにする

## 9. リスクと緩和策

- Risk: 上 / 左拡張後に既存セルの座標が変わるため、ユーザーが絶対座標と誤解する可能性がある
- Mitigation: 今回は現行データ構造どおり「現在の左上基準」とし、絶対座標は非ゴールにする

- Risk: Header の右側が混み合う
- Mitigation: `Player` / `Hover` は短い chip 表示にし、必要なら `Hover` を非表示または折り返し可能にする

- Risk: hover 座標更新で再レンダーが増える
- Mitigation: Cell 座標が変わった時だけ親 state を更新する実装を検討する

## 10. 影響範囲

- `src/App.tsx`
  - hover 座標 state
  - `MapCanvas` props
  - Map Canvas ヘッダーの座標表示
- `src/components/MapCanvas.tsx`
  - props 追加
  - hover Cell 座標計算と callback 通知

## 11. Definition of Done

- Map Canvas ヘッダーに Player 座標が表示される
- Map Canvas ヘッダーに Hover 座標が表示される
- マップ外 hover / mouse leave で `Hover -` になる
- 上 / 左 / 右 / 下拡張後も、現在の `FloorState` 座標に一致した値が表示される
- Canvas 内の Cell Icon message overlay と競合しない
- `npm run build` が成功する
