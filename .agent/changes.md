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
**2026-04-23 15:28 (Asia/Taipei) — Tauri global Arrow shortcut 検証実装**

### Summary
- Tauri 実行時だけ Arrow の global shortcut を ON/OFF できる検証機能を追加した

### Context / Goal
- 非フォーカス時でもゲーム操作に合わせて自動マッピングを進められるかを、まずは安全な Arrow 限定で検証したかった
- 常時監視ではなく、Tauri 実行時のみ明示トグルで有効化できる最小構成に留めた

### Changes
- Tauri に global shortcut plugin を追加し、ArrowUp / ArrowDown / ArrowLeft / ArrowRight を登録できるようにした
- Navigator に `Global Arrow Test` セクションを追加し、Tauri 実行時だけ capture の ON/OFF と状態確認ができるようにした
- global shortcut 発火時は現在の向きを基準に前進 / 左旋回 / 右旋回 / 後方転回へ変換する処理を追加した
- ローカルフォーカス時の Arrow キー入力と二重反応しないよう、global capture 有効中は既存の Arrow キー処理を抑制した

### Files Touched
- `package.json` — `@tauri-apps/plugin-global-shortcut` を追加し、依存関係を更新した
- `package-lock.json` — 新しい npm 依存のロック情報を反映した
- `src/App.tsx` — Tauri 判定、global shortcut トグル、状態表示、Arrow 入力の二重反応抑止を追加した
- `src-tauri/Cargo.toml` — Rust 側に `tauri-plugin-global-shortcut` を追加した
- `src-tauri/Cargo.lock` — Cargo 依存のロック情報を更新した
- `src-tauri/src/lib.rs` — Tauri Builder に global shortcut plugin を登録した
- `src-tauri/capabilities/default.json` — global shortcut の register / unregister / isRegistered 権限を追加した

### Behavioral Impact
- Tauri アプリ実行中は、`Global Arrow Test` のトグルを ON にすると非フォーカス時の Arrow 入力で移動 / 向き変更を試せるようになった
- Web 実行時はこの機能は無効で、従来どおりフォーカス中のローカルキーボード入力だけが動作する
- Arrow キーが他アプリや OS に確保されている環境では登録失敗となり、状態表示が `register failed` になる

### Risk & Mitigation
- Risk: Arrow 単体の global shortcut は他アプリ操作と衝突しやすく、環境によっては登録できない
- Mitigation: 明示トグル式にし、常時有効化せず状態表示で失敗を見える化した
- Risk: global shortcut 有効中にローカル Arrow 入力も通すと二重動作になる
- Mitigation: Tauri capture 有効時は既存の `window` キーハンドラで Arrow キーを早期 return するようにした

### Tests / Verification
- `npm run build`
- `cargo build --manifest-path .\src-tauri\Cargo.toml`
- `npm run tauri build`
- Web と Tauri のビルド成功を確認。非フォーカス時の Arrow 実機入力確認は未実施
**2026-04-23 15:36 (Asia/Taipei) — ボタンのアイコン化提案追加**

### Summary
- 現状ボタンの棚卸しとアイコン化優先順位を `Doc/ButtonIconProposal.md` に整理した

### Context / Goal
- 各パネルのボタンが UI 面積を圧迫しているため、どの操作を先にアイコン化するかの判断基準が必要だった
- 危険操作や意味が曖昧な操作まで一律にアイコン化しない方針を先に文書化したかった

### Changes
- 現在の主要ボタン群を用途別に整理した
- 頻用操作、危険操作、状態切替でアイコン化の優先度を分けた
- `IconButton` / `TextIconButton` を軸にした段階的な実装手順をまとめた

### Files Touched
- `Doc/ButtonIconProposal.md` — ボタンの棚卸し、アイコン化の対象分類、実装手順、リスクを整理した

### Behavioral Impact
- ドキュメント追加のみで、現行アプリの挙動変更はない

### Risk & Mitigation
- Risk: 実装前の提案書だけでは、実際の画面バランスと差が出る可能性がある
- Mitigation: 頻用ボタンから段階実装し、危険操作は text 併用を維持する前提にした

### Tests / Verification
- 未実施
- 文書追加のみのため、現時点ではコードビルドや実機確認は行っていない
**2026-04-23 15:43 (Asia/Taipei) — ボタンのSVGアイコン化実装**

### Summary
- `Doc/ButtonIconProposal.md` に沿って頻用ボタンを SVG ベースのアイコンボタンへ置き換えた

### Context / Goal
- `MapCanvas`、`Workspace`、`Navigator` の頻用ボタンがテキスト中心で、横幅と高さを圧迫していた
- 危険操作や保存系はテキストを残しつつ、意味が固定された操作だけを先にアイコン化したかった

### Changes
- `MapCanvas` 上部の `Undo / Redo / Zoom - / Zoom + / Reset View` を SVG アイコンボタンへ変更した
- `Workspace` の `Undo / Redo` と `Viewport` のパン / リセット / ズーム操作を SVG アイコンボタンへ変更した
- `Navigator` の `Expand Grid` と `Movement` を SVG アイコン主体の操作系へ変更した
- アイコンのみボタンに `title` と `aria-label` を付け、tooltip と支援技術の両方で操作名が分かるようにした

### Files Touched
- `src/App.tsx` — `IconButton` と各種 SVG アイコンを追加し、頻用ボタン群の見た目と配置をアイコン主体へ変更した

### Behavioral Impact
- 頻用操作ボタンの占有面積が減り、`MapCanvas` 周辺と各パネル内の密度が上がった
- `Add / Duplicate / Delete`、`Save JSON / Load JSON`、モードやツール選択などは従来どおりテキストを維持している
- 操作内容自体は変わらず、ボタン表示だけがアイコン中心になった

### Risk & Mitigation
- Risk: アイコンだけでは初見で意味が伝わりにくい
- Mitigation: `title` と `aria-label` を必須にし、hover と支援技術の両方でラベルを露出するようにした
- Risk: 危険操作までアイコン化すると誤操作しやすくなる
- Mitigation: `Delete`、`Save JSON`、`Load JSON` は今回もテキストのまま残した

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-23 15:48 (Asia/Taipei) — Movementアイコンの単純化**

### Summary
- `Movement` の回転系アイコンを単純な矢印へ変え、中央の向き表示を `N / E / S / W` の1文字化に変更した

### Context / Goal
- `Movement` の現行アイコンは回転記号寄りで、方向操作として一目で理解しにくかった
- 中央表示の `Facing` 文字も面積を消費していたため、向きだけを簡潔に見せたかった

### Changes
- 左右の方向変更アイコンを回転矢印から単純な左右矢印へ変更した
- 後方転回アイコンを Uターン風記号から下矢印へ変更した
- 中央の向き表示から `Facing` 文言を削除し、`N / E / S / W` の1文字だけを表示するようにした
- 向き表示用に `Facing` から1文字へ変換するヘルパーを追加した

### Files Touched
- `src/App.tsx` — `MovementPad` のアイコン構成と中央表示を更新し、不要になった回転系 SVG を削除した

### Behavioral Impact
- `Movement` セクションの見た目が上下左右の素直な矢印へ統一され、方向把握がしやすくなった
- 操作内容そのものは変わらず、表示だけが簡潔になった

### Risk & Mitigation
- Risk: `turn left / right / back` が移動矢印に見えて、回転操作だと誤解される可能性がある
- Mitigation: 配置は従来どおり維持し、ボタンの `title` / `aria-label` で操作名は残した

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-23 15:49 (Asia/Taipei) — Movementボタンサイズ統一**

### Summary
- `Movement` の上下左右ボタンと中央の向き表示を同じ外形サイズへ揃えた

### Context / Goal
- `Movement` セクションで上下ボタンだけ小さく見え、視覚的なまとまりが崩れていた
- 4方向ボタンと中央表示を同一サイズにして、方向パッドとして一体に見せたかった

### Changes
- `IconButton` に正方形サイズ指定を追加した
- `Movement` の前進、左右、後方ボタンを同じ正方形サイズへ統一した
- 中央の `N / E / S / W` 表示も同じサイズの枠へ揃えた

### Files Touched
- `src/App.tsx` — `IconButton` のサイズバリエーションを追加し、`MovementPad` の各要素を同一サイズへ変更した

### Behavioral Impact
- `Movement` セクションの方向ボタンが均一サイズになり、見た目のバランスが整った
- 操作内容やキーバインドの挙動自体は変わっていない

### Risk & Mitigation
- Risk: 正方形サイズの導入で他のアイコンボタンにも流用され、意図しないサイズ差が出る可能性がある
- Mitigation: `square` は `Movement` でだけ使う明示指定に留め、既存サイズには影響しない形にした

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-23 15:50 (Asia/Taipei) — Movementサイズの再調整**

### Summary
- `Movement` の正方形ボタンを小型化し、パネル内で収まるサイズへ再調整した

### Context / Goal
- 前回の正方形サイズ統一では、`Movement` の各ボタンが大きすぎてパネル内で窮屈になっていた
- 同じ外形サイズは維持しつつ、占有を下げてレイアウト破綻を避けたかった

### Changes
- `IconButton` の `square` サイズを小さくした
- 中央の `N / E / S / W` 表示枠も同じ縮小サイズへ合わせた

### Files Touched
- `src/App.tsx` — `Movement` 用の正方形サイズ定義と中央表示の寸法を縮小した

### Behavioral Impact
- `Movement` セクションの上下左右ボタンと中央表示は同サイズのまま、全体の占有だけが減った
- 操作内容やキーバインドの挙動は変わっていない

### Risk & Mitigation
- Risk: 小さくしすぎると押しにくくなる可能性がある
- Mitigation: 等サイズは維持したまま一段だけ縮小し、最低限の視認性と押下領域を残した

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-23 15:53 (Asia/Taipei) — Movement中心線の整列修正**

### Summary
- `Movement` を単一の 3x3 grid に統一し、中央の向き表示と上下ボタンの中心線ズレを解消した

### Context / Goal
- `Movement` では中央表示だけが左右ボタン用の grid に置かれ、上下ボタンは別の `flex` 行に置かれていたため、視覚上の中心線が揃っていなかった
- すべてを同じレイアウト基準に載せて、方向パッドとして一体に見せたかった

### Changes
- `MovementPad` を 3x3 の単一 grid 構成へ変更した
- 上下ボタン、左右ボタン、中央の `N / E / S / W` 表示を同じ grid セル基準で配置するようにした

### Files Touched
- `src/App.tsx` — `MovementPad` のレイアウトを `flex + grid` の混在構成から単一 grid 構成へ変更した

### Behavioral Impact
- `Movement` セクションの中央表示と上下左右ボタンの中心線が揃い、方向パッド全体の見た目が安定した
- ボタン動作やキーバインドの挙動は変わっていない

