# Handoff: software de gestión para constructoras (piloto: Oscar Cordero)

> Documento para arrancar el proyecto en una sesión nueva de Claude.
> Fecha: 2026-11-15. Escrito al final de la sesión de la web.
> Convención: **[HECHO]** = lo dijo el cliente o está en el código. **[PROPUESTA]** = idea mía, no validada. **[ABIERTO]** = falta decidir o preguntar.

---

## 0. Cómo usar este documento

1. Abrí una sesión nueva de Claude Code con acceso a `Agus3312/software-constructoras`.
2. Pegale el **prompt de arranque** de la sección 12.
3. Pedile que use el skill `superpowers:brainstorming` antes de escribir código. Todavía no está aprobado ningún diseño.
4. Lo primero que hay que hacer es **hablar con Oscar** (sección 3). Sin eso, todo lo demás es hipótesis.

---

## 1. Qué es y para qué

**[HECHO]**
- Es un software para gestionar una constructora. Es un **proyecto distinto de la web** y no se mezcla con ella.
- Se piensa como **producto para varias constructoras**, con **Oscar Francisco Cordero como piloto** (cliente real, primer usuario).
- Oscar **cobra por comisión, no por m²**. Dice que la gente se va cuando ve un número fuera de su expectativa. Por eso la web no muestra precio final.
- La web nueva ya manda (o va a mandar) contactos al software con un armado de presupuesto: tipo de obra, metros, zona, destino (vivir/vender/alquilar), techo/fachada/piso y un rango opcional de gasto.

**[PROPUESTA]** Objetivo del producto, en una línea: *que el dueño de una constructora chica sepa en todo momento qué consultas tiene abiertas, qué obras están en marcha, cuánto se gastó y cuánto le queda cobrar, sin planillas ni mensajes perdidos.*

**Anti-objetivos [PROPUESTA]** (para no desviarse):
- No es un ERP contable ni reemplaza al contador.
- No calcula precios automáticos por m² (contradice el modelo de Oscar).
- No es una app para el cliente final de entrada. Primero resuelve el trabajo interno.

---

## 2. Estado actual del ecosistema

### La web (repo `Agus3312/ser.co-final`, rama `claude/epic-sagan-uugw2w`)
- **Producción:** https://cordero-obras.vercel.app (`/` = versión nueva, `/v1` = la anterior aprobada, `/presupuesto` = página que se comparte por WhatsApp).
- Proyecto Vercel `cordero-obras` (team `agus3312s-projects`). Hay otros dos proyectos viejos, `cordero-construcciones` y `cordero-construcciones-2do-dise-o`, sin tocar.
- Stack: Vite + JS vanilla + Lenis. Sin servidor.
- Hoy **no hay número de WhatsApp cargado** (`src/site-config.js` → `whatsappPhone: ''`). Mientras tanto el contacto principal cae en Instagram `@ser.co.ok`.

### Punto de integración ya preparado: `src/lead-hook.js`
```js
export const LEAD_ENDPOINT = '';   // acá va la URL del software
export async function enviarContacto(lead) { /* POST JSON, no rompe si falla */ }
```
Se invoca al apretar "Mandar por WhatsApp" en el armador, **antes** de abrir WhatsApp. Si falla, WhatsApp se abre igual.

### Forma del lead que manda la web (`buildLead` en `src/armador.js`)
```json
{
  "origen": "web-armador",
  "fecha": "2026-11-15T12:00:00.000Z",
  "elecciones": {
    "tipo": "ampliacion", "metros": "30-80", "zona": "norte", "destino": "vivir",
    "techo": "plano", "fachada": "ladrillo", "piso": "cemento", "rango": "10-30k"
  },
  "resumen": [["Obra","Ampliación"],["Metros","De 30 a 80 m²"], "..."]
}
```
Valores posibles (ids estables, definidos en `src/armador-config.js`):
- `tipo`: `refaccion` | `ampliacion` | `casa`
- `metros`: `hasta-30` | `30-80` | `80-150` | `mas-150` | `no-se`
- `zona`: `caba` | `norte` | `oeste` | `sur` | `otra`
- `destino`: `vivir` | `vender` | `alquilar`
- `techo`: `dos-aguas` | `plano` · `fachada`: `revoque` | `ladrillo` | `madera` · `piso`: `porcelanato` | `madera` | `cemento`
- `rango` (opcional): `hasta-10k` | `10-30k` | `30-80k` | `mas-80k` | `hablarlo`

