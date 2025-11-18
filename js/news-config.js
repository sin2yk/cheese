// js/news-config.js（全置換：スロットとパスだけを定義）
(function () {
  var SLOTS = [
    '20251028-ise',
    '20251012-epoisses',
    '20250805-karuizawa',
    '20250601-roquefort',
    '20250203-losier',
    '20241224-comte'
  ];
 // ページのディレクトリに追随して viewer を指す
(function(){
  var dir = location.pathname.replace(/[^\/]+$/, ''); // 末尾のファイル名を除く
  
window.NEWS_VIEWER_BASE = dir + 'pdfjs-dist/web/viewer.html?file=';
})();
  window.NEWS_VIEWER_BASE = './pdfjs-dist/web/viewer.html?file=';
  window.NEWS_SLUGS = SLOTS.slice();
  // 既存の common/latest が別メタ構造を使っていても壊さないため、
  // ここでは NEWS_META を作らない（＝何もしない）
})();
