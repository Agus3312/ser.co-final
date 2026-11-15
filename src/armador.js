// Lógica pura del armador: sin DOM, para poder testearla.

export const VISUAL_DEFAULTS = { techo: 'dos-aguas', fachada: 'revoque', piso: 'madera' };

function allQuestions(config) {
  return [
    ...config.pasos.map((p) => ({ id: p.id, label: p.pregunta, opciones: p.opciones })),
    ...config.visual.grupos.map((g) => ({ id: g.id, label: g.label, opciones: g.opciones })),
    { id: config.rango.id, label: config.rango.pregunta, opciones: config.rango.opciones }
  ];
}

export function findOption(config, questionId, optionId) {
  const question = allQuestions(config).find((q) => q.id === questionId);
  return question?.opciones.find((o) => o.id === optionId) ?? null;
}

// Devuelve solo las elecciones válidas según la config.
export function sanitizeState(config, raw = {}) {
  const state = {};
  for (const q of allQuestions(config)) {
    if (raw[q.id] && q.opciones.some((o) => o.id === raw[q.id])) state[q.id] = raw[q.id];
  }
  return state;
}

export function withVisualDefaults(state) {
  return { ...VISUAL_DEFAULTS, ...state };
}

export function renderPath(config, state, vista) {
  const s = withVisualDefaults(state);
  return config.renders[vista]
    .replace('{techo}', s.techo)
    .replace('{fachada}', s.fachada)
    .replace('{piso}', s.piso);
}

// Lista ordenada de [pregunta corta, respuesta] para el resumen y el mensaje.
export function buildSummary(config, state) {
  const rows = [];
  const short = { tipo: 'Obra', metros: 'Metros', zona: 'Zona', destino: 'Destino' };
  for (const paso of config.pasos) {
    const opt = findOption(config, paso.id, state[paso.id]);
    if (opt) rows.push([short[paso.id] ?? paso.pregunta, opt.label]);
  }
  for (const grupo of config.visual.grupos) {
    const opt = findOption(config, grupo.id, state[grupo.id]);
    if (opt) rows.push([grupo.label, opt.label]);
  }
  const rango = findOption(config, config.rango.id, state[config.rango.id]);
  rows.push(['Presupuesto', rango ? rango.label : config.textos.sinRango]);
  return rows;
}

export function buildShareUrl(baseUrl, config, state) {
  const url = new URL(baseUrl);
  const clean = sanitizeState(config, state);
  for (const [key, value] of Object.entries(clean)) url.searchParams.set(key, value);
  return url.toString();
}

export function parseShareParams(config, search) {
  const params = new URLSearchParams(search);
  return sanitizeState(config, Object.fromEntries(params.entries()));
}

export function buildMessage(config, state, shareUrl) {
  const lines = [config.textos.saludo, ''];
  for (const [label, value] of buildSummary(config, state)) lines.push(`• ${label}: ${value}`);
  if (shareUrl) lines.push('', `${config.textos.verImagen} ${shareUrl}`);
  lines.push('', config.textos.cierre);
  return lines.join('\n');
}

// Payload listo para mandar al software de gestión cuando exista.
export function buildLead(config, state) {
  return {
    origen: 'web-armador',
    fecha: new Date().toISOString(),
    elecciones: sanitizeState(config, state),
    resumen: buildSummary(config, state)
  };
}
