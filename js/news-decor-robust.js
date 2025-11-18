// js/news-decor-robust.js  — 二重遷移根治版
// ・カード内外の a が重複しても「aは1つ」に正規化
// ・クリック時に stopPropagation で親の onclick を無効化（ダブル遷移防止）
// ・PDFは window.NEWS_OPEN_RAW_PDF が true なら常に生PDFへ
// ・subtitle は PDF(1p先頭 or Title) を取得（失敗時は title再掲）

(function(){
  var DEBUG = !!window.NEWS_DECOR_DEBUG;
  var IMG_RE = /\/news\/([^/]+)\/poster\.(jpg|jpeg|png)(\?.*)?$/i;
  function log(){ if(DEBUG) console.log.apply(console, arguments); }

  function splitSlug(slug){
    var m = /^(\d{4})(\d{2})(\d{2})-(.+)$/.exec(String(slug||''));
    return m ? { ymd: m[1]+'-'+m[2]+'-'+m[3], tail: m[4] } : { ymd:'—', tail:String(slug||'') };
  }
  function toTitle(tail){
    return String(tail||'').split(/[-_]/).filter(Boolean)
      .map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
  }

  function ensureRawPdfLink(a, slug){
    var pdf = (window.NEWS_ASSETS_BASE||'./news')+'/'+slug+'/poster.pdf';
    a.href = pdf; a.target = '_blank'; a.rel = 'noopener';
  }

  function isAnchorToNewsCard(a){
  try{
    var href = a.getAttribute('href') || '';
    if (!href) return false;
    var u = new URL(href, location.href);
    // 例: ./news.html#news-20251224-comte
    return /(^|\/)news\.html$/i.test(u.pathname) && /^#news-/.test(u.hash);
  }catch(_){ return false; }
}


  // 1ページ目の先頭テキスト or Title
  function readPdfSubtitle(pdfUrl){
    return new Promise(res=>{
      var pdfjs = window.pdfjsLib; if(!pdfjs) return res('');
      try{
        var task = pdfjs.getDocument({ url: pdfUrl });
        task.promise.then(doc=>{
          doc.getMetadata().then(meta=>{
            var t = (meta && meta.info && meta.info.Title) ? String(meta.info.Title).trim() : '';
            if (t) { doc.destroy().then(()=>res(t), ()=>res(t)); }
            else {
              doc.getPage(1).then(p=>{
                p.getTextContent().then(tc=>{
                  var s = '';
                  for (var i=0;i<tc.items.length;i++){ var x=(tc.items[i].str||'').trim(); if(x){ s=x; break; } }
                  doc.destroy().then(()=>res(s), ()=>res(s));
                }, ()=>{ try{doc.destroy();}catch(_){ } res(''); });
              }, ()=>{ try{doc.destroy();}catch(_){ } res(''); });
            }
          }, ()=>{ try{doc.destroy();}catch(_){ } res(''); });
        }, ()=>res(''));
      }catch(_){ res(''); }
    });
  }

  function ensureThumb(img, slug){
    if(!img) return;
    if(IMG_RE.test(img.src)) return;
    var base=(window.NEWS_ASSETS_BASE||'./news')+'/'+slug+'/';
    var trials=['poster.jpg','poster.jpeg','poster.png']; var i=0;
    img.onerror=function next(){ if(i>=trials.length){ img.style.display='none'; return; } img.src=base+trials[i++]; img.onerror=next; };
    img.onerror();
  }

  // aタグの正規化：カード内外に複数ある場合、最も外側の a を採用して他は中身を移して除去
  function normalizeAnchor(img){
    var innerA = img.closest('a');
    var outerA = img.parentElement;
    while (outerA && outerA.tagName !== 'A') outerA = outerA.parentElement;
    var a = outerA || innerA;

    if (!a){
      a = document.createElement('a'); a.className = 'news-card';
      img.parentNode.insertBefore(a, img); a.appendChild(img);
    } else {
      // aの内側にある余計なaを除去（子要素を移動してから消す）
      a.querySelectorAll('a').forEach(function(b){
        if (b === a) return;
        while (b.firstChild) a.appendChild(b.firstChild);
        b.remove();
      });
    }
    // 親側が a の場合、子の a は不要なので上の処理で解体済み
    // 二重発火防止
    a.addEventListener('click', function(e){ e.stopPropagation(); }, {capture:true});
    return a;
  }

  function pickOrCreateCaption(a){
    var cap = a.querySelector('figcaption.meta') || a.querySelector('figcaption') || a.querySelector('.meta');
    if(!cap){
      var fig = a.querySelector('figure'); if(!fig){ fig=document.createElement('figure'); a.appendChild(fig); }
      cap = document.createElement('figcaption'); cap.className='meta'; fig.appendChild(cap);
    } else { cap.classList.add('meta'); }
    cap.innerHTML=''; return cap;
  }

  function decorate(){
    var imgs = document.querySelectorAll('img[src*="/news/"][src*="/poster"]');
    var n=0;
    imgs.forEach(function(img){
      var m = IMG_RE.exec(img.src); if(!m) return; var slug=m[1];
      var a = normalizeAnchor(img);
      // 着地点IDを必ず保証（index → news.html#news-<slug> で飛べるように）
      if (!a.id || !/^news-/.test(a.id)) a.id = 'news-' + slug;
      a.classList.add('news-card'); // 共通ターゲットを必ず付与（将来CSSの安定化）
      ensureThumb(img, slug);

      // すでに「news.html#news-<slug>」を指している場合は上書きしない（index対策）
      if (!isAnchorToNewsCard(a)) {
      ensureRawPdfLink(a, slug);   // news.html 側は従来どおりPDF直開き
      } else {
        a.removeAttribute('target'); // 同タブ遷移
        a.rel = 'noopener';
      }


      var parts = splitSlug(slug);
      var titleTxt = toTitle(parts.tail);

      var cap = pickOrCreateCaption(a);
      var titleEl=document.createElement('div'); titleEl.className='title'; titleEl.textContent=titleTxt;
      var dateEl =document.createElement('time'); dateEl.className='date';  dateEl.textContent=parts.ymd || '—';
      var subEl  =document.createElement('div'); subEl.className='subtitle'; subEl.textContent=titleTxt;
      cap.appendChild(titleEl); cap.appendChild(dateEl); cap.appendChild(subEl);

      // 画像直後へ
      var fig=a.querySelector('figure'); if(fig){ a.insertBefore(cap, fig.nextSibling); }

      // 旧要素掃除（深い階層も）
      a.querySelectorAll('h1,h2,h3,h4,h5,h6,time:not(.date),.card-content,.mv__news__text,.news__meta,.news__text,.title:not(div.title),.subtitle:not(div.subtitle)').forEach(function(node){
        if (cap.contains(node)) return;
        if (node.closest('figure')) return;
        node.remove();
      });
      var parent=a.parentElement;
      if(parent){
        Array.from(parent.children).forEach(function(node){
          if(node===a) return;
          if(node.tagName==='SCRIPT'||node.tagName==='NOSCRIPT') return;
          if(node.nodeType===1) node.remove();
        });
      }

      // PDF本文からサブタイトル
      var pdfUrl=(window.NEWS_ASSETS_BASE||'./news')+'/'+slug+'/poster.pdf';
      readPdfSubtitle(pdfUrl).then(function(s){ if(s) subEl.textContent=s; });

      n++;
    });
    log('[decor] processed cards =', n);
  }

  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', decorate); }
  else { setTimeout(decorate,0); }
})();
