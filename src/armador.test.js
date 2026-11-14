import test from 'node:test';
import assert from 'node:assert/strict';
import { armadorConfig as config } from './armador-config.js';
import {
  buildLead,
  buildMessage,
  buildShareUrl,
  buildSummary,
  parseShareParams,
  renderPath,
  sanitizeState
} from './armador.js';
import { resolvePrimaryContact } from './contact.js';
import { enviarContacto } from './lead-hook.js';

const full = {
  tipo: 'ampliacion',
  metros: '30-80',
  zona: 'norte',
  destino: 'vivir',
  techo: 'plano',
  fachada: 'ladrillo',
  piso: 'cemento',
  rango: '10-30k'
};

test('drops unknown questions and options', () => {
  assert.deepEqual(sanitizeState(config, { tipo: 'casa', metros: 'mil', hack: 'x' }), { tipo: 'casa' });
});

test('summary follows the config order and never shows a computed price', () => {
  const rows = buildSummary(config, full);
  assert.deepEqual(rows.map(([k]) => k), ['Obra', 'Metros', 'Zona', 'Destino', 'Techo', 'Fachada', 'Piso', 'Presupuesto']);
  assert.deepEqual(rows.at(-1), ['Presupuesto', 'De USD 10.000 a 30.000']);
});

test('budget row says "Sin definir" when the visitor skips it', () => {
  assert.deepEqual(buildSummary(config, { tipo: 'casa' }).at(-1), ['Presupuesto', 'Sin definir']);
});

test('share URL round-trips through the query string', () => {
  const url = buildShareUrl('https://example.com/presupuesto.html', config, { ...full, extra: '1' });
  assert.ok(!url.includes('extra'));
  assert.deepEqual(parseShareParams(config, new URL(url).search), full);
});

test('message lists every choice, the share link and the closing line', () => {
  const msg = buildMessage(config, full, 'https://example.com/p?tipo=ampliacion');
  assert.match(msg, /^Hola Oscar/);
  assert.match(msg, /• Obra: Ampliación/);
  assert.match(msg, /• Piso: Cemento alisado/);
  assert.match(msg, /Mirá lo que elegí: https:\/\/example\.com\/p\?tipo=ampliacion/);
  assert.match(msg, /¿Lo podemos conversar\?$/);
});

test('render paths fill defaults for missing visual choices', () => {
  assert.equal(renderPath(config, { fachada: 'madera' }, 'exterior'), '/renders/exterior-dos-aguas-madera.svg');
  assert.equal(renderPath(config, full, 'interior'), '/renders/interior-cemento.svg');
});

test('every render combination in the config has a file name', () => {
  const [techos, fachadas, pisos] = config.visual.grupos.map((g) => g.opciones.map((o) => o.id));
  const paths = new Set();
  for (const techo of techos) for (const fachada of fachadas) paths.add(renderPath(config, { techo, fachada }, 'exterior'));
  for (const piso of pisos) paths.add(renderPath(config, { piso }, 'interior'));
  assert.equal(paths.size, 9);
});

test('lead payload carries clean choices for the future software', () => {
  const lead = buildLead(config, { ...full, nope: 'x' });
  assert.equal(lead.origen, 'web-armador');
  assert.deepEqual(lead.elecciones, full);
});

test('lead hook is a safe no-op until an endpoint is configured', async () => {
  let called = false;
  const res = await enviarContacto({}, { fetchImpl: () => { called = true; } });
  assert.equal(called, false);
  assert.equal(res.enviado, false);
});

test('primary contact uses WhatsApp when a number exists, Instagram otherwise', () => {
  const base = { instagramUrl: 'https://www.instagram.com/ser.co.ok/' };
  assert.equal(resolvePrimaryContact({ ...base, whatsappPhone: '' }, 'Hola').channel, 'instagram');
  const wa = resolvePrimaryContact({ ...base, whatsappPhone: '11 2345 6789' }, 'Hola');
  assert.equal(wa.url, 'https://wa.me/5491123456789?text=Hola');
});
