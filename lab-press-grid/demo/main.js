import { renderFilm, buildArchivePaper, buildEvents, DUR } from './film.js';

const cv = document.getElementById('c');
const g = cv.getContext('2d');

const fams = [
  '400 40px "Archivo"',
  '500 40px "Archivo"',
  '600 40px "Archivo"',
  '700 40px "Archivo"',
  '800 40px "Archivo"',
  '400 40px "JetBrains Mono"',
  '700 40px "JetBrains Mono"',
  '500 40px "Noto Sans SC"',
  '700 40px "Noto Sans SC"',
  '900 40px "Noto Sans SC"',
];

const sampleText = '工程套印网格推理成本拆解显存折叠稀疏激活破局砍掉显存墙按需唤醒算力架构级降维打击低秩联合压缩切碎冗余缓存显存占用直降九成每仅激活专家参数脱离稠密网格约束三大机制叠加把百万推理成本砍掉传统全量键值缓存冗余注意力头显存跨卡通信带宽阻塞机密实测键值缓存压缩率单激活参数总参数总成本稀疏路由0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

await Promise.all(fams.map(f => document.fonts.load(f, sampleText)));
await document.fonts.ready;

buildArchivePaper();

const Q = new URLSearchParams(location.search);
const mode = Q.get('mode') || 'custom';

window.DUR = DUR;
window.EV = buildEvents();
window.render = t => renderFilm(g, t, { mode });
window.READY = true;
