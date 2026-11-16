// 先着枠：ここの数字だけ変えれば、ヒーローのバッジに反映される
// left が null のあいだは「先着5名限定」。申し込みが入ったら残り数（例：4）を入れると「残り4名」になる
var SEATS = { total: 5, left: null };

(function () {
  var t = SEATS.total, n = SEATS.left;
  var text = {
    hero: n === null ? '先着' + t + '名限定' : '残り' + n + '名'
  };
  document.querySelectorAll('[data-seats]').forEach(function (el) {
    var v = text[el.getAttribute('data-seats')];
    if (v) el.textContent = v;
  });
})();

// 料金：サンプルHPのページ全体の画像をクリックで拡大（Esc・背景・閉じるで閉じる）
(function () {
  var box = document.querySelector('.shot-viewer');
  if (!box || typeof box.showModal !== 'function') return;
  var body = box.querySelector('.shot-viewer-body');
  var img = box.querySelector('img');
  var opener;
  document.querySelectorAll('.page-shot').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var src = btn.querySelector('img');
      img.src = src.currentSrc || src.src;
      img.alt = src.alt;
      opener = btn;
      box.showModal();
      body.scrollTop = 0;
    });
  });
  box.addEventListener('click', function (e) {
    if (e.target === box || e.target === body || e.target.closest('.shot-viewer-close')) box.close();
  });
  box.addEventListener('close', function () { if (opener) opener.focus(); });
})();

// 料金の詳細（<details>）：開閉をなめらかに。キーボード（Enter・Space）でも同じ動き。
// 動きを減らす設定のときや、古いブラウザでは、そのまま（瞬時に）開閉する
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.price-details details').forEach(function (d) {
    var summary = d.querySelector('summary');
    var body = d.querySelector('.detail-body');
    var anim;
    summary.addEventListener('click', function (e) {
      if (reduce.matches || !body.animate) return;
      e.preventDefault();
      if (anim) anim.cancel();
      if (!d.open || d.classList.contains('is-closing')) {
        d.classList.remove('is-closing');
        d.open = true;
        anim = body.animate({ height: ['0px', body.offsetHeight + 'px'], opacity: [0, 1] }, { duration: 320, easing: 'ease-out' });
      } else {
        d.classList.add('is-closing');
        anim = body.animate({ height: [body.offsetHeight + 'px', '0px'], opacity: [1, 0] }, { duration: 260, easing: 'ease-in' });
        anim.onfinish = function () { d.open = false; d.classList.remove('is-closing'); };
      }
    });
  });
})();

// LINEの相談ボタン：PCのブラウザではLINEのトークが開かず、LINEのトップページに移ってしまうので、
// 最後の相談のQRコードまでスクロールする。スマホ・タブレット（iPhone・iPad・Android）はそのままLINEを開く。
// タッチパネル付きのPCもあるので、画面の幅や指・マウスではなく、端末の種類で判断する
(function () {
  var qr = document.querySelector('.contact-qr');
  if (!qr) return;
  var ua = navigator.userAgent;
  var mobile = /Android|iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || // iPadOS は Mac と名乗る
    !!(navigator.userAgentData && navigator.userAgentData.mobile);
  if (mobile) return;
  document.documentElement.classList.add('is-pc'); // PCでは幅にかかわらずQRコードを出す（style.css）
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  qr.setAttribute('tabindex', '-1');
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href*="line.me/R/oaMessage"]');
    if (!a) return;
    e.preventDefault();
    qr.scrollIntoView({ block: 'center', behavior: reduce.matches ? 'auto' : 'smooth' });
    qr.focus({ preventScroll: true });
    // どこを見ればよいか分かるよう、少しのあいだ強調する
    qr.classList.remove('is-highlight');
    void qr.offsetWidth;
    qr.classList.add('is-highlight');
  });
})();

