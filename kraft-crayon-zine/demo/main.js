import { makeComp, W, H } from './gl.js';
import { BOIL } from './crayon.js';
import { DUR, EV, SUBS, frame } from './film.js';

const comp = makeComp(document.getElementById('gl'), W, H);
window.DUR = DUR;
window.EV = EV;
window.SUBS = SUBS;

const fontsToLoad = ['400 40px "Patrick Hand"', '400 40px "ZCOOL KuaiLe"'];
await Promise.all(fontsToLoad.map(f => document.fonts.load(f).catch(() => {})));

window.render = t => {
  BOIL.step = Math.floor(t * 12 + 1e-6);
  frame(comp, t);
};
window.READY = true;
