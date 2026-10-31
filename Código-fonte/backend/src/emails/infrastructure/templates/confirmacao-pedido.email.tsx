import { Button, Text } from '@react-email/components';
import { LayoutBaseEmail } from './layout-base.email';
import { ItensPedidoEmail } from './itens-pedido.email';
import { DadosPedidoEmail } from './dados-pedido-email';

export function ConfirmacaoPedidoEmail({
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
      preview={`Recebemos seu pedido #${numero}`}
      titulo={`Recebemos seu pedido, ${nomeCliente.split(' ')[0]}!`}
    >
      <Text style={{ fontSize: '14px', color: '#0a0e1a', lineHeight: '1.5' }}>
        Seu pedido <strong>#{numero}</strong> foi registrado e está aguardando a confirmação do
        pagamento. Assim que aprovarmos, avisamos por aqui de novo.
      </Text>
      <Text style={{ fontSize: '13px', color: '#5b6b8c' }}>
        {tipoEntrega === 'ENTREGA' ? 'Entrega no endereço cadastrado.' : 'Retirada na loja.'}
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

export default ConfirmacaoPedidoEmail;
