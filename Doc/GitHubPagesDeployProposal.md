# GitHub Pages デプロイ実装案

## 1. 概要

`main` ブランチへの push をトリガーに、GitHub Actions で Web 版をビルドし、`dist/` を GitHub Pages へデプロイします。  
Tauri アプリのビルドや配布はこの workflow には含めず、ブラウザ版の公開だけを対象にします。

## 2. ゴール / 非ゴール

### ゴール
- `push` を契機に Web 版を自動で GitHub Pages へ公開する
- Vite の `dist/` を公式の Pages Actions でデプロイする
- ローカル開発と Tauri ビルドに影響しない形で Pages 用 `base` を設定する

### 非ゴール
- Tauri の Windows installer / exe を GitHub Releases へ配布する workflow は作らない
- preview 環境や PR ごとの一時デプロイは対象外
- カスタムドメイン設定は対象外

## 3. 前提・仮定

- GitHub Pages の source は `GitHub Actions` に設定する
- デプロイ対象ブランチは `main` とする
- リポジトリ名は `Web-Auto-Mapping` とする
- Pages URL は通常 `https://<owner>.github.io/Web-Auto-Mapping/` になる
- `npm run build` は Web 版ビルドとして通る前提

## 4. 現状整理

### 現在の構成
- `package.json`
  - `npm run build` は `tsc --noEmit -p tsconfig.app.json && vite build`
- `vite.config.ts`
  - 現在は `base` 未指定
- 出力先
  - Vite 既定の `dist/`

### 課題
- GitHub Pages のサブパス配信では、Vite の asset path が `/assets/...` のままだと 404 になりやすい
- ローカル開発や Tauri では `base: '/'` 相当が自然なので、常に `/Web-Auto-Mapping/` に固定すると別 runtime へ影響する

## 5. 提案アーキテクチャ

### Workflow
1. `main` への push で workflow 起動
2. Node.js をセットアップ
3. `npm ci`
4. `npm run build`
5. `dist/` を Pages artifact として upload
6. GitHub Pages へ deploy

### Vite base
`vite.config.ts` で GitHub Actions 実行時だけ base を切り替えます。

- GitHub Actions 上
  - `base: '/Web-Auto-Mapping/'`
- ローカル / Tauri
  - `base: '/'`

理由:
- Pages のサブパス配信に対応する
- Tauri とローカル開発の asset 解決を壊さない

## 6. インターフェース設計

### 追加 workflow
- `.github/workflows/deploy-pages.yml`

### 必要 permission
- `contents: read`
- `pages: write`
- `id-token: write`

### GitHub Actions concurrency
- `group: pages`
- `cancel-in-progress: false`

理由:
- Pages の公式 template に近い構成にし、同時 deploy の競合を避ける

## 7. 実装手順

### Step 1
- `vite.config.ts` に Pages 用 `base` 切替を追加する
- `process.env.GITHUB_ACTIONS === 'true'` を判定に使う

### Step 2
- `.github/workflows/deploy-pages.yml` を追加する
- `actions/checkout`
- `actions/setup-node`
- `actions/configure-pages`
- `actions/upload-pages-artifact`
- `actions/deploy-pages`

### Step 3
- ローカルで `npm run build` を確認する
- 可能なら `GITHUB_ACTIONS=true npm run build` 相当で Pages base のビルドも確認する

### Step 4
- GitHub 側で Pages source を `GitHub Actions` に設定する
- `main` へ push して Actions と Pages の公開結果を確認する

## 8. 非機能要件チェック

### 性能
- static asset 配信のみで、実行時性能への影響は小さい

### セキュリティ
- Pages deploy 用 permission は最小限にする
- Tauri ビルドや secrets は使わない

### 可観測性
- GitHub Actions の workflow log で build / deploy の失敗を確認できる

### 互換性
- `GITHUB_ACTIONS` 判定により、ローカル開発と Tauri ビルドの base は従来どおりに保つ

### 運用
- Web 版公開と Tauri 配布は workflow を分ける

## 9. リスクと緩和策

- Risk: Pages URL のリポジトリ名と `base` が一致しないと asset が 404 になる
- Mitigation: `base` を `/Web-Auto-Mapping/` に固定し、リポジトリ名変更時は `vite.config.ts` を更新する

- Risk: GitHub Pages の source が `Deploy from branch` のままだと Actions deploy が反映されない
- Mitigation: GitHub repository settings で Pages source を `GitHub Actions` に変更する手順を明記する

- Risk: Tauri ビルド時に Pages 用 base が混入する
- Mitigation: `GITHUB_ACTIONS === 'true'` のときだけ Pages base に切り替える

## 10. 影響範囲

- `.github/workflows/deploy-pages.yml`
  - GitHub Pages deploy workflow を追加
- `vite.config.ts`
  - GitHub Actions 上だけ Pages 用 base を設定

## 11. Definition of Done

- `main` への push で GitHub Actions が起動する
- `npm ci` と `npm run build` が workflow 上で成功する
- `dist/` が GitHub Pages へデプロイされる
- Pages URL で JS / CSS が 404 にならずアプリが表示される
- ローカルの `npm run build` が従来どおり成功する
