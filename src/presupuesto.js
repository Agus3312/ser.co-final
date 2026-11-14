import './styles-v2.css';
import { armadorConfig as config } from './armador-config.js';
import { buildSummary, parseShareParams, renderPath } from './armador.js';

const state = parseShareParams(config, window.location.search);
const summary = document.querySelector('.summary');
for (const [label, value] of buildSummary(config, state)) {
  const dt = document.createElement('dt');
  dt.textContent = label;
  const dd = document.createElement('dd');
  dd.textContent = value;
  summary.append(dt, dd);
}

const rows = Object.fromEntries(buildSummary(config, { techo: 'dos-aguas', fachada: 'revoque', piso: 'madera', ...state }));
const images = document.querySelector('.share-images');
for (const [vista, alt] of [
  ['exterior', `Fachada con techo ${rows.Techo.toLowerCase()} y terminación ${rows.Fachada.toLowerCase()}`],
  ['interior', `Ambiente interior con piso de ${rows.Piso.toLowerCase()}`]
]) {
  const fig = document.createElement('figure');
  const img = document.createElement('img');
  img.src = renderPath(config, state, vista);
  img.alt = alt;
  img.width = 1600;
  img.height = 1000;
  const cap = document.createElement('figcaption');
  cap.textContent = config.renders.leyenda;
  fig.append(img, cap);
  images.append(fig);
}