**Ojo:** las zonas y los rangos en USD **los inventé yo** y nunca los validó Oscar. Probablemente cambien. El software no debe depender de que sean estos valores exactos: guardar el id y el texto.

**Limitación conocida:** el lead **no trae nombre ni teléfono**. El visitante manda un WhatsApp y el contacto real llega por ese chat. Para que el software tenga el teléfono, hay que pedirlo en el armador (cambio en la web) o recibirlo por la API de WhatsApp Business (ver ideas, sección 9).

### Pendientes del cliente (bloquean cosas)
- [ ] Número de WhatsApp de Oscar.
- [ ] Su lista de ítems/materiales y **cómo presupuesta hoy**.
- [ ] Logo, QR de Instagram, tarjeta.
- [ ] Renders reales (hoy hay 9 dibujos placeholder en `public/renders/`).

---

## 3. Preguntas para Oscar (descubrimiento) — hacerlas ANTES de diseñar

Orden de importancia. Una conversación de 30–45 min alcanza. Idealmente grabarla y transcribirla.

1. **Un día normal:** ¿cómo es el camino desde que entra una consulta hasta que cobra la obra? ¿Dónde se le pierde algo o se le complica?
2. **Comisión:** ¿cómo la calcula exactamente? ¿% sobre el costo total de la obra, sobre mano de obra, monto fijo, por etapa? ¿Quién paga los materiales, él o el cliente? ¿Cobra aunque la obra no se haga?
3. **Presupuesto:** ¿cómo lo arma hoy (planilla, papel, de memoria)? ¿Por rubros? ¿Qué rubros usa? ¿Cuántas versiones suele haber por cliente?
4. **Equipo:** ¿trabaja solo, con capataz, con subcontratistas (plomero, electricista, pintor)? ¿Quién necesita ver qué?
5. **Dónde está la información hoy:** WhatsApp, planillas, cuaderno, fotos en el celu. ¿Qué es lo que más se pierde?
6. **Volumen:** ¿cuántas consultas por mes, cuántas se convierten en obra, cuántas obras simultáneas?
7. **Clientes:** ¿quieren ver avance? ¿Piden fotos? ¿Cómo pagan (transferencia, efectivo, cheques, dólares)?
8. **Facturación:** ¿factura como persona física/monotributo/responsable inscripto? (Condiciona qué integrar o no.)
9. **Dispositivo:** ¿todo desde el celular? ¿Tiene compu? ¿Qué tan cómodo es con apps?
10. **Éxito:** ¿qué tendría que hacer el software en 3 meses para que diga "esto me sirve"?

Y para el producto (no para Oscar): conseguir **otras 2–3 constructoras chicas** para entrevistar rápido. Con una sola no se sabe qué es específico de Oscar y qué es general.

---

## 4. Decisiones abiertas

| # | Decisión | Opciones | Mi inclinación |
|---|---|---|---|
| D1 | ¿Cuál es la primera pieza? | (a) bandeja de consultas + seguimiento, (b) presupuestos, (c) seguimiento de obra | (a), porque ya existe la fuente de datos (la web) y tiene valor desde el día 1 |
| D2 | Modelo de comisión | % sobre costo / % sobre mano de obra / fijo / por etapa | Modelarlo **flexible** (tipo + parámetros) hasta saber |
| D3 | ¿Multi-tenant desde el día 1? | Sí (organización en cada tabla) / No, y migrar después | **Sí**, es barato al principio y carísimo después |
| D4 | Canal del cliente | Solo WhatsApp / portal web / ambos | WhatsApp primero (es donde ya vive) |
| D5 | Dónde vive el código | Repo propio `software-constructoras` | Ya fue creado; confirmar que está vacío |
| D6 | Nombre del producto | — | Definir con Agus; hoy se llama "software-constructoras" |

---

## 5. Stack propuesto **[PROPUESTA — validar]**

Criterio: que lo mantenga una sola persona, barato al arrancar, multi-tenant seguro, y rápido de iterar con Claude.