### Risk & Mitigation
- Risk: grid 再配置でパネル内の縦横間隔が想定より詰まる可能性がある
- Mitigation: 既存の `gap-2` は維持し、配置基準だけを統一した

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-23 16:02 (Asia/Taipei) — Floor操作のSVGアイコン化**

### Summary
- `Doc/svg-icon.md` を参照し、`Add / Duplicate / Delete` を SVG アイコンボタンへ変更した

### Context / Goal
- Floor 操作の 3 ボタンをテキストよりも省スペースな表現へ寄せたかった
- 既存のアイコン化方針に合わせつつ、削除だけは危険色を維持したかった

### Changes
- `Add` を新規追加用のファイル + アイコンへ変更した
- `Duplicate` を複製アイコンへ変更した
- `Delete` をゴミ箱アイコンへ変更し、危険操作の赤系トーンを維持した
- `Doc/svg-icon.md` の線構成をアプリ内 SVG コンポーネントとして追加した

### Files Touched
- `src/App.tsx` — Floor 操作ボタンを `IconButton` へ置き換え、追加・複製・削除の SVG アイコンを追加した

### Behavioral Impact
- `Add / Duplicate / Delete` は操作内容を変えず、表示だけが SVG アイコン主体になった
- 削除ボタンは従来どおり危険色で見分けられる

### Risk & Mitigation
- Risk: アイコンだけだと初見で意味が伝わりにくい
- Mitigation: `IconButton` の `title` と `aria-label` により、hover と支援技術で操作名を露出する

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-23 16:06 (Asia/Taipei) — UI説明文整理案の追加**

### Summary
- 常時表示の説明文を削減するための整理案を `Doc/UiDescriptionTrimProposal.md` に追加した

### Context / Goal
- 現在の UI はセクション本文が多く、縦方向の占有を圧迫している
- どの説明を削除、短文化、別ヘルプへ移すべきかを先に整理したかった

### Changes
- 説明文を `削除してよい / 短文化すべき / 別導線へ移すべき` の3分類で整理した
- `PanelHeading.body` を optional にする前提で、実装ステップを段階化した
- ショートカット説明を `Shortcuts / Help` へ集約する方針を明記した

### Files Touched
- `Doc/UiDescriptionTrimProposal.md` — UI 説明文の整理方針、分類、実装手順、リスクをまとめた

### Behavioral Impact
- ドキュメント追加のみで、現行アプリの挙動変更はない

### Risk & Mitigation
- Risk: 実装時に説明を削りすぎると初見導線が弱くなる
- Mitigation: 本提案ではショートカット系を別ヘルプへ残す前提で分類した

### Tests / Verification
- 未実施
- 文書追加のみのため、現時点ではコードビルドや実機確認は行っていない
**2026-04-23 16:09 (Asia/Taipei) — UI説明文の削減実装**

### Summary
- `Doc/UiDescriptionTrimProposal.md` に沿って、常時表示の説明文を削減し必要なヒントだけ短文化した

### Context / Goal
- パネル内の説明文が縦方向のスペースを圧迫していた
- 日常操作で不要な本文を削除し、ショートカットや特殊条件だけを短い表記で残したかった

### Changes
- `PanelHeading.body` と `ShellPanel.description` を optional にして、説明なしの見出しを許容した
- `Navigator` と `Workspace` の多くのセクション本文を削除した
- `Movement`、`Forward Edge`、`Global Arrow Test`、`Save / Load`、`Zoom / Pan`、`Cell Icons` は短いヒントだけ残した
- `Save / Load` の autosave 詳細行を削除し、保存先ラベルだけを残した
- `MapCanvas` 下部の長文 `Canvas Status` を削除し、モードとズーム率だけのコンパクト表示にした

### Files Touched
- `src/App.tsx` — 各 `PanelHeading` の説明文を削除または短文化し、autosave 詳細行を削除した
- `src/components/ShellPanel.tsx` — パネル説明文を optional にして、未指定時は非表示にした
- `src/components/MapCanvas.tsx` — 下部ステータスの長文説明を削除し、モードとズーム率だけ表示するようにした

### Behavioral Impact
- UI の情報量が減り、各パネルの縦方向の占有が小さくなった
- 機能、キーバインド、保存形式、操作挙動は変わっていない
- ショートカット系の最低限の再確認情報は短文として残している

### Risk & Mitigation
- Risk: 初見ユーザーには説明不足に見える可能性がある
- Mitigation: 完全削除せず、特殊操作やショートカットは短いヒントとして残した
- Risk: `ShellPanel.description` optional 化で説明を渡し忘れても気づきにくくなる
- Mitigation: 今回は意図的に省略する用途として導入し、タイトルとセクション構造は維持した

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-23 16:51 (Asia/Taipei) — タイトル入力スペース保持修正**

### Summary
- `Title` 入力中にスペースが即時削除されないよう、タイトル正規化処理を修正した

### Context / Goal
- `Title` 入力で単語間スペースを入力しても、store 側の `trim()` により即座に消えていた
- 空白だけのタイトルは既定名へ戻しつつ、通常のタイトル文字列内スペースは保持したかった

### Changes
- `sanitizeDocumentTitle()` で保存値そのものに `trim()` を適用しないようにした
- 空判定だけ `title.trim().length` を使い、値は元の `title` を保持するようにした
- 入力中のスペース保持理由をコメントとして明記した

### Files Touched
- `src/store/appStore.ts` — タイトル正規化処理を変更し、入力中のスペースを保持するようにした

### Behavioral Impact
- `Title` に単語間スペースや末尾スペースを入力できるようになった
- 空文字または空白のみのタイトルは従来どおり `Untitled Map` に戻る

### Risk & Mitigation
- Risk: 末尾スペースも保存されるため、意図しない空白がタイトルに残る可能性がある
- Mitigation: 入力中の編集性を優先し、空白のみの場合だけ既定名へ戻すガードを維持した

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-23 17:01 (Asia/Taipei) — MapCanvasヘッダーへの操作トグル集約**

### Summary
- `Map / Explore` と `Global Arrow` の切り替えを `MapCanvas` ヘッダーへ移動し、左右ペインから削除した

### Context / Goal
- `Map / Explore` と `Global Arrow` はマップ操作の現在状態に直結しており、左右ペインより中央の `MapCanvas` 近くに置く方が自然だった
- 左右ペインの縦スペースを減らしつつ、操作状態をマップ上部で確認・切替できるようにしたかった

### Changes
- `MapCanvas` ヘッダーへ `Explore / Map` の小型セグメントトグルを追加した
- `MapCanvas` ヘッダーへ `Arrow on / Arrow off` の小型トグルを追加した
- `Navigator` の `Global Arrow Test` セクションを削除した
- `Workspace` の `Explore / Map` セクションを削除した
- 小型ヘッダートグル用に `CompactToggleButton` を追加した
- global capture 有効中のローカル Arrow 抑制が最新 state を参照するよう、キーボード effect の依存を補正した

### Files Touched
- `src/App.tsx` — `MapCanvas` ヘッダーへ操作トグルを集約し、左右ペインの重複セクションを削除した

### Behavioral Impact
- `Map / Explore` と `Global Arrow` の切り替え位置が `MapCanvas` 上部に変わった
- 左右ペインから該当セクションがなくなり、縦方向の占有が減った
- 操作内容、保存形式、global shortcut の登録仕様は変わっていない

### Risk & Mitigation
- Risk: `MapCanvas` ヘッダーに操作が集まりすぎて横幅が窮屈になる可能性がある
- Mitigation: 既存 toolbar より小さい `CompactToggleButton` を使い、折り返し可能な `flex-wrap` 内に配置した
- Risk: `Global Arrow` が Tauri 限定であることが見えづらくなる
- Mitigation: Web 実行時は disabled にし、`title` で Tauri 限定であることを表示するようにした

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-23 17:06 (Asia/Taipei) — GitHub Pagesデプロイ提案追加**

### Summary
- push をトリガーに Web 版を GitHub Pages へデプロイする実装案を追加した

### Context / Goal
- Vite + React の Web 版を GitHub Pages で自動公開できるようにしたい
- Tauri 配布とは分け、`dist/` の Pages deploy だけを対象にする方針を整理したかった

### Changes
- GitHub Actions workflow の構成案を整理した
- GitHub Actions 実行時だけ Vite `base` を `/Web-Auto-Mapping/` に切り替える方針を明記した
- 必要 permissions、Pages artifact、deploy 手順、GitHub 側 Pages source 設定をまとめた

### Files Touched
- `Doc/GitHubPagesDeployProposal.md` — GitHub Pages デプロイの実装方針、手順、リスク、完了条件を追加した

### Behavioral Impact
- ドキュメント追加のみで、現行アプリの挙動変更はない

### Risk & Mitigation
- Risk: 実装時に Pages URL と Vite base がずれると asset が 404 になる
- Mitigation: リポジトリ名 `Web-Auto-Mapping` 前提で `/Web-Auto-Mapping/` を使う方針を明記した

### Tests / Verification
- 未実施
- 文書追加のみのため、コードビルドや GitHub Actions 実行は行っていない
**2026-04-23 17:24 (Asia/Taipei) — Expand Gridボタン表示統一**

### Summary
- `Expand Grid` の矢印と数字を専用ボタン内の grid レイアウトで揃えた

### Context / Goal
- 既存の `IconButton` badge 表示では、矢印と数字の位置関係が分離して見え、4方向で統一感が弱かった
- `+4 direction` は1つの操作意味なので、数字を badge ではなくボタン内容として扱いたかった

### Changes
- `ExpandGridButton` を追加した
- `Expand Grid` の4方向ボタンを `IconButton` から `ExpandGridButton` へ変更した
- ボタン内部を `grid-cols-[1fr_1.75rem]` にして、矢印領域と数値領域を固定配置にした

### Files Touched
- `src/App.tsx` — `ExpandGridButton` を追加し、`Expand Grid` の4ボタンを専用レイアウトへ差し替えた

### Behavioral Impact
- `Expand Grid` の矢印と `4` の表示位置が揃い、4方向の見た目が統一された
- グリッド拡張の動作自体は変わっていない

### Risk & Mitigation
- Risk: 専用ボタンが増えて汎用 `IconButton` との見た目差が出る可能性がある
- Mitigation: 色、border、hover の基本クラスは既存ボタンに合わせ、内部レイアウトだけ専用化した

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-23 17:25 (Asia/Taipei) — Expand Grid数値表示の簡素化**

### Summary
- `Expand Grid` の `4` を丸 badge 表示から `+4` のインライン表示へ変更した

### Context / Goal
- 数字が丸ボタン風に見えて、矢印アイコンと別要素のように分離していた
- 拡張方向と拡張量を同じ操作内容として、より統一感のある表示にしたかった

