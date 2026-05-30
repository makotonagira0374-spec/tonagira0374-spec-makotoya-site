import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const blogDir = path.join(rootDir, 'blog');
const postsJsPath = path.join(blogDir, 'posts.js');
const indexPath = path.join(blogDir, 'index.html');
const siteOrigin = 'https://makotoyarickshaw.jp';

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function decodeHtml(value = '') {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(value = '') {
  return decodeHtml(value.replace(/<[^>]*>/g, ' '));
}

function extractMeta(html, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `<meta\\s+(?:property|name)=["']${escapedKey}["']\\s+content=["']([^"']*)["']\\s*\\/?>`,
    'i'
  );
  return decodeHtml(html.match(pattern)?.[1] || '');
}

function extractJsonLdValue(html, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`"${escapedKey}"\\s*:\\s*"([^"]+)"`, 'i');
  return decodeHtml(html.match(pattern)?.[1] || '');
}

function extractTitle(html) {
  const ogTitle = extractMeta(html, 'og:title');
  const rawTitle = ogTitle || stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  return rawTitle
    .replace(/\s*[|｜]\s*誠屋ブログ\s*$/u, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractHeroMeta(html, label) {
  const metaBlock = html.match(/<div[^>]+class=["'][^"']*(?:article-hero__meta|article-meta)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] || '';
  const spans = [...metaBlock.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)].map((match) => stripTags(match[1]));
  const value = spans.find((span) => span.startsWith(label));
  return value ? value.replace(label, '').trim() : '';
}

function normalizeImageForBlog(imageUrl) {
  if (!imageUrl) return '../ogp.jpg';
  return imageUrl
    .replace(`${siteOrigin}/`, '../')
    .replace(/^https?:\/\/[^/]+\//, '../')
    .replace(/^\/+/, '../');
}

function normalizeHref(fileName) {
  return `./${fileName}`;
}

function toAbsoluteBlogUrl(href) {
  return `${siteOrigin}/blog/${href.replace(/^\.\//, '')}`;
}

function parseExistingPosts() {
  if (!fs.existsSync(postsJsPath)) return new Map();

  const source = readUtf8(postsJsPath);
  const jsonText = source
    .replace(/^\s*window\.BLOG_POSTS\s*=\s*/u, '')
    .replace(/;\s*$/u, '');

  try {
    return new Map(JSON.parse(jsonText).map((post) => [post.href, post]));
  } catch {
    return new Map();
  }
}

function collectPost(fileName, existingPosts) {
  const html = readUtf8(path.join(blogDir, fileName));
  const href = normalizeHref(fileName);
  const existing = existingPosts.get(href) || {};
  const date = extractJsonLdValue(html, 'datePublished') || extractHeroMeta(html, '公開日').replaceAll('.', '-');
  const category = extractHeroMeta(html, 'カテゴリ') || existing.category || '誠屋ブログ';
  const tag = extractHeroMeta(html, 'タグ');
  const existingTag = existing.tag === '誠屋ブログ' ? '' : existing.tag;
  const description = extractMeta(html, 'description') || extractMeta(html, 'og:description') || existing.excerpt || '';

  return {
    href,
    image: normalizeImageForBlog(extractMeta(html, 'og:image') || existing.image),
    alt: existing.alt || `${extractTitle(html)}のイメージ`,
    category,
    tag: tag || existingTag || category,
    date,
    title: extractTitle(html) || existing.title || fileName.replace(/\.html$/u, ''),
    excerpt: description
  };
}

function writePostsJs(posts) {
  const output = `window.BLOG_POSTS = ${JSON.stringify(posts, null, 2)};\n`;
  fs.writeFileSync(postsJsPath, output, 'utf8');
}

function buildBlogSchema(posts) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: '誠屋ブログ',
    url: `${siteOrigin}/blog/`,
    publisher: {
      '@type': 'Organization',
      name: '誠屋',
      url: `${siteOrigin}/`
    },
    blogPost: posts.slice(0, 10).map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: toAbsoluteBlogUrl(post.href)
    }))
  };
}

function updateIndexSchema(posts) {
  const html = readUtf8(indexPath);
  const schema = JSON.stringify(buildBlogSchema(posts), null, 2);
  const scriptStartPattern = /<script[^>]*application\/ld\+json[^>]*>/u;
  const scriptStartMatch = html.match(scriptStartPattern);

  if (!scriptStartMatch || typeof scriptStartMatch.index !== 'number') {
    throw new Error('Could not find Blog JSON-LD block in blog/index.html');
  }

  const scriptStart = scriptStartMatch.index;
  const contentStart = scriptStart + scriptStartMatch[0].length;
  const scriptEnd = html.indexOf('</script>', contentStart);

  if (scriptEnd === -1) {
    throw new Error('Could not find closing Blog JSON-LD script tag in blog/index.html');
  }

  const updated = `${html.slice(0, scriptStart)}<script type="application/ld+json">\n${schema}\n</script>${html.slice(scriptEnd + '</script>'.length)}`;

  fs.writeFileSync(indexPath, updated.replaceAll('>?????</a>', '>記事を読む</a>'), 'utf8');
}

const existingPosts = parseExistingPosts();
const posts = fs
  .readdirSync(blogDir)
  .filter((fileName) => fileName.endsWith('.html') && fileName !== 'index.html')
  .map((fileName) => collectPost(fileName, existingPosts))
  .filter((post) => post.date)
  .sort((a, b) => b.date.localeCompare(a.date) || a.href.localeCompare(b.href));

writePostsJs(posts);
updateIndexSchema(posts);

console.log(`Synced ${posts.length} blog posts.`);
console.log(`Updated ${path.relative(rootDir, postsJsPath)}`);
console.log(`Updated ${path.relative(rootDir, indexPath)}`);