- **Frontend/app:** Next.js (App Router) + TypeScript, desplegado en Vercel. Mobile-first (Oscar va a usarlo desde el celular, en obra).
- **Base de datos y auth:** Supabase (Postgres + Auth + Storage + RLS). La seguridad multi-tenant se resuelve con **Row Level Security** por `organizacion_id`.
- **UI:** Tailwind + shadcn/ui. Reusar la paleta y la tipografía de la web (Space Grotesk, azul `#146ef5`, negro `#080808`) para coherencia de marca.
- **PWA** (instalable, offline básico para cargar fotos y gastos en obra sin señal).
- **Validación:** Zod. **Tests:** Vitest + Playwright para el flujo crítico.
- **Fotos:** Supabase Storage, con redimensionado en el cliente antes de subir.
- **Recibir leads de la web:** endpoint `POST /api/leads` (Route Handler) autenticado por una clave por organización. La web lo llama desde `lead-hook.js`.

Alternativas descartadas por ahora: backend separado (Express/Nest) → más piezas que mantener; Firebase → peor para datos relacionales; no-code (Airtable/Notion) → no escala como producto multi-constructora.

**Riesgo del endpoint público:** como la web es estática, cualquier clave que use para llamar al software queda visible en el navegador. Mitigar con: CORS restringido al dominio, rate limit, validación estricta, y tratar los leads como **no confiables** (se marcan "origen web" y pasan por revisión humana). No poner secretos reales en el front.

---

## 6. Modelo de datos inicial **[PROPUESTA]**

Todas las tablas llevan `organizacion_id` + RLS.

```
organizaciones        id, nombre, slug, creado_en
usuarios              id (auth), organizacion_id, nombre, rol (dueño|capataz|administrativo|solo_lectura)

contactos             id, org, nombre, telefono, email, origen (web|whatsapp|referido|otro), notas
consultas (leads)     id, org, contacto_id?, estado (nueva|contactada|visita|presupuestada|ganada|perdida),
                      origen, payload_web jsonb,   -- el lead tal cual llegó
                      tipo_obra, metros_rango, zona, destino, rango_gasto,
                      motivo_perdida?, creada_en, ultimo_contacto_en
actividades           id, org, consulta_id|obra_id, tipo (nota|llamada|whatsapp|visita|cambio_estado), texto, usuario_id, en

presupuestos          id, org, consulta_id|obra_id, version, estado (borrador|enviado|aprobado|rechazado),
                      modelo_comision, parametros_comision jsonb, total_estimado, vigente_hasta
presupuesto_items     id, presupuesto_id, rubro, descripcion, unidad, cantidad, costo_unitario, orden
catalogo_items        id, org, rubro, nombre, unidad, costo_referencia, proveedor_id?, actualizado_en
proveedores           id, org, nombre, contacto, rubros[]

obras                 id, org, contacto_id, presupuesto_aprobado_id, nombre, direccion,
                      estado (por_empezar|en_curso|pausada|terminada|cobrada), inicio, fin_estimado, fin_real
etapas                id, obra_id, nombre, orden, avance_pct, inicio, fin
gastos                id, obra_id, etapa_id?, fecha, concepto, monto, moneda, proveedor_id?, comprobante_url, pagado_por (oscar|cliente)
cobros                id, obra_id, fecha, monto, moneda, concepto (anticipo|etapa|comision|final), medio
fotos / documentos    id, obra_id, etapa_id?, url, tipo, tomada_en, visible_para_cliente bool
tareas                id, org, obra_id|consulta_id, titulo, vence_en, asignada_a, hecha
```

Notas:
- **Moneda:** en Argentina conviven ARS y USD. Guardar siempre `monto` + `moneda` y, cuando importe, el tipo de cambio usado. No mezclar en sumas sin convertir.
- **`payload_web jsonb`** conserva el lead original: permite reprocesar si cambian las reglas.
- **Comisión flexible:** `modelo_comision` + `parametros_comision jsonb` hasta que se sepa cómo la calcula Oscar (D2).

---

## 7. Roadmap por fases **[PROPUESTA]**

Cada fase termina con algo que Oscar pueda **usar de verdad**, no con una demo.

**Fase 0 — Descubrimiento (1 semana).** Entrevista con Oscar (sección 3), mirar sus planillas, entrevistar 2 constructoras más. Entregable: documento de diseño aprobado + decisión D1/D2.

**Fase 1 — Bandeja de consultas (MVP).**
- Login (Oscar + 1 usuario más), organización de prueba.
- `POST /api/leads` recibe lo de la web. Bandeja con estados y filtros.
- Ficha de consulta: datos, notas, historial, botón "responder por WhatsApp" con mensaje prellenado.
- Conectar `lead-hook.js` de la web.
- Éxito: Oscar deja de perder consultas y ve en un lugar cuáles están abiertas.

