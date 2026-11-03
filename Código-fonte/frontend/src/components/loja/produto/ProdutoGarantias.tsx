import Link from 'next/link';

// Só o que dá pra sustentar: Mercado Pago é o gateway real, a cotação de frete devolve retirada
// a R$ 0 pra qualquer CEP, e os 7 dias são o direito de arrependimento (CDC, art. 49), já
// descritos na política de devolução. Sem prazo de entrega aqui: varia por CEP, e o cálculo de
// frete logo abaixo dá o número real.
const GARANTIAS = [
  { caminho: 'M3 7h18v10H3zM3 11h18', texto: 'Pix e cartão via Mercado Pago' },
  { caminho: 'M4 10l8-6 8 6v10H4zM10 20v-6h4v6', texto: 'Retirada grátis na loja, em Campos' },
];

function Icone({ caminho }: { caminho: string }) {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-[#14753c]"
    >
      <path d={caminho} />
    </svg>
  );
}

export function ProdutoGarantias() {
  return (
    <ul className="flex list-none flex-col gap-1.5 border-t border-line p-0 pt-3 text-[12.5px] text-navy">
      {GARANTIAS.map((garantia) => (
        <li key={garantia.texto} className="flex items-center gap-2">
          <Icone caminho={garantia.caminho} />
          {garantia.texto}
        </li>
      ))}
      <li className="flex items-center gap-2">
        <Icone caminho="M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4" />
        <Link href="/politica-devolucao" className="underline-offset-2 hover:underline">
          7 dias para desistir da compra
        </Link>
      </li>
    </ul>
  );
}
