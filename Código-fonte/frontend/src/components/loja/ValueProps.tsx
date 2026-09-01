const PROPS = [
  {
    icone: '📦',
    titulo: 'Atacado e varejo',
    texto:
      'Compre em quantidade pro seu comércio ou só o que precisa pra casa — mesmo preço justo dos dois jeitos.',
    destaque: true,
  },
  {
    icone: '💬',
    titulo: 'Pedido no WhatsApp',
    texto: 'Manda sua lista e a gente confirma tudo por lá, sem complicação.',
  },
  {
    icone: '✅',
    titulo: 'Marcas confiáveis',
    texto: 'Ypê, Veja, OMO, Downy e outras marcas que você já conhece e confia.',
  },
];

export function ValueProps() {
  return (
    <section id="sobre" className="mx-auto max-w-[1180px] px-5 py-14">
      <h2 className="mb-6 text-center font-display text-2xl font-bold text-navy">
        Por que comprar na Atlas Nova Clean
      </h2>
      <div className="grid gap-4 nav:grid-cols-3">
        {PROPS.map((prop) => (
          <div
            key={prop.titulo}
            className={[
              'rounded-atlas p-6 shadow-atlas',
              prop.destaque
                ? 'bg-navy text-white nav:row-span-2'
                : 'border border-line bg-white text-navy',
            ].join(' ')}
          >
            <span className="mb-3 block text-3xl" aria-hidden="true">
              {prop.icone}
            </span>
            <h3 className="mb-1.5 font-display text-lg font-bold">{prop.titulo}</h3>
            <p className={prop.destaque ? 'text-[13.5px] text-sky/90' : 'text-[13.5px] text-muted'}>
              {prop.texto}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
