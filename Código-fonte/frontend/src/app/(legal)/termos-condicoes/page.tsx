import { LegalArticle } from '@/components/layout/LegalArticle';

export default function Page() {
  return (
    <LegalArticle
      titulo="Termos e Condições de Uso"
      atualizadoEm="9 de julho de 2026"
      aviso="Este texto é um modelo genérico de termos e condições e deve ser revisado por um profissional antes de ser tratado como definitivo."
    >
      <p>
        Ao usar o site da Atlas Nova Clean, você concorda com os termos descritos abaixo. Leia com
        atenção.
      </p>

      <h2>Sobre o site</h2>
      <p>
        Este site funciona como um catálogo digital dos produtos de limpeza, descartáveis e
        papelaria vendidos pela Atlas Nova Clean, localizada em Campos dos Goytacazes, RJ. Os
        pedidos montados aqui são finalizados diretamente com a loja pelo WhatsApp — o site não
        processa pagamentos.
      </p>

      <h2>Preços e disponibilidade</h2>
      <p>
        Os preços exibidos podem ser alterados sem aviso prévio e estão sujeitos a confirmação no
        momento do fechamento do pedido com a loja. A disponibilidade dos produtos depende do
        estoque no momento da compra.
      </p>

      <h2>Uso adequado do site</h2>
      <p>
        Você concorda em usar este site apenas para fins legítimos de consulta e compra, sem tentar
        acessar áreas restritas, copiar conteúdo para fins comerciais próprios ou interferir no
        funcionamento do site.
      </p>

      <h2>Avaliações de clientes</h2>
      <p>
        Ao publicar uma avaliação, você garante que o conteúdo é verdadeiro e não ofensivo. A Atlas
        Nova Clean pode remover avaliações que considerar inadequadas, falsas ou que violem estes
        termos.
      </p>

      <h2>Propriedade intelectual</h2>
      <p>
        A marca, o logotipo e os textos deste site pertencem à Atlas Nova Clean. As marcas de
        produtos citadas (Ypê, Veja, OMO, Tuff e outras) pertencem aos seus respectivos fabricantes
        e são mencionadas apenas para fins informativos de catálogo.
      </p>

      <h2>Limitação de responsabilidade</h2>
      <p>
        A Atlas Nova Clean não se responsabiliza por eventuais indisponibilidades temporárias do
        site ou por informações desatualizadas de preço/estoque que sejam corrigidas antes da
        confirmação final do pedido pelo WhatsApp.
      </p>

      <h2>Dúvidas</h2>
      <p>
        Em caso de dúvidas sobre estes termos, entre em contato pelo WhatsApp{' '}
        <a href="https://wa.me/5522997805258" target="_blank" rel="noopener">
          (22) 99780-5258
        </a>
        .
      </p>
    </LegalArticle>
  );
}
