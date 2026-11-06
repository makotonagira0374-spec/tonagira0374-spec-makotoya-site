// サンプルHP「ひだまり食堂」のスクリプト
// ・帯の高さを測る
// ・カウントダウン（開催日の一覧 #days から、今日以降でいちばん近い日までの日数）
// ・遊びのカードを、指で触れたときにも少し傾ける
// ・シェアボタン／ダミーのリンク
//
// 確認用：URL に ?today=2026-11-14 のように付けると、その日を「今日」として計算する

var root = document.documentElement;

// 帯の高さを測って、トップの上の余白（--band-h）にする
(function () {
  var band = document.querySelector('.sample-band');
  function set() { root.style.setProperty('--band-h', band.offsetHeight + 'px'); }
  set();
  if ('ResizeObserver' in window) new ResizeObserver(set).observe(band);
})();

// ---------- カウントダウン ----------
(function () {
  var box = document.querySelector('[data-countdown]');
  var items = Array.prototype.slice.call(document.querySelectorAll('#days li'));
  if (!box || !items.length) return;

  // 「年-月-日」を、その日の0時（端末の時刻）にする
  function toDay(str) {
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(str || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  var q = /[?&]today=([\d-]+)/.exec(location.search);
  var now = new Date();
  var today = (q && toDay(q[1])) || new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var WEEK = ['にち', 'げつ', 'か', 'すい', 'もく', 'きん', 'ど'];

  // 一覧の日付を読み、過ぎた日に印を付ける。今日以降でいちばん近い日を探す
  var next = null;
  items.forEach(function (li) {
    var t = li.querySelector('time');
    var d = t && toDay(t.getAttribute('datetime'));
    if (!d) return;
    li.classList.remove('is-next', 'is-past');
    if (d < today) li.classList.add('is-past');
    else if (!next || d < next.date) next = { date: d, li: li };
  });

  // メニューのカードにも「こんど！」を付ける（次の日と同じ日付のカード。次の日がなければ外す）
  function markMenu(key, isToday) {
    document.querySelectorAll('.menu-card').forEach(function (card) {
      var t = card.querySelector('time');
      var badge = card.querySelector('.menu-badge');
      var cd = t && toDay(t.getAttribute('datetime'));
      if (cd && cd < today) card.classList.add('is-past');
      if (t && t.getAttribute('datetime') === key) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'menu-badge';
          t.parentNode.appendChild(badge);
        }
        badge.textContent = isToday ? 'きょう！' : 'こんど！';
      } else if (badge) {
        badge.remove();
      }
    });
  }

  var label = box.querySelector('.cd-label');
  var main = box.querySelector('.cd-main');
  var date = box.querySelector('.cd-date');

  if (!next) {
    // すべて過ぎていたとき
    box.classList.add('is-none');
    label.textContent = 'つぎの ひだまりの日';
    main.textContent = 'つぎの日は もうすぐ おしらせするね';
    date.textContent = '';
    date.hidden = true;
    markMenu(null, false);
    return;
  }

  next.li.classList.add('is-next');
  // 時刻を使わず日付どうしで引く（夏時間などのずれは Math.round で吸収）
  var days = Math.round((next.date - today) / 86400000);
  var d = next.date;
  var when = (d.getMonth() + 1) + 'がつ' + d.getDate() + 'にち（' + WEEK[d.getDay()] + '）';

  if (days === 0) {
    box.classList.add('is-today');
    label.textContent = 'まってたよ！';
    main.innerHTML = '<b>きょうは ひだまりの日！</b>';
    date.textContent = '10:30から まるめろ台公民館で まってるね';
  } else {
    main.innerHTML = 'あと<b class="cd-num"></b>にち！';
    main.querySelector('.cd-num').textContent = days;
    date.textContent = when + ' 10:30から';
  }
  markMenu(next.li.querySelector('time').getAttribute('datetime'), days === 0);
})();

// ---------- 遊びのカード：指で触れたときも、くるっと傾ける（マウスは CSS の :hover） ----------
(function () {
  document.querySelectorAll('.play-card').forEach(function (card) {
    var timer;
    card.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      card.classList.add('is-tilt');
      clearTimeout(timer);
      timer = setTimeout(function () { card.classList.remove('is-tilt'); }, 700);
    });
  });
})();

// ---------- お知らせ（トースト） ----------
var toast = (function () {
  var el = document.querySelector('.toast');
  var timer;
  return function (msg) {
    el.textContent = msg;
    el.classList.add('is-show');
    clearTimeout(timer);
    timer = setTimeout(function () { el.classList.remove('is-show'); }, 2400);
  };
})();

// シェア：スマホの共有機能が使えれば使い、使えなければURLをコピーする
document.querySelectorAll('[data-share]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var data = { title: document.title, text: 'まるめろ台の みんなの食堂「ひだまり食堂」', url: location.href.split('#')[0] };
    if (navigator.share) {
      navigator.share(data).catch(function () {});
      return;
    }
    var done = function () { toast('このページのURLをコピーしました。'); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(data.url).then(done, fallback);
    } else {
      fallback();
    }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = data.url;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('URLをコピーできませんでした：' + data.url); }
      ta.remove();
    }
  });
});

// ダミーのリンク：サンプルのため、移動せずにお知らせだけ出す
document.addEventListener('click', function (e) {
  var a = e.target.closest('[data-dummy]');
  if (!a) return;
  e.preventDefault();
  toast('サンプルHPのため、このリンクは動きません。');
});

// 別のページから #onion などの付いたリンクで来たとき、その場所まで移動する
// （Webフォントや画像の読み込みで、ブラウザの最初の移動がずれたり、されなかったりすることがあるため、読み込み後に合わせ直す）
(function () {
  if (!location.hash) return;
  var el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (!el) return;
  function align() {
    var top = el.getBoundingClientRect().top;
    var want = (parseFloat(getComputedStyle(el).scrollMarginTop) || 0) + (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0);
    if (Math.abs(top - want) > 40) el.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  window.addEventListener('load', function () {
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(function () { requestAnimationFrame(align); });
  });
})();
