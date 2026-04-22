**2026-04-22 13:12 (Asia/Taipei) — 開発ロードマップ作成**

### Summary
- `Doc/Spec.md` をもとに初版から仕上げまでの開発ロードマップを新規作成した

### Context / Goal
- 仕様書の内容を踏まえて、実装順と各段階の到達点を明文化する必要があった
- 今後の実装着手時に、MVP 範囲と段階的な拡張方針を参照できる状態にする

### Changes
- `Doc/Spec.md` の主要方針を整理し、フェーズ別の開発ロードマップへ再構成した
- ゴール、非ゴール、前提、フェーズ、リスク、完了条件を含む文書を `Doc/Roadmap.md` として追加した

### Files Touched
- `Doc/Roadmap.md` — 仕様書ベースの開発ロードマップを新規作成
- `.agent/changes.md` — 今回の作業内容を規約に沿って記録

### Behavioral Impact
- 実行時の挙動変更はない
- 実装着手時の優先順位とスコープ判断がしやすくなった

### Risk & Mitigation
- Risk: 仕様更新後にロードマップが追従しないと計画と実装が乖離する
- Mitigation: 主要仕様変更時は同ファイルを更新し、作業完了時に `changes.md` へ追記する

### Tests / Verification
- `Doc/Spec.md` を UTF-8 で読み取り、内容との整合を確認
- 文書追加のみのため実行テストは未実施
**2026-04-22 13:22 (Asia/Taipei) — Phase 0 基盤実装**

### Summary
- React + TypeScript + Vite + Tailwind + Zustand の Phase 0 基盤を新規構築した

### Context / Goal
- `Doc/Roadmap.md` の Phase 0 を実装し、今後のマップ機能を載せられる土台が必要だった
- 起動可能なアプリ基盤、基本レイアウト、型定義、状態管理、Canvas プレースホルダを先に成立させる

### Changes
- Vite ベースの React / TypeScript プロジェクト構成とビルド設定を追加した
- Tailwind を使った 3 カラム UI と、左右ペイン + 中央 Canvas のアプリ骨格を実装した
- マップ、プレイヤー、ビューポート、将来のセル / エッジ表現を含む型定義を追加した
- Zustand ストアの雛形と固定グリッドを描く Canvas コンポーネントを追加した
- ローカル npm キャッシュを `.gitignore` へ追加し、ワークツリー汚染を避けた

### Files Touched
- `package.json` — 依存関係と開発用スクリプトを追加
- `package-lock.json` — インストール済み依存関係のロックファイルを追加
- `tsconfig.json` — TypeScript プロジェクト参照の起点を追加
- `tsconfig.app.json` — アプリ本体向け TypeScript 設定を追加
- `tsconfig.node.json` — Vite 設定向け TypeScript 設定を追加
- `vite.config.ts` — React と Tailwind の Vite 設定を追加
- `index.html` — SPA エントリーポイントを追加
- `src/main.tsx` — React エントリーを追加
- `src/App.tsx` — Phase 0 のアプリシェル UI を実装
- `src/components/MapCanvas.tsx` — リサイズ追従する Canvas プレースホルダを実装
- `src/components/ShellPanel.tsx` — 左右ペイン共通のパネルコンポーネントを追加
- `src/store/appStore.ts` — Zustand ストア雛形と初期状態を追加
- `src/types/map.ts` — 基本状態と将来拡張用のマップ型を追加
- `src/styles.css` — Tailwind 読込と基調デザイン変数を追加
- `src/vite-env.d.ts` — Vite 型定義を追加
- `.gitignore` — `.npm-cache/` を追加

### Behavioral Impact
- ブラウザで起動可能なフロントエンド土台が追加された
- 固定グリッドとプレイヤー位置を表示する Canvas と、周辺 UI の骨格が利用可能になった
- 実マッピング機能自体は未実装で、Phase 1 以降でセル / エッジ描画へ拡張する前提

