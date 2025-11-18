/* js/news-page.js
   - NEWS_SLUGS を元に news.html のTOCとカードを自動生成
   - pdf.js があればPDFメタからタイトル取得、なければスラッグから生成
   - PDFは幅フィットで開く（#page=1&zoom=page-width）
*/

(function () {
  // ---- 設定 / util ----
  const USE_PDFJS = !!window.pdfjsLib;
  if (USE_PDFJS && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://unpkg.com/pdfjs-dist@4.3.136/build/pdf.worker.min.js';
  }

  const esc = (s) =>
    String(s).replaceAll('&', '&amp;')
             .replaceAll('<', '&lt;')
             .replaceAll('>', '&gt;');

  const parseDate = (slug) => {
    const m = String(slug).match(/^(\d{4})(\d{2})(\d{2})-/);
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  };

  const fmtDate = (d) =>
    new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);

  const titleFromSlug = (slug) =>
    slug.replace(/^\d{8}-/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

  async function getTitleFromPdf(pdfUrl, fallback) {
    if (!USE_PDFJS) return fallback;
    try {
      const doc = await pdfjsLib.getDocument(pdfUrl).promise;
      const meta = await doc.getMetadata().catch(() => null);
      const t =
        (meta?.info?.Title || meta?.metadata?.get?.('dc:title') || '').trim();
      return t || fallback;
    } catch {
      return fallback;
    }
  }

  // ---- main ----
  async function render() {
    const board = document.getElementById('wallboard');
    const tocWrap = document.querySelector('#toc .wrap');
    if (!board || !tocWrap) return;

    const slugs = Array.isArray(window.NEWS_SLUGS) ? window.NEWS_SLUGS : [];
    const items = slugs
      .map((slug) => ({ slug, dt: parseDate(slug) }))
      .filter((x) => x.dt)
      .sort((a, b) => b.dt - a.dt);

    const frag = document.createDocumentFragment();

    for (const { slug, dt } of items) {
      const pdf = `/news/${slug}/poster.pdf#page=1&zoom=page-width`;
      const jpg = `/news/${slug}/poster.jpg`;
      const fallbackTitle = titleFromSlug(slug);
      const title = await getTitleFromPdf(pdf, fallbackTitle);

      const art = document.createElement('article');
      art.className = 'wall';
      art.id = `n-${slug}`;
      art.dataset.title = title;
      art.innerHTML = `
        <a class="wall__link" href="${pdf}" target="_blank" rel="noopener">
          <figure>
            <img src="${jpg}" alt="${esc(title)}（壁新聞プレビュー）" loading="lazy" decoding="async">
            <figcaption>
              <strong>${esc(title)}</strong>
              <span class="meta">${fmtDate(dt)}・PDFを開く</span>
            </figcaption>
          </figure>
        </a>`;
      frag.appendChild(art);
    }

    board.replaceChildren(frag);

    // TOC
    const ul = document.createElement('ul');
    for (const { slug } of items) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#n-${slug}`;
      a.textContent =
        document.getElementById(`n-${slug}`)?.dataset.title || slug;
      li.appendChild(a);
      ul.appendChild(li);
    }
    tocWrap.replaceChildren(ul);
  }

  render();
})();
