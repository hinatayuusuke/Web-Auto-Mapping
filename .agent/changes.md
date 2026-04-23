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

**2026-04-23 15:10 (Asia/Taipei) — MapCanvas ツールバー圧縮**

### Summary
- `MapCanvas` ヘッダーのボタンを専用の小型ツールバーへ変更し、中央上部の占有を縮小した

### Context / Goal
- `Undo / Redo / Zoom / Reset View` が左右ペイン用と同じボタン寸法で、中央カラム上部を圧迫していた
- `MapCanvas` 操作用ボタンだけを軽いツールバーとして扱い、できるだけ詰めたかった

### Changes
- `MapCanvas` ヘッダーの padding と gap を縮小した
- 操作用ボタンを `ShortcutButton` から専用の `ToolbarButton` へ差し替えた
- `ToolbarButton` は `rounded-xl`、小さめの padding、`13px` テキストで compact にした
- 寸法表示の行高と上下余白もあわせて縮小した

### Files Touched
- `src/App.tsx` — `MapCanvas` ヘッダーと `ToolbarButton` を追加し、中央ツールバーを compact 化

### Behavioral Impact
- `MapCanvas` 上部ツールバーの高さが下がり、キャンバス表示面積が増えた
- 左右ペインの既存ボタンサイズは維持され、中央だけ軽量化された

### Risk & Mitigation
- Risk: ボタンを詰めすぎるとクリックしづらくなる
- Mitigation: 中央専用にだけ適用し、ラベル可読性と hover 状態は維持した

### Tests / Verification
- `npm run build`

**2026-04-23 14:09 (Asia/Taipei) — ヘッダーステータス圧縮**

### Summary
- ヘッダーのステータス欄を 2 行カード風から 1 行の圧縮表示へ変更し、縦方向の占有を削減した

### Context / Goal
- ヘッダーの `Mode / Floor / Auto Map / Tool / Icon / Zoom` が縦方向に大きく、中央の作業領域を圧迫していた
- 同じ情報量を保ちながら、できるだけ高さを詰めたかった

### Changes
- ヘッダー全体の下余白と内部 gap を縮小した
- タイトル行の line-height と説明文サイズを詰めた
- `StatusChip` を縦積みから横並びへ変更し、ラベルと値の間隔・行高を縮小した
- `xl` 幅ではステータス下線も減らし、情報列として軽く見えるようにした

### Files Touched
- `src/App.tsx` — ヘッダーと `StatusChip` のレイアウトを圧縮表示へ調整

### Behavioral Impact
- ヘッダーが低くなり、初期表示で中央の `MapCanvas` が見える面積が増えた
- 表示内容自体は変わらず、情報密度だけ上がった

### Risk & Mitigation
- Risk: ステータスを詰めすぎると値が読みにくくなる
- Mitigation: ラベルは uppercase のまま残し、値は `truncate` と最小フォントサイズで可読性を維持した

### Tests / Verification
- `npm run build`

**2026-04-23 13:19 (Asia/Taipei) — Tauri 移植 Phase B 実装**

### Summary
- 保存 I/O を runtime 判定付き adapter 層へ切り出し、Web と Tauri で同じ UI から保存 / 読込を切り替えられるようにした

### Context / Goal
- `Doc/TauriMigrationProposal.md` の Phase B として、保存 / 読込 / export / import の呼び出し点をブラウザ API 直結から外す必要があった
- Web 版は既存挙動を保ちつつ、Tauri 版では dialog / fs plugin を使うネイティブ I/O へ接続したかった

### Changes
- `src/lib/runtime.ts` を追加し、`@tauri-apps/api/core` の `isTauri()` で runtime 判定を行う層を追加した
- `src/lib/storageAdapter.ts` を追加し、Web 版の `localStorage` / download / file picker と、Tauri 版の `AppData` autosave / native open-save dialog を同じ関数群へ統一した
- `src/store/appStore.ts` は同期初期化をやめ、`hydratePersistedState()` による非同期復元へ変更した
- autosave は `persistenceReady` が立つまで抑止し、初期 hydrate 前に既定状態で既存データを上書きしないようにした
- `src/App.tsx` は import / export UI を adapter 経由へ切り替え、autosave 先の表示も runtime 依存にした
- Tauri 側へ `@tauri-apps/api`、`@tauri-apps/plugin-dialog`、`@tauri-apps/plugin-fs` と対応する Rust plugin を追加し、capability を更新した

### Files Touched
- `src/lib/runtime.ts` — `web` / `tauri` 判定を追加
- `src/lib/storageAdapter.ts` — 保存 / 読込 / export / import の adapter 実装を追加
- `src/store/appStore.ts` — 非同期 hydrate、autosave ガード、adapter 経由保存へ変更
- `src/App.tsx` — import / export UI と autosave 表示を adapter 連携へ更新
- `package.json` — Tauri API / dialog / fs の JS 依存関係を追加
- `package-lock.json` — npm 依存関係更新を反映
- `src-tauri/Cargo.toml` — dialog / fs plugin を追加
- `src-tauri/Cargo.lock` — Rust 依存関係ロックを更新
- `src-tauri/src/lib.rs` — dialog / fs plugin を初期化
- `src-tauri/capabilities/default.json` — dialog と fs 書込権限を追加

### Behavioral Impact
- Web 版では従来どおり `localStorage` とブラウザ download / file picker を使う
- Tauri 版では autosave が `AppData` 側の JSON へ保存され、明示的な Save / Load はネイティブ dialog と fs plugin を使う
- store 初期化は非同期 hydrate へ変わったが、UI からの利用方法は変わらない

### Risk & Mitigation
- Risk: 非同期 hydrate 前に autosave が走ると既存保存内容を既定状態で上書きする
- Mitigation: `persistenceReady` が立つまで autosave を無効化し、hydrate 完了後のみ保存するようにした
- Risk: Tauri の fs / dialog permission 不足で runtime では読書きが拒否される可能性がある
- Mitigation: 公式ドキュメントに合わせて `dialog:default`、`fs:default`、`fs:allow-app-write`、`fs:allow-write-text-file` を capability に追加した

