// サンプルHP「こみち」のスクリプト

// 帯の高さを測って、トップがちょうど1画面に収まるようにする
(function () {
  var band = document.querySelector('.sample-band');
  function set() { document.documentElement.style.setProperty('--band-h', band.offsetHeight + 'px'); }
  set();
  if ('ResizeObserver' in window) new ResizeObserver(set).observe(band);
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