### Changes
- `ExpandGridButton` の数値表示から丸 border と背景を削除した
- 数値を `+4` として、矢印と同じ current color のテキスト表示へ変更した

### Files Touched
- `src/App.tsx` — `ExpandGridButton` の数値表示スタイルを簡素化した

### Behavioral Impact
- `Expand Grid` の数字が独立した丸ボタンに見えなくなり、矢印と一体のラベルとして見えるようになった
- グリッド拡張の動作自体は変わっていない

### Risk & Mitigation
- Risk: `+4` の視認性が丸 badge より弱くなる可能性がある
- Mitigation: 太字と tracking を残し、ボタン内右側の固定位置は維持した

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-23 17:30 (Asia/Taipei) — Workspace右ペインの編集パレット優先化**

### Summary
- 右ペインから `State` と `History` を削除し、編集アイコン群を最上段へ移動した

### Context / Goal
- `State` はヘッダーや各 active 表示と重複し、`History` は `MapCanvas` ヘッダーの Undo / Redo と重複していた
- 右ペインを状態表示よりも編集パレットとして使いやすくしたかった

### Changes
- `Workspace` の `Current Status` セクションを削除した
- `Workspace` の `Undo / Redo` セクションを削除した
- `Edit Tool` を右ペイン最上段へ移動した
- `Cell Icons` と `Auto Mapping` を上位に移動した
- `Save / Load` を下部へ移動し、既存の通知表示は残した
- 空フロアなどの map state notice は `Save / Load` 付近へ移して保持した

### Files Touched
- `src/App.tsx` — `Workspace` セクションの削除と並び替えを行った

### Behavioral Impact
- 右ペインの先頭が編集操作に直結する構成になった
- `State` と `History` の重複表示がなくなり、縦方向の占有が減った
- Undo / Redo 自体は `MapCanvas` ヘッダーから引き続き操作できる

### Risk & Mitigation
- Risk: `Selected Tool` や `Selected Icon` の一覧表示がなくなり、現在状態を見失う可能性がある
- Mitigation: それぞれの選択ボタンの active 表示で状態を確認できるため、重複表示だけを削除した
- Risk: 空フロアなどの通知が消えると状態異常に気づきにくい
- Mitigation: `mapStateNotice` は削除せず `Save / Load` セクション下へ移動した

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-23 17:43 (Asia/Taipei) — Explore移動時の自動グリッド拡張**

### Summary
- Explore Mode の移動先がグリッド外になる場合、移動前に自動で `+4` 拡張するようにした

### Context / Goal
- Explore Mode で端に到達するたびに手動で `Expand Grid` を押す必要があり、自動マッピングの流れが途切れていた
- 探索中は移動に合わせて地図が自然に広がる挙動にしたかった

### Changes
- `moveInDirection` の Explore 分岐で、移動前に `expandFloorForExploreMove()` を通すようにした
- 移動先が西 / 北 / 東 / 南の範囲外になる場合、それぞれ left / up / right / down に `GRID_EXPAND_STEP` 分だけ拡張する処理を追加した
- 上 / 左拡張時の座標シフトは既存の `expandFloorGrid()` に任せ、拡張後に通常の `movePlayerInExploreMode()` を実行するようにした
- Map Mode の移動では自動拡張しない挙動を維持した

### Files Touched
- `src/store/appStore.ts` — Explore Mode 移動前の自動拡張処理と補助関数を追加した

### Behavioral Impact
- Explore Mode では端から外へ移動しようとすると、グリッドが自動で `+4` 拡張されてから移動する
- 自動拡張と移動は既存の `applyTrackedMutation()` 内で行われるため、Undo 1 回でまとめて戻せる
- Map Mode では従来どおり範囲外移動でグリッドは拡張されない

### Risk & Mitigation
- Risk: 上 / 左拡張時は既存セルやアイコン、プレイヤー座標がシフトするため、移動前後の座標計算を誤るとズレる可能性がある
- Mitigation: 手動拡張と同じ `expandFloorGrid()` を先に通し、座標シフト後の floor に対して既存の Explore 移動処理を呼ぶようにした
- Risk: 自動拡張により意図せずマップサイズが増え続ける可能性がある
- Mitigation: 対象を Explore Mode の範囲外移動時だけに限定し、Map Mode では発火しないようにした

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-23 17:53 (Asia/Taipei) — Global Arrow切替ショートカット追加**

### Summary
- `Ctrl+Alt+F12` で `Global Arrow` の ON/OFF を切り替える global shortcut を追加した

### Context / Goal
- `Global Arrow` は非フォーカス時に使う機能なので、ON/OFF もアプリへフォーカスを戻さず切り替えられる必要があった
- Arrow capture 本体とは別に、切替用 shortcut は常時登録しておきたかった

### Changes
- `GLOBAL_ARROW_TOGGLE_SHORTCUT` として `Ctrl+Alt+F12` を追加した
- Tauri 実行時だけ `Ctrl+Alt+F12` を global shortcut 登録する effect を追加した
- `Ctrl+Alt+F12` 押下時に `globalArrowCaptureEnabled` を toggle するようにした
- Arrow capture の ON/OFF 登録 effect とは分離し、Arrow capture を OFF にしても切替 shortcut は残るようにした
- `Global Arrow` トグルの title に `Ctrl+Alt+F12` で切替できることを表示するようにした

### Files Touched
- `src/App.tsx` — `Ctrl+Alt+F12` の常時 global shortcut 登録と UI tooltip 表示を追加した

### Behavioral Impact
- Tauri アプリでは、非フォーカス時でも `Ctrl+Alt+F12` で `Global Arrow` の ON/OFF を切り替えられるようになった
- Web 実行時は従来どおり `Global Arrow` は無効のまま
- Arrow 移動 shortcut の登録 / 解除仕様自体は変わっていない

### Risk & Mitigation
- Risk: `Ctrl+Alt+F12` が他アプリやドライバ系ツールに確保されている環境では登録または発火しない可能性がある
- Mitigation: 登録失敗時は `toggle register failed` を状態表示へ出すようにした
- Risk: Arrow capture OFF 時に切替 shortcut まで解除されると非フォーカス復帰できなくなる
- Mitigation: 切替 shortcut は Arrow capture 本体とは別 effect で常時登録するようにした

### Tests / Verification
- `npm run build`
- `cargo build --manifest-path .\src-tauri\Cargo.toml`
- `npm run tauri build`
- Web / Rust / Tauri 配布ビルド成功を確認。`Ctrl+Alt+F12` の実機入力確認は未実施
**2026-04-24 10:34 (Asia/Taipei) — ChestアイコンのSVG相当描画追加**

### Summary
- `chest` セルアイコンを文字表示から、指定 SVG と同等のピクセルアート描画へ変更した

### Context / Goal
- `Chest` アイコンを汎用グリフではなく、ユーザー指定の SVG デザインで表示したかった
- Canvas 描画ループ内で確実に表示できるよう、非同期画像読込ではなく矩形描画で再現したかった

### Changes
- `drawIcons()` で `chest` だけを特別扱いし、専用描画関数を呼ぶようにした
- 指定 SVG の 16x16 ピクセル構成を `drawChestCellIcon()` として Canvas の `fillRect` 群へ落とし込んだ
- `chest` は文字グリフを使わず、専用ピクセルアートだけを描くようにした
- 指定 SVG ベースであることをコメントに明記した

### Files Touched
- `src/components/MapCanvas.tsx` — `chest` 用の専用ピクセルアート描画を追加し、文字表示から切り替えた

### Behavioral Impact
- `Chest` アイコンは丸背景 + `C` ではなく、指定 SVG 相当のピクセルアートとして表示されるようになった
- `stairs`、`pit`、`marker` など他のセルアイコン表示は変わっていない

### Risk & Mitigation
- Risk: 小さいズームでは 16x16 ピクセルアートが潰れて見える可能性がある
- Mitigation: セルサイズに対して描画サイズを床関数で量子化し、最低 1px 単位で矩形を維持するようにした
- Risk: 指定 SVG を画像として直接使っていないため、完全に同一のレンダリング結果にならない可能性がある
- Mitigation: SVG の矩形構成と色をそのまま Canvas の `fillRect` 群へ写し、視覚差を最小化した

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-24 10:53 (Asia/Taipei) — Chestアイコン差し替え更新**

### Summary
- `Chest` アイコンを新しい SVG ベースのピクセルアートへ更新した

### Context / Goal
- 既存の `Chest` 表示を、ユーザー提示の別デザインへ差し替えたかった
- 提示 SVG は `viewBox` が 16x16 なのに実座標が 32x30 まで使われていたため、実際の座標系に合わせて修正が必要だった

### Changes
- `drawChestCellIcon()` の矩形構成を新しい SVG デザインへ差し替えた
- SVG の矩形座標を 32x30 のピクセルアートとして解釈し、Canvas 上でも同じ構成で描画するようにした
- 背景、蓋、金具、ロック、ハイライト、コーナー陰影を新デザインに合わせて更新した

### Files Touched
- `src/components/MapCanvas.tsx` — `Chest` 専用描画の矩形群とスケール基準を更新した

### Behavioral Impact
- `Chest` アイコンが新しいピクセルアートデザインで表示されるようになった
- 他のセルアイコンやエッジアイコンの描画は変わっていない

### Risk & Mitigation
- Risk: 提示 SVG の `viewBox` と実座標が不一致だったため、そのままでは縮尺が崩れる
- Mitigation: 実際に使われている矩形座標を優先し、32x30 のソース座標系として再構成した
- Risk: 小さいズームで細部が潰れて見える可能性がある
- Mitigation: セルサイズに対する相対スケールで描画し、最低限の視認サイズを確保した

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-24 11:10 (Asia/Taipei) — Chestアイコン収まり調整**

### Summary
- `Chest` アイコンの描画スケールを下げ、セル枠からはみ出しにくいサイズへ調整した

### Context / Goal
- 新しい `Chest` ピクセルアートがセル内でやや大きく、枠からはみ出して見えていた
- デザインは維持したまま、セル内に収まる余白を少し増やしたかった

### Changes
- `drawChestCellIcon()` の `iconWidth` 比率を下げた
- 最小サイズも少し下げ、ズーム時の過剰な張り付きが起きにくいようにした

### Files Touched
- `src/components/MapCanvas.tsx` — `Chest` 専用描画のスケール値を調整した

### Behavioral Impact
- `Chest` アイコンがセル枠内に収まりやすくなった
- 他のアイコン描画や `Chest` のデザイン構成自体は変わっていない

### Risk & Mitigation
- Risk: 縮小しすぎると小ズーム時の視認性が落ちる可能性がある
- Mitigation: 最小幅は維持しつつ、比率だけを一段下げる軽微な調整に留めた

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-24 13:23 (Asia/Taipei) — 降り階段アイコン追加**

