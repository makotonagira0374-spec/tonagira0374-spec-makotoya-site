const header = document.querySelector('.blog-header');
const postGrid = document.querySelector('[data-blog-post-grid]');
const pagination = document.querySelector('[data-blog-pagination]');

function syncHeaderState() {
  if (!header) return;
  header.classList.toggle('is-scrolled', window.scrollY > 8);
}

syncHeaderState();
window.addEventListener('scroll', syncHeaderState, { passive: true });

function initBlogPagination() {
  if (!postGrid || !pagination) return;

  const pageSize = Number.parseInt(postGrid.dataset.blogPageSize || '5', 10);
  const posts = Array.from(postGrid.children).filter((child) => child.classList.contains('blog-card'));
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

  function syncUrl() {
    const url = new URL(window.location.href);
    if (currentPage === 1) {
      url.searchParams.delete('page');
    } else {
      url.searchParams.set('page', String(currentPage));
    }
    window.history.replaceState({}, '', url);
  }

  function scrollToArticles() {
    const articlesSection = document.querySelector('#articles');
    if (!articlesSection) return;
    const top = articlesSection.getBoundingClientRect().top + window.scrollY - 18;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  function render() {
    const firstPost = (currentPage - 1) * pageSize;
    const lastPost = firstPost + pageSize;

    posts.forEach((post, index) => {
      post.hidden = index < firstPost || index >= lastPost;
    });

    if (prevButton) prevButton.disabled = currentPage === 1;
    if (nextButton) nextButton.disabled = currentPage === totalPages;
    if (status) status.textContent = `${currentPage} / ${totalPages}ページ`;

    if (pagesContainer) {
      Array.from(pagesContainer.children).forEach((button, index) => {
        const page = index + 1;
        const isActive = page === currentPage;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-current', isActive ? 'page' : 'false');
      });
    }
  }

  function setPage(page, shouldScroll = true) {
    currentPage = Math.min(Math.max(page, 1), totalPages);
    render();
    syncUrl();
    if (shouldScroll) scrollToArticles();
  }

  if (pagesContainer) {
    pagesContainer.innerHTML = '';
    for (let page = 1; page <= totalPages; page += 1) {
      const button = document.createElement('button');
      button.className = 'blog-pagination__page';
      button.type = 'button';
      button.textContent = String(page);
      button.setAttribute('aria-label', `${page}ページ目を表示`);
      button.addEventListener('click', () => setPage(page));
      pagesContainer.appendChild(button);
    }
  }

  if (prevButton) {
    prevButton.addEventListener('click', () => setPage(currentPage - 1));
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => setPage(currentPage + 1));
  }

  pagination.hidden = false;
  render();
  syncUrl();
}

initBlogPagination();
