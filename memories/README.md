# 誠屋 お客様納品ページ 運用メモ

## 全体構成

写真・動画をただ置くのではなく、QRコードから開いた瞬間に「作品を受け取る体験」になるように、共通テンプレートで表示しています。

- `memories/shared/style.css`: 見た目を管理します。
- `memories/shared/page.js`: ページ生成、ライトボックス、保存ボタンを管理します。
- `memories/shared/data.js`: お客様ごとの情報を管理します。基本的にはここを編集します。
- `memories/{slug}/index.html`: お客様専用URLの入口です。

## サンプルURL

`/memories/2026-04-03-tanaka-k7m2p9/`

実写真テスト用:

`/memories/2026-03-22-test/`

このテストページは、デスクトップの `水間門前町フォトプラン/2026.3.22` に入っていた写真を `memories/assets/2026-03-22-test/` にコピーして表示しています。

slugは、日付・お名前・ランダム文字を組み合わせると推測されにくくなります。

例:

- `2026-04-03-tanaka-k7m2p9`
- `2026-04-10-yamada-r4q8w2`
- `2026-05-01-sato-h9x3ka`

## 新しいお客様ページを追加する手順

1. `memories/shared/data.js` に、お客様データを1件追加します。
2. `memories/2026-04-03-tanaka-k7m2p9/` フォルダをコピーして、新しいslug名に変更します。
3. コピーした `index.html` の `window.MAKOTOYA_MEMORY_SLUG` を新しいslugに変更します。
4. OGPをきれいに出したい場合は、コピーした `index.html` の `title`、`description`、`og:image`、`og:url` もお客様ごとに変更します。
5. ブラウザで `/memories/{slug}/` を開いて確認します。

## お客様データの書き方

```js
{
  slug: "2026-04-10-yamada-r4q8w2",
  customerName: "山田様",
  date: "2026年4月10日",
  title: "山田様 記念日フォト・ムービー",
  mainCopy: "この日の空気を、もう一度。",
  heroImage: "memories/assets/2026-04-10-yamada-r4q8w2/hero.jpg",
  movieUrl: "memories/assets/2026-04-10-yamada-r4q8w2/movie.mp4",
  movieDownloadUrl: "memories/assets/2026-04-10-yamada-r4q8w2/movie.mp4",
  galleryImages: [
    {
      src: "memories/assets/2026-04-10-yamada-r4q8w2/photo-01.jpg",
      alt: "山田様 記念日フォト 1",
      caption: "はじまりの一枚"
    }
  ],
  zipDownloadUrl: "memories/assets/2026-04-10-yamada-r4q8w2/photos.zip",
  message: "本日はご利用いただきありがとうございました。\n\n大切な一日が、これからも何度でも思い返せる時間になりますように。"
}
```

## 画像・動画の置き場所

運用では、以下のようにお客様ごとにフォルダを分けると管理しやすいです。

```text
memories/
  assets/
    2026-04-10-yamada-r4q8w2/
      hero.jpg
      movie.mp4
      photo-01.jpg
      photo-02.jpg
      photos.zip
```

写真はスマホ表示を考えて、長辺2000px前後、1枚あたり500KBから1.5MB程度を目安にすると読み込みが安定します。動画は重くなりやすいので、スマホ再生用に圧縮したMP4を置き、必要であれば高画質版はZIPや別リンクで渡してください。

## GitHub Pagesで公開する手順

1. ファイルを追加・編集します。
2. ローカルで `python -m http.server 8000` などを使い、`http://localhost:8000/memories/{slug}/` を確認します。
3. 問題がなければGitHubへpushします。
4. 数分後、`https://makotoyarickshaw.jp/memories/{slug}/` で確認します。
5. そのURLをQRコード化します。

## QRコード運用

QRコードに入れるURLは、必ずslugまで含めます。

`https://makotoyarickshaw.jp/memories/2026-04-03-tanaka-k7m2p9/`

カードや台紙に印刷する前に、iPhoneとAndroidの両方で読み取り確認してください。印刷物には「写真と映像のお受け取りはこちら」など、納品感が出すぎない文言がおすすめです。

## 公開範囲と安全性

この構成はログイン制ではありません。URLを知っている人が見られる方式です。

安全性を少し高めるために、slugにはランダム文字を入れてください。`tanaka` だけ、`2026-04-03-tanaka` だけのようなURLは推測されやすいです。

より安全にしたい場合は、将来的に以下を検討できます。

- Vercelで簡易パスワードを付ける
- ページ側に簡易合言葉入力を付ける
- 写真・動画を期限付きURLで配信する

ただし、運用が複雑になりすぎる場合は、まずは推測されにくいslugで十分です。

## ここだけ触れば使えます

日常運用で触る場所は、基本的にこの2つです。

- `memories/shared/data.js`
- `memories/{slug}/index.html` の `window.MAKOTOYA_MEMORY_SLUG`

見た目を変えたいときだけ `memories/shared/style.css` を触ってください。

## ZIP受け取り特化ページ

現在のテストページ `/memories/2026-03-22-test/` は、スマホで迷わずZIPを受け取るための静的ページです。

編集する場所:

- ベストショット: `memories/{slug}/index.html` の `<img src="...">`
- ZIPファイル: `memories/{slug}/index.html` の `href="/memories/assets/{slug}/photos.zip"`
- 保存時のファイル名: `download="makotoya-日付-photos.zip"`
- LINE導線: 不要なら `delivery-line` の1行を削除
- 見た目: `memories/shared/download.css`