### Risk & Mitigation
- Risk: Tailwind / Vite / Zustand の依存更新で将来ビルド差分が出る可能性がある
- Mitigation: `package-lock.json` を追加して依存解決を固定し、`npm run build` の通過を確認済み
- Risk: npm audit 上で moderate 脆弱性が残っている
- Mitigation: 今回は Phase 0 優先で据え置き、依存更新タイミングで `npm audit` を再評価する

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd install --cache .\.npm-cache`
- `C:\3rd\nodejs\npm.cmd run build`
- 本番ビルド成功を確認
**2026-04-22 13:50 (Asia/Taipei) — Phase 1 マップ中核モデル実装**

### Summary
- セル、エッジ、アイコン、プレイヤーを保持するマップ中核モデルと Canvas 描画を実装した

### Context / Goal
- `Doc/Roadmap.md` の Phase 1 を実装し、探索や編集の前提になる安定したマップ状態モデルが必要だった
- 任意のセル / エッジ状態をストアで保持し、Canvas へ即時反映される土台を成立させる

### Changes
- `FloorState` をセル配列、水平 / 垂直エッジ配列、セルアイコン、エッジアイコンを含む構造へ拡張した
- 空フロア生成、デモフロア生成、セル / エッジ / プレイヤー更新、統計取得を担う `src/lib/mapModel.ts` を追加した
- Zustand ストアを新モデルへ対応させ、選択フロアへのセル、エッジ、プレイヤー更新 action を追加した
- Canvas 描画を固定グリッド表示から、床、壁、開通、アイコン、プレイヤー向き描画へ差し替えた
- `App` を Phase 1 向け表示へ更新し、ストア更新が見える最小操作としてモード切替と向き変更 UI を追加した

### Files Touched
- `src/types/map.ts` — セル、エッジ、アイコン、フロア全体の型へ拡張
- `src/lib/mapModel.ts` — フロア生成、更新、統計のロジックを追加
- `src/store/appStore.ts` — 新しいマップモデルに合わせて store action と selector を更新
- `src/components/MapCanvas.tsx` — 実データ描画と座標レイアウト計算へ差し替え
- `src/App.tsx` — Phase 1 状態表示と最小操作 UI へ更新

### Behavioral Impact
- 既知セル、壁、通路、アイコン、プレイヤー向きを含むデモマップが描画されるようになった
- プレイヤーの向き変更が Canvas に即時反映されるようになった
- Explore / Map の UI 切替は動作するが、探索更新ロジック自体はまだ未実装

### Risk & Mitigation
- Risk: 現在のデモフロア生成は固定サンプルであり、実運用データ入力ではない
- Mitigation: 生成ロジックを `mapModel.ts` に隔離し、Phase 2 以降の探索更新へ差し替えやすくした
- Risk: セル更新時に周辺エッジを自動再計算していないため、将来の編集 UI では不整合が起き得る
- Mitigation: Phase 1 では最低限の保持責務に留め、Phase 2 以降で更新規則を action に集約する前提にした

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-22 15:34 (Asia/Taipei) — Phase 5 操作性強化実装**

### Summary
- Undo / Redo、ズーム / パン、右 / 下拡張、状態表示と通知 UI を追加した

### Context / Goal
- `Doc/Roadmap.md` の Phase 5 を実装し、長時間のマッピング作業で誤操作から復帰しやすくする必要があった
- グリッド不足時の継続作業、viewport 調整、保存 / 読込まわりの状態把握を同時に改善する

### Changes
- 履歴スタックを store に追加し、移動、編集、階層操作、グリッド拡張に対する Undo / Redo を実装した
- 履歴スナップショットは `structuredClone` で独立コピーし、巻き戻し時の参照共有による破損を防いだ
- 選択中フロアの右 / 下方向拡張を `+4` 単位で行えるようにし、既存座標を維持したまま `unknown` を末尾へ追加する実装を入れた
- Canvas にホイールズームと `Alt+drag` / middle drag によるパンを追加した
- UI を Phase 5 向けに更新し、履歴ボタン、viewport 操作、選択中ツール / アイコン表示、空階層 / 保存成功 / 読込失敗の通知表示を追加した
- キーボードショートカットへ `Ctrl+Z`, `Ctrl+Y`, `Ctrl+Shift+Z` を追加した

### Files Touched
- `src/store/appStore.ts` — 履歴管理、Undo / Redo、右 / 下拡張、viewport reset を追加
- `src/lib/mapModel.ts` — 右 / 下方向のグリッド拡張ロジックを追加
- `src/components/MapCanvas.tsx` — ホイールズーム、`Alt+drag` / middle drag パン、zoom 表示を追加
- `src/App.tsx` — Phase 5 の UI、通知表示、履歴 / viewport 操作、拡張ボタン、redo 系ショートカットを追加

### Behavioral Impact
- 編集や移動、階層操作、グリッド拡張の誤操作を Undo / Redo で戻せるようになった
- グリッド端で止まっても右 / 下へ拡張して作業を継続できるようになった
- Canvas 表示をズーム / パンで調整でき、選択中ツールやアイコン、保存 / 読込結果を画面上で把握しやすくなった

### Risk & Mitigation
- Risk: 履歴スナップショットが状態参照を共有すると redo 復元が壊れる
- Mitigation: 履歴投入時と復元時の両方で `structuredClone` を使い、スナップショットを独立させた
- Risk: パン操作が左クリック編集と衝突すると編集誤爆が増える
- Mitigation: パンは `Alt+drag` または middle drag に限定し、通常の左クリック編集導線を維持した

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- `C:\3rd\nodejs\npm.cmd run dev -- --host 127.0.0.1 --port 4173`
- Playwright CLI で `+4 Right` → `Undo` → `Redo` の順に操作し、`16 x 16` / `20 x 16` の切り替わりを確認
- Playwright CLI で `Zoom +` とヘッダー / Canvas の zoom 表示反映を確認
- Console の既知エラーが `favicon.ico` 404 のみであることを確認
**2026-04-22 15:41 (Asia/Taipei) — Canvas 初期表示を上寄せに調整**

### Summary
- Canvas 内のマップ原点を縦中央から上寄せへ変更した

### Context / Goal
- 現在のページは縦長で、マップ本体が Canvas 内で中央配置されるため初見時に fold の下へ落ちやすかった
- 最初の表示と `Reset View` 後の表示で、マップ本体が上側から見える状態に揃える必要があった

### Changes
- `MapCanvas` のレイアウト計算で `originY` を縦中央基準から固定上余白基準へ変更した
- ホイールズーム時の基準原点も同じ上余白へ合わせ、初期表示とズーム後の見え方がずれないようにした

### Files Touched
- `src/components/MapCanvas.tsx` — 縦方向の原点計算を上寄せへ変更し、ズーム時の Y 基準も同じ余白へ揃えた

### Behavioral Impact
- 初期表示でマップ本体が Canvas 上部から見えるようになった
- `Reset View` やズーム後も、縦方向の基準は上寄せのまま維持される

### Risk & Mitigation
- Risk: 縦方向を固定上寄せにすると、背の低い Canvas では下側が見切れやすくなる
- Mitigation: パン操作は維持しており、必要に応じて下方向へ移動して確認できる

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-22 15:08 (Asia/Taipei) — Phase 4 階層管理と保存再開実装**

### Summary
- 階層管理、JSON 保存 / 読込、localStorage 自動保存と再開を実装した

### Context / Goal
- `Doc/Spec.md` と `Doc/Roadmap.md` を再確認し、Phase 4 の継続利用可能版を実装する必要があった
- 複数階層を独立して扱い、保存した状態を JSON または localStorage から再開できるようにする

### Changes
- 永続化フォーマットを `PersistedDocument` として定義し、タイトル、設定、階層、選択中階層、ビューポートを保存対象にした
- localStorage の自動保存と起動時復元を store レベルへ追加した
- 階層の追加、複製、削除、選択、名前変更 action を追加した
- JSON の書き出しと読込 UI を追加し、形式不正時は読み込まないようにした
- 左ペインに階層一覧、右ペインに保存 / 読込領域を追加し、Phase 4 の操作導線を成立させた

### Files Touched
- `src/types/map.ts` — 永続化フォーマット型を追加
- `src/lib/persistence.ts` — JSON / localStorage 永続化ロジックを新規追加
- `src/store/appStore.ts` — 階層管理、起動時復元、自動保存 action を追加
- `src/App.tsx` — 階層一覧、タイトル編集、JSON 保存 / 読込 UI を追加
- `.agent/changes.md` — 今回の作業内容を追記

### Behavioral Impact
- 複数階層を独立して持てるようになり、選択階層ごとに編集状態を切り替えられるようになった
- 状態更新ごとに localStorage へ保存され、再読込時に前回状態から再開できるようになった
- 現在のマップ状態を JSON で書き出し、同形式の JSON を読み戻せるようになった

### Risk & Mitigation
- Risk: 永続化フォーマット検証は構造の最小確認に留めており、壊れた内部配列までは厳密検証していない
- Mitigation: `version` と主要フィールドを検証し、不正フォーマットは fail fast で拒否する形にした
- Risk: HMR 中に自動保存購読が重複すると localStorage 書込が増える可能性がある
- Mitigation: `window` に初期化フラグを置いて多重購読を防いだ

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- `C:\3rd\nodejs\npm.cmd run dev -- --host 127.0.0.1 --port 4173`
- Playwright で画面を開き、階層一覧と保存 / 読込 UI が表示されることを確認
- Console の致命エラーがないことを確認（`favicon.ico` 404 のみ）
**2026-04-22 14:53 (Asia/Taipei) — 黒画面の無限再レンダー修正**

### Summary
- Zustand selector の不安定な返り値が原因の無限再レンダーを修正した

### Context / Goal
- `npm run dev` で画面が黒くなり、React が描画前に落ちる問題が発生していた
- 画面表示を復旧しつつ、同種の selector 起因ループを避ける構成へ直す必要があった

### Changes
- `useSelectedFloorStats()` を削除し、store selector が毎回新しい object を返さないようにした
- `App` 側で `selectedFloor` をもとに `useMemo` で統計を計算する形へ変更した
- dev サーバー起動と実ブラウザ確認をやり直し、無限再レンダーが解消したことを確認した

### Files Touched
- `src/store/appStore.ts` — 不安定な stats selector を削除
- `src/App.tsx` — `getFloorStats` を `useMemo` で計算する形へ変更
- `.agent/changes.md` — 今回の不具合修正内容を記録

### Behavioral Impact
- 画面が正常に描画され、黒画面で止まらなくなった
- Explore / Map UI と Canvas が通常どおり表示されるようになった
- Console エラーは `favicon.ico` の 404 のみになった

### Risk & Mitigation
- Risk: 今後も store selector 内で毎回新しい object / array を返すと同様の問題が再発する
- Mitigation: 集計系は selector ではなく、コンポーネント側で `useMemo` または安定 selector に寄せる運用にする

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- `C:\3rd\nodejs\npm.cmd run dev -- --host 127.0.0.1 --port 4173`
- Playwright で `http://127.0.0.1:4173/` を開き、画面描画と Console エラー解消を確認
**2026-04-22 14:21 (Asia/Taipei) — Phase 3 Map モードと編集導線実装**

