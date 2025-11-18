// js/news-toc-autofix.js
// ページ上部の「slug羅列っぽいリンク群」を検出し、表示文字をタイトルに置換。
// #news-toc の有無やDOM構造差に依存しない。

(function () {
  var SLUG_RE = /^(\d{4})(\d{2})(\d{2})-([a-z0-9\-]+)$/i;

  function toTitle(slug) {
    var tail = String(slug).replace(/^\d{8}-/, '');
    return tail.split(/[-_]/).filter(Boolean)
      .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); })
      .join(' ');
  }

  function fixAnchor(a) {
    var txt = (a.textContent || '').trim();
    var m = SLUG_RE.exec(txt);
    if (!m) return false;
    var slug = m[0];
    a.textContent = toTitle(slug);
    // アンカー先が無ければ slug を使う
    if (!a.getAttribute('href') || a.getAttribute('href') === '#') {
      a.setAttribute('href', '#' + slug);
    }
    a.classList.add('chip');
    a.addEventListener('click', function (e) {
      var id = slug;
      var t = document.getElementById(id);
      if (t) {
        e.preventDefault();
        t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + id);
      }
    }, { passive: false });
    return true;
  }

  function run() {
    // 優先: #news-toc 内の a
    var toc = document.getElementById('news-toc');
    var count = 0;
    if (toc) {
      toc.querySelectorAll('a').forEach(function (a) { if (fixAnchor(a)) count++; });
      if (count > 0) return;
    }
    // フォールバック: ページ上部にある slug っぽい a をまとめて置換
    var anchors = document.querySelectorAll('main a, .news, body > div a, body > a');
    anchors.forEach(function (a) { fixAnchor(a); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    setTimeout(run, 0);
  }
})();
