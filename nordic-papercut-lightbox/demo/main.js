import { makePapercutComp } from './gl.js';
import { createLayers, renderFrame } from './scene.js';

const params = new URLSearchParams(location.search);
const mode = params.get('mode') === 'vertical' ? 'vertical' : 'horizontal';
const W = mode === 'vertical' ? 1080 : 1920;
const H = mode === 'vertical' ? 1440 : 1080;

const stage = document.getElementById('stage');
stage.width = W;
stage.height = H;
stage.style.width = W + 'px';
stage.style.height = H + 'px';

const comp = makePapercutComp(stage, W, H);
const layers = createLayers(W, H);

await document.fonts.ready;

window.render = (t = 6.0) => {
  renderFrame(comp, layers, t, mode);
};
window.__seek = window.render;

window.render(6.0);
window.READY = true;
window.__ready = true;