### Tests / Verification
- `npm install`
- `npm run build`
- `cargo build --manifest-path .\src-tauri\Cargo.toml`
- `npm run tauri build`

**2026-04-23 14:02 (Asia/Taipei) — Tauri autosave runtime 判定修正**

### Summary
- Tauri 実行ファイルで Web 扱いになっていた runtime 判定を修正し、autosave が `AppLocalData` の JSON ファイルへ保存されるようにした

### Context / Goal
- `web_auto_mapping.exe` 実行時に autosave が Tauri 側ファイルへ保存されず、再起動後に状態が復元されなかった
- 原因を切り分けた結果、`core.isTauri()` 依存の判定と autosave 保存先スコープが実環境と噛み合っていなかった

### Changes
- `src/lib/runtime.ts` の runtime 判定を `core.isTauri()` から `window.__TAURI_INTERNALS__` ベースへ変更した
- `src/lib/storageAdapter.ts` の Tauri autosave 保存先を `BaseDirectory.AppLocalData` へ切り替えた
- `src-tauri/capabilities/default.json` は autosave 用 JSON ファイルだけを対象にした `exists` / `read-text-file` / `write-text-file` 権限へ絞った

### Files Touched
- `src/lib/runtime.ts` — `withGlobalTauri` 非依存の Tauri 判定へ変更
- `src/lib/storageAdapter.ts` — Tauri autosave の baseDir を `AppLocalData` へ変更
- `src-tauri/capabilities/default.json` — autosave ファイル向けの限定スコープ権限へ更新

### Behavioral Impact
- `web_auto_mapping.exe` 実行時、autosave は `C:\Users\<user>\AppData\Local\com.fineart.web-automapping\web-auto-mapping.document.json` に保存される
- これにより Tauri 実行ファイルの再起動後も autosave から復元できる前提が成立した

### Risk & Mitigation
- Risk: runtime 判定を内部グローバルに依存するため、将来の Tauri API 実装変更で再調整が必要になる可能性がある
- Mitigation: 判定ロジックを `runtime.ts` に閉じ込め、他モジュールへ広げない形を維持した
- Risk: autosave 権限を広げすぎるとローカルファイルアクセス範囲が不要に広くなる
- Mitigation: capability は固定 autosave ファイルのみに限定した

### Tests / Verification
- `npm run build`
- `npm run tauri build`
- `src-tauri\target\release\web_auto_mapping.exe` を起動して数秒後に終了し、`C:\Users\yuugao.FINEART\AppData\Local\com.fineart.web-automapping\web-auto-mapping.document.json` の生成を確認

**2026-04-23 11:51 (Asia/Taipei) — Tauri 移植 Phase A 実装**

### Summary
- Tauri の最小構成を追加し、既存 React アプリをデスクトップ向けにビルドできる状態へ接続した

### Context / Goal
- `Doc/TauriMigrationProposal.md` の Phase A として、現行 UI と状態管理を大きく崩さず Tauri ウインドウへ載せる必要があった
- Web 版の `npm run dev` / `npm run build` を維持しつつ、Tauri 用の開発 / ビルド導線を追加したかった

### Changes
- `src-tauri/` を追加し、Tauri v2 の最小 Rust ホスト、設定、権限定義、アイコン雛形を導入した
- `package.json` に `tauri` / `tauri:dev` / `tauri:build` スクリプトを追加し、`@tauri-apps/cli` を開発依存関係へ追加した
- Tauri 側の package 名、lib 名、window identifier をアプリ向けに更新し、初期ウインドウサイズと最小サイズを調整した
- `npm install` により `package-lock.json` を更新し、Rust 側は `Cargo.lock` を生成した

### Files Touched
- `package.json` — Tauri CLI 依存関係と起動 / ビルド用スクリプトを追加
- `package-lock.json` — npm 依存関係更新を反映
- `src-tauri/Cargo.toml` — Rust package / lib 名と説明メタデータをアプリ向けに更新
- `src-tauri/Cargo.lock` — Rust 依存関係ロックファイルを生成
- `src-tauri/tauri.conf.json` — identifier、window label、初期サイズ、最小サイズを設定
- `src-tauri/src/main.rs` — 更新した lib 名を参照するように修正
- `src-tauri/src/lib.rs` — Tauri アプリ起動エントリを追加
- `src-tauri/build.rs` — Tauri ビルドスクリプトを追加
- `src-tauri/capabilities/default.json` — 最小権限定義を追加
- `src-tauri/icons/*` — Tauri バンドル用の標準アイコン群を追加

### Behavioral Impact
- `npm run tauri:dev` と `npm run tauri:build` で既存フロントエンドを Tauri ウインドウアプリとして扱えるようになった
- 現時点の保存 / 読込は従来どおり Web 側実装のままで、Tauri 固有の I/O にはまだ切り替えていない

### Risk & Mitigation
- Risk: Tauri bundle は既定設定のままだと配布対象が広く、初回ビルド時間と成果物サイズが大きくなりやすい
- Mitigation: Phase A では最小導入を優先し、保存 I/O や配布最適化は後続フェーズへ分離した
- Risk: `identifier` やウインドウサイズは暫定値のため、配布要件や OS ごとの振る舞いに合わせて再調整が必要になる
- Mitigation: 設定は `src-tauri/tauri.conf.json` に集約し、次フェーズで局所的に調整できる形にした

### Tests / Verification
- `npm install`
- `npm run build`
- `cargo build --manifest-path .\src-tauri\Cargo.toml`
- `npm run tauri build`
**2026-04-23 09:50 (Asia/Taipei) — Marker メッセージ機能を実装**

### Summary
- `marker` アイコンにメッセージを持たせ、ダブルクリック編集、hover 表示、先頭 1 文字 glyph を実装した

### Context / Goal
- `Doc/MarkerMessageProposal.md` に沿って、`marker` を単なる記号ではなく軽い注釈ノードとして扱えるようにする必要があった
- 保存データへメッセージを保持しつつ、既存のクリック編集とダブルクリック編集の競合も抑える必要があった

