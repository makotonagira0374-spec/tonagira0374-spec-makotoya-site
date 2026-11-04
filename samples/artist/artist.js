// サンプルHP「栞」のスクリプト
// ・スクロールの動きそのものは乗っ取らない（1作品ずつ止めるのは CSS の scroll-snap）
// ・ここでは、帯の高さを測る／今何枚目かの目印を切り替える／ギャラリーを過ぎたらスナップを外す、だけを行う

var root = document.documentElement;

// 帯の高さを測って、作品の上の余白（--band-h）にする
(function () {
  var band = document.querySelector('.sample-band');
  function set() { root.style.setProperty('--band-h', band.offsetHeight + 'px'); }
  set();
  if ('ResizeObserver' in window) new ResizeObserver(set).observe(band);
})();

// 今何枚目かの目印：画面の半分以上に見えている作品の点に aria-current を付ける
(function () {
  var dots = document.querySelectorAll('.dots a');
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      dots.forEach(function (a) {
        if (a.getAttribute('href') === '#' + e.target.id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.work').forEach(function (w) { io.observe(w); });
})();

// 最後の作品を過ぎたら、スクロールスナップを外して普通のスクロールに戻す（html に .is-free）
// ・後半のブロックが画面の半分より上まで来たら外す
// ・戻ってきて、後半のブロックが画面の下の端（90%）より下に下がったら、もう一度付ける
//   （外す位置と付ける位置をずらして、境目でガタつかないようにする）
(function () {
  var after = document.querySelector('.after');
  var ticking = false;
  function check() {
    ticking = false;
    var top = after.getBoundingClientRect().top;
    var h = window.innerHeight;
    if (top <= h * 0.5) root.classList.add('is-free');
    else if (top >= h * 0.9) root.classList.remove('is-free');
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(check); }
  }, { passive: true });
  window.addEventListener('resize', check);
  check();

  // ページ内リンクで後半のブロックへ移動するときは、先にスナップを外す
  // （付けたままだと、移動の途中で作品の位置に引き戻されるため）
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').length < 2) return;
    var target = document.getElementById(a.getAttribute('href').slice(1));
    if (target && after.contains(target)) root.classList.add('is-free');
  });
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
