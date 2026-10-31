import { Hr, Row, Column, Text } from '@react-email/components';
import { ItemPedidoEmail, formatarMoedaEmail } from './dados-pedido-email';

// Compartilhado entre confirmação/pagamento aprovado — não duplica a tabela de itens
// em dois templates. Row/Column (não <table> cru) porque são os primitivos do
// @react-email/components que já compilam pra <table> HTML por baixo, mantendo
// compatibilidade com Outlook.
// Linha de resumo (frete/desconto) entre os itens e o total.
function LinhaResumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <Row style={{ marginBottom: '6px' }}>
      <Column>
        <Text style={{ fontSize: '13px', color: '#5b6b8c', margin: 0 }}>{rotulo}</Text>
      </Column>
      <Column align="right">
        <Text style={{ fontSize: '13px', color: '#5b6b8c', margin: 0 }}>{valor}</Text>
      </Column>
    </Row>
  );
}

export function ItensPedidoEmail({
  itens,
  total,
  valorFrete,
  desconto,
}: {
  itens: ItemPedidoEmail[];
  total: number;
  valorFrete: number;
  desconto: number;
}) {
  return (
    <>
      <Hr style={{ borderColor: '#dce6f5', margin: '16px 0 12px' }} />
      {itens.map((item, indice) => (
        <Row key={indice} style={{ marginBottom: '6px' }}>
          <Column>
            <Text style={{ fontSize: '13px', color: '#0a0e1a', margin: 0 }}>
              {item.quantidade}× {item.nome}
            </Text>
          </Column>
          <Column align="right">
            <Text style={{ fontSize: '13px', color: '#0a0e1a', margin: 0 }}>
              {formatarMoedaEmail(item.precoUnitario * item.quantidade)}
            </Text>
          </Column>
        </Row>
      ))}
      {(desconto > 0 || valorFrete > 0) && (
        <Hr style={{ borderColor: '#dce6f5', margin: '12px 0' }} />
      )}
      {desconto > 0 && <LinhaResumo rotulo="Desconto" valor={`-${formatarMoedaEmail(desconto)}`} />}
      {valorFrete > 0 && <LinhaResumo rotulo="Frete" valor={formatarMoedaEmail(valorFrete)} />}
      <Hr style={{ borderColor: '#dce6f5', margin: '12px 0' }} />
      <Row>
        <Column>
          <Text style={{ fontSize: '14px', fontWeight: 'bold', color: '#0b1f4d', margin: 0 }}>
            Total
          </Text>
        </Column>
        <Column align="right">
          <Text style={{ fontSize: '14px', fontWeight: 'bold', color: '#0b1f4d', margin: 0 }}>
            {formatarMoedaEmail(total)}
          </Text>
        </Column>
      </Row>
    </>
  );
}
