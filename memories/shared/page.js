(function () {
  "use strict";

  const pages = window.MAKOTOYA_MEMORY_PAGES || [];
  const root = document.querySelector("[data-memory-root]");
  const loading = document.querySelector("[data-memory-loading]");
  const basePath = normalizeBase(window.MAKOTOYA_MEMORY_BASE || "");

  if (!root) {
    return;
  }

  const slug = getCurrentSlug();
  const page = pages.find((item) => item.slug === slug);

  if (!page) {
    renderNotFound(slug);
    finishLoading();
    return;
  }

  setDocumentMeta(page);
  renderPage(page);
  setupLightbox();
  finishLoading();

  function getCurrentSlug() {
    // slug別HTMLで指定された値を最優先にします。
    if (window.MAKOTOYA_MEMORY_SLUG) {
      return String(window.MAKOTOYA_MEMORY_SLUG).trim();
    }

    // 確認用に /memories/?slug=xxx でも開けるようにしています。
    const params = new URLSearchParams(window.location.search);
    const slugFromQuery = params.get("slug");
    if (slugFromQuery) {
      return slugFromQuery.trim();
    }

    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const memoriesIndex = pathParts.indexOf("memories");
    if (memoriesIndex >= 0 && pathParts[memoriesIndex + 1]) {
      return decodeURIComponent(pathParts[memoriesIndex + 1]);
    }

    return "";
  }

  function normalizeBase(path) {
    if (!path) {
      return "";
    }

    return path.endsWith("/") ? path : `${path}/`;
  }

  function assetUrl(path) {
    // お客様データには "photo/xxx.jpg" のように書き、表示ページの階層に合わせて補完します。
    if (!path) {
      return "";
    }

    const value = String(path);
    if (/^(https?:|data:|blob:|\/)/.test(value)) {
      return value;
    }

    return `${basePath}${value.replace(/^\.?\//, "")}`;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function textWithBreaks(value) {
    return escapeHtml(value).replace(/\n/g, "<br>");
  }

  function fileNameFromUrl(url, fallback) {
    const cleanUrl = String(url || "").split("?")[0].split("#")[0];
    const name = cleanUrl.split("/").filter(Boolean).pop();
    return name || fallback;
  }

  function normalizeImage(image, index) {
    if (typeof image === "string") {
      return {
        src: image,
        alt: `${page.customerName || "お客様"} 記念日フォト ${index + 1}`,
        caption: ""
      };
    }

    return {
      src: image.src || "",
      alt: image.alt || `${page.customerName || "お客様"} 記念日フォト ${index + 1}`,
      caption: image.caption || ""
    };
  }

  function setMeta(selector, value) {
    const target = document.querySelector(selector);
    if (target && value) {
      target.setAttribute("content", value);
    }
  }

  function setDocumentMeta(item) {
    const title = `${item.title || "お客様の思い出"} | 人力車 誠屋`;
    const description = `${item.customerName || "お客様"}へ、誠屋から写真と映像をお届けします。${item.mainCopy || "あの日のあなたに、戻れる場所。"}`;
    const ogImage = assetUrl(item.heroImage);

    document.title = title;
    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:image"]', ogImage);
    setMeta('meta[property="og:url"]', window.location.href);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);
    setMeta('meta[name="twitter:image"]', ogImage);
  }

  function renderPage(item) {
    // ここで、1件分のお客様データを体験ページに組み立てます。
    const heroImage = assetUrl(item.heroImage);
    const movieUrl = assetUrl(item.movieUrl);
    const movieDownloadUrl = assetUrl(item.movieDownloadUrl || item.movieUrl);
    const zipDownloadUrl = assetUrl(item.zipDownloadUrl);
    const gallery = (item.galleryImages || []).map(normalizeImage);
    const hasMovie = Boolean(movieUrl);
    const firstSectionHref = hasMovie ? "#movie" : "#gallery";

    root.innerHTML = `
      <article class="memory-page">
        <section class="memory-hero" aria-label="思い出のファーストビュー">
          <img class="memory-hero__image" src="${escapeHtml(heroImage)}" alt="${escapeHtml(item.title || "誠屋の記念日フォト")}" decoding="async" data-fallback-image>
          <div class="memory-hero__shade" aria-hidden="true"></div>
          <div class="memory-hero__inner">
            <p class="memory-brand">人力車 誠屋</p>
            <p class="memory-eyebrow">Anniversary Memories</p>
            <h1>${escapeHtml(item.mainCopy || "この日の空気を、もう一度。")}</h1>
            <p class="memory-hero__title">${escapeHtml(item.title || "")}</p>
            <p class="memory-hero__meta">${escapeHtml(item.customerName || "")} / ${escapeHtml(item.date || "")}</p>
            <a class="memory-hero__button" href="${firstSectionHref}">作品を受け取る</a>
          </div>
        </section>

        <section class="memory-section memory-intro" aria-label="このページについて">
          <div class="memory-container memory-intro__grid">
            <p class="memory-section__label">Your Day, Preserved</p>
            <div>
              <h2>あの日のあなたに、戻れる場所。</h2>
              <p>
                写真と映像を、ただ保存するためだけではなく、何度でもその時間を味わえるように整えました。
                静かな時間に、ゆっくりご覧ください。
              </p>
            </div>
          </div>
        </section>

        <section class="memory-section memory-movie" id="movie" aria-label="ムービー">
          <div class="memory-container">
            <div class="memory-section__heading">
              <p class="memory-section__label">Movie</p>
              <h2>${hasMovie ? "その日の空気ごと、映像で。" : "写真で受け取る、記念日の時間。"}</h2>
              <p>${hasMovie ? "音が出てもよい場所で、再生ボタンを押してご覧ください。" : "今回のテストページでは、2026.3.22フォルダの写真をギャラリーとして表示しています。"}</p>
            </div>

            <div class="memory-movie__frame">
              ${movieUrl ? `
                <video controls playsinline preload="metadata" poster="${escapeHtml(heroImage)}">
                  <source src="${escapeHtml(movieUrl)}">
                  お使いのブラウザでは動画を再生できません。
                </video>
              ` : `
                <div class="memory-empty">
                  <p>今回はフォトプランのため、写真ギャラリーから作品をお受け取りください。</p>
                </div>
              `}
            </div>

            <div class="memory-actions">
              ${movieDownloadUrl ? `
                <a class="memory-button memory-button--primary" href="${escapeHtml(movieDownloadUrl)}" download="${escapeHtml(fileNameFromUrl(movieDownloadUrl, "makotoya-movie.mp4"))}">動画を保存する</a>
              ` : ""}
              <a class="memory-button" href="#save-guide">保存方法を見る</a>
            </div>
          </div>
        </section>

        <section class="memory-section memory-gallery" id="gallery" aria-label="フォトギャラリー">
          <div class="memory-container">
            <div class="memory-section__heading">
              <p class="memory-section__label">Photo Gallery</p>
              <h2>日常に、埋もれない一瞬を。</h2>
              <p>写真をタップすると大きく表示できます。保存ボタンから1枚ずつ受け取れます。</p>
            </div>

            <div class="memory-gallery__actions">
              ${zipDownloadUrl ? `
                <a class="memory-button memory-button--primary" href="${escapeHtml(zipDownloadUrl)}" download="${escapeHtml(fileNameFromUrl(zipDownloadUrl, "makotoya-photos.zip"))}">写真をまとめて保存する</a>
              ` : `
                <p>まとめて保存用のZIPを用意する場合は、データの <code>zipDownloadUrl</code> にZIPファイルのパスを入れてください。</p>
              `}
            </div>

            <div class="memory-gallery__grid">
              ${gallery.map((image, index) => renderGalleryItem(image, index)).join("")}
            </div>
          </div>
        </section>

        <section class="memory-section memory-message" aria-label="誠屋からのメッセージ">
          <div class="memory-container memory-message__inner">
            <p class="memory-section__label">Message</p>
            <h2>誠屋より、心をこめて。</h2>
            <p>${textWithBreaks(item.message || "")}</p>
          </div>
        </section>

        <section class="memory-section memory-save" id="save-guide" aria-label="保存方法の案内">
          <div class="memory-container">
            <div class="memory-section__heading">
              <p class="memory-section__label">Save Guide</p>
              <h2>スマートフォンへの保存方法</h2>
              <p>機種やブラウザにより表示は少し異なります。迷ったときは、写真を大きく開いて長押ししてください。</p>
            </div>

            <div class="memory-save__grid">
              <article class="memory-save__item">
                <h3>iPhone / Safari</h3>
                <p>写真は「保存」ボタン、または拡大後に長押しして保存できます。動画はボタンを押した後、共有メニューから“ビデオを保存”を選んでください。</p>
              </article>
              <article class="memory-save__item">
                <h3>Android / Chrome</h3>
                <p>写真・動画の保存ボタンを押すと、ダウンロードが始まります。通知や「Files」「ギャラリー」アプリから確認できます。</p>
              </article>
            </div>
          </div>
        </section>

        <footer class="memory-footer">
          <div class="memory-container">
            <p>思い出が、また今日の力になりますように。</p>
            <small>&copy; 人力車 誠屋 / Mizuma Monzenmachi Rickshaw</small>
          </div>
        </footer>
      </article>

      <dialog class="memory-lightbox" data-lightbox aria-label="写真の拡大表示">
        <button class="memory-lightbox__close" type="button" data-lightbox-close>閉じる</button>
        <img src="" alt="" data-lightbox-image>
        <p data-lightbox-caption></p>
        <a class="memory-button memory-button--primary" href="#" download data-lightbox-download>この写真を保存する</a>
      </dialog>
    `;

    setupImageFallbacks();
  }

  function renderGalleryItem(image, index) {
    const url = assetUrl(image.src);
    const fileName = fileNameFromUrl(url, `makotoya-photo-${index + 1}.jpg`);

    return `
      <figure class="memory-photo">
        <button class="memory-photo__image-button" type="button" data-lightbox-open data-image-src="${escapeHtml(url)}" data-image-alt="${escapeHtml(image.alt)}" data-image-caption="${escapeHtml(image.caption)}" data-download-name="${escapeHtml(fileName)}">
          <img src="${escapeHtml(url)}" alt="${escapeHtml(image.alt)}" loading="lazy" decoding="async" data-fallback-image>
        </button>
        <figcaption>
          <span>${escapeHtml(image.caption || `Photo ${index + 1}`)}</span>
          <a href="${escapeHtml(url)}" download="${escapeHtml(fileName)}">保存</a>
        </figcaption>
      </figure>
    `;
  }

  function setupImageFallbacks() {
    const images = root.querySelectorAll("[data-fallback-image]");

    images.forEach((image) => {
      image.addEventListener("error", () => {
        const holder = document.createElement("div");
        holder.className = "memory-image-fallback";
        holder.textContent = "画像を読み込めませんでした";
        image.replaceWith(holder);
      }, { once: true });
    });
  }

  function setupLightbox() {
    // 写真をタップしたときの拡大表示です。未対応ブラウザでは open 属性で代替します。
    const dialog = root.querySelector("[data-lightbox]");
    if (!dialog) {
      return;
    }

    const image = dialog.querySelector("[data-lightbox-image]");
    const caption = dialog.querySelector("[data-lightbox-caption]");
    const download = dialog.querySelector("[data-lightbox-download]");
    const close = dialog.querySelector("[data-lightbox-close]");

    root.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-lightbox-open]");
      if (!trigger) {
        return;
      }

      image.src = trigger.dataset.imageSrc || "";
      image.alt = trigger.dataset.imageAlt || "";
      caption.textContent = trigger.dataset.imageCaption || "";
      download.href = trigger.dataset.imageSrc || "#";
      download.download = trigger.dataset.downloadName || "";

      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    });

    function closeDialog() {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }

    close.addEventListener("click", closeDialog);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        closeDialog();
      }
    });
  }

  function renderNotFound(requestedSlug) {
    root.innerHTML = `
      <main class="memory-missing">
        <div class="memory-container">
          <p class="memory-brand">人力車 誠屋</p>
          <h1>専用ページが見つかりませんでした。</h1>
          <p>
            QRコードの読み取り直し、またはURLに誤りがないかご確認ください。
            ${requestedSlug ? `<br><span>確認中のURL: ${escapeHtml(requestedSlug)}</span>` : ""}
          </p>
          <a class="memory-button memory-button--primary" href="${escapeHtml(assetUrl("index.html"))}">誠屋トップへ</a>
        </div>
      </main>
    `;
  }

  function finishLoading() {
    window.setTimeout(() => {
      document.body.classList.remove("is-loading");
      if (loading) {
        loading.setAttribute("hidden", "");
        if (loading.style) {
          loading.style.display = "none";
        }
      }
    }, 240);
  }
})();
