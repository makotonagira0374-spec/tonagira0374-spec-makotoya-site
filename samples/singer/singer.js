// サンプルHP「凪」のスクリプト

// 帯の高さを測って、トップがちょうど1画面に収まるようにする
(function () {
  var band = document.querySelector('.sample-band');
  function set() { document.documentElement.style.setProperty('--band-h', band.offsetHeight + 'px'); }
  set();
  if ('ResizeObserver' in window) new ResizeObserver(set).observe(band);
})();

// プレーヤー：再生ボタンを押すと、曲名と再生時間を切り替えて、お知らせを出す（サンプルのため音は鳴らさない）
(function () {
  var tracks = document.querySelectorAll('.track');
  var title = document.querySelector('[data-now-title]');
  var length = document.querySelector('[data-now-length]');
  var msg = document.querySelector('[data-now-msg]');
  tracks.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tracks.forEach(function (b) { b.removeAttribute('aria-current'); });
      btn.setAttribute('aria-current', 'true');
      title.textContent = btn.dataset.title;
      length.textContent = btn.dataset.length;
      // 同じ文言でも読み上げられるように、いったん空にしてから入れる
      msg.textContent = '';
      setTimeout(function () { msg.textContent = 'サンプルのため音源は再生されません'; }, 50);
    });
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
