// サンプルHP「こみち」のスクリプト

// 帯の高さを測って、トップがちょうど1画面に収まるようにする
(function () {
  var band = document.querySelector('.sample-band');
  function set() { document.documentElement.style.setProperty('--band-h', band.offsetHeight + 'px'); }
  set();
  if ('ResizeObserver' in window) new ResizeObserver(set).observe(band);
})();

// トップの写真：数秒ごとに次の写真へ入れ替える
// 動きを減らす設定の人には自動で切り替えない。右上のボタンで止める・再開できる
(function () {
  var INTERVAL = 6000; // 1枚を見せる時間（ミリ秒）
  var slides = document.querySelectorAll('.hero-slide');
  var btn = document.querySelector('.hero-pause');
  if (slides.length < 2) { if (btn) btn.hidden = true; return; }
  var i = 0;
  var timer = null;
  function next() {
    slides[i].classList.remove('is-active');
    i = (i + 1) % slides.length;
    var img = slides[i].querySelector('img');
    img.loading = 'eager';
    slides[i].classList.add('is-active');
  }
  function play() { stop(); timer = setInterval(next, INTERVAL); set(false); }
  function stop() { clearInterval(timer); timer = null; }
  function set(paused) { btn.setAttribute('aria-pressed', paused ? 'true' : 'false'); }
  btn.addEventListener('click', function () {
    if (timer) { stop(); set(true); } else { next(); play(); }
  });
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { set(true); return; }
  // 2枚目以降を先に読み込んでおき、切り替えたときに白く抜けないようにする
  setTimeout(function () { slides.forEach(function (s) { s.querySelector('img').loading = 'eager'; }); }, 1500);
  play();
})();

// 応援してくれている人の声：ボタンを押すと一覧を開く・閉じる
(function () {
  var btn = document.querySelector('.voices-toggle');
  var list = document.getElementById('voices-list');
  if (!btn || !list) return;
  var label = btn.querySelector('.voices-toggle-label');
  btn.querySelector('.voices-count').textContent = '（' + list.children.length + '件）';
  function set(open) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    list.hidden = !open;
    label.textContent = open ? '声を閉じる' : '声を見る';
  }
  btn.hidden = false;
  set(false);
  btn.addEventListener('click', function () { set(list.hidden); });
})();

// 椅子のスポンサー：空いている椅子（is-taken の付いていない椅子）を数えて「残り◯脚」に入れる
(function () {
  var out = document.querySelector('[data-chairs-left]');
  if (!out) return;
  var left = document.querySelectorAll('.chairs li:not(.is-taken)').length;
  out.textContent = left;
  document.querySelector('.chairs').setAttribute('aria-label', '8脚の椅子のスポンサー状況：残り' + left + '脚');
})();

// ダミーのリンク：サンプルのため、移動せずにお知らせだけ出す
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
