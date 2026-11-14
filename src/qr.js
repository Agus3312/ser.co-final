import { buildQrTargets, loadQrCodes, loadQrSession, saveQrCodes, saveQrSession } from './qr-helpers.js';
import { siteConfig } from './site-config.js';

const form = document.querySelector('#qr-form');
const results = document.querySelector('#qr-results');
const status = document.querySelector('#qr-status');
const count = document.querySelector('#qr-count');
const printButton = document.querySelector('#print-qrs');
const siteInput = document.querySelector('#site-url');
const instagramInput = document.querySelector('#instagram-url');
const whatsappInput = document.querySelector('#whatsapp-phone');
const facebookInput = document.querySelector('#facebook-url');
const submitButton = form.querySelector('[type="submit"]');

const savedSession = loadQrSession(window.localStorage);
let qrCodes = loadQrCodes(window.localStorage);
let QRCode;
let qrLibraryFailed = false;

instagramInput.value = savedSession?.instagramUrl ?? siteConfig.instagramUrl;
facebookInput.value = savedSession?.facebookUrl ?? siteConfig.facebookUrl;
whatsappInput.value = savedSession?.whatsappPhone ?? '';
siteInput.value = savedSession?.siteUrl ?? (window.location.protocol === 'https:' && !['localhost', '127.0.0.1'].includes(window.location.hostname) ? window.location.origin : '');

const qrLibraryReady = import('https://esm.sh/qrcode@1.5.4?bundle')
  .then((module) => {
    QRCode = module.default;
  })
  .catch(() => {
    qrLibraryFailed = true;
    status.textContent = 'No se pudo cargar el generador QR. Revisá tu conexión a internet e intentá de nuevo.';
  });

function persistQrSession() {
  const session = {
    siteUrl: siteInput.value.trim(),
    instagramUrl: instagramInput.value.trim(),
    whatsappPhone: whatsappInput.value.trim(),
    facebookUrl: facebookInput.value.trim(),
    updatedAt: new Date().toISOString()
  };

  saveQrSession(window.localStorage, session);
  return session;
}

function createDownloadLink(label, filename, dataUrl) {
  const link = document.createElement('a');
  link.className = 'qr-download';
  link.href = dataUrl;
  link.download = filename;
  link.textContent = label;
  return link;
}

async function createQrCard(target) {
  const article = document.createElement('article');
  article.className = 'qr-card';

  const cardHeader = document.createElement('div');
  cardHeader.className = 'qr-card-heading';
  const title = document.createElement('h3');
  title.textContent = target.name;
  const label = document.createElement('span');
  label.textContent = target.key === 'site' ? 'GENERAL' : 'DIRECTO';
  const headerActions = document.createElement('div');
  headerActions.className = 'qr-card-header-actions';
  const deleteButton = document.createElement('button');
  deleteButton.className = 'qr-delete';
  deleteButton.type = 'button';
  deleteButton.setAttribute('aria-label', `Eliminar QR de ${target.name}`);
  deleteButton.title = 'Eliminar este QR';
  const deleteIcon = document.createElement('span');
  deleteIcon.className = 'material-symbols-outlined';
  deleteIcon.setAttribute('aria-hidden', 'true');
  deleteIcon.textContent = 'delete';
  deleteButton.append(deleteIcon);
  headerActions.append(label, deleteButton);
  cardHeader.append(title, headerActions);
  deleteButton.addEventListener('click', async () => {
    qrCodes = qrCodes.filter(({ id }) => id !== target.id);
    saveQrCodes(window.localStorage, qrCodes);
    await renderQrCodes();
    status.textContent = 'Código eliminado.';
  });

  const canvas = document.createElement('canvas');
  canvas.className = 'qr-canvas';
  canvas.setAttribute('aria-label', `Código QR para ${target.name}`);
  await QRCode.toCanvas(canvas, target.url, {
    errorCorrectionLevel: 'H',
    width: 280,
    margin: 4,
    color: { dark: '#34473c', light: '#ffffff' }
  });

  const destination = document.createElement('p');
  destination.className = 'qr-destination';
  destination.textContent = target.url;

  const actions = document.createElement('div');
  actions.className = 'qr-card-actions';
  const filename = `${target.key}-cordero-oscar-${target.id.slice(-8)}`;
  actions.append(createDownloadLink('Descargar PNG', `${filename}.png`, canvas.toDataURL('image/png')));

  const svg = await QRCode.toString(target.url, {
    type: 'svg',
    width: 900,
    margin: 4,
    errorCorrectionLevel: 'H',
    color: { dark: '#34473c', light: '#ffffff' }
  });
  const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  actions.append(createDownloadLink('Descargar SVG', `${filename}.svg`, svgDataUrl));

  article.append(cardHeader, canvas, destination, actions);
  return article;
}

async function renderQrCodes() {
  results.replaceChildren();
  for (const qrCode of qrCodes) {
    results.append(await createQrCard(qrCode));
  }
  count.textContent = String(qrCodes.length).padStart(2, '0');
  printButton.disabled = qrCodes.length === 0;
}

[siteInput, instagramInput, whatsappInput, facebookInput].forEach((input) => {
  input.addEventListener('input', () => {
    persistQrSession();
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  status.textContent = 'Preparando códigos...';

  try {
    await qrLibraryReady;
    if (qrLibraryFailed || !QRCode) {
      status.textContent = 'No se pudo cargar el generador QR. Revisá tu conexión a internet e intentá de nuevo.';
      return;
    }

    const targets = buildQrTargets({
      siteUrl: siteInput.value.trim(),
      instagramUrl: instagramInput.value.trim(),
      whatsappPhone: whatsappInput.value,
      whatsappMessage: siteConfig.whatsappMessage,
      facebookUrl: facebookInput.value.trim()
    });

    if (targets.length === 0) {
      status.textContent = 'Agregá al menos un destino válido para generar un código.';
      return;
    }

    const timestamp = Date.now();
    const newCodes = targets.map((target, index) => ({
      ...target,
      id: globalThis.crypto?.randomUUID?.() ?? `${timestamp}-${index}-${Math.random().toString(36).slice(2)}`
    }));
    qrCodes = [...qrCodes, ...newCodes];
    saveQrCodes(window.localStorage, qrCodes);
    persistQrSession();
    await renderQrCodes();
    status.textContent = `Se agregaron ${newCodes.length} ${newCodes.length === 1 ? 'código' : 'códigos'}. Total guardado: ${qrCodes.length}.`;
  } catch {
    status.textContent = 'No se pudieron generar los códigos. Revisá los destinos e intentá de nuevo.';
  } finally {
    submitButton.disabled = false;
  }
});

printButton.addEventListener('click', () => window.print());

qrLibraryReady.then(async () => {
  if (!QRCode) return;
  try {
    await renderQrCodes();
    status.textContent = qrCodes.length ? `Hay ${qrCodes.length} códigos guardados.` : 'Acepta @usuario, teléfono local o dominio sin https.';
  } catch {
    status.textContent = 'No se pudieron restaurar los códigos guardados.';
  }
});