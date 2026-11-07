import { makeEditorialComp } from './gl.js';
import { renderKeyframe } from './scene.js';

const Q = new URLSearchParams(location.search);
const isVert = Q.get('mode') === 'vertical' || window.innerHeight > window.innerWidth;
const W = isVert ? 1080 : 1920;
const H = isVert ? 1440 : 1080;

const cv = document.getElementById('gl');
cv.width = W;
cv.height = H;

const comp = makeEditorialComp(cv, W, H);
window.DUR = 10;

const fontsToLoad = [
  '600 24px "Noto Serif SC"',
  '700 36px "Noto Serif SC"',
  '700 34px "Playfair Display"',
];
await Promise.all(fontsToLoad.map(f => document.fonts.load(f).catch(() => {})));

window.render = t => {
  renderKeyframe(comp, t, W, H);
};
window.READY = true;
