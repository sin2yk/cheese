// 安定版：1本分(+gap)だけ送る／中央だけ可視／確実停止
(() => {
  const wrap  = document.querySelector('.hero-copy');      // コンテナ
  const title = document.querySelector('.hero-title');     // 見出し
  const lead  = document.querySelector('.hero-lead');      // 下段テキスト
  if (!wrap || !title) return;

  // viewport と track を用意
  const viewport = document.createElement('div');
  viewport.className = 'marquee-viewport';

  const track = document.createElement('div');
  track.className = 'marquee-track';

  // DOM配置：lead の前に viewport を入れ、その中に track、track に title を移して複製を追加
  wrap.insertBefore(viewport, lead || wrap.firstChild);
  viewport.appendChild(track);
  track.appendChild(title);
  const clone = title.cloneNode(true);
  track.appendChild(clone);

  // 基本は隙間ゼロ
  wrap.style.setProperty('--marquee-gap', '0px');

  const SPEED = 80; // px/sec（好みで調整）

  function updateMetrics() {
    // フォントロード後でも正しい幅になるように getBoundingClientRect で天井切り上げ
    const oneWidth = Math.ceil(title.getBoundingClientRect().width || title.scrollWidth);

    // 可視窓を「ちょうど1本分」に
    viewport.style.width = oneWidth + 'px';

    // gap を取得（ゼロ前提だけど将来の調整に対応）
    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap || '0');

    // ★重要：送る距離は「1本分 + gap」だけ（2本分にしない）
    const shift = oneWidth + gap;

    // 速度一定：距離 / 速度 = 時間
    const durationSec = shift / SPEED;

    wrap.style.setProperty('--marquee-gap', '24px');
    wrap.style.setProperty('--marquee-shift', `${shift}px`);
    wrap.style.setProperty('--marquee-duration', `${durationSec}s`);
  }

  // 初期計算（フォントが遅延する環境対策）
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateMetrics);
  }
  updateMetrics();
  window.addEventListener('resize', updateMetrics);

  // 再生/停止トグル（確実停止のため直接 playState も制御）
  let running = false;
  function setRunning(state) {
    running = state;
    wrap.classList.toggle('is-running', state);
    track.style.animationPlayState = state ? 'running' : 'paused';
  }

  viewport.addEventListener('click', () => setRunning(!running));

  // 初期は停止
  setRunning(false);
})();