### Summary
- `stairs-down` セルアイコン種別を追加し、指定 SVG ベースの降り階段描画を実装した

### Context / Goal
- 既存の `stairs` とは別に、降り階段を識別できるアイコンが必要だった
- 指定 SVG の見た目を Canvas 上でも再現しつつ、保存形式と UI 選択肢にも通したかった

### Changes
- `CellIconKind` に `stairs-down` を追加した
- パレット順とアイコン巡回順に `stairs-down` を追加した
- 永続化バリデーションで `stairs-down` を許可した
- `Cell Icons` パレットとヘッダー表示で `stairs-down` を `down stairs` として表示するようにした
- `MapCanvas` で `stairs-down` を専用ピクセルアート描画へ分岐し、指定 SVG の矩形構成を Canvas の `fillRect` 群として実装した

### Files Touched
- `src/types/map.ts` — `CellIconKind` に `stairs-down` を追加した
- `src/store/appStore.ts` — セルアイコン巡回順に `stairs-down` を追加した
- `src/lib/persistence.ts` — 永続化時の `CellIconKind` 判定に `stairs-down` を追加した
- `src/App.tsx` — セルアイコンパレットとヘッダー表示に `down stairs` ラベルを追加した
- `src/components/MapCanvas.tsx` — `stairs-down` の専用ピクセルアート描画を追加した

### Behavioral Impact
- `Cell Icons` から `down stairs` を選択して配置できるようになった
- 保存 / 読込でも `stairs-down` を保持できるようになった
- 既存の `stairs`、`pit`、`chest`、`marker` の挙動は変わっていない

### Risk & Mitigation
- Risk: 新しい icon kind を追加すると既存保存データのバリデーションや巡回順と不整合が出る可能性がある
- Mitigation: 型、巡回順、永続化判定、UI パレットを同時に更新して整合を保った
- Risk: 小さいズームで 32x32 ピクセルアートが潰れて見える可能性がある
- Mitigation: セルサイズに対する相対スケールで描画し、最低限の視認サイズを確保した

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-24 13:59 (Asia/Taipei) — 登り階段アイコン差し替え**

### Summary
- `stairs` アイコンを文字表示から、指定 SVG ベースの登り階段ピクセルアート描画へ変更した

### Context / Goal
- 既存の登り階段は丸背景 + `S` の簡易表示だったため、指定された SVG デザインへ差し替えたかった
- 既存の `chest` と `stairs-down` と同じく、Canvas 上で直接ピクセルアート描画にしたかった

### Changes
- `drawIcons()` で `stairs` を専用描画分岐へ切り替えた
- `getCellIconGlyph()` で `stairs` の文字グリフ出力をやめた
- `drawUpStairsCellIcon()` を追加し、提示 SVG の各 path を 32x32 の矩形群として Canvas 描画へ落とし込んだ
- 指定 SVG ベースの再現であることをコメントに明記した

### Files Touched
- `src/components/MapCanvas.tsx` — `stairs` の専用ピクセルアート描画を追加し、文字表示から切り替えた

### Behavioral Impact
- 登り階段アイコンが `S` 表示ではなく、指定 SVG 相当のピクセルアートで表示されるようになった
- `stairs-down`、`chest`、`pit`、`marker` の描画仕様は維持されている

### Risk & Mitigation
- Risk: 32x32 ピクセルアートは小さいズームで細部が潰れて見える可能性がある
- Mitigation: セルサイズに対する相対スケールで描画し、最低限の視認サイズを確保した
- Risk: SVG の path 群を矩形群へ手変換しているため、色や配置に転記ミスが入る可能性がある
- Mitigation: path の矩形単位をそのまま `fillRect` に写し、ビルド確認まで行った

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-24 14:26 (Asia/Taipei) — 登り階段アイコンの再差し替え**

### Summary
- `stairs` アイコンを新しい rect ベース SVG デザインへ更新した

### Context / Goal
- 直前に適用した登り階段アイコンを、さらに新しい SVG デザインへ差し替えたかった
- 今回の SVG は rect だけで構成されていたため、より直接的に Canvas 描画へ写したかった

### Changes
- `drawUpStairsCellIcon()` の矩形群を新しい SVG に合わせて全面更新した
- 旧デザイン由来の path 変換矩形を削除し、新しい rect 構成だけを残した
- 変更理由をコメントに反映した

### Files Touched
- `src/components/MapCanvas.tsx` — `stairs` 専用描画の矩形構成を新しい SVG デザインに差し替えた

### Behavioral Impact
- 登り階段アイコンが新しい階段デザインで表示されるようになった
- `stairs-down`、`chest`、その他のアイコン描画には影響していない

### Risk & Mitigation
- Risk: 連続差し替えで旧デザイン由来の矩形が残ると表示が壊れる可能性がある
- Mitigation: `drawUpStairsCellIcon()` 内の矩形群を全面入れ替え、旧 path 由来の塊を残さない形にした

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-24 14:29 (Asia/Taipei) — 降り階段アイコンの左右反転**

### Summary
- `stairs-down` アイコンを Canvas transform で左右反転し、登り階段との差別化を強めた

### Context / Goal
- 登り階段と降り階段の見た目差を、色だけでなく向きでも明確にしたかった
- 既存の矩形定義は維持しつつ、最小変更で反転したかった

### Changes
- `drawDownStairsCellIcon()` を `context.save()` / `translate()` / `scale(-1, 1)` / `restore()` で包んだ
- 降り階段のピクセルアートを描画範囲内で左右反転するようにした
- 反転理由をコメントとして明記した

### Files Touched
- `src/components/MapCanvas.tsx` — `stairs-down` 描画を Canvas transform で左右反転するようにした

### Behavioral Impact
- 降り階段アイコンが左右反転され、登り階段と向きでも見分けやすくなった
- `stairs-down` の色や構造は維持され、向きだけが変わった

### Risk & Mitigation
- Risk: transform の適用範囲を誤ると他の描画にも反転が漏れる可能性がある
- Mitigation: `save()` / `restore()` で `drawDownStairsCellIcon()` の内部だけに閉じた

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-24 14:31 (Asia/Taipei) — 降り階段反転のロールバック**

### Summary
- `stairs-down` の Canvas transform による左右反転をロールバックした

### Context / Goal
- `scale(-1, 1)` による左右反転は、セル内の描画座標そのものまでずらして見える問題があった
- 次は transform ではなく、SVG / 矩形座標自体を左右反転した版へ書き換える前提で整理したかった

### Changes
- `drawDownStairsCellIcon()` から `save / translate / scale(-1, 1) / restore` を削除した
- 降り階段アイコンを左右反転前の状態へ戻した

### Files Touched
- `src/components/MapCanvas.tsx` — `stairs-down` の transform 反転処理を削除した

### Behavioral Impact
- 降り階段アイコンは反転前の元の向きに戻った
- セル内での描画座標ずれは解消された

### Risk & Mitigation
- Risk: 登り階段との見た目差別化が一時的に元へ戻る
- Mitigation: 次段階で SVG の `rect x` を左右反転した版へ書き換える前提に切り替えた

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-24 14:34 (Asia/Taipei) — 降り階段の座標反転実装**

### Summary
- `stairs-down` を transform ではなく rect の `x` 座標変換で左右反転する方式へ切り替えた

### Context / Goal
- Canvas の `scale(-1, 1)` 方式では、セル内の描画原点ごと動いて見える問題があった
- 位置を崩さずに左右反転するため、SVG の rect 座標そのものを反転した版を描く方式へ変えたかった

### Changes
- `drawDownStairsCellIcon()` に `fillMirroredRect()` を追加した
- 各矩形を `x' = 32 - x - width` で変換して描く方式へ変更した
- transform ベースの反転は使わず、元の描画原点は維持した
- 座標変換方式へ切り替えた理由をコメントとして明記した

### Files Touched
- `src/components/MapCanvas.tsx` — `stairs-down` の左右反転方法を transform から矩形座標変換へ変更した

### Behavioral Impact
- 降り階段アイコンはセル内位置を崩さずに左右反転されるようになった
- `stairs-down` の見た目差別化は維持しつつ、描画位置ずれは解消される

### Risk & Mitigation
- Risk: rect の反転変換を個別に適用すると、座標変換漏れがあると左右差が壊れる可能性がある
- Mitigation: `fillMirroredRect()` に処理を集約し、各矩形は元座標のまま列挙する形にした

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認
**2026-04-24 14:55 (Asia/Taipei) — Pitアイコンの黒丸化**

### Summary
- `pit` アイコンを文字表示から黒丸の専用描画へ変更した

### Context / Goal
- `pit` は意味が単純で、文字よりも穴に見える単純な記号の方が分かりやすかった
- 階段や Chest のような絵柄系とは分けて、最小表現に寄せたかった

### Changes
- `drawIcons()` で `pit` を専用描画分岐へ切り替えた
- `getCellIconGlyph()` で `pit` の文字グリフ出力をやめた
- `drawPitCellIcon()` を追加し、セル中央に小さめの黒丸と薄い縁を描くようにした

### Files Touched
- `src/components/MapCanvas.tsx` — `pit` 用の専用描画を追加し、文字表示から切り替えた

### Behavioral Impact
- `pit` は `P` 表示ではなく、黒丸の穴記号として表示されるようになった
- `stairs`、`stairs-down`、`chest`、`marker` の描画仕様は変わっていない

### Risk & Mitigation
- Risk: 黒丸だけだと背景によっては見落としやすい可能性がある
- Mitigation: 完全な塗りつぶしだけでなく、薄い外周線を足して輪郭を保った

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認

**2026-04-24 15:05 (Asia/Taipei) — Cell Iconsパレットの実アイコン化**

### Summary
- `Cell Icons` をテキストボタンからアイコンのみの選択ボタンへ変更した

### Context / Goal
- 右ペインの `Cell Icons` は文字ラベル中心で、実際にマップへ置かれる見た目と一致していなかった
- パレット上でも同じ見た目を見せて、選択時の認知負荷を下げたかった

### Changes
- `Cell Icons` セクションを 3 列のアイコン専用ボタンへ置き換えた
- `stairs`、`stairs-down`、`pit`、`chest`、`marker` の簡易プレビュー SVG を `App.tsx` に追加した
- `marker` は暫定仕様として丸背景に `M` を描くプレビューにした

### Files Touched
- `src/App.tsx` — `Cell Icons` の UI をアイコン専用ボタンへ差し替え、各アイコンのプレビューコンポーネントを追加

### Behavioral Impact
- 右ペインの `Cell Icons` はラベル文字ではなく、実アイコンに近い見た目で選択できるようになった
- ボタン自体は `title` と `aria-label` を維持しているため、操作名の参照性は残している

