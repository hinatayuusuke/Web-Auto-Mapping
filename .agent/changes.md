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