### Changes
- `CellIcon` に optional の `message` を追加した
- `mapModel.ts` に marker メッセージ更新処理を追加し、store から履歴付きで更新できるようにした
- `MapCanvas` に marker hover 判定、上段メッセージ表示、ダブルクリック編集用の入力 UI を追加した
- `marker` 上の左クリックだけ短い遅延を入れ、ダブルクリック編集と通常クリック編集の競合を抑えた
- marker glyph を `message` の先頭 1 文字、空時は `M` に切り替えた

### Files Touched
- `src/types/map.ts` — `CellIcon` に `message?: string` を追加
- `src/lib/mapModel.ts` — marker メッセージ更新関数を追加
- `src/store/appStore.ts` — marker メッセージ更新 action を追加
- `src/components/MapCanvas.tsx` — hover 表示、編集 UI、glyph 切替、marker hit test を追加

### Behavioral Impact
- Map 上の `marker` をダブルクリックするとメッセージを編集できるようになった
- `marker` にマウスオーバーすると `MapCanvas` 上段に全文が表示されるようになった
- `marker` の表示文字はメッセージ先頭 1 文字、空メッセージ時は `M` になる
- 保存 / 読込後も marker メッセージが保持される

### Risk & Mitigation
- Risk: ダブルクリックと既存のシングルクリック編集が衝突すると、意図しないセル編集が走る可能性がある
- Mitigation: `marker` 上の左クリックだけ 220ms 遅延し、2 回目クリックで編集を優先するようにした
- Risk: hover 文言が長いと `MapCanvas` 上部を圧迫する可能性がある
- Mitigation: 上段表示は 1 行の `truncate` 表示に留めた

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-22 18:45 (Asia/Taipei) — Marker メッセージ機能の実装案を追加**

### Summary
- `marker` アイコンへメッセージを持たせる実装案を `Doc/MarkerMessageProposal.md` に追加した

### Context / Goal
- `marker` を注釈ノードとして使えるようにし、ダブルクリック編集、hover 表示、先頭 1 文字 glyph という仕様を整理する必要があった
- 初回実装でどこまでをゴールにするか、保存構造や UI 競合を含めて明文化したかった

### Changes
- `marker` 専用メッセージ機能について、データ構造、操作、表示ルール、実装手順、リスクを提案書へ整理した
- glyph は「メッセージ先頭 1 文字」、空時は `M` を使う前提を明記した

### Files Touched
- `Doc/MarkerMessageProposal.md` — `marker` メッセージ機能の実装案を新規追加

### Behavioral Impact
- 実装はまだ変えていない
- 次段階で `marker` メッセージ機能を実装するための基準文書が追加された

### Risk & Mitigation
- Risk: ダブルクリック編集と既存クリック編集の競合が後で曖昧になる可能性がある
- Mitigation: 提案書で `marker` 限定、Map モード限定、hover 表示位置、保存構造まで先に固定した

### Tests / Verification
- 未実施（ドキュメント追加のみ）
**2026-04-23 11:20 (Asia/Taipei) — Tauri 移植実装案を追加**

### Summary
- Tauri への段階移植案を `Doc/TauriMigrationProposal.md` に追加した

### Context / Goal
- 現行の React + Vite + Canvas アプリを Window アプリ化するにあたり、最小 Tauri 化から保存 I/O のネイティブ化まで段階整理が必要だった
- Web 版を維持しつつ Tauri 版を追加するため、adapter 分離前提の実装方針を明文化したかった

### Changes
- Tauri 導入のゴール / 非ゴール、段階移行、adapter 方針、影響範囲を提案書へ整理した
- 初回は UI をそのまま載せ、次段階で保存 / 読込だけを Tauri API へ寄せる方針を明記した

### Files Touched
- `Doc/TauriMigrationProposal.md` — Tauri 移植の実装案を新規追加

### Behavioral Impact
- 実装はまだ変えていない
- Tauri 移植を進めるための基準文書が追加された

### Risk & Mitigation
- Risk: Tauri 化と保存方式刷新を同時に進めると影響範囲が広がりやすい
- Mitigation: 提案書では「最小 Tauri 化」→「I/O adapter 化」→「デスクトップ仕上げ」の段階導入に分けた

### Tests / Verification
- 未実施（ドキュメント追加のみ）
**2026-04-22 18:18 (Asia/Taipei) — MapCanvas のホイールでページスクロールが漏れる問題を修正**

### Summary
- `MapCanvas` 上のホイール操作で縦長モードのページ全体スクロールが反応しないようにした

### Context / Goal
- 縦長モードでは `body` の縦スクロールを許可しているため、`MapCanvas` のズーム中にページ全体スクロールが漏れていた
- Canvas 上のホイールはズーム専用に固定し、`body` 側へスクロールを渡さない必要があった

### Changes
- `MapCanvas` のフレーム要素へ、`passive: false` のネイティブ `wheel` リスナーを追加して `preventDefault()` を強制した
- React 側の `handleWheel` でも `stopPropagation()` を追加した
- `MapCanvas` 外枠に `overscroll-contain` を追加した

### Files Touched
- `src/components/MapCanvas.tsx` — ネイティブ `wheel` 抑止、`stopPropagation()`、`overscroll-contain` を追加

### Behavioral Impact
- 縦長モードでも `MapCanvas` 上のホイールはズームだけが反応し、ページ全体スクロールへ漏れにくくなった
- 通常モードでの `MapCanvas` ズーム挙動はそのまま維持する

### Risk & Mitigation
- Risk: `MapCanvas` 上では通常スクロールを完全に止めるため、将来的に Canvas 内スクロールを入れる場合は調整が必要
- Mitigation: 抑止は `MapCanvas` フレーム内に限定し、ページ全体や左右ペインのスクロール制御とは分離した

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-22 18:14 (Asia/Taipei) — 通常モードの幅依存縦積みを解消**

### Summary
- 縦長専用モードと通常レイアウトの条件を揃え、通常モードでは幅だけで左右ペインが下へ落ちないようにした