### Summary
- Map モードの壁衝突、前方ショートカット編集、Canvas クリック編集、アイコン配置を実装した

### Context / Goal
- `Doc/Roadmap.md` の Phase 3 を実装し、探索結果を人手で補正しながら歩行確認できる編集体験が必要だった
- Explore と Map の責務を分け、キーボードとマウスの両方で最小限の編集導線を成立させる

### Changes
- `EditTool`、前方エッジ編集 intent、Canvas interaction target を型に追加した
- Map モード専用の移動制約を追加し、既知の `wall` を越えず、未知セルには入らない歩行確認を実装した
- 前方エッジに対する `1:wall`, `2:door`, `3:open`, `0:unknown` のショートカット編集を追加した
- `I`, `Alt+I`, `Backspace`, `[` , `]`, `Tab` を含むキーボード編集導線を追加した
- Canvas でセル中心はセル、境界付近はエッジとして解釈し、左クリック配置 / 右クリック削除の Map モード編集を追加した
- 右ペインに編集ツール選択とセルアイコンパレットを追加し、選択中ツール状態を UI へ反映した

### Files Touched
- `src/types/map.ts` — 編集ツールと interaction に必要な型を追加
- `src/lib/mapModel.ts` — Map モード移動、前方エッジ編集、アイコン配置、Canvas 編集ロジックを追加
- `src/store/appStore.ts` — 編集状態、Map モード action、ショートカット action を追加
- `src/App.tsx` — キーボードショートカット、編集ツール UI、アイコンパレットを追加
- `src/components/MapCanvas.tsx` — Map モード限定のクリック編集と前方フォーカス描画を追加