### Risk & Mitigation
- Risk: パレット用 SVG と Canvas 上の実描画が将来的にずれる可能性がある
- Mitigation: まずは主要な形状だけを合わせ、見た目差分が問題になったら共通のプレビュー定義へ寄せる

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認

**2026-04-24 15:08 (Asia/Taipei) — Cell Iconsの宝箱プレビュー差し替え**

### Summary
- `Cell Icons` パレットの `chest` プレビューだけを完全版 SVG に差し替えた

### Context / Goal
- `Cell Icons` の宝箱表示は簡略版で、提示されたピクセルアートとの差分が残っていた
- `MapCanvas` 側は触らず、パレット上の見た目だけを指定 SVG に合わせたかった

### Changes
- `ChestPreview()` の `viewBox` を `32x32` に揃えた
- 提示された宝箱 SVG の `rect` 群を UI プレビューへ反映した
- `MapCanvas` の宝箱描画ロジックは変更していない

### Files Touched
- `src/App.tsx` — `Cell Icons` 用の `ChestPreview` を完全版 SVG に更新

### Behavioral Impact
- 右ペインの `Cell Icons` に表示される宝箱アイコンだけが詳細版の見た目になった
- 実際にマップへ配置される `chest` 描画は従来のまま

### Risk & Mitigation
- Risk: UI プレビューと `MapCanvas` 上の `chest` 表示に差分が残る
- Mitigation: 今回はパレットだけを対象に限定し、必要になった時点で `MapCanvas` 側も同じ SVG ベースへ寄せる

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認

**2026-04-24 15:11 (Asia/Taipei) — Cell Iconsの線枠グリッド化**

### Summary
- `Cell Icons` をカード風ボタンから、余白の少ない線枠グリッド表示へ変更した

### Context / Goal
- `Cell Icons` は選択パレット用途に対して、各ボタンのカード装飾がやや重かった
- アイコン自体を見せることを優先し、面積効率の良い格子表示へ寄せたかった

### Changes
- `Cell Icons` セクションの並びを、外周枠付きの 3 列グリッドに変更した
- 各アイコンボタンから個別の丸み付きカード表現を外し、フラットなセル表示へ切り替えた
- 選択中だけ inset の強い線枠と薄い背景色で強調する形に整理した

### Files Touched
- `src/App.tsx` — `Cell Icons` パレットのレイアウトとボタン装飾を線枠グリッド向けに調整

### Behavioral Impact
- `Cell Icons` は余白の少ない格子配置となり、同じ面積でより密にアイコンを確認できるようになった
- 非選択状態の装飾は弱くなり、選択中のセルだけが強く見えるようになった

### Risk & Mitigation
- Risk: 線枠を詰めたことでクリック領域が窮屈に見える可能性がある
- Mitigation: セル自体の最小高さは維持し、hover と active の視覚差を残して判別性を確保した

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認

**2026-04-24 15:13 (Asia/Taipei) — Cell Iconsの外周装飾削減**

### Summary
- `Cell Icons` の外周カード装飾を外し、グリッドをさらに密に詰めた

### Context / Goal
- 線枠グリッド化後も、パレット全体の外周装飾とセル余白がまだ大きかった
- アイコンをより密に並べ、選択パレットとしての面積効率を上げたかった

### Changes
- `Cell Icons` グリッドから外周の枠線と角丸コンテナを削除した
- 各セルボタンの最小高さと内側余白を縮小した
- アイコン表示サイズも一段小さくして、全体を詰めた

### Files Touched
- `src/App.tsx` — `Cell Icons` のグリッド外枠とセルサイズを縮小調整

### Behavioral Impact
- `Cell Icons` は周囲のカード装飾なしで、より密な格子状パレットとして表示される
- 1 セルあたりの占有が減り、右ペイン内のスペース効率が上がった

### Risk & Mitigation
- Risk: 詰めすぎで押しやすさや識別性が落ちる可能性がある
- Mitigation: セル自体のクリック面積は維持しつつ、active 枠と hover 差分は残した

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認

**2026-04-24 15:17 (Asia/Taipei) — Edit Toolのアイコン化と線枠グリッド化**

### Summary
- `Edit Tool` をテキスト一覧から、Canvas の意味に寄せたアイコン付き線枠グリッドへ変更した

### Context / Goal
- `Edit Tool` は文字ボタンの縦並びで、`Cell Icons` に比べて面積効率と視認性が低かった
- `floor / unknown / wall / door / open` などの編集意図を、Canvas 上の見た目に近い記号で選べるようにしたかった

### Changes
- `Edit Tool` セクションを 4 列の密な線枠グリッドに変更した
- `cell floor`、`cell unknown`、`cell icon`、`edge wall`、`edge open door`、`edge closed door`、`edge open`、`edge unknown` の専用プレビューを `App.tsx` に追加した
- 各ボタンはアイコンのみ表示にしつつ、`title` と `aria-label` で操作名を残した

### Files Touched
- `src/App.tsx` — `Edit Tool` の UI をアイコン選択グリッドへ差し替え、各編集ツールのプレビューコンポーネントを追加

### Behavioral Impact
- `Edit Tool` はテキスト一覧ではなく、色と形で編集対象を判断できるパレット表示になった
- 選択中ツールは `Cell Icons` と同じ強調ルールで見えるようになった

### Risk & Mitigation
- Risk: 一部ツールは文字より記号の方が初見で分かりにくい可能性がある
- Mitigation: `title` と `aria-label` を維持し、hover 時や支援技術で名称を確認できるようにした

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認

**2026-04-24 15:21 (Asia/Taipei) — Edit Toolのcell icon削除案を文書化**

### Summary
- `Edit Tool` から `cell icon` を外し、`Cell Icons` 側へ導線を寄せる実装案を `Doc/` に追加した

### Context / Goal
- `Edit Tool` 内の `cell icon` は `Cell Icons` パレットと役割が重複していた
- UI 実装前に、状態遷移を壊さない削除方針を文書として整理したかった

### Changes
- `Edit Tool` から `cell icon` を外す前提の設計方針を整理した
- `Cell Icons` クリック時に `selectedTool = cell-icon` へ自動切替する導線案を明記した
- ゴール、非ゴール、実装手順、リスクを含む実装案ドキュメントを追加した

### Files Touched
- `Doc/EditToolCellIconRemovalProposal.md` — `cell icon` UI 削除と `Cell Icons` 側への導線統合案を新規作成

### Behavioral Impact
- 今回はドキュメント追加のみで、実アプリの挙動変更はない

### Risk & Mitigation
- Risk: 実装前のため、文書と最終 UI の差分が後で出る可能性がある
- Mitigation: 非ゴールと状態遷移方針を明記し、変更範囲を `App.tsx` 中心に限定している

### Tests / Verification
- 未実施（ドキュメント追加のみのため）

**2026-04-24 15:23 (Asia/Taipei) — Edit Toolからcell iconを除去**

### Summary
- `Edit Tool` から `cell icon` を外し、`Cell Icons` クリック時にアイコン配置モードへ入るようにした

### Context / Goal
- `Edit Tool` 内の `cell icon` は `Cell Icons` パレットと役割が重複していた
- UI 上の重複を減らしつつ、既存の `selectedTool = cell-icon` ロジックは維持したかった

### Changes
- `EDIT_TOOL_OPTIONS` から `cell icon` を除外した
- `Cell Icons` の各ボタンをクリックしたとき、`selectedCellIconKind` 更新に加えて `selectedTool('cell-icon')` へ切り替えるようにした
- `Cell Icons` の見出し文を、配置モードへ入る導線が分かる短い説明へ変更した
- `Edit Tool` 側で不要になった `cell icon` 用プレビューを削除した

### Files Touched
- `src/App.tsx` — `Edit Tool` の項目削減、`Cell Icons` クリック時の状態遷移追加、不要プレビューの削除

### Behavioral Impact
- `Edit Tool` には `cell icon` が表示されなくなった
- `Cell Icons` のいずれかをクリックすると、そのアイコン選択と同時にアイコン配置モードへ入る
- `Cell Icons` の active 表示は、`cell-icon` モード中の選択アイコンだけを示すようになった

### Risk & Mitigation
- Risk: `Cell Icons` のクリックで編集モードが変わることに最初は気づきにくい可能性がある
- Mitigation: 見出し文を更新し、active 表示も `cell-icon` モードと一致させて挙動を揃えた

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認

**2026-04-24 15:27 (Asia/Taipei) — ドラッグ連続編集の実装案を追加**

### Summary
- `Map` モードでの左ドラッグ連続配置 / 右ドラッグ連続削除の実装案を `Doc/` に追加した

### Context / Goal
- `Map` モードでは壁や floor を連続して編集したい場面が多く、単発クリックだけでは操作回数が多い
- 実装前に、対象種別固定と 1 drag = 1 undo を含む安全な方針を整理したかった

### Changes
- `Map` モード限定のドラッグ編集仕様を整理した
- 左ドラッグ配置、右ドラッグ削除、対象種別固定、重複適用防止、Undo 1 回化の方針を明記した
- 影響範囲と段階的な実装手順をまとめた

### Files Touched
- `Doc/DragPaintProposal.md` — ドラッグ連続編集の仕様、実装手順、リスクを新規作成

### Behavioral Impact
- 今回はドキュメント追加のみで、実アプリの挙動変更はない

### Risk & Mitigation
- Risk: 実装時に履歴管理や対象判定の複雑さで差分が広がる可能性がある
- Mitigation: 初版は補間なし、`MapCanvas` と store の最小変更に限定する方針を文書で固定した

### Tests / Verification
- 未実施（ドキュメント追加のみのため）

**2026-04-24 15:35 (Asia/Taipei) — Mapモードのドラッグ連続編集を実装**

### Summary
- `Map` モードで左ドラッグ連続配置、右ドラッグ連続削除、`1 drag = 1 undo` を実装した

### Context / Goal
- `Map` モードでは壁やセル状態を連続して編集したい場面が多く、単発クリックだけでは操作回数が多かった
- `Doc/DragPaintProposal.md` に沿って、対象種別固定と履歴 1 回化を守ったドラッグ編集を追加したかった

### Changes
- `MapCanvas` にドラッグ編集用のローカル state / ref を追加した
- 左ドラッグは連続配置、右ドラッグは連続削除として、ドラッグ開始時の対象種別に一致する対象だけを処理するようにした
- 同一ドラッグ中の重複適用を防ぐため、処理済み target の集合を追加した
- marker のダブルクリック編集は維持しつつ、移動が始まった場合はクリック待機をキャンセルしてドラッグ編集へ切り替えるようにした
- store に履歴なしの preview 更新と、ドラッグ終了時だけ `undoStack` を積む確定処理を追加した

