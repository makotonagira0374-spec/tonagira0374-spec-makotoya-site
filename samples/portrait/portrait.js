// サンプルHP「灯」の共通スクリプト（1ページ目・2ページ目で共有）
// 帯の高さを測って、入口の写真がちょうど1画面に収まるようにする
(function () {
  var band = document.querySelector('.sample-band');
  function set() { document.documentElement.style.setProperty('--band-h', band.offsetHeight + 'px'); }
  set();
  if ('ResizeObserver' in window) new ResizeObserver(set).observe(band);
})();

// 作品：画面に入ったら1枚ずつ浮かび上がる
(function () {
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('is-in'); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  items.forEach(function (el) { io.observe(el); });
})();

// 作品：クリックで大きく表示（Esc・背景・Close で閉じる）
(function () {
  var box = document.querySelector('.lightbox');
  if (!box || typeof box.showModal !== 'function') return;
  var img = box.querySelector('img');
  var cap = box.querySelector('figcaption');
  var opener;
  document.querySelectorAll('.work-open').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var src = btn.querySelector('img');
      img.src = src.currentSrc || src.src;
      img.alt = src.alt;
      cap.textContent = btn.closest('figure').querySelector('figcaption').textContent;
      opener = btn;
      box.showModal();
    });
  });
  box.addEventListener('click', function (e) {
    if (e.target === box || e.target.closest('.lightbox-close')) box.close();
  });
  box.addEventListener('close', function () { if (opener) opener.focus(); });
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
