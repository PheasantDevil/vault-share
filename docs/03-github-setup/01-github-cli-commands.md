# GitHub CLI コマンド一覧（vault-share 初期作成・運用）

## 前提

- [GitHub CLI (gh)](https://cli.github.com/) をインストールし、`gh auth login` で認証済みであること。
- 本リポジトリは **GitHub 上で既に作成済み**（`PheasantDevil/vault-share`）。以下は初期構築時および今後の運用で使うコマンドの一覧です。

---

## 1. 認証・状態確認

```bash
# ログイン（未認証時のみ。ブラウザまたはトークンで認証）
gh auth login

# 認証状態の確認
gh auth status

# 利用可能なアカウントの切り替え（複数アカウント時）
gh auth switch
```

---

## 2. リポジトリの新規作成（未作成の場合）

既存のローカルリポジトリを GitHub に登録する場合:

```bash
# リポジトリルートで実行
cd /Users/Work/vault-share

# プライベートで作成し、カレントディレクトリをソースとしてリモート origin を追加（プッシュは別途）
gh repo create vault-share --private \
  --source=. \
  --remote=origin \
  --description "機密情報を親しい間柄で安全に共有する Web サービス（TypeScript / Next.js / GCP）"
```

**注意**: 同じ名前のリポジトリが既に存在する場合は上記は失敗します。その場合は既存リポジトリにリモートを追加してプッシュ（後述）。

---

## 3. リモートの追加・初回プッシュ（リポジトリは既にある場合）

```bash
cd /Users/Work/vault-share

# リモートが無い場合のみ
git remote add origin https://github.com/PheasantDevil/vault-share.git

# ブランチをプッシュ（初回は -u で上流設定）
git push -u origin main
git push -u origin feature/initial-setup   # 作業用ブランチがある場合
```

---

## 4. リポジトリ設定の更新（gh repo edit）

```bash
# デフォルトブランチを main に設定
gh repo edit --default-branch main

# 説明文を設定
gh repo edit --description "機密情報を親しい間柄で安全に共有する Web サービス（TypeScript / Next.js / GCP）"

# トピック（タグ）を追加
gh repo edit --add-topic typescript --add-topic nextjs --add-topic gcp --add-topic firestore --add-topic pulumi

# 公開範囲の変更（必要に応じて）
gh repo edit --visibility private   # または public / internal
```

---

## 5. リポジトリ情報の確認

```bash
# 概要（URL・説明・デフォルトブランチ・公開範囲）
gh repo view

# JSON で詳細取得
gh repo view --json name,description,defaultBranchRef,url,visibility,repositoryTopics
```

---

## 6. 日常のプッシュ・PR

```bash
# 現在のブランチをプッシュ
git push

# PR 作成（カレントブランチ → main）
gh pr create --base main --title "feat: 機能名" --body "変更内容"

# PR 一覧
gh pr list

# PR をマージ（例: 番号 1 の PR）
gh pr merge 1
```

---

## 7. 手動で行う設定（Web UI）

以下の設定は GitHub の Web 上で行う想定です。

- **Branch protection rules**: Settings → Branches → Add rule（main の保護など）
- **Actions の権限**: Settings → Actions → General（Workflow permissions）
- **Secrets / Variables**: Settings → Secrets and variables → Actions（GCP デプロイ用の OIDC 等）
- **Collaborators**: Settings → Collaborators（メンバー追加）

---

## 8. 本リポジトリで実行済みの初期構築（参考）

- リポジトリは既に存在していたため `gh repo create` は未使用。`origin` は既に設定済み。
- `main` を `feature/initial-setup` から作成し `git push -u origin main` でプッシュ。
- `gh repo edit --default-branch main` でデフォルトブランチを main に変更。
- `gh repo edit --description "..." --add-topic typescript ...` で説明とトピックを設定。
