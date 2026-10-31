import { Button, Text } from '@react-email/components';
import { LayoutBaseEmail } from './layout-base.email';
import { ItensPedidoEmail } from './itens-pedido.email';
import { DadosPedidoEmail } from './dados-pedido-email';

export function PagamentoAprovadoEmail({
  numero,
  nomeCliente,
  itens,
  total,
  valorFrete,
  desconto,
  tipoEntrega,
  linkAcompanhamento,
}: DadosPedidoEmail) {
  return (
    <LayoutBaseEmail
      preview={`Pagamento do pedido #${numero} aprovado`}
      titulo={`Pagamento aprovado, ${nomeCliente.split(' ')[0]}!`}
    >
      <Text style={{ fontSize: '14px', color: '#0a0e1a', lineHeight: '1.5' }}>
        Confirmamos o pagamento do seu pedido <strong>#{numero}</strong>. Já estamos preparando
        {tipoEntrega === 'ENTREGA' ? ' o envio.' : ' tudo para a retirada na loja.'}
      </Text>

      <ItensPedidoEmail itens={itens} total={total} valorFrete={valorFrete} desconto={desconto} />

      {linkAcompanhamento && (
        <Button
          href={linkAcompanhamento}
          style={{
            backgroundColor: '#0b1f4d',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 'bold',
            padding: '12px 20px',
            borderRadius: '8px',
            marginTop: '20px',
          }}
        >
          Acompanhar pedido
        </Button>
      )}
    </LayoutBaseEmail>
  );
}

export default PagamentoAprovadoEmail;