### Files Touched
- `src/components/MapCanvas.tsx` — ドラッグ開始 / 継続 / 終了、marker クリック待機のキャンセル、連続編集の対象管理を追加
- `src/store/appStore.ts` — 履歴なし preview 更新と、ドラッグ終了時の履歴確定アクションを追加

### Behavioral Impact
- `Map` モードで左ボタンを押したまま移動すると連続配置できる
- `Map` モードで右ボタンを押したまま移動すると連続削除できる
- セルで開始したドラッグはセルだけ、エッジで開始したドラッグはエッジだけを編集する
- 1 回のドラッグ操作は Undo 1 回で戻せる

### Risk & Mitigation
- Risk: 速いドラッグで座標補間が入っていないため、一部 target を飛ばす可能性がある
- Mitigation: 初版は重複防止と対象種別固定を優先し、必要になった時点で線分補間を追加しやすい構造にした

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認

**2026-04-24 15:40 (Asia/Taipei) — エッジドラッグの軸固定**

### Summary
- エッジのドラッグ連続編集を、開始時の縦 / 横軸に固定するようにした

### Context / Goal
- 連続編集でエッジをドラッグすると、カーソルのぶれで縦横のエッジが混在しやすく、UX が悪かった
- 最初に触ったエッジの軸に限定して編集し、意図しない壁やドアの混在を防ぎたかった

### Changes
- ドラッグ編集 state に開始エッジの `axis` を保持するようにした
- エッジ開始のドラッグ中は、開始時と同じ `horizontal / vertical` の target だけを適用するようにした
- marker クリック待機からドラッグへ遷移する経路でも、開始 target の軸を引き継ぐようにした
- 型絞り込みを追加し、`edge` のときだけ `axis` を参照するようにした

### Files Touched
- `src/components/MapCanvas.tsx` — ドラッグ編集 state にエッジ軸を追加し、適用対象を同軸エッジのみに制限

### Behavioral Impact
- エッジで開始したドラッグは、縦開始なら縦エッジだけ、横開始なら横エッジだけを連続編集する
- セル開始のドラッグ挙動は従来どおり変わらない

### Risk & Mitigation
- Risk: 軸固定により、斜めに動かしたとき一部のエッジが塗られないと感じる可能性がある
- Mitigation: 誤編集防止を優先した仕様として固定し、必要になれば将来は同軸補間だけ追加しやすい構造にしている

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認

**2026-04-24 15:46 (Asia/Taipei) — Forward Edgeのショートカットをアイコン化**

### Summary
- 左ペインの `Forward Edge` ショートカットを、数字付きアイコングリッドへ変更した

### Context / Goal
- 左ペインの `Forward Edge` はテキストボタンで、右ペインのアイコングリッド系 UI と見た目の統一感が弱かった
- `1 / 2 / 3 / 4 / 0` のショートカットだけを、右ペインと同系統の線枠グリッド + アイコン表示へ寄せたかった

### Changes
- `Forward Edge` 用に `FORWARD_EDGE_SHORTCUTS` 定義を追加した
- `1 wall / 2 door / 3 open / 4 closed / 0 unknown` を、左に数字、右に edge プレビューを置く `ForwardEdgeShortcutButton` へ差し替えた
- 既存の `EdgeToolPreview`、`OpenDoorToolPreview`、`UnknownEdgeToolPreview` を流用してアイコン表示を統一した
- `Save / Load` など他の `ShortcutButton` セクションは変更していない

### Files Touched
- `src/App.tsx` — `Forward Edge` のショートカット UI を数字付きアイコングリッドへ変更し、専用プレビュー部品を追加

### Behavioral Impact
- 左ペインの `Forward Edge` は文字ラベルではなく、数字付きアイコンボタンで選べるようになった
- ショートカットの意味自体は変わらず、`1 / 2 / 3 / 4 / 0` の対応も維持される

### Risk & Mitigation
- Risk: テキストが減ったことで初見では意味が分かりにくくなる可能性がある
- Mitigation: 各ボタンに `title` と `aria-label` を残し、数字も左に常時表示して認識しやすくした

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認

**2026-04-24 15:51 (Asia/Taipei) — GitHub Pages自動デプロイ設定**

### Summary
- GitHub Actions で `main` push 時に Web 版を GitHub Pages へデプロイする設定を追加した

### Context / Goal
- `Doc/GitHubPagesDeployProposal.md` に沿って、ブラウザ版だけを GitHub Pages へ自動公開したかった
- ローカル開発と Tauri ビルドを壊さず、Pages 用の `base` だけを Actions build 時に切り替えたかった

### Changes
- `vite.config.ts` を関数化し、`GITHUB_ACTIONS === 'true'` のときだけ `base` を `/Web-Auto-Mapping/` に切り替えるようにした
- `.github/workflows/deploy-pages.yml` を追加し、`main` push と手動起動で `npm ci` → `npm run build` → Pages artifact upload → deploy を行うようにした
- workflow には `contents: read`、`pages: write`、`id-token: write`、`concurrency: pages` を設定した

### Files Touched
- `vite.config.ts` — GitHub Actions 上だけ Pages 用 `base` へ切り替える設定を追加
- `.github/workflows/deploy-pages.yml` — GitHub Pages デプロイ workflow を新規追加

### Behavioral Impact
- `main` への push で GitHub Pages デプロイ workflow が走るようになる
- ローカルと Tauri の build は従来どおり `/` base、GitHub Actions 上の Web build だけ `/Web-Auto-Mapping/` base になる

### Risk & Mitigation
- Risk: リポジトリ名が将来変わると `base` と Pages URL がずれて asset 404 になる可能性がある
- Mitigation: `vite.config.ts` の `base` は repo 名に依存しているため、改名時に同時更新すべき箇所として明確化した

### Tests / Verification
- `npm run build`
- `$env:GITHUB_ACTIONS='true'; npm run build; Remove-Item Env:\GITHUB_ACTIONS`
- 通常 build と Pages 想定 build の両方で TypeScript 型検査と Vite 本番ビルド成功を確認

**2026-04-24 16:23 (Asia/Taipei) — 左ペインのMovementを最上段へ移動**

### Summary
- 左ペインの `Movement` セクションを最上段へ移動した

### Context / Goal
- `Movement` は左ペイン内で最も操作頻度が高く、探索や確認時に最初に触る要素だった
- UX 改善のため、管理系セクションより先に見える位置へ上げたかった

### Changes
- `navigatorPanel` 内の section 順を入れ替え、`Movement` を最初のセクションに移動した
- `Map Title`、`Floor Selector`、`Expand Grid`、`Forward Edge` などの内容自体は変更していない

### Files Touched
- `src/App.tsx` — 左ペイン内の `Movement` セクションを最上段へ並び替え

### Behavioral Impact
- 左ペインを開いたとき、最初に `Movement` が見えるようになった
- 操作仕様やショートカット自体は変わっていない

### Risk & Mitigation
- Risk: 慣れていた利用者には一時的に配置変更の違和感が出る可能性がある
- Mitigation: 内容はそのままで順序だけを変更し、探索系操作を優先する自然な並びへ寄せた

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認

**2026-04-24 16:43 (Asia/Taipei) — favicon.png の反映設定**

### Summary
- `public/favicon.png` を参照する favicon 設定を `index.html` に追加した

### Context / Goal
- `public/favicon.png` を作成したため、ローカルと GitHub Pages の両方で favicon として読み込まれるようにしたかった
- Pages の subpath 配信でも壊れないよう、Vite の `base` に追従する書き方を使いたかった

### Changes
- `index.html` の `<head>` に `rel="icon"` を追加した
- `href` は `%BASE_URL%favicon.png` を使い、通常 build と Pages build の両方で正しいパスになるようにした

### Files Touched
- `index.html` — `public/favicon.png` を参照する favicon link を追加

### Behavioral Impact
- アプリの favicon は `public/favicon.png` を使うようになった
- GitHub Pages 配信時も `/Web-Auto-Mapping/favicon.png` を参照できる

### Risk & Mitigation
- Risk: favicon の更新がブラウザキャッシュに残り、変更がすぐ反映されない可能性がある
- Mitigation: `%BASE_URL%` を使って path 自体は正しくし、見た目の更新は hard reload で確認しやすくした

### Tests / Verification
- `npm run build`
- `$env:GITHUB_ACTIONS='true'; npm run build; Remove-Item Env:\GITHUB_ACTIONS`
- 通常 build と Pages 想定 build の両方で Vite 本番ビルド成功を確認

**2026-04-27 13:20 (Asia/Taipei) — cell-icon 配置時の Cell 優先判定**

### Summary
- `cell-icon` 選択中は Canvas の Edge 判定をスキップし、Cell を優先するようにした

### Context / Goal
- Map canvas 縮小時に Edge 判定領域が相対的に大きくなり、Cell アイコン配置が Edge 判定へ吸われやすかった
- Cell アイコン配置時だけ Cell を狙いやすくし、Edge 編集ツールの操作感は維持したかった

### Changes
- `MapCanvas` で `selectedTool` を参照するようにした
- `getInteractionTargetAtCanvasPoint` に `selectedTool` を渡し、`cell-icon` 時はマップ範囲内のクリックを常に Cell target として返すようにした
- Edge 系ツール選択時の既存 Edge 判定ロジックは維持した

### Files Touched
- `src/components/MapCanvas.tsx` — `cell-icon` 時だけ Edge hit test をスキップする分岐を追加

### Behavioral Impact
- `cell-icon` 選択中は縮小表示でも Cell アイコンを配置しやすくなる
- Edge 編集ツール選択時の Edge 判定領域や編集挙動は変わらない

### Risk & Mitigation
- Risk: `cell-icon` 選択中に右クリックで Edge を unknown に戻す操作はできなくなる
- Mitigation: Edge を編集する場合は既存どおり Edge 系ツールを選ぶ前提とし、変更範囲を `cell-icon` の hit test に限定した

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認

**2026-04-28 10:30 (Asia/Taipei) — 座標表示の左側移動**

### Summary
- Map Canvas ヘッダーの座標表示を右側操作群から左側タイトル横へ移動した

### Context / Goal
- Hover 座標の桁数変動により、右側の操作ボタン位置が左右に揺れる可能性があった
- 座標表示をボタン群から切り離し、操作 UI の位置を安定させたかった

### Changes
- `Player` / `Hover` 座標表示を `Floor Workspace` の横へ移動した
- 右側操作群から座標表示を削除した
- 座標値に最小幅と `tabular-nums` を指定し、数字変動時の見た目の揺れを抑えた

### Files Touched
- `src/App.tsx` — Map Canvas ヘッダー内の座標表示位置と `CoordinateStatus` 幅指定を変更