### Context / Goal
- ヘッダーが残ったまま左右ペインだけ下へ落ちる途中状態は、縦長判定とは別に `lg` 未満で通常レイアウトが縦積みしていたことが原因だった
- 縦長専用モードへ入った時だけ並び替えが起きるように、条件を一本化する必要があった

### Changes
- 通常モードの `main` を、`lg:` ブレークポイント依存の縦積みではなく常時 3 カラム grid に変更した
- 通常モードの中央 `MapCanvas` カラムも、`lg:min-h-0` ではなく通常モード内で素直に伸縮する高さ設定へ見直した

### Files Touched
- `src/App.tsx` — 通常モードの 3 カラム構成を幅依存からレイアウトモード依存へ変更

### Behavioral Impact
- 通常モードでは画面幅が `lg` 未満でも、ヘッダーあり + 3 カラムのまま表示される
- 左右ペインが下へ移るのは縦長専用モードに入ったときだけになる

### Risk & Mitigation
- Risk: 横長だが幅が狭い環境では、3 カラム維持により横方向が窮屈になる可能性がある
- Mitigation: 左右ペイン幅は `minmax(220px, 264px)` に抑え、中央列を `minmax(0,1fr)` で確保した

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-22 18:01 (Asia/Taipei) — 縦長簡易レイアウト案を追加**

### Summary
- 縦長時の簡易表示案を `Doc/TallViewportCompactProposal.md` として新規追加した

### Context / Goal
- 縦長時は `MapCanvas` 優先、ヘッダー非表示、下段 2 列パネル、内部スクロールという方向性で仕様整理が必要だった
- `MapCanvas` のズームや左右ペインの単独スクロール時にページ全体スクロールが反応しない条件まで含めて設計文書化したかった

### Changes
- 縦長専用モードのゴール / 非ゴール、前提、構成、スクロール方針、段階実装を提案書へ整理した
- `Navigator` / `Workspace` の固定高さ + 単独スクロール、`MapCanvas` 最上段、ヘッダー非表示を明文化した

### Files Touched
- `Doc/TallViewportCompactProposal.md` — 縦長簡易レイアウトの実装案を新規追加

### Behavioral Impact
- 実装はまだ変えていない
- 次段階で縦長レイアウトを実装する際の基準文書が追加された

### Risk & Mitigation
- Risk: 文書だけ先行すると、実装側が別解釈になる可能性がある
- Mitigation: レイアウト優先順位、固定高さ、内部スクロール、ホイール競合抑止を DoD まで落として明文化した

### Tests / Verification
- 未実施（ドキュメント追加のみ）
**2026-04-22 18:08 (Asia/Taipei) — 縦長簡易レイアウトを実装**

### Summary
- 縦長時はヘッダーを隠し、`MapCanvas` を最上段、`Navigator / Workspace` を下段 2 列の固定高さスクロールへ切り替えるようにした

### Context / Goal
- `Doc/TallViewportCompactProposal.md` に沿って、縦長時でも `MapCanvas` を最優先で見せつつ、補助 UI は下段で圧縮表示したかった
- `MapCanvas` のズームや左右ペインの単独スクロール中にページ全体スクロールが反応しにくい構成へ寄せる必要があった

### Changes
- `App.tsx` で縦長 / 横長の 2 レイアウトへ分岐し、縦長時はヘッダー非表示、`MapCanvas` 最上段、下段 2 列レイアウトへ変更した
- 縦長時の `MapCanvas` に専用の固定高さを与え、下段パネルも `clamp()` ベースの固定高さにした
- `Navigator` と `Workspace` は `repeat(auto-fit, minmax(260px, 280px))` による細い 2 列で中央寄せし、幅不足時だけ 1 列へフォールバックするようにした
- `ShellPanel` に外側クラスを渡せるようにし、固定高さ付きでも内部 `overflow-y-auto overscroll-contain` を維持できるようにした

### Files Touched
- `src/App.tsx` — 縦長専用の並び替え、ヘッダー非表示、上段 / 下段レイアウト、固定高さクラスを追加
- `src/components/ShellPanel.tsx` — 固定高さクラスを受け取れるように拡張

### Behavioral Impact
- 横長時は従来どおりの 3 カラム固定レイアウトを維持する
- 縦長時はヘッダーが消え、`MapCanvas` が最上段、その下に `Navigator / Workspace` が細い 2 列で並ぶ
- 縦長時の `Navigator / Workspace` は固定高さの内部スクロールになる

### Risk & Mitigation
- Risk: 下段 2 列の最小幅を満たせない環境では窮屈になる可能性がある
- Mitigation: `auto-fit + minmax(260px, 280px)` を使い、幅不足時は自動で 1 列へ落ちるようにした
- Risk: ホイール競合はブラウザ差異が残る可能性がある
- Mitigation: `MapCanvas` の `preventDefault()` と `ShellPanel` 内の `overscroll-contain` をそのまま維持した

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-22 17:53 (Asia/Taipei) — 縦長時のページ全体スクロールを有効化**

### Summary
- ブラウザが縦長と判定された時点で、ページ全体スクロールを有効にした

### Context / Goal
- 縦長時のレイアウト再整理に向けて、まずは 1 ページ固定を解除し、ページ全体が自然に伸びる土台が必要だった
- レイアウト並び替え前でも、縦長時点で `body` と最上位コンテナがスクロールを受けられるようにしたかった

### Changes
- `App.tsx` に縦長ビューポート判定を追加した
- 縦長時だけ `body[data-layout-mode='tall']` を付け、`styles.css` で `overflow-y: auto` を有効化した
- 縦長時は最上位ラッパーの `h-[100dvh] overflow-hidden` を外し、`min-h-[100dvh]` ベースに切り替えた
- `main` の `overflow-y-auto` / `lg:overflow-hidden` も縦長時には外し、ページ高さへコンテンツが積み上がるようにした

### Files Touched
- `src/App.tsx` — 縦長判定と、縦長時の高さ / overflow クラス切替を追加
- `src/styles.css` — 縦長モード時の `body` 縦スクロールを許可

### Behavioral Impact
- 横長時は従来どおり 1 ページ固定レイアウトのまま動作する
- 縦長時はページ全体スクロールが有効になり、以後のレイアウト再整理を載せやすい状態になった

