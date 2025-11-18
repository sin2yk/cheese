/* =========================
   news-latest.js（安全版）
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
  const list = document.querySelector("#news-list");
  if (!list || !window.NEWS_SLUGS) {
    console.error("news-list or NEWS_SLUGS missing");
    return;
  }

  // NEWS部分だけ初期化
  list.replaceChildren();

// 最新3件
const latest = window.NEWS_SLUGS.slice(0, 3);
latest.forEach(slug => {
  const meta = getMeta(slug); // ← getMetaでテーブル優先→無ければslugパース
  const tile = buildWallTile({
    slug,
    date: meta.date,
    title: meta.title,
    linkTarget: "news", // indexは一覧へ
    showLinkText: false        // ★ 追記：二重表示を抑止
    // サムネは buildWallTile 内で setThumbWithFallback が担当
  });
  list.appendChild(tile);
});




  console.log("[news-latest] rendered:", latest.length);
});
