const WHATSAPP_NUMERO = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? '';

export function CtaBand() {
  return (
    <section className="bg-navy px-5 py-12 text-center">
      <h2 className="font-display text-2xl font-bold text-white">Pronto pra fazer seu pedido?</h2>
      <p className="mx-auto mt-2 max-w-md text-[14px] text-sky/80">
        Manda sua lista no WhatsApp e a gente confirma tudo rapidinho.
      </p>
      <a
        href={`https://wa.me/${WHATSAPP_NUMERO}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-green px-6 py-3 text-[14px] font-bold text-white hover:brightness-110"
      >
        Chamar no WhatsApp
      </a>
    </section>
  );
}
