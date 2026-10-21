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

// 登り坂：画面に入ったら1回だけ演出を始める（線 → 言葉 → 二人。順番と時間は CSS 側）
(function () {
  var climb = document.querySelector('.why-climb');
  if (!climb) return;
  if (!('IntersectionObserver' in window)) { climb.classList.add('is-play'); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { climb.classList.add('is-play'); io.disconnect(); }
    });
  }, { threshold: 0.25 });
  io.observe(climb);
})();

// サンプルHP：PCだけ、4つの問いをスマホ画面の中の答えと同じ高さに並べ、
// 問いから答えの範囲の縦線（.samples-mark）まで、まっすぐ横に線を引く。
// 同じ範囲を指す問い（どこへ／なぜ）は、近くにまとめて置く
(function () {
  var stage = document.querySelector('.samples-stage');
  if (!stage) return;
  var list = stage.querySelector('.samples-qs');
  var svg = stage.querySelector('.samples-lines');
  var phone = stage.querySelector('.phone');
  var img = stage.querySelector('.phone-shot img');
  var qs = Array.prototype.slice.call(stage.querySelectorAll('.samples-q'));
  var mq = window.matchMedia('(min-width: 960px)');
  var NS = 'http://www.w3.org/2000/svg';
  var GAP = 28; // 問いと問いの最小のすき間

  function mark(key) { return stage.querySelector('.samples-mark[data-range="' + key + '"]'); }
  // 見出しの文字の範囲（h3 の箱ではなく、実際の文字の端）
  function titleRects(q) {
    var range = document.createRange();
    range.selectNodeContents(q.querySelector('.samples-q-title'));
    return range.getClientRects();
  }

  function layout() {
    svg.textContent = '';
    if (!mq.matches) {
      stage.classList.remove('is-aligned');
      list.style.height = '';
      qs.forEach(function (q) { q.style.top = ''; });
      return;
    }
    stage.classList.add('is-aligned');
    qs.forEach(function (q) { q.style.top = '0px'; });
    var L = list.getBoundingClientRect();

    // 同じ範囲を指す、続いた問いをひとまとまりにする
    var groups = [];
    qs.forEach(function (q) {
      var g = groups[groups.length - 1];
      if (g && g.key === q.getAttribute('data-range')) g.items.push(q);
      else groups.push({ key: q.getAttribute('data-range'), items: [q] });
    });

    // まとまりの見出しの中心の平均が、範囲の中心に来るように置く（上の問いと重なるときは下へずらす）
    var prevBottom = -Infinity;
    groups.forEach(function (g) {
      var m = mark(g.key).getBoundingClientRect();
      var center = (m.top + m.bottom) / 2 - L.top;
      var stack = 0, sum = 0;
      var offsets = g.items.map(function (q) {
        var t = titleRects(q)[0];
        var o = stack;
        sum += o + (t.top - L.top) + t.height / 2;
        stack += q.offsetHeight + GAP;
        return o;
      });
      var top = Math.max(center - sum / g.items.length, prevBottom + GAP);
      g.items.forEach(function (q, i) { q.style.top = top + offsets[i] + 'px'; });
      prevBottom = top + stack - GAP;
    });
    list.style.height = Math.max(prevBottom, phone.offsetHeight) + 'px';

    // 線：見出しの右端から、範囲の縦線まで水平に
    var S = stage.getBoundingClientRect();
    qs.forEach(function (q) {
      var rects = titleRects(q);
      var right = 0;
      for (var i = 0; i < rects.length; i++) right = Math.max(right, rects[i].right);
      var y = rects[0].top + rects[0].height / 2 - S.top;
      var m = mark(q.getAttribute('data-range')).getBoundingClientRect();
      var line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', right + 20 - S.left);
      line.setAttribute('x2', m.left - S.left);
      line.setAttribute('y1', y);
      line.setAttribute('y2', y);
      svg.appendChild(line);
    });
  }

  // 問いにマウスを乗せる（クリックする）と、スマホ画面の答えの範囲がほんのり明るくなる
  qs.forEach(function (q) {
    q.addEventListener('mouseenter', function () { if (mq.matches) stage.setAttribute('data-active', q.getAttribute('data-range')); });
    q.addEventListener('click', function () { if (mq.matches) stage.setAttribute('data-active', q.getAttribute('data-range')); });
  });
  list.addEventListener('mouseleave', function () { stage.removeAttribute('data-active'); });

  layout();
  if (!img.complete) img.addEventListener('load', layout);
  if (document.fonts) document.fonts.ready.then(layout);
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(phone);
  else window.addEventListener('resize', layout);
  if (mq.addEventListener) mq.addEventListener('change', layout);
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