**Fase 2 — Presupuestos.**
- Presupuesto por rubros/ítems, versiones, catálogo propio de ítems.
- Modelo de comisión (según D2). Salida en PDF/link para el cliente. Aprobación.
- Éxito: arma un presupuesto en minutos y queda trazabilidad de versiones.

**Fase 3 — Obras en curso.**
- Obra creada desde presupuesto aprobado. Etapas con avance, gastos, cobros, fotos.
- Vista "rentabilidad": lo presupuestado vs lo gastado vs lo cobrado.
- Éxito: sabe cuánto gana o pierde cada obra mientras se hace.

**Fase 4 — Cliente y equipo.**
- Link de seguimiento para el cliente (fotos + avance, sin login pesado).
- Rol capataz (carga gastos/fotos desde el celu, sin ver comisiones).

**Fase 5 — Producto multi-constructora.**
- Alta de organizaciones, planes, onboarding, plantillas por tipo de constructora, panel de administración propio.

---

## 8. Reglas de trabajo para la sesión nueva **[PROPUESTA]**

- Brainstorming → documento de diseño aprobado → plan (`superpowers:writing-plans`) → recién ahí código.
- Probar siempre en el navegador (Playwright viene preinstalado en el contenedor) y con pantalla de celular primero.
- Todo texto de interfaz en **español rioplatense** (vos, tenés, armá), sin jerga técnica.
- Una sola curva de animación `cubic-bezier(0.22, 0.61, 0.36, 1)` y tiempos cortos, igual que la web.
- Nunca guardar secretos en el repo. Variables de entorno por Vercel/Supabase.
- Los datos de clientes son personales: RLS desde la primera tabla y un test que verifique que una organización **no puede leer** datos de otra.
- Commits chicos y descriptivos. No crear PRs sin que se pida.

---

## 9. Ideas de mejora (backlog para después del MVP)

Ordenadas por **valor / esfuerzo** estimado. Todas son propuestas.

### Alto valor, esfuerzo razonable
1. **WhatsApp Business API / Cloud API.** Recibir los mensajes en el software, asociar el teléfono a la consulta automáticamente, respuestas rápidas y plantillas. Resuelve la limitación de que el lead de la web no trae teléfono.
2. **Parte de obra por WhatsApp.** El capataz manda una foto con un texto ("pileta, 2do día de hormigón") y queda cargada en la obra y la etapa correctas.
3. **Carga de gastos con foto del ticket.** OCR del comprobante (monto, proveedor, fecha) con revisión humana. Hoy es lo que más se pierde en obra.
4. **Plantillas de presupuesto por tipo de obra** (baño, cocina, ampliación 30 m², casa 80 m²) con rubros típicos pre-cargados.
5. **Alertas de desvío:** avisar cuando lo gastado en una etapa supera lo presupuestado, o cuando una obra lleva N días sin avance cargado.
6. **Recordatorios de seguimiento:** "consulta sin respuesta hace 3 días", "presupuesto enviado sin novedades hace 7".

### Valor medio
7. **Link de seguimiento para el cliente** con fotos y línea de tiempo (diferencial comercial fuerte: transmite profesionalismo).
8. **Aprobación digital del presupuesto** con registro de fecha, IP y versión aprobada.
9. **Comparador de versiones** de un presupuesto (qué cambió entre la v1 y la v3).
10. **Cronograma visual** (Gantt simple) por obra con etapas y dependencias.
11. **Cobros con Mercado Pago** (links de pago por etapa) y conciliación automática.
12. **Ajuste por inflación:** actualizar presupuestos y saldos por índice (por ejemplo el de la Cámara Argentina de la Construcción) o por dólar, con regla definida por obra.
13. **Agenda de visitas** con calendario y recordatorio al cliente.
14. **Biblioteca de proveedores** con histórico de precios por material y alerta cuando sube.

