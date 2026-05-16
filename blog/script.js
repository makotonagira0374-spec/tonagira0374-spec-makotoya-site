const header = document.querySelector('.blog-header');
const postGrid = document.querySelector('[data-blog-post-grid]');
const pagination = document.querySelector('[data-blog-pagination]');
const blogPostsData = Array.isArray(window.BLOG_POSTS) ? window.BLOG_POSTS : null;

function syncHeaderState() {
  if (!header) return;
  header.classList.toggle('is-scrolled', window.scrollY > 8);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDisplayDate(dateValue) {
  if (typeof dateValue !== 'string') return '';
  return dateValue.replaceAll('-', '.');
}

function createPostCard(post) {
  const article = document.createElement('article');
  article.className = 'blog-card blog-card--featured';
  article.dataset.postSlug = String(post.href || '')
    .replace(/^\.\/+/, '')
    .replace(/\.html$/, '');

  article.innerHTML = `
    <a class="blog-card__media" href="${escapeHtml(post.href)}">
      <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.alt)}" loading="lazy" decoding="async" />
    </a>
    <div class="blog-card__body">
      <div class="blog-card__meta">
        <span>${escapeHtml(post.category)}</span>
        <span>${escapeHtml(post.tag)}</span>
        <time datetime="${escapeHtml(post.date)}">${escapeHtml(formatDisplayDate(post.date))}</time>
      </div>
      <h3><a href="${escapeHtml(post.href)}">${escapeHtml(post.title)}</a></h3>
      <p>${escapeHtml(post.excerpt)}</p>
      <div class="blog-card__actions">
        <a class="blog-btn blog-btn--ghost" href="${escapeHtml(post.href)}">記事を読む</a>
      </div>
    </div>
  `;

  return article;
}

function syncUrl(page) {
  const url = new URL(window.location.href);
  if (page === 1) {
    url.searchParams.delete('page');
  } else {
    url.searchParams.set('page', String(page));
  }
  window.history.replaceState({}, '', url);
}

function scrollToArticles() {
  const articlesSection = document.querySelector('#articles');
  if (!articlesSection) return;
  const top = articlesSection.getBoundingClientRect().top + window.scrollY - 18;
  window.scrollTo({ top, behavior: 'smooth' });
}

function initBlogPagination() {
  if (!postGrid || !pagination) return;

  const pageSize = Number.parseInt(postGrid.dataset.blogPageSize || '5', 10);
  const maxVisiblePages = 5;
  const staticPosts = Array.from(postGrid.children).filter((child) => child.classList.contains('blog-card'));
  const posts = blogPostsData && blogPostsData.length
    ? blogPostsData
        .map((post, index) => ({ ...post, __index: index }))
        .sort((a, b) => {
          if (a.date === b.date) {
            return a.__index - b.__index;
          }

          return b.date.localeCompare(a.date);
        })
        .map(({ __index, ...post }) => post)
    : staticPosts;
  const totalPages = Math.ceil(posts.length / pageSize);

  if (!Number.isFinite(pageSize) || pageSize < 1 || totalPages <= 1) {
    pagination.hidden = true;
    return;
  }

  const prevButton = pagination.querySelector('[data-blog-prev]');
  const nextButton = pagination.querySelector('[data-blog-next]');
  const pagesContainer = pagination.querySelector('[data-blog-pages]');
  const status = pagination.querySelector('[data-blog-page-status]');
  const urlPage = new URLSearchParams(window.location.search).get('page');
  let currentPage = Number.parseInt(urlPage || '1', 10);

  if (!Number.isFinite(currentPage)) currentPage = 1;
  currentPage = Math.min(Math.max(currentPage, 1), totalPages);

  function getVisiblePageRange() {
    if (totalPages <= maxVisiblePages) {
      return { start: 1, end: totalPages };
    }

    const halfWindow = Math.floor(maxVisiblePages / 2);
    const maxStart = totalPages - maxVisiblePages + 1;
    const start = Math.min(Math.max(1, currentPage - halfWindow), maxStart);

    return {
      start,
      end: start + maxVisiblePages - 1
    };
  }

  function renderPageButtons() {
    if (!pagesContainer) return;

    const { start, end } = getVisiblePageRange();
    pagesContainer.innerHTML = '';

    for (let page = start; page <= end; page += 1) {
      const button = document.createElement('button');
      const isActive = page === currentPage;

      button.className = 'blog-pagination__page';
      button.type = 'button';
      button.textContent = String(page);
      button.setAttribute('aria-label', `${page}ページを表示`);
      button.setAttribute('aria-current', isActive ? 'page' : 'false');
      button.classList.toggle('is-active', isActive);
      button.addEventListener('click', () => setPage(page));
      pagesContainer.appendChild(button);
    }
  }

  function renderPostsFromData() {
    const firstPost = (currentPage - 1) * pageSize;
    const currentPosts = posts.slice(firstPost, firstPost + pageSize);
    const fragment = document.createDocumentFragment();

    currentPosts.forEach((post) => {
      fragment.appendChild(createPostCard(post));
    });

    postGrid.replaceChildren(fragment);
  }

  function renderStaticPosts() {
    const firstPost = (currentPage - 1) * pageSize;
    const lastPost = firstPost + pageSize;

    staticPosts.forEach((post, index) => {
      post.hidden = index < firstPost || index >= lastPost;
    });
  }

  function render() {
    if (blogPostsData && blogPostsData.length) {
      renderPostsFromData();
    } else {
      renderStaticPosts();
    }

    if (prevButton) prevButton.disabled = currentPage === 1;
    if (nextButton) nextButton.disabled = currentPage === totalPages;
    if (status) status.textContent = `${currentPage} / ${totalPages}ページ`;

    renderPageButtons();
  }

  function setPage(page, shouldScroll = true) {
    currentPage = Math.min(Math.max(page, 1), totalPages);
    render();
    syncUrl(currentPage);
    if (shouldScroll) scrollToArticles();
  }

  if (prevButton) {
    prevButton.addEventListener('click', () => setPage(currentPage - 1));
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => setPage(currentPage + 1));
  }

  pagination.hidden = false;
  render();
  syncUrl(currentPage);
}

syncHeaderState();
window.addEventListener('scroll', syncHeaderState, { passive: true });
initBlogPagination();
