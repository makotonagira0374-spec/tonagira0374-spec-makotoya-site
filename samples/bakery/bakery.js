// サンプルHP「ことり」のスクリプト

// 帯の高さを測って、ページの上の余白とスクロール位置に使う
(function () {
  var band = document.querySelector('.sample-band');
  function set() { document.documentElement.style.setProperty('--band-h', band.offsetHeight + 'px'); }
  set();
  if ('ResizeObserver' in window) new ResizeObserver(set).observe(band);
})();

// トップの写真：1 → 2 → 3 → 1 … の順に、ゆっくりフェードで入れ替える
// 新しい写真を前の写真の上でフェードインさせ、終わったら前の写真を下げる（途中で背景が透けない）
// 動きを減らす設定の端末では入れ替えない（CSS で3枚目だけを出す）
(function () {
  var SHOW = 4000; // 1枚を見せる時間（ミリ秒）
  var FADE = 1500; // 入れ替えにかける時間（ミリ秒。bakery.css の .hero-slide の transition と合わせる）
  var slides = document.querySelectorAll('[data-slide]');
  if (slides.length < 2) return;
  // 撮影用（?shot 付き。誠屋HPの一覧に出すスマホ画面）：入れ替えずに3枚目（パンを置く写真）を出す
  if (/[?&]shot\b/.test(location.search)) {
    slides.forEach(function (s) { s.classList.remove('is-active'); s.style.transition = 'none'; });
    slides[slides.length - 1].querySelector('img').loading = 'eager';
    slides[slides.length - 1].classList.add('is-active');
    return;
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var i = 0;
  // 2枚目以降は、最初の入れ替えまでに読み込んでおく（白く抜けないように）
  window.addEventListener('load', function () {
    slides.forEach(function (s) { s.querySelector('img').loading = 'eager'; });
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

// ダミーのリンク：サンプルのため、移動せずにお知らせだけ出す
(function () {
  var toast = document.querySelector('.toast');
  var timer;
  function show(text) {
    toast.textContent = text;
    toast.classList.add('is-show');
    clearTimeout(timer);
    timer = setTimeout(function () { toast.classList.remove('is-show'); }, 2400);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-dummy]');
    if (!a) return;
    e.preventDefault();
    show('サンプルHPのため、このリンクは動きません。');
  });
})();