### Risk & Mitigation
- Risk: レイアウト自体はまだ横長前提のままなので、縦長時の並びは次段階での調整が必要
- Mitigation: 今回はスクロール条件だけに絞り、既存レイアウトへの影響を最小にした

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-22 17:33 (Asia/Taipei) — セルアイコン背景の丸を拡大**

### Summary
- セルアイコン背景の丸を、セル内に収まる範囲ぎりぎりまで大きくした

### Context / Goal
- セルアイコン用の丸が小さく、ズーム時や一覧視認時に目立ちにくかった
- セル境界からはみ出さない範囲で、背景丸の存在感を上げたかった

### Changes
- セルアイコンの半径計算を見直し、セルサイズの 46% を基準にしつつ、セル内上限で clamp するようにした
- 固定の小さい半径指定をやめ、低ズームでも大きめに見えるようにした

### Files Touched
- `src/components/MapCanvas.tsx` — セルアイコン背景円の半径計算を更新

### Behavioral Impact
- セルアイコン背景の丸がセルいっぱい近くまで広がり、識別しやすくなった
- セル外へのはみ出しは抑えたまま表示サイズだけを拡大した

### Risk & Mitigation
- Risk: 丸を大きくしすぎるとグリフ文字が窮屈に見える可能性がある
- Mitigation: 半径はセル内上限で clamp し、テキストサイズ自体は変えずにバランスを保った

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-22 17:19 (Asia/Taipei) — Floor List をコンボボックス化**

### Summary
- 左ペインの Floor List をカード一覧からコンボボックスへ置き換え、名前編集 input は維持した

### Context / Goal
- 1 ページ固定レイアウトでは階層カード一覧が縦スペースを圧迫しやすかった
- 階層選択を圧縮しつつ、選択中フロア名の編集は従来どおりすぐ行える状態を保ちたかった

### Changes
- `Floor List` セクションを `Floor Selector` に変更した
- 階層選択 UI を、階層名とグリッドサイズを表示する `select` へ置き換えた
- `Selected Floor Name` の編集 input と `Add / Duplicate / Delete` ボタン群はそのまま残した

### Files Touched
- `src/App.tsx` — Floor 選択 UI をカード一覧からコンボボックスへ更新

### Behavioral Impact
- 階層切替はコンボボックスから行う形になり、左ペインの縦使用量が減った
- フロア名の編集方法と階層操作ボタンの使い方は変わらない

### Risk & Mitigation
- Risk: 一覧カードよりは各階層の一覧性が下がる
- Mitigation: `option` に階層名と `width x height` を併記し、選択中フロア名の編集欄を直下に残した

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-22 17:12 (Asia/Taipei) — 開いたドア / 閉じたドアを分離**

### Summary
- 通常ドアを緑の開口線、閉じたドアを赤の連続線として分離し、Shortcut と編集ツールへ追加した

### Context / Goal
- 既存のドア表示だけでは「開いている通行可能なドア」と「閉じたドア」を区別できなかった
- Edge 編集と前方 Shortcut の両方から閉じたドアを扱えるようにする必要があった

### Changes
- `EdgeIconKind` と `EdgeEditIntent` に `closed-door` を追加した
- 閉じたドアは `wall + closed-door icon`、通常ドアは `open + door icon` として編集ロジックを分離した
- Canvas 描画を更新し、通常ドアを緑の開口線、閉じたドアを赤の連続線として描くようにした
- Edit Tool に `edge closed door`、Forward Edge Shortcut に `4 closed door` を追加した

### Files Touched
- `src/types/map.ts` — 閉じたドア用の型を追加
- `src/lib/persistence.ts` — 新しい編集ツール値を許可
- `src/lib/mapModel.ts` — 閉じたドアのエッジ編集ロジックを追加
- `src/components/MapCanvas.tsx` — 開いたドア / 閉じたドアの専用描画へ更新
- `src/App.tsx` — Edit Tool と前方 Shortcut UI / キーボード割当を更新

### Behavioral Impact
- 通行可能な通常ドアは緑の開口線、通行不可の閉じたドアは赤線として見分けられるようになった
- `4` キーまたは `4 closed door` ボタンから前方境界へ閉じたドアを即時配置できるようになった
- Map モードのマウス編集でも `edge closed door` を直接配置できるようになった

### Risk & Mitigation
- Risk: 既存の `door` と新規 `closed-door` の意味差が UI 上で伝わりにくい可能性がある
- Mitigation: 編集ツール名と Shortcut 文言を `open door` / `closed door` へ分け、描画色も緑 / 赤に分離した

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-22 17:03 (Asia/Taipei) — ドア表示を赤い切れ壁線へ変更**

### Summary
- ドアの境界表示を、中央に開口を持つ赤い壁線へ変更した

### Context / Goal
- 既存のドアはエッジ上の丸アイコン表示で、壁や通路との差分が一瞬で読み取りにくかった
- ドアを「境界そのものの状態」として見せ、壁線ベースで認識しやすくしたかった

### Changes
- ドアを持つエッジだけ専用描画へ切り替え、中央を抜いた赤い線分 2 本で描くようにした
- ドア付きエッジでは通常の `open` 線を描かず、青線との重なりを避けるようにした
- 既存の丸アイコン + グリフによる `door` 描画をスキップし、`secret-door` と `one-way` は従来表示のまま残した

### Files Touched
- `src/components/MapCanvas.tsx` — ドア付きエッジの専用描画を追加し、`door` の丸アイコン表示を停止

### Behavioral Impact
- ドアは「中央に穴の空いた赤い壁線」として表示されるようになった
- 通常壁、通路、ドアの境界差分が形と色の両方で判別しやすくなった

### Risk & Mitigation
- Risk: 小さいズーム時は開口が狭く見えにくくなる可能性がある
- Mitigation: 開口サイズに最小値を設け、低ズームでも切れ目が残るようにした

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-22 16:46 (Asia/Taipei) — 上 / 左グリッド拡張を追加**

