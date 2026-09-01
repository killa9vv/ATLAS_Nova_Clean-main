import { LegalArticle } from '@/components/layout/LegalArticle';

export default function Page() {
  return (
    <LegalArticle
      titulo="Política de Privacidade"
      atualizadoEm="9 de julho de 2026"
      aviso="Este texto é um modelo genérico de política de privacidade baseado na LGPD e deve ser revisado por um profissional antes de ser tratado como definitivo — principalmente se a loja passar a usar ferramentas de análise (Google Analytics, Meta Pixel etc.)."
    >
      <p>
        Esta política explica como a Atlas Nova Clean trata os dados pessoais de quem visita este
        site ou faz pedidos, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº
        13.709/2018).
      </p>

      <h2>Quais dados coletamos</h2>
      <ul>
        <li>Nome e telefone, quando você preenche o formulário de finalização de pedido;</li>
        <li>Endereço de entrega, quando aplicável;</li>
        <li>Itens do seu carrinho de compras, armazenados apenas no seu navegador;</li>
        <li>Avaliações e comentários que você opte por publicar no site.</li>
      </ul>

      <h2>Para que usamos esses dados</h2>
      <p>
        Usamos essas informações exclusivamente para processar seu pedido, entrar em contato pelo
        WhatsApp e organizar a entrega ou retirada. Não usamos seus dados para nenhuma outra
        finalidade sem o seu conhecimento.
      </p>

      <h2>Cookies</h2>
      <p>
        Este site usa cookies e armazenamento local do navegador para lembrar os itens do seu
        carrinho e suas avaliações enviadas. Você pode gerenciar essa preferência no banner de
        cookies exibido na primeira visita.
      </p>

      <h2>Compartilhamento com terceiros</h2>
      <p>
        Não vendemos nem compartilhamos seus dados pessoais com terceiros, exceto quando
        estritamente necessário para viabilizar a entrega do seu pedido.
      </p>

      <h2>Seus direitos como titular dos dados</h2>
      <p>
        Conforme a LGPD, você pode solicitar a qualquer momento: acesso aos seus dados, correção de
        informações incorretas, exclusão dos seus dados ou informações sobre como eles são usados.
        Basta entrar em contato pelo WhatsApp{' '}
        <a href="https://wa.me/5522997805258" target="_blank" rel="noopener">
          (22) 99780-5258
        </a>
        .
      </p>
    </LegalArticle>
  );
}
