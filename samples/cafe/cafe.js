// サンプルHP「たきび」のスクリプト

var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var SHOT = /[?&]shot\b/.test(location.search); // 撮影用（誠屋HPの一覧に出すスマホ画面）

// 帯の高さを測って、ページの上の余白・ヘッダーの位置・スクロール位置に使う
(function () {
  var band = document.querySelector('.sample-band');
  function set() { document.documentElement.style.setProperty('--band-h', band.offsetHeight + 'px'); }
  set();
  if ('ResizeObserver' in window) new ResizeObserver(set).observe(band);
})();

// HOME の写真：top-1 → top-2 → top-3 → top-1 … の順に、ゆっくりフェードで入れ替える
// 新しい写真を前の写真の上でフェードインさせ、終わったら前の写真を下げる（途中で背景が透けない）
// 動きを減らす設定の端末・撮影用（?shot）では入れ替えず、1枚目だけ
(function () {
  var SHOW = 4500; // 1枚を見せる時間（ミリ秒）。フェードと合わせて1枚あたり約6秒
  var FADE = 1500; // 入れ替えにかける時間（ミリ秒。cafe.css の .hero-slide の transition と合わせる）
  var slides = document.querySelectorAll('[data-slide]');
  if (slides.length < 2 || SHOT || REDUCED) return;
  var i = 0;
  // 2枚目以降は、最初の入れ替えまでに読み込んでおく（黒く抜けないように）
  window.addEventListener('load', function () {
    slides.forEach(function (s) { s.loading = 'eager'; });
  });
  setInterval(function () {
    var prev = slides[i];
    i = (i + 1) % slides.length;
    prev.classList.remove('is-active');
    prev.classList.add('is-prev');
    slides[i].classList.add('is-active');
    setTimeout(function () { prev.classList.remove('is-prev'); }, FADE);
  }, SHOW + FADE);
})();

// スクロールで、文字がゆっくり浮かび上がる
(function () {
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || SHOT) {
    items.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  items.forEach(function (el) { io.observe(el); });
})();

// 右側の点のナビ：画面の真ん中にあるセクションの点を光らせる
(function () {
  var dots = document.querySelectorAll('[data-dot]');
  if (!dots.length) return;
  var targets = Array.prototype.map.call(dots, function (a) { return document.querySelector(a.getAttribute('href')); });
  var current = -1;
  var ticking = false;
  function update() {
    ticking = false;
    var mid = window.innerHeight / 2;
    var idx = 0;
    for (var k = targets.length - 1; k >= 0; k--) {
      if (targets[k] && targets[k].getBoundingClientRect().top <= mid) { idx = k; break; }
    }
    if (idx === current) return;
    current = idx;
    dots.forEach(function (a, n) {
      if (n === idx) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

// メニューとモーダル（<dialog>）
// ・data-open="（dialog の id）" のボタンで開く。開くとパネル（data-focus）にフォーカスを移す
// ・× ボタン（data-close）、背景のクリック、Esc キーで閉じる。閉じるとブラウザが開いたボタンにフォーカスを戻す
// ・開いている間は、後ろのページをスクロールさせない（html.is-locked）
(function () {
  var root = document.documentElement;
  var dialogs = document.querySelectorAll('dialog');
  if (!dialogs.length || typeof dialogs[0].showModal !== 'function') return;

  function unlock() {
    if (!document.querySelector('dialog[open]')) root.classList.remove('is-locked');
  }
  function open(id) {
    var d = document.getElementById(id);
    if (!d || d.open) return;
    root.classList.add('is-locked');
    d.showModal();
    var body = d.querySelector('.modal-body');
    if (body) body.scrollTop = 0;
    var panel = d.querySelector('[data-focus]');
    if (panel) panel.focus();
  }
  function close(d) {
    if (d && d.open) d.close();
    unlock();
  }

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-open]');
    if (opener) { e.preventDefault(); open(opener.getAttribute('data-open')); return; }
    var closer = e.target.closest('[data-close]');
    if (closer) { close(closer.closest('dialog')); return; }
    // メニューの項目：メニューを閉じてから、そのセクションへ
    var link = e.target.closest('[data-menu-link]');
    if (link) {
      e.preventDefault();
      close(link.closest('dialog'));
      var target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
      return;
    }
    // パネルの外（暗い背景）を押したとき
    if (e.target.tagName === 'DIALOG') close(e.target);
  });
  dialogs.forEach(function (d) { d.addEventListener('close', unlock); });
})();

// ダミーのリンク（予約・ギフト注文・クラウドファンディング・Instagram）：サンプルのため、移動せずにお知らせだけ出す
(function () {
  var toast = document.querySelector('.toast');
  var timer;
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-dummy]');
    if (!a) return;
    e.preventDefault();
    toast.textContent = 'サンプルHPのため、このリンクは動きません。';
    toast.classList.add('is-show');
    clearTimeout(timer);
    timer = setTimeout(function () { toast.classList.remove('is-show'); }, 2400);
  });
})();