// アクセス解析：相談ボタン・Instagram・サンプルHPが押された回数をGoogleアナリティクスに送る。
// 人力車 誠屋のサイトと同じ「contact_click」（channel で区別）。サンプルHPは「sample_open」
(function () {
  document.addEventListener('click', function (e) {
    if (typeof window.gtag !== 'function') return;
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    var text = (a.textContent || '').replace(/\s+/g, ' ').trim();
    // どこで押されたか（hero・flow など、id のないセクションは「section」以外の最初のクラス名）
    var section = a.closest('section, header, footer');
    var where = '';
    if (section) {
      var names = Array.prototype.filter.call(section.classList, function (c) { return c !== 'section'; });
      where = section.id || names[0] || section.tagName.toLowerCase();
    }
    if (href.indexOf('line.me') !== -1 || href.indexOf('instagram.com') !== -1) {
      gtag('event', 'contact_click', {
        channel: href.indexOf('line.me') !== -1 ? 'line' : 'instagram',
        link_text: text,
        section: where
      });
    } else if (href.indexOf('/samples/') === 0) {
      gtag('event', 'sample_open', { link_text: text, section: where });
    }
  }, true);
})();

// サンプルHPの一覧（横一列のスライダー）：矢印ボタンで1枚ずつ動かし、端では押せないようにする
(function () {
  var list = document.getElementById('samples-list');
  if (!list) return;
  var nav = list.parentNode.querySelector('.samples-nav');
  var prev = nav.querySelector('[data-dir="-1"]');
  var next = nav.querySelector('[data-dir="1"]');
  var target = 0, moving = false, timer;
  function step() {
    var cards = list.children;
    if (cards.length < 2) return list.clientWidth;
    return cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left;
  }
  function update() {
    var max = list.scrollWidth - list.clientWidth;
    var atStart = list.scrollLeft <= 2;
    var atEnd = list.scrollLeft >= max - 2;
    prev.disabled = atStart;
    next.disabled = atEnd;
    // 全部が収まっているときは矢印を出さない
    nav.hidden = max <= 2;
    list.classList.toggle('is-end', !atStart && atEnd);
    list.classList.toggle('is-mid', !atStart && !atEnd);
  }
  nav.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-dir]');
    if (!btn) return;
    var smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // 動いている途中で続けて押しても1枚ずつ進むよう、今の位置から何枚目かを数えて行き先を決める
    var s = step();
    var last = Math.round((list.scrollWidth - list.clientWidth) / s + .49);
    var base = moving ? target : Math.round(list.scrollLeft / s);
    target = Math.min(last, Math.max(0, base + Number(btn.getAttribute('data-dir'))));
    moving = true;
    clearTimeout(timer);
    // 動き終わったら（scrollend。使えないブラウザは時間で）次の押下を今の位置から数える
    timer = setTimeout(function () { moving = false; }, 1500);
    list.scrollTo({ left: target * s, behavior: smooth ? 'smooth' : 'auto' });
  });
  list.addEventListener('scroll', update, { passive: true });
  list.addEventListener('scrollend', function () { moving = false; clearTimeout(timer); update(); });
  window.addEventListener('resize', update);
  update();
})();

// ヘッダー：スクロールしたら背景を付ける
(function () {
  var header = document.querySelector('.site-header');
  if (!header) return;

  function update() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  update();
  window.addEventListener('scroll', update, { passive: true });
})();

// スマホのメニュー開閉
(function () {
  var header = document.querySelector('.site-header');
  var button = document.querySelector('.menu-button');
  var nav = document.getElementById('site-nav');
  if (!button || !nav) return;

  function setOpen(open) {
    button.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    if (header) header.classList.toggle('is-menu-open', open);
  }

  button.addEventListener('click', function () {
    setOpen(button.getAttribute('aria-expanded') !== 'true');
  });

  // メニュー内のリンクを押したら閉じる
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });

  // Escキーで閉じる
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      button.focus();
    }
  });
})();
