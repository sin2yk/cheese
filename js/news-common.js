/* =========================
   news-common.js
   ========================= */

// ---- サイト基底（サブディレクトリ対応）を求めるユーティリティ ----
// 例: /cheeseacademy/index.html -> /cheeseacademy/
//     /cheeseacademy/news.html  -> /cheeseacademy/
function getSiteBase() {
  const p = location.pathname;
  if (p.endsWith('/')) return p;                 // すでに /cheeseacademy/ の形
  const i = p.lastIndexOf('/');
  return i >= 0 ? p.slice(0, i + 1) : '/';
}

// 任意: 配置が /cheeseacademy/news-articles/<slug>/poster.jpg なら
// window.NEWS_ASSETS_BASE = 'news-articles'; のように index.html で上書き可
function getNewsAssetsBase() {
  const custom = (window.NEWS_ASSETS_BASE || '').replace(/^\/+|\/+$/g, ''); // 先頭末尾の/除去
  return custom || 'news'; // デフォルトは 'news'
}

// 例: "2025-10-31-Ginza" → {date: "2025-10-31", title: "Ginza"}
function inferMetaFromSlug(slug) {
  const parts = slug.split("-");
  const date = parts.slice(0, 3).join("-");
  const title = parts.slice(3).join(" ");
  return { date, title };
}

// NEWSカード共通生成関数
// ===== ここから置き換え =====
function buildWallTile({ slug, date, title, linkTarget = "pdf" , showLinkText = true }) {
  const li = document.createElement("li");
  li.className = "news-item";
// li 生成直後に追加（任意）
    li.dataset.slug = slug;
    li.id = `news-${slug}`;   // ← タイトルTOCがここへ飛ぶ
    li.style.listStyle = "none";
    li.style.margin = "0";
    li.style.padding = "0";

  const a = document.createElement("a");
  a.className = "news-card";

 if (linkTarget === "news") {
  // index のサムネ → news.html の該当カードへ
  a.href = `./news.html#news-${slug}`;
  a.removeAttribute('target');   // 同タブ遷移
  a.rel = "noopener";
} else {
  // news.html はPDFへ
  a.href = `${getSiteBase()}${getNewsAssetsBase()}/${slug}/poster.pdf#zoom=page-width`;
  a.target = "_blank";
  a.rel = "noopener";
}


  const fig = document.createElement("figure");
  fig.className = "thumb";

  const img = document.createElement("img");
  img.alt = title || slug;
img.decoding = "async";
// （任意）事前サイズ指定があるなら入れるとCLSが減る：
// img.width = 960; img.height = 540;

  setThumbWithFallback(img, slug, null);  // ← 未定義参照をやめる
  img.loading = "lazy";
  fig.appendChild(img);

  const body = document.createElement("div");
  body.className = "body";

  const timeEl = document.createElement("time");
  if (date) {
    timeEl.dateTime = date;
    timeEl.textContent = date;
  }

  const h3 = document.createElement("h3");
  h3.className = "title";
  h3.textContent = title || slug;

  body.append(timeEl, h3);
  a.append(fig, body);
  li.appendChild(a);

  return li;
}
// ===== ここまで置き換え =====
// ---- 共通: サムネイルのSRC決定（index.html と news.html の相対パス差を吸収）----
// ---- サムネのSRCを複数候補で自動フォールバック ----
// ---- サムネ候補を生成（拡張子ゆらぎ・相対パスのみ / サブディレクトリ対応）----
function thumbSrcCandidates(slug) {
  const base = getSiteBase();             // 例: /cheeseacademy/
  const assets = getNewsAssetsBase();     // 例: 'news' or 'news-articles'
  const names = ['poster.jpg', 'poster.jpeg', 'poster.png'];

  // 例: /cheeseacademy/news/<slug>/poster.jpg
  const cand = [];
  names.forEach(n => {
    cand.push(`${base}${assets}/${slug}/${n}`);
  });

  // 念のため: news.html 側で相対になるケースにも保険をかける
  names.forEach(n => {
    cand.push(`${assets}/${slug}/${n}`);
    cand.push(`./${assets}/${slug}/${n}`);
    cand.push(`${slug}/${n}`);
    cand.push(`./${slug}/${n}`);
  });

  // 重複除去
  return Array.from(new Set(cand));
}

function setThumbWithFallback(imgEl, slug, explicitSrc) {
  const list = explicitSrc ? [explicitSrc] : thumbSrcCandidates(slug);
  let i = 0;
  function tryNext() {
    if (i >= list.length) {
      // 任意：プロジェクトにダミー画像がある場合だけ使う
      // const base = getSiteBase();
      // imgEl.onerror = null;
      // imgEl.src = `${base}assets/no-thumb.png`;
      return;
    }
    const src = list[i++];
    imgEl.onerror = tryNext;
    imgEl.src = src;
  }
  tryNext();
}




// 既存: getMeta（残してOK）
function getMeta(slug) {
  const byTable = (window.NEWS_META && window.NEWS_META[slug]) || null;
  return byTable || inferMetaFromSlug(slug);
}

