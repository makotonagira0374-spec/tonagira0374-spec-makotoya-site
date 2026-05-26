# ブログ管理の流れ

ブログ一覧は、各記事HTMLを元に `tools/sync-blog-management.mjs` で同期します。

## 新しい記事を追加するとき

1. `blog/` に記事HTMLを追加する
2. 記事HTMLの `<title>`、`meta description`、`og:image`、JSON-LDの `datePublished` を入れる
3. 必要なら記事上部の `.article-hero__meta` に `カテゴリ ...` を入れる
4. 次のコマンドを実行する

```powershell
node tools\sync-blog-management.mjs
```

このコマンドで `blog/posts.js` と `blog/index.html` 内のブログ構造化データが更新されます。

## 補足

- `blog/posts.js` は手で編集せず、記事HTMLから再生成する前提です。
- 既存の `alt` と `tag` は、過去の `posts.js` にある値をできるだけ引き継ぎます。
- 一覧ページの表示順は `datePublished` の新しい順です。