### Summary
- 既存の右 / 下拡張に加えて、上 / 左へも 4 マス単位で拡張できるようにした

### Context / Goal
- グリッド拡張を右 / 下だけでなく上 / 左にも広げ、探索や編集の余白を四方向で確保したかった
- 上 / 左拡張時もプレイヤー、アイコン、境界座標の整合を崩さず扱う必要があった

### Changes
- `expandFloorGrid` を四方向対応に拡張し、上 / 左追加時は既存要素を平行移動するようにした
- プレイヤー位置、セルアイコン、エッジアイコンの座標と ID を拡張量に応じて更新するようにした
- store に `expandSelectedFloorLeft` / `expandSelectedFloorUp` を追加した
- Navigator の Grid セクションを `Expand Grid` に更新し、`+4 Left` / `+4 Up` ボタンを追加した

### Files Touched
- `src/lib/mapModel.ts` — 四方向拡張と、上 / 左拡張時の座標シフト処理を追加
- `src/store/appStore.ts` — 上 / 左拡張 action を追加
- `src/App.tsx` — Grid 拡張 UI を 4 方向ボタンに更新

### Behavioral Impact
- 選択中フロアを上 / 左 / 右 / 下の 4 方向へ 4 マスずつ拡張できるようになった
- 上 / 左拡張後もプレイヤー位置と配置済みアイコンが見た目の位置を維持したまま新座標系へ移る

### Risk & Mitigation
- Risk: 上 / 左拡張では既存座標がずれるため、関連オブジェクトのシフト漏れがあると保存データ不整合になりやすい
- Mitigation: `expandFloorGrid` 内でプレイヤー、セルアイコン、エッジアイコンを一括で更新し、ID も同時に再生成した

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-22 16:41 (Asia/Taipei) — Zoom 25% が実描画へ反映されない問題を修正**

### Summary
- Zoom 表示だけ変わり、実際のマップが 50% 未満へ縮まらない問題を修正した

### Context / Goal
- `MIN_ZOOM` を 25% に下げても、実際の描画サイズは 50% 未満でほぼ変化しなかった
- 原因は `MapCanvas` 側のセルサイズ計算に別の下限があり、表示値と実描画倍率が一致していなかったため

### Changes
- `calculateCellSize()` の最終セルサイズ計算から整数丸めと `14px` 下限を外し、より小さく連続的に縮小できるようにした
- セルサイズ下限を `MIN_CELL_SIZE = 4` に変更し、25% 付近まで実際に縮小できるようにした
- 既存コメントを追加し、zoom 表示と実描画倍率を一致させる意図を明記した

### Files Touched
- `src/components/MapCanvas.tsx` — セルサイズ計算を連続値ベースへ変更し、下限を引き下げた

### Behavioral Impact
- Zoom 25% まで実際にマップ表示が縮小されるようになった
- これまで 50% 未満で止まっていた見た目の頭打ちが解消された

### Risk & Mitigation
- Risk: 非常に小さい zoom ではセル線やアイコンが見づらくなる
- Mitigation: 最小セルサイズ `4px` は維持し、完全に潰れない最低限の視認性を残した

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- `C:\3rd\nodejs\npm.cmd run dev -- --host 127.0.0.1 --port 4173`
- Playwright で `Zoom -` を複数回実行し、表示が `25%` まで下がることを確認
- 同確認時に、実際のマップ見た目も縮小されていることを確認
**2026-04-22 16:36 (Asia/Taipei) — Zoom 下限を 25% に変更**

### Summary
- ズーム下限を 50% から 25% に変更した

### Context / Goal
- より大きく引いた表示で全体を確認できるように、ズーム下限を 25% まで下げる必要があった
- 描画側と store 側の clamp を揃えて変更する

### Changes
- `MapCanvas` 側の `MIN_ZOOM` を `0.25` に変更した
- `sanitizeViewport` 側の zoom 下限 clamp を `0.25` に変更した

### Files Touched
- `src/components/MapCanvas.tsx` — ホイールズーム下限を 25% に変更
- `src/store/appStore.ts` — viewport 保存 / 復元時の zoom 下限を 25% に変更

### Behavioral Impact
- ズームアウトの下限が 25% まで広がった
- 保存済み viewport や UI ボタン経由の zoom 値も 25% 未満にはならない

### Risk & Mitigation
- Risk: かなり小さく引いた表示では、セルやアイコンが視認しづらくなる
- Mitigation: これは閲覧自由度を優先した変更で、必要なら Zoom + やホイールで即時に戻せる

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-22 16:34 (Asia/Taipei) — Floor Workspace と MapCanvas の二重線を解消**

### Summary
- `Floor Workspace` と `MapCanvas` の間に見えていた二重線と隙間を解消した

### Context / Goal
- 中央セクションのヘッダー下に 2 本の線が見え、その間にわずかなスペースが残っていた
- 境界線を 1 本だけにし、ヘッダー直下からそのまま Canvas が始まる見え方にする必要があった

### Changes
- 中央セクション内の Canvas ラッパー padding を `p-0` に変更した
- `MapCanvas` 外枠の上 border を削除し、左右と下の border のみを維持した

### Files Touched
- `src/App.tsx` — 中央の Canvas ラッパー余白を削除
- `src/components/MapCanvas.tsx` — `MapCanvas` の上 border を削除

### Behavioral Impact
- `Floor Workspace` ヘッダー下の境界が 1 本だけになった
- `MapCanvas` とヘッダーの間の不要な隙間がなくなった

### Risk & Mitigation
- Risk: 上 border を削ることで、中央セクションの囲いが弱く見える可能性がある
- Mitigation: ヘッダー側の `border-b` は維持し、左右と下の枠線も残した

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-22 16:30 (Asia/Taipei) — MapCanvas 内余白を削除**

### Summary
- `MapCanvas` 全体とマップ表示の間にあった内部余白を削除した

### Context / Goal
- `MapCanvas` の外枠と実際のマップ描画の間に余白があり、表示面積を無駄にしていた
- マップ自体を外枠いっぱいまで使って表示したい

### Changes
- `MapCanvas` の描画計算で使う `GRID_PADDING` と `GRID_TOP_PADDING` を `0` に変更した

