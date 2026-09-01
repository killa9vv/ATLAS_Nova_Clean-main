import { LegalArticle } from '@/components/layout/LegalArticle';

export default function Page() {
  return (
    <LegalArticle
      titulo="Política de Entrega"
      atualizadoEm="9 de julho de 2026"
      aviso="Este texto é um modelo genérico de política de entrega e deve ser revisado e ajustado pela loja conforme sua operação real (prazos, áreas atendidas, valores de frete)."
    >
      <p>
        Esta página explica como funciona a entrega e a retirada dos pedidos feitos na Atlas Nova
        Clean.
      </p>

      <h2>Retirada na loja</h2>
      <p>
        Você pode retirar seu pedido pessoalmente em{' '}
        <strong>Av. Arthur Bernardes, 619 — Campos dos Goytacazes, RJ</strong>, de segunda a sábado,
        das 8h às 18h, assim que a loja confirmar que o pedido está pronto.
      </p>

      <h2>Entrega</h2>
      <p>
        Para pedidos com entrega, o valor do frete e o prazo são calculados junto com a loja pelo
        WhatsApp, considerando o endereço informado e o volume do pedido. Você recebe essa
        informação antes de confirmar a compra.
      </p>
      <p>
        O prazo estimado para entregas dentro de Campos dos Goytacazes é de{' '}
        <strong>1 a 3 dias úteis</strong> a partir da confirmação do pagamento, podendo variar
        conforme a região e a disponibilidade dos produtos.
      </p>

      <h2>Acompanhamento do pedido</h2>
      <p>
        Como o pedido é finalizado pelo WhatsApp, qualquer atualização sobre o status da entrega
        (saiu para entrega, atraso, necessidade de reagendar) é feita diretamente na conversa com a
        loja.
      </p>

      <h2>Problemas na entrega</h2>
      <p>
        Se o produto chegar danificado, com itens faltando ou diferente do combinado, entre em
        contato pelo WhatsApp em até 48 horas após o recebimento para que possamos resolver — veja
        também nossa <a href="/politica-devolucao">Política de Devolução</a>.
      </p>
    </LegalArticle>
  );
}
