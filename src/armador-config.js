// Opciones y textos del armador de presupuesto.
// Para cambiar una pregunta, una opción o un texto, se edita solo este archivo.
//
// Cada opción tiene:
//   id     → lo que viaja en el link (sin espacios ni tildes; no cambiarlo una vez publicado)
//   label  → lo que ve el visitante y lo que llega en el WhatsApp
//   detalle (opcional) → una línea de ayuda debajo del label

export const armadorConfig = {
  // Los 4 pasos de un clic.
  pasos: [
    {
      id: 'tipo',
      pregunta: '¿Qué querés hacer?',
      opciones: [
        { id: 'refaccion', label: 'Refacción', detalle: 'Renovar lo que ya tenés' },
        { id: 'ampliacion', label: 'Ampliación', detalle: 'Sumar metros a tu casa' },
        { id: 'casa', label: 'Casa desde cero', detalle: 'Obra nueva en tu terreno' }
      ]
    },
    {
      id: 'metros',
      pregunta: '¿Cuántos metros, más o menos?',
      opciones: [
        { id: 'hasta-30', label: 'Hasta 30 m²' },
        { id: '30-80', label: 'De 30 a 80 m²' },
        { id: '80-150', label: 'De 80 a 150 m²' },
        { id: 'mas-150', label: 'Más de 150 m²' },
        { id: 'no-se', label: 'Todavía no sé' }
      ]
    },
    {
      id: 'zona',
      pregunta: '¿Dónde es la obra?',
      opciones: [
        { id: 'caba', label: 'CABA' },
        { id: 'norte', label: 'Zona norte' },
        { id: 'oeste', label: 'Zona oeste' },
        { id: 'sur', label: 'Zona sur' },
        { id: 'otra', label: 'Otra zona' }
      ]
    },
    {
      id: 'destino',
      pregunta: '¿Es para vivir o para vender?',
      opciones: [
        { id: 'vivir', label: 'Para vivir' },
        { id: 'vender', label: 'Para vender' },
        { id: 'alquilar', label: 'Para alquilar' }
      ]
    }
  ],

  // Paso visual: cada elección cambia la imagen al instante.
  // Las imágenes salen de las rutas de `renders` reemplazando {techo}, {fachada} y {piso}.
  visual: {
    pregunta: 'Elegí cómo te imaginás el resultado',
    grupos: [
      {
        id: 'techo',
        label: 'Techo',
        vista: 'exterior',
        opciones: [
          { id: 'dos-aguas', label: 'A dos aguas' },
          { id: 'plano', label: 'Plano' }
        ]
      },
      {
        id: 'fachada',
        label: 'Fachada',
        vista: 'exterior',
        opciones: [
          { id: 'revoque', label: 'Revoque blanco' },
          { id: 'ladrillo', label: 'Ladrillo visto' },
          { id: 'madera', label: 'Madera' }
        ]
      },
      {
        id: 'piso',
        label: 'Piso',
        vista: 'interior',
        opciones: [
          { id: 'porcelanato', label: 'Porcelanato' },
          { id: 'madera', label: 'Madera' },
          { id: 'cemento', label: 'Cemento alisado' }
        ]
      }
    ]
  },

  // Cuando lleguen los renders definitivos, se reemplazan los archivos
  // en /public/renders con los mismos nombres (o se cambia la extensión acá).
  renders: {
    exterior: '/renders/exterior-{techo}-{fachada}.svg',
    interior: '/renders/interior-{piso}.svg',
    leyenda: 'Imagen ilustrativa'
  },

  // Rango opcional. Nunca se muestra un precio calculado: lo elige el visitante.
  rango: {
    id: 'rango',
    pregunta: '¿Hasta dónde querés gastar?',
    ayuda: 'Es opcional. Nos sirve para proponerte opciones que entren en tu presupuesto.',
    opciones: [
      { id: 'hasta-10k', label: 'Hasta USD 10.000' },
      { id: '10-30k', label: 'De USD 10.000 a 30.000' },
      { id: '30-80k', label: 'De USD 30.000 a 80.000' },
      { id: 'mas-80k', label: 'Más de USD 80.000' },
      { id: 'hablarlo', label: 'Prefiero hablarlo' }
    ]
  },

  textos: {
    saludo: 'Hola Oscar, armé un presupuesto en la web:',
    cierre: '¿Lo podemos conversar?',
    verImagen: 'Mirá lo que elegí:',
    sinRango: 'Sin definir'
  }
};