### Files Touched
- `src/components/MapCanvas.tsx` — マップ描画の内部余白定数を削除

### Behavioral Impact
- マップ表示が `MapCanvas` の外枠により近い位置まで広がるようになった
- ズームやパンの仕様自体は変わらない

### Risk & Mitigation
- Risk: 外周の線やプレイヤー位置によっては、端の見え方が以前より詰まって見える
- Mitigation: 今回は余白定数だけを変更し、必要なら後続で最小限の片側余白だけ戻せる形を維持した

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-22 16:27 (Asia/Taipei) — Floor Workspace と Canvas Status の高さを縮小**

### Summary
- 中央カラム上部と下部の占有高さをさらに詰めた

### Context / Goal
- `Floor Workspace` ヘッダーと `Canvas Status` バーがまだ少し高く、Canvas の実表示面積を圧迫していた
- 情報は残したまま、上下の固定占有をさらに減らす必要があった

### Changes
- `Floor Workspace` ヘッダーの `gap` と上下 padding を縮小した
- `Floor Workspace` 見出しの行間を詰め、寸法表示ボックスの上下 padding を縮小した
- `Canvas Status` の上下 padding と説明文の上余白を縮小した

### Files Touched
- `src/App.tsx` — `Floor Workspace` ヘッダーの高さを縮小
- `src/components/MapCanvas.tsx` — `Canvas Status` バーの高さを縮小

### Behavioral Impact
- 操作仕様は変わらず、中央の Canvas がわずかに高く使えるようになった
- `Floor Workspace` と `Canvas Status` の表示は維持したまま、上下の固定占有が減った

### Risk & Mitigation
- Risk: 高さを詰めすぎるとヘッダーとステータスの情報が窮屈に見える
- Mitigation: テキストサイズは維持し、余白のみを段階的に削減した

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-22 16:20 (Asia/Taipei) — 左右ペイン幅を縮小**

### Summary
- `Navigator` と `Workspace` の固定幅をさらに詰めた

### Context / Goal
- 中央の `MapCanvas` 領域を広げるため、左右ペインの占有幅をさらに削りたかった
- 変更対象は 3 カラム grid の列幅だけに限定し、影響を小さく抑える

### Changes
- `lg` 時の左右ペイン幅を `300px` から `264px` へ変更した
- `xl` 時の左右ペイン幅を `320px` から `280px` へ変更した

### Files Touched
- `src/App.tsx` — 3 カラム grid の左右列幅を縮小

### Behavioral Impact
- 左 `Navigator` と右 `Workspace` が以前より細くなり、中央のマップ表示領域が広がった
- 操作仕様やスクロール構造は変わらない

### Risk & Mitigation
- Risk: 左右ペインが狭くなりすぎると、長いラベルや説明文が折り返しやすくなる
- Mitigation: 今回は列幅のみを段階的に縮小し、必要なら後続で文言圧縮や非表示整理へ進める

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-22 15:49 (Asia/Taipei) — 1 ページ固定レイアウト実装案を追加**

### Summary
- ヘッダー圧縮と 1 ページ固定レイアウト化の実装案を `Doc` に追加した

### Context / Goal
- 全体スクロールをやめて、左右ペイン独立スクロールと中央 Canvas 優先のレイアウトへ変更する方針整理が必要だった
- 実装前に、ゴール、非ゴール、影響範囲、段階的な変更手順を明文化する

### Changes
- デスクトップ向け 1 画面固定レイアウト案を文書化した
- ヘッダー圧縮、左右ペイン `overflow-y-auto`、中央 Canvas の残り高優先、狭幅フォールバック方針を整理した

### Files Touched
- `Doc/OnePageLayoutProposal.md` — 1 ページ固定レイアウトの実装案を新規追加

### Behavioral Impact
- アプリ挙動自体は未変更
- 次の実装作業で採るレイアウト変更方針が `Doc` から参照できるようになった

### Risk & Mitigation
- Risk: 提案だけ先行し、実装時に狭幅フォールバックの扱いが曖昧になる
- Mitigation: 文書内でデスクトップ優先と狭幅フォールバックを非ゴール / 前提として明記した

### Tests / Verification
- 未実施
- 理由: 今回はドキュメント追加のみで、コード変更は行っていない
**2026-04-22 16:09 (Asia/Taipei) — フラット化 UI 実装**

### Summary
- ボタン以外の重いカード装飾を削減し、線ベースの軽い UI へ寄せた

### Context / Goal
- `Doc/FlatChromeProposal.md` に沿って、1 ページ固定レイアウトを圧迫していたカード表現を減らす必要があった
- ボタンや入力の操作性は維持しつつ、ヘッダー、ペイン、情報行、通知を軽量化する

### Changes
- ヘッダーの補助バッジとカード感を弱め、状態表示も箱より行に近い見え方へ変更した
- `ShellPanel` の背景面、角丸、影を削り、区切り線ベースの軽い外枠へ変更した
- `KeyValueRow` を箱型の情報カードから、`border-b` ベースの情報行へ変更した
- `NoticeCard` を大きな面付き通知から左ボーダー主体の軽量通知へ変更した
- 中央 Canvas セクションと Canvas 下部ステータスも、丸角カードから線主体の補助表示へ寄せた
- 保存キー表示ボックスや中央ヘッダー内の寸法表示ボックスを簡素化した

### Files Touched
- `src/App.tsx` — ヘッダー、中央セクション、情報行、通知、補助表示のカード感を削減
- `src/components/ShellPanel.tsx` — 左右ペインの外枠をフラット化
- `src/components/MapCanvas.tsx` — Canvas 下部ステータスバーを線主体の表示へ変更

### Behavioral Impact
- アプリの操作仕様は変わらず、見た目だけが軽量化された
- 同じ 1 ページ固定でも、左右ペインと中央の有効スペースが以前より広く見えるようになった
- 非操作要素の主張が下がり、ボタンや入力へ視線が集まりやすくなった

