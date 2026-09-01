import { LegalArticle } from '@/components/layout/LegalArticle';

export default function Page() {
  return (
    <LegalArticle
      titulo="Política de Devolução e Troca"
      atualizadoEm="9 de julho de 2026"
      aviso="Este texto é um modelo genérico baseado no CDC e deve ser revisado por um profissional (contador/advogado) antes de ser tratado como política definitiva da loja."
    >
      <p>
        Queremos que você fique satisfeito com sua compra. Esta política segue as regras do Código
        de Defesa do Consumidor (CDC) para compras feitas fora do estabelecimento físico, como pelo
        WhatsApp ou por este site.
      </p>

      <h2>Direito de arrependimento (7 dias)</h2>
      <p>
        De acordo com o <strong>Art. 49 do CDC</strong>, você tem até{' '}
        <strong>7 dias corridos</strong> a partir do recebimento do produto para desistir da compra,
        sem precisar justificar o motivo, desde que o produto esteja sem uso, na embalagem original
        e com todos os itens que o acompanham.
      </p>

      <h2>Produto com defeito ou problema</h2>
      <p>
        Se o produto apresentar algum defeito ou vício, você tem até <strong>30 dias</strong>{' '}
        (produtos não duráveis) para solicitar troca, reparo ou reembolso, conforme o{' '}
        <strong>Art. 18 do CDC</strong>.
      </p>

      <h2>Como solicitar uma devolução</h2>
      <ol>
        <li>
          Entre em contato pelo WhatsApp{' '}
          <a
            href="https://wa.me/5522997805258?text=Ol%C3%A1%2C%20quero%20solicitar%20uma%20devolu%C3%A7%C3%A3o%20ou%20troca"
            target="_blank"
            rel="noopener"
          >
            (22) 99780-5258
          </a>{' '}
          informando o número/data do pedido e o motivo.
        </li>
        <li>
          Nossa equipe vai orientar sobre a devolução do produto (retirada, envio ou entrega na
          loja).
        </li>
        <li>Após a análise do produto devolvido, o reembolso ou a troca é processado.</li>
      </ol>

      <h2>Reembolso</h2>
      <p>
        O reembolso é feito pela mesma forma de pagamento usada na compra (Pix, cartão ou dinheiro),
        em prazo combinado no momento da solicitação.
      </p>

      <h2>Produtos que não podem ser devolvidos</h2>
      <p>
        Produtos que tenham sido abertos, usados ou que, por questões de higiene (ex: descartáveis
        abertos), não possam ser revendidos não são elegíveis para devolução por arrependimento —
        exceto em caso de defeito.
      </p>
    </LegalArticle>
  );
}
