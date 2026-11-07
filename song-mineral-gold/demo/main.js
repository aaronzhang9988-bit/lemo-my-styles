import { makeSilkComp } from './gl.js';
import { renderKeyframe } from './scene.js';

const Q = new URLSearchParams(location.search);
const isVert = Q.get('mode') === 'vertical' || window.innerHeight > window.innerWidth;
const W = isVert ? 1080 : 1920;
const H = isVert ? 1440 : 1080;

const cv = document.getElementById('gl');
cv.width = W;
cv.height = H;

const comp = makeSilkComp(cv, W, H);
window.DUR = 10;

const fontsToLoad = ['600 28px "Noto Serif SC"', '700 32px "Noto Serif SC"'];
await Promise.all(fontsToLoad.map(f => document.fonts.load(f).catch(() => {})));

window.render = t => {
  renderKeyframe(comp, t, W, H);
};
window.READY = true;