### Behavioral Impact
- Map モードで既知の壁を越えない移動確認ができるようになった
- 前方境界の壁 / ドア / 開通 / unknown をキーボードで即時編集できるようになった
- Map モードでセル、エッジ、セルアイコンをマウスから直接編集できるようになった
- Explore モードでは引き続き移動による自動記録を優先し、Canvas クリック編集は受け付けない

### Risk & Mitigation
- Risk: 右クリック削除は単純化のためセルを `unknown`、エッジを `unknown` に戻す挙動としている
- Mitigation: 削除ルールは `mapModel.ts` に集約し、後続フェーズでツール別削除へ拡張しやすい形にした
- Risk: Map モード移動は未知セルを通さないため、探索用途としては厳しめの制約になっている
- Mitigation: Explore と Map の役割分離を優先し、踏査は Explore、整合確認は Map に限定する仕様にした

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-22 14:05 (Asia/Taipei) — Phase 2 探索モード実装**

### Summary
- Explore モードの移動、床 / 通路自動記録、オート補完レベル切替を実装した

### Context / Goal
- `Doc/Roadmap.md` の Phase 2 を実装し、探索しながら地図が埋まるコア体験を成立させる必要があった
- 移動入力、`floor / open` 自動記録、`Off / Basic / Corridor` の補完を同じ状態モデル上で動かす

