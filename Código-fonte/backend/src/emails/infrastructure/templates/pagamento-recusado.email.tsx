import { Button, Text } from '@react-email/components';
import { LayoutBaseEmail } from './layout-base.email';
import { ItensPedidoEmail } from './itens-pedido.email';
import { DadosPedidoEmail } from './dados-pedido-email';

export interface DadosPagamentoRecusadoEmail extends DadosPedidoEmail {
  linkTentarDeNovo: string;
}

/** Cartão que ficou em análise e foi recusado depois — o cliente já tinha saído do checkout. */
export function PagamentoRecusadoEmail({
  numero,
  nomeCliente,
  itens,
  total,
  valorFrete,
  desconto,
  linkTentarDeNovo,
}: DadosPagamentoRecusadoEmail) {
  return (
    <LayoutBaseEmail
      preview={`Pagamento do pedido #${numero} não aprovado`}
      titulo={`${nomeCliente.split(' ')[0]}, seu pagamento não foi aprovado`}
    >
      <Text style={{ fontSize: '14px', color: '#0a0e1a', lineHeight: '1.5' }}>
        O banco não aprovou o pagamento do pedido <strong>#{numero}</strong>, e nenhum valor foi
        cobrado. Você pode tentar de novo com outro cartão ou com Pix — se não pagar, o pedido é
        cancelado automaticamente em até 24 horas.
      </Text>

      <ItensPedidoEmail itens={itens} total={total} valorFrete={valorFrete} desconto={desconto} />

      <Button
        href={linkTentarDeNovo}
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
        Tentar de novo
      </Button>
    </LayoutBaseEmail>
  );
}

export default PagamentoRecusadoEmail;
