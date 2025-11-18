/* =========================
   news-all.js（news.html 専用：壁新聞）
   このファイルは “全置き換え”
   ========================= */
  document.addEventListener('DOMContentLoaded', () => {
  // 1) コンテナ（section#wallboard）
  const wall = document.getElementById('wallboard');
  const tocWrap = document.querySelector('#toc .wrap');
  if (!wall) return;

  // クリーンアップ
  wall.replaceChildren();

  // 2) データ整形：重複slug除去 → メタ取得 → 日付降順
  const slugs = Array.from(new Set(window.NEWS_SLUGS || []));
  const items = slugs
    .map((slug) => {
      const meta = getMeta(slug); // news-common.js
      return {
        slug,
        date: meta?.date || '',
        title: meta?.title || slug
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // 3) カード生成（.wallboard 直下に .wall を置く）
  items.forEach(({ slug, date, title }) => {
    // <article class="wall" id="news-<slug>">
    const art = document.createElement('article');
    art.className = 'wall';
    art.id = `news-${slug}`;     // ← タイトルTOCの飛び先
    art.dataset.slug = slug;

    // <a class="wall__link" href="...pdf">
    const a = document.createElement('a');
    a.id = `news-${slug}`;                   // ★ 追加
    a.className = 'wall__link';
    a.href = `${getSiteBase()}${getNewsAssetsBase()}/${slug}/poster.pdf#zoom=page-width`;
    a.target = '_blank';
    a.rel = 'noopener';

    // 画像
    const fig = document.createElement('figure');
    const img = document.createElement('img');
    img.alt = title || slug;
    img.decoding = 'async';
    img.loading = 'lazy';
    // 16:9に見せるのは CSS 側（height:auto）でOK、必要なら aspect-ratio を足す
    setThumbWithFallback(img, slug, null);  // news-common.js
    fig.appendChild(img);

    // キャプション
    const cap = document.createElement('figcaption');
    const strong = document.createElement('strong');
    strong.textContent = title || slug;
    const metaEl = document.createElement('span');
    metaEl.className = 'meta';
    metaEl.textContent = date || '';
    // 必要なら要約を入れる：
    // const p = document.createElement('p'); p.textContent = '…';

    cap.appendChild(strong);
    cap.appendChild(metaEl);
    // cap.appendChild(p);

    a.appendChild(fig);
    a.appendChild(cap);
    art.appendChild(a);
    wall.appendChild(art);
  });
  
  // slug→表示タイトル。NEWS_META があれば優先、なければ slug 後半を整形
  function displayTitleFor(slug) {
  // slug 例: "20251224-comte" / "news-20251224-comte"
  const core = slug.replace(/^news-/, '');
  const nice =
    core.replace(/^\d{8}-/, '')                 // 日付を落とす
        .split('-')                             // ハイフン区切り
        .map(s => s.charAt(0).toUpperCase() + s.slice(1)) // 先頭大文字
        .join(' ');
  // META優先（news-decor-robust.js で後から補完されても問題なし）
  if (window.NEWS_META && window.NEWS_META[core] && window.NEWS_META[core].title) {
    return window.NEWS_META[core].title;
  }
  return nice; // フォールバック
  }

    // 4) タイトルTOCを #toc .wrap に出す（存在すれば）
  if (tocWrap) {
    const ul = document.createElement('ul');
    ul.className = 'toc-list';
    items.forEach(({ slug, title }) => {
      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `#news-${slug}`;      // ← このページ内スクロール
      a.textContent = displayTitleFor(slug, title);   // ← 表示用タイトルに差し替え
      li.appendChild(a);
      ul.appendChild(li);
    });
    tocWrap.replaceChildren(ul);
  }

  console.log('[news-all] rendered:', items.length);
});

// ↓↓↓ ここから挿入 ↓↓↓
(function scrollToHashAfterRender() {
  var hash = location.hash && decodeURIComponent(location.hash.slice(1));
  if (!hash) return;
  // すぐ見つかれば即スクロール
  var el = document.getElementById(hash);
  if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }

  // 見つからない場合、最大2秒だけ待ってから再試行（描画の遅延に対応）
  var start = Date.now();
  var timer = setInterval(function() {
    var t = document.getElementById(hash);
    if (t) {
      clearInterval(timer);
      t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (Date.now() - start > 2000) {
      clearInterval(timer);
    }
  }, 100);
})();