### Changes
- 探索開始向けの初期フロア生成を追加し、現在地だけ既知の状態からマッピングを始められるようにした
- Explore モードの移動 action を追加し、移動元 / 移動先の床化と移動境界の `open` 更新を実装した
- `Basic` で現在地周辺の unknown 境界を壁候補化し、`Corridor` で移動軸の側壁も追加補完するようにした
- `W/A/S/D` と矢印キーによる移動入力を追加し、画面上の移動パッドからも同じ action を呼べるようにした
- オート補完レベル切替 UI と探索向けの状態表示を追加した

### Files Touched
- `src/lib/mapModel.ts` — 探索開始フロア生成、移動更新、オート補完ロジックを追加
- `src/store/appStore.ts` — Explore モード用の `moveInDirection` action と初期状態へ更新
- `src/App.tsx` — キーボード移動、移動パッド、オート補完切替 UI を追加
- `src/components/MapCanvas.tsx` — 現在の探索挙動に合わせて説明表示を更新

### Behavioral Impact
- Explore モードで移動するたびに床と通路が自動で記録されるようになった
- `Basic` と `Corridor` の設定差分がエッジ補完として反映されるようになった
- Map モード時の壁衝突や編集制約はまだ未実装で、現時点では向き変更だけを保持する

### Risk & Mitigation
- Risk: `Corridor` 補完は仕様文からの実装解釈を含み、移動元 / 移動先の側壁を補完する挙動にしている
- Mitigation: 補完ロジックを `mapModel.ts` に集約し、必要なら Phase 3 以降で局所的に調整できる形にした
- Risk: 境界外への移動は現時点で無視されるため、グリッド拡張前は端で探索が止まる
- Mitigation: これは Phase 5 のグリッド拡張までの暫定仕様とし、範囲外では向きだけ更新する

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