### Behavioral Impact
- Hover 座標が変わっても、Explore / Map や toolbar ボタンの位置に影響しにくくなる
- 座標表示は `Floor Workspace` ラベルの近くにまとまり、マップ状態情報として確認しやすくなる

### Risk & Mitigation
- Risk: 左側タイトル領域の横幅が狭い場合に座標表示が折り返す可能性がある
- Mitigation: `flex-wrap` を使い、右側ボタン群とは独立して折り返せるようにした

### Tests / Verification
- `npm run typecheck`
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認

**2026-04-28 10:22 (Asia/Taipei) — Map Canvas ヘッダー座標表示**

### Summary
- Map Canvas ヘッダーにプレイヤー座標と hover 中 Cell 座標を表示するようにした

### Context / Goal
- マップ上の位置確認をしやすくするため、Canvas 内 overlay ではなく `Floor Workspace` ヘッダー側に座標情報を出したかった
- マップ拡張後も現行の左上 `(0,0)` 基準の座標体系と一致する表示にしたかった

### Changes
- `MapCanvas` に hover Cell 座標を親へ通知する callback prop を追加した
- App 側で hover 座標 state を持ち、同じ座標の連続通知では state 更新しないようにした
- Map Canvas ヘッダーのサイズ表示手前に `Player` / `Hover` 座標表示を追加した
- floor 切替時は hover 座標をクリアするようにした
- `Doc/MapCoordinateDisplayProposal.md` に実装案を追加した

### Files Touched
- `src/components/MapCanvas.tsx` — hover Cell 座標計算と callback 通知を追加
- `src/App.tsx` — Player / Hover 座標 state とヘッダー表示を追加
- `Doc/MapCoordinateDisplayProposal.md` — Map 座標表示の実装案を追加

### Behavioral Impact
- Map Canvas ヘッダーで `Player x,y` と `Hover x,y` を確認できる
- マップ外 hover / mouse leave / floor 切替時は `Hover -` になる
- 座標は現行 `FloorState` の左上基準で表示され、保存形式は変更しない

### Risk & Mitigation
- Risk: mousemove ごとの hover 座標通知で再レンダーが増える可能性がある
- Mitigation: App 側で現在値と同じ座標なら state を更新しないガードを入れた

### Tests / Verification
- `npm run typecheck`
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認

**2026-04-28 09:54 (Asia/Taipei) — Cell 系ツールの Cell 優先 hit test**

### Summary
- `cell-floor` / `cell-unknown` でも縮小表示時に Cell を狙いやすいよう、Cell 系ツール全体で Edge 判定をスキップするようにした

### Context / Goal
- 既存の `cell-icon` は縮小表示時に Edge 判定へ吸われないよう Cell 固定判定になっていた
- `cell-floor` / `cell-unknown` は同じ補正がなく、縮小した Map canvas で配置しづらかった

### Changes
- `getInteractionTargetAtCanvasPoint` の `cell-icon` 専用分岐を Cell 系ツール共通の分岐へ変更した
- `cell-floor` / `cell-unknown` / `cell-icon` 判定用の `isCellEditTool` helper を追加した
- コメントを Cell 系ツール全体の理由へ更新した

### Files Touched
- `src/components/MapCanvas.tsx` — Cell 系ツール選択時の hit test を Cell 固定に変更

### Behavioral Impact
- 縮小表示時でも `cell-floor` / `cell-unknown` / `cell-icon` はクリック位置の Cell を編集しやすくなる
- `edge-*` ツール選択時の Edge 判定幅と挙動は従来どおり

### Risk & Mitigation
- Risk: Cell 系ツール選択中は Edge をクリックしても Edge 編集できない
- Mitigation: Edge 編集は `edge-*` ツールを選択する既存操作に統一し、選択中ツールと編集対象の一貫性を優先した

### Tests / Verification
- `npm run typecheck`
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認

**2026-04-28 09:42 (Asia/Taipei) — Explore Mode の Edit Tool 自由編集化**

### Summary
- Explore Mode でも Edit Tool による Canvas 編集とドラッグ編集を Map Mode 同様に使えるようにした

### Context / Goal
- 以前は Explore Mode の Canvas 編集を Cell Icon に限定していた
- Explore 中でも floor / unknown / edge 系ツールを自由に使える方が運用しやすいため、Map Mode 限定の編集ゲートを外したかった

### Changes
- Canvas primary / secondary interaction を Explore / Map 共通で既存編集関数へ通すようにした
- Explore Mode でも左ドラッグ paint と右ドラッグ erase が開始できるようにした
- Workspace の Edit Tool 説明文と空階層 notice を新仕様に合わせて更新した
- Explore Mode の Cell Icon だけを許可する特例 helper を削除した

### Files Touched
- `src/store/appStore.ts` — Canvas 編集の mode 制限と Cell Icon 特例分岐を削除
- `src/components/MapCanvas.tsx` — Explore Mode でも drag paint / erase を開始するように変更
- `src/App.tsx` — Edit Tool と空階層 notice の文言を更新

### Behavioral Impact
- Explore Mode で `cell-floor` / `cell-unknown` / `edge-*` / `cell-icon` のクリック・ドラッグ編集ができる
- 右クリック / 右ドラッグの消去も Explore Mode で Map Mode と同じ挙動になる
- 移動時の Explore auto mapping 挙動自体は変更していない

### Risk & Mitigation
- Risk: Explore Mode 中に手動編集と移動による auto mapping が混在し、意図しない上書きに見える可能性がある
- Mitigation: 既存の Edit Tool 選択と Undo 履歴をそのまま使い、編集経路を Map Mode と共通化して挙動差を減らした

### Tests / Verification
- `npm run typecheck`
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認

**2026-04-27 14:39 (Asia/Taipei) — Global Shortcut 設定のモーダル化**

### Summary
- Global Shortcut 詳細設定を Workspace 常時表示からアプリ内モーダル表示へ変更した

### Context / Goal
- Global Shortcut 設定項目が多く、Workspace に常時展開すると右ペインの視認性が落ちていた
- Workspace には状態サマリーと入口だけを残し、詳細な Record / Clear / Reset 操作は別画面で扱いたかった

### Changes
- `GlobalShortcutSettings` をサマリー表示と `Configure` ボタン中心の UI に変更した
- 詳細設定 UI を `GlobalShortcutSettingsDialog` として分離した
- `Esc` / backdrop / `Close` でモーダルを閉じられるようにした
- `Record` 中の `Esc` はモーダル close ではなく recording cancel として扱うようにした
- 実装案 Doc にモーダル UI 方針を追記した

### Files Touched
- `src/components/GlobalShortcutSettings.tsx` — Workspace 表示をサマリーと `Configure` ボタンに縮小
- `src/components/GlobalShortcutSettingsDialog.tsx` — Global Shortcut 詳細設定モーダルを追加
- `Doc/GlobalShortcutRegistrationProposal.md` — モーダル UI 方針と DoD を追記

### Behavioral Impact
- Workspace の Global Shortcut section は状態確認と設定画面への入口だけになる
- `Configure` クリックで詳細設定モーダルが開く
- モーダル内で従来どおり master toggle、binding toggle、Record、Clear、Reset defaults を操作できる

### Risk & Mitigation
- Risk: `Esc` の役割が modal close と recording cancel で競合する可能性がある
- Mitigation: recording 中は recording cancel を優先し、modal close は recording していない時だけに限定した

### Tests / Verification
- `npm run typecheck`
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認

**2026-04-27 14:06 (Asia/Taipei) — Tauri Global Shortcut 登録 UI**

### Summary
- Tauri 版向けに Forward Edge と Cell Icon 操作用の Global Shortcut 登録 UI を追加した

### Context / Goal
- 既存の移動ショートカットと Global Arrow Capture は現状維持しつつ、記録補助操作だけを Global Shortcut として登録できるようにしたかった
- Global Shortcut は OS 全体へ作用するため、初期状態では無効にし、対象操作も Forward Edge と current cell の Cell Icon 操作に限定したかった

### Changes
- Global Shortcut 対象 action、既定候補 shortcut、実行処理を `globalShortcutActions` に分離した
- Tauri app local data に `web-auto-mapping.preferences.json` として Global Shortcut 設定を保存 / 読込する処理を追加した
- 登録 / 解除 / 重複検出 / status 表示を担当する `useGlobalShortcutRegistration` hook を追加した
- Workspace に Tauri 専用の `Global Shortcuts` 設定 UI を追加した
- preferences 保存先を Tauri fs capability に追加した

### Files Touched
- `src/App.tsx` — Workspace に `GlobalShortcutSettings` section を追加
- `src/components/GlobalShortcutSettings.tsx` — Global Shortcut 登録 UI を追加
- `src/hooks/useGlobalShortcutRegistration.ts` — Tauri Global Shortcut の登録状態管理を追加
- `src/lib/globalShortcutActions.ts` — 登録対象 action と実行処理を追加
- `src/lib/globalShortcutPreferences.ts` — app local data への設定保存 / 読込を追加
- `src-tauri/capabilities/default.json` — preferences ファイルの read/write/exists 権限を追加

### Behavioral Impact
- Tauri 版で Forward Edge 5種、Cell Icon previous / next、current cell 配置、current cell 削除を Global Shortcut として登録できる
- 初期状態では master toggle が off のため Global Shortcut は登録されない
- Web runtime では UI が disabled 表示になり、登録処理は動かない
- 既存の移動ショートカット、Global Arrow Capture、`Ctrl+Alt+F12` toggle は変更していない

### Risk & Mitigation
- Risk: Global Shortcut が他アプリや OS shortcut と競合する可能性がある
- Mitigation: 登録状態を action ごとに表示し、同一設定内の重複 shortcut は登録しないようにした
- Risk: Tauri preferences 保存権限が不足すると設定保存に失敗する可能性がある
- Mitigation: `default.json` に `$APPLOCALDATA/web-auto-mapping.preferences.json` の許可を追加した

### Tests / Verification
- `npm run typecheck`
- `npm run build`
- `npm run tauri:build` は Vite build まで成功したが、`src-tauri/target/release/web_auto_mapping.exe` の削除が OS error 5 で拒否され、Rust build 前に停止した

**2026-04-27 13:40 (Asia/Taipei) — 全 Cell Icon メッセージ対応**

### Summary
- `marker` 限定だったメッセージ編集・hover 表示を、全 Cell Icon で使えるようにした

### Context / Goal
- 既存の `CellIcon.message?: string` は全アイコンで保持できる形だったが、編集 UI と hover 表示は `marker` のみ対象だった
- 階段、落とし穴、宝箱にも補足メモを付けられるようにしつつ、地図上のアイコン種別は識別しやすいままにしたかった