### Con IA (probar cuando haya datos propios)
15. **Borrador de presupuesto desde audio o descripción:** Oscar dicta "baño de 3 por 2, cambiar cerámicos y sanitarios" y se arma el borrador con ítems del catálogo para que lo revise. Siempre con revisión humana, nunca precio automático por m².
16. **Resumen semanal de la obra** redactado a partir de fotos y notas, listo para mandar al cliente.
17. **Clasificación y priorización de consultas** a partir del payload y el chat (probabilidad de cierre estimada con su propio histórico, no con números genéricos).
18. **Sugerir ítems olvidados** ("en refacciones de baño suele faltar impermeabilización").

### Producto / negocio
19. **Reseñas post-obra** automáticas por WhatsApp y publicación en la web.
20. **Galería antes/después** que se alimenta sola desde las fotos marcadas como "publicable" y se refleja en la web de la constructora.
21. **Web + software como paquete:** cada constructora nueva recibe su sitio (como el de Oscar) conectado a su bandeja desde el día 1. Es un buen argumento de venta.
22. **Informes de rentabilidad** por tipo de obra, zona, cliente y mes (qué conviene tomar y qué rechazar).
23. **Modo offline completo** en obra con sincronización posterior.
24. **Facturación electrónica ARCA/AFIP** (solo si el relevamiento muestra que Oscar lo necesita; es una integración pesada).
25. **Importar su planilla actual** para que no arranque de cero (CSV de ítems, clientes y obras anteriores).

---

## 10. Riesgos

| Riesgo | Mitigación |
|---|---|
| Diseñar sin entender cómo trabaja Oscar | Fase 0 obligatoria antes de código |
| Sobreconstruir para "varias constructoras" con una sola validación | Piloto real, entrevistar 2–3 más, mantener lo específico de Oscar en configuración |
| El lead de la web sin teléfono limita el seguimiento | Pedir teléfono en el armador, o WhatsApp Cloud API (idea 1) |
| Endpoint público con clave visible en el navegador | CORS + rate limit + validación + leads no confiables |
| Datos personales y financieros de clientes | RLS + tests de aislamiento + backups |
| Mezclar ARS/USD y errores en cuentas | Moneda explícita por monto; tipo de cambio guardado |
| Oscar no adopta la herramienta | Mobile-first, carga en 2 toques, cero jerga, acompañarlo las primeras semanas |
| Dependencia de un solo desarrollador/Claude | Documentar decisiones en `docs/`, tests del flujo crítico |

---

## 11. Estado del repositorio del software al cierre de esta sesión

- `Agus3312/software-constructoras` fue **agregado al alcance** de la sesión de la web, pero **no se llegó a clonar** (se interrumpió). **No se sabe si está vacío**: verificar al empezar (`git ls-remote` / `ls`).
- No hay una sola línea de código escrita para el software. No hay diseño aprobado.
- La sesión nueva debería arrancar por crear `docs/superpowers/specs/AAAA-MM-DD-software-constructoras-design.md` con el diseño aprobado, y este archivo copiado a `docs/`.

---

## 12. Prompt de arranque (copiar y pegar en la sesión nueva)

```
Vamos a diseñar el software de gestión para constructoras. Piloto: Oscar Francisco Cordero.
Leé docs/HANDOFF-software-constructoras.md (o el archivo que te pase) completo antes de responder.

Reglas:
- Español rioplatense.
- Usá el skill de brainstorming. No escribas código ni instales nada hasta que yo apruebe el diseño.
- Todavía no hablé con Oscar: ayudame a preparar y registrar esa entrevista (sección 3) y tomá lo que
  respondí como único dato confirmado. Lo marcado como PROPUESTA es hipótesis tuya del pasado, cuestionalo.
- Empezá resumiéndome en 150 palabras lo que entendiste y haceme la pregunta que más cambie lo que se construye.

Contexto técnico: la web de Oscar está en https://cordero-obras.vercel.app (repo Agus3312/ser.co-final,
rama claude/epic-sagan-uugw2w). El software va en Agus3312/software-constructoras.
```

---

## 13. Referencias rápidas

- Web producción: https://cordero-obras.vercel.app
- Repo web: `Agus3312/ser.co-final` (rama `claude/epic-sagan-uugw2w`)
- Repo software: `Agus3312/software-constructoras`
- Archivos clave de la web para la integración: `src/lead-hook.js`, `src/armador.js` (`buildLead`), `src/armador-config.js`, `src/contact.js` (`buildWhatsAppUrl`), `src/site-config.js`
- Instagram: https://www.instagram.com/ser.co.ok/
- Brief original de la web: `BRIEF-web-oscar.md` (llamada del 31/10)