### Risk & Mitigation
- Risk: フラット化で区切りが弱くなり、情報のまとまりが見えにくくなる
- Mitigation: 各セクション見出しは維持し、情報行には `border-b`、通知には左ボーダーを残した
- Risk: 中央 Canvas 周辺の囲いを落としすぎると作業領域の境界が曖昧になる
- Mitigation: Canvas 本体の境界線と上部操作バーの区切りは維持した

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- `C:\3rd\nodejs\npm.cmd run dev -- --host 127.0.0.1 --port 4173`
- Playwright でヘッダー、左右ペイン、情報行、Canvas 下部表示のフラット化を確認
- Console の既知エラーが `favicon.ico` 404 のみであることを確認
**2026-04-22 16:18 (Asia/Taipei) — 中央カラム余白を追加調整**

### Summary
- `MapCanvas` 周辺の余白をさらに詰め、中央作業領域の密度を上げた

### Context / Goal
- `MapCanvas` と他ブロックの間、`Floor Workspace` と Canvas 本体の間、`Canvas Status` の内側余白がまだ大きかった
- 境界線は残しつつ、中央カラムの占有効率を上げる必要があった

### Changes
- 本文 3 カラムの `gap` を `3` 相当から `2` 相当へ縮小した
- 中央セクション内の Canvas ラッパー余白を `p-3` 相当から `p-1` へ縮小した
- `Canvas Status` バーの内側余白と行間を詰めた

### Files Touched
- `src/App.tsx` — 中央カラム周辺の `gap` と Canvas ラッパー余白を縮小
- `src/components/MapCanvas.tsx` — `Canvas Status` の内側余白と行間を縮小

### Behavioral Impact
- 操作仕様は変わらず、中央のマップ表示に使える面積が少し増えた
- `Floor Workspace`、Canvas 本体、`Canvas Status` の間隔がよりタイトになった

### Risk & Mitigation
- Risk: 余白を詰めすぎると、ヘッダー、描画面、ステータスバーの境界が曖昧になる
- Mitigation: 各要素の境界線は維持し、余白のみを段階的に縮小した

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-22 15:58 (Asia/Taipei) — 1 ページ固定レイアウト実装**

### Summary
- ページ全体スクロールを止め、左右独立スクロールと中央 Canvas 優先の 1 ページレイアウトへ変更した

### Context / Goal
- `Doc/OnePageLayoutProposal.md` に沿って、ヘッダー圧縮と 3 カラム固定レイアウトを実装する必要があった
- 左 `Navigator`、右 `Workspace` は個別スクロール、中央 `Map Canvas` は常時表示のままホイールズームを維持する

### Changes
- ルートを `100dvh` 基準へ変更し、`body` のページ全体スクロールを無効化した
- ヘッダーを 1 段のコンパクトな構成へ詰め、カード装飾と縦余白を削減した
- 本文を `min-h-0` 前提の 3 カラム構成へ整理し、中央 Canvas が残り高を優先的に使うよう変更した
- `ShellPanel` に独立スクロール責務を持たせ、左右ペイン内部のみ `overflow-y-auto` と `overscroll-contain` を有効化した
- 狭幅では `main` だけを縦スクロールするフォールバックを残しつつ、デスクトップでは全体 1 ページ固定になるようにした

### Files Touched
- `src/App.tsx` — ヘッダー圧縮、1 ページ固定レイアウト、中央 Canvas 領域の高さ制御へ変更
- `src/components/ShellPanel.tsx` — 左右ペインの独立スクロールと高さ制御を追加
- `src/styles.css` — `html/body/#root` の高さ固定と `body` の `overflow: hidden` を追加

### Behavioral Impact
- デスクトップ幅ではブラウザ全体の縦スクロールが発生しなくなった
- 左右ペインはホイール時にそれぞれ独立してスクロールし、中央 Canvas は常時画面内に残る
- ヘッダーの占有が減り、初期表示からマップ作業領域が見えやすくなった

### Risk & Mitigation
- Risk: 高さ固定に伴い、狭幅画面で全要素を同じ方法で表示すると窮屈になる
- Mitigation: `main` は狭幅時のみ内部縦スクロールへフォールバックし、デスクトップ優先の固定レイアウトと両立させた
- Risk: 独立スクロール化で親コンテナの `min-h-0` が不足すると高さ計算が破綻する
- Mitigation: ルート、本文、中央セクション、左右ペインに `min-h-0` / `overflow-hidden` を明示した

### Tests / Verification
- `C:\3rd\nodejs\npm.cmd run build`
- `C:\3rd\nodejs\npm.cmd run dev -- --host 127.0.0.1 --port 4173`
- Playwright でレイアウト表示を確認
- Playwright `eval` で `bodyScrollHeight === innerHeight` および `bodyOverflow === hidden` を確認
- Playwright `eval` で左右 `aside` のスクロール領域が `overflowY: auto` かつ `scrollHeight > clientHeight` であることを確認
- Console の既知エラーが `favicon.ico` 404 のみであることを確認
**2026-04-22 16:05 (Asia/Taipei) — フラット化実装案を追加**

### Summary
- ボタン以外のカード装飾を削減する実装案を `Doc` に追加した

### Context / Goal
- 1 ページ固定レイアウトで、カード装飾が占有するスペースと視線コストを下げる必要があった
- 実装前に、削る対象、残す対象、段階的な変更順を整理する

### Changes
- ヘッダー、ペイン、情報行、通知をフラット化する実装方針を文書化した
- 「面から線へ置き換える」方針、優先順位、影響範囲、リスクを整理した

### Files Touched
- `Doc/FlatChromeProposal.md` — ボタン以外のカードデザイン削減に関する実装案を新規追加

### Behavioral Impact
- アプリ挙動自体は未変更
- 次の UI 微調整で採る装飾削減方針が `Doc` から参照できるようになった

### Risk & Mitigation
- Risk: 実装前提が曖昧なままフラット化を進めると、区切りまで消して可読性を落としやすい
- Mitigation: 文書内で「残すもの」と「削るもの」を分け、段階実装の順番を明記した

### Tests / Verification
- 未実施
- 理由: 今回はドキュメント追加のみで、コード変更は行っていない
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