### Changes
- `updateMarkerMessageAt` / `setSelectedMarkerMessage` を Cell Icon 汎用の `updateCellIconMessageAt` / `setSelectedCellIconMessage` に変更した
- Canvas 上のダブルクリック編集と hover メッセージ表示を、全 Cell Icon 対象へ広げた
- `marker` は従来どおりメッセージ先頭 1 文字を glyph として表示する仕様を維持した
- `marker` 以外の Cell Icon は既存描画を維持し、メッセージ付きの場合だけ小さいバッジを表示するようにした

### Files Touched
- `src/lib/mapModel.ts` — Cell Icon の種類に関係なく `message` を更新できる関数へ汎用化
- `src/store/appStore.ts` — Cell Icon メッセージ更新アクション名と呼び出し先を汎用化
- `src/components/MapCanvas.tsx` — hover / double click / edit form / hit test を全 Cell Icon 対応へ変更し、非 marker 用メッセージバッジを追加

### Behavioral Impact
- `stairs` / `stairs-down` / `pit` / `chest` / `marker` のすべてにメッセージを記入・保存できる
- メッセージ付き Cell Icon に hover すると全文が Canvas 上部に表示される
- `marker` 以外はメッセージがあっても既存アイコン形状を維持し、種類を識別しやすい

### Risk & Mitigation
- Risk: 全 Cell Icon でダブルクリック編集を受け付けるため、通常クリック配置との競合範囲が広がる
- Mitigation: 既存の遅延クリック処理を Cell Icon 汎用に拡張し、ドラッグ開始しない通常クリックだけ編集判定と共存させた

### Tests / Verification
- `npm run typecheck`
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認

**2026-04-27 13:32 (Asia/Taipei) — Explore Mode での Cell Icon マウス配置対応**

### Summary
- Explore Mode でも `cell-icon` 選択中は Canvas クリックで Cell Icon を配置・削除できるようにした

### Context / Goal
- 既存仕様ではキーボードの `I` / `Alt+I` は Explore Mode でもアイコン配置できたが、マウス配置は Map Mode 限定だった
- Explore 中に発見物をその場で記録できるよう、Cell Icon だけを例外的にマウス操作可能にしたかった

### Changes
- Canvas primary interaction の許可条件を整理し、Map Mode に加えて Explore Mode の `cell-icon` + Cell target を許可した
- Explore Mode の `cell-icon` 右クリックでは Cell 状態を変更せず、対象 Cell の Icon だけ削除するようにした
- Workspace の説明文を、地形編集は Map Mode 限定、Cell Icons は Explore / Map 両対応と分かる内容へ更新した

### Files Touched
- `src/store/appStore.ts` — Explore Mode で Cell Icon の配置・削除だけを許可する Canvas interaction 分岐を追加
- `src/App.tsx` — Workspace の Edit Tool / Cell Icons 説明文を更新

### Behavioral Impact
- Explore Mode で `cell-icon` を選択して Canvas 左クリックすると、クリックした Cell に選択中アイコンを配置できる
- Explore Mode で `cell-icon` を選択して Canvas 右クリックすると、クリックした Cell のアイコンだけ削除できる
- `cell-floor` / `cell-unknown` / `edge-*` のマウス編集は、従来どおり Map Mode 限定のまま

### Risk & Mitigation
- Risk: Explore Mode 中に Cell Icon だけマウス編集できるため、モード差分が分かりづらくなる可能性がある
- Mitigation: Workspace の説明文を更新し、地形編集と Cell Icon 配置の扱いを分けて表示した

### Tests / Verification
- `npm run build`
- TypeScript 型検査と Vite 本番ビルド成功を確認

**2026-04-28 10:53 (Asia/Taipei) — Map 範囲選択 / クリップボード実装**

### Summary
- Map Canvas の矩形範囲選択と、アプリ内 copy / cut / paste を実装した

### Context / Goal
- `Doc/MapSelectionClipboardProposal.md` の仕様に沿って、Cell / Edge / Icon をまとめて複製・移動できるようにする
- 保存形式は変えず、OS clipboard ではなくアプリ内 clipboard として扱う

### Changes
- `Shift + drag` による Cell 矩形選択と Canvas overlay 表示を追加
- 選択範囲の `Ctrl+C` / `Ctrl+X` / `Ctrl+V` / `Escape` / `Delete` / `Backspace` 操作を追加
- Cell、外周 Edge、Cell Icon、Edge Icon を相対座標 payload として copy / cut / paste する pure function を追加
- paste が右 / 下にはみ出す場合、既存の map 拡張処理で自動拡張するようにした
- Undo / Redo では clipboard を保持し、階層切り替えや Undo / Redo 後の selection はクリアするようにした

### Files Touched
- `src/types/map.ts` — `CellRect` / `MapClipboardPayload` 型を追加
- `src/lib/mapClipboard.ts` — copy / clear / paste の map clipboard 処理を追加
- `src/store/appStore.ts` — selection / clipboard state と copy / cut / paste actions を追加
- `src/components/MapCanvas.tsx` — `Shift + drag` selection interaction と overlay 描画を追加
- `src/App.tsx` — keyboard shortcut を store actions に接続

### Behavioral Impact
- Map Canvas 上で範囲選択し、選択範囲内の Cell / Edge / Icon をまとめて copy / cut / paste できる
- paste 先は hover Cell を優先し、hover が無い場合は player Cell を左上として扱う
- copy は履歴に積まず、cut / paste / selection contents clear は既存 Undo / Redo の 1 操作として扱う

### Risk & Mitigation
- Risk: Edge の copy 範囲が Cell と異なり、外周 Edge の扱いを誤る可能性がある
- Mitigation: `hEdges = height + 1`、`vEdges = width + 1` として明示的に分離し、payload validate を追加
- Risk: selection と既存 drag paint が競合する可能性がある
- Mitigation: `Shift + drag` 中は selection を優先し、paint / erase を開始しない

### Tests / Verification
- `npm run typecheck`
- `npm run build`

**2026-04-28 11:10 (Asia/Taipei) — 範囲選択 toolbar ボタン追加**

### Summary
- Map Canvas ヘッダーに範囲選択ボタンを追加し、selection mode を切り替えられるようにした

### Context / Goal
- `Shift + drag` だけでは範囲選択機能が見つけづらいため、既存 toolbar と同じ形式の SVG アイコンボタンを追加する
- `Escape` で選択解除し、selection mode も OFF にする方針で統一する

### Changes
- app store に `selectionModeEnabled`、`setSelectionModeEnabled`、`toggleSelectionMode` を追加
- Map Canvas の範囲選択開始条件を `Shift + drag` または selection mode ON に変更
- selection mode ON 中は右クリック等の通常 paint / erase 操作を開始しないようにした
- Map Canvas ヘッダーの toolbar に `Range select` ボタンと同じ線画スタイルの SVG アイコンを追加
- `Escape` キーで選択範囲を解除し、selection mode も OFF にするようにした

### Files Touched
- `src/store/appStore.ts` — selection mode state と切り替え action を追加
- `src/components/MapCanvas.tsx` — selection mode 中の selection 優先分岐を追加
- `src/App.tsx` — toolbar ボタン、SVG アイコン、Escape 終了処理を追加

### Behavioral Impact
- toolbar の `Range select` ボタンを押すと、Shift を押さなくても Canvas drag で範囲選択できる
- selection mode 中は通常の Cell / Edge 編集より範囲選択が優先される
- `Escape` で選択範囲と selection mode の両方が解除される

### Risk & Mitigation
- Risk: selection mode ON のまま通常編集しようとしても paint / erase が実行されない
- Mitigation: toolbar ボタンを active 表示し、`Escape` で明示的に mode OFF へ戻せるようにした

### Tests / Verification
- `npm run typecheck`
- `npm run build`

**2026-04-28 11:17 (Asia/Taipei) — 範囲選択ボタン再押下時の選択解除**

### Summary
- Range select ボタンをもう一度押した時に、selection mode OFF と同時に選択範囲も解除するようにした

### Context / Goal
- `Escape` と同じ解除挙動に揃え、toolbar ボタンだけで範囲選択状態を完全に閉じられるようにする

### Changes
- `toggleSelectionMode` の OFF 分岐で `selectedMapRect` も `null` にするよう変更

### Files Touched
- `src/store/appStore.ts` — selection mode の toggle OFF 時に選択範囲をクリア

### Behavioral Impact
- Range select ボタンを ON にした後、再押下すると選択範囲 overlay も消える
- Escape の解除挙動と toolbar ボタン再押下の挙動が一致する

### Risk & Mitigation
- Risk: 既存の選択範囲を残したまま selection mode だけ OFF にする使い方はできなくなる
- Mitigation: 今回の要求どおり Escape と同じ解除挙動に統一した

### Tests / Verification
- `npm run typecheck`
- `npm run build`

**2026-04-28 13:11 (Asia/Taipei) — Tauri Windows prerelease workflow 追加**

### Summary
- `main` push 時に Windows 版 Tauri パッケージをビルドし、GitHub prerelease へ添付する workflow を追加した

### Context / Goal
- 手動ビルドなしで、確認用の Tauri 配布パッケージを GitHub Release に残せるようにする
- 初期実装として Windows の `.msi` / `.exe` を対象にし、正式 release ではなく prerelease として扱う

### Changes
- `.github/workflows/tauri-prerelease.yml` を追加
- trigger を `push` to `main` に設定
- `contents: write` permission を設定し、GitHub Release 作成を許可
- `npm ci`、Rust toolchain setup、`npm run tauri:build` を Windows runner で実行する構成にした
- CI 内だけ `package.json` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.toml` の version を `0.1.${{ github.run_number }}` に更新
- `v0.1.${{ github.run_number }}` tag の prerelease を作成し、MSI / NSIS installer を assets として添付

### Files Touched
- `.github/workflows/tauri-prerelease.yml` — Tauri Windows prerelease 用 GitHub Actions workflow を追加

### Behavioral Impact
- `main` に push すると GitHub Actions が Windows Tauri build を実行し、成功時に prerelease を作成する
- prerelease の tag / name / app version は GitHub Actions run number ベースで自動採番される
- リポジトリ内の version ファイルは workflow 実行中だけ変更され、commit はされない

### Risk & Mitigation
- Risk: Windows runner 上の Tauri bundler 依存関係や GitHub Release 権限設定により、初回 CI で失敗する可能性がある
- Mitigation: `contents: write` を明示し、まず Windows の MSI / NSIS のみを対象にした。失敗時は Actions log から不足 dependency を追加する
- Risk: `main` push ごとに prerelease が増える
- Mitigation: tag を run number で一意にし、正式 release ではなく prerelease として扱う

### Tests / Verification
- `git diff --check`
- `npm run build`
- GitHub Actions 上の Tauri build / release 作成は未実施（remote runner 実行が必要）
