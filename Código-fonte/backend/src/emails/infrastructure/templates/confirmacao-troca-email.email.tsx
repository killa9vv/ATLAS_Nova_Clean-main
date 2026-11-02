import { Button, Text } from '@react-email/components';
import { LayoutBaseEmail } from './layout-base.email';

export interface DadosConfirmacaoTrocaEmail {
  nomeCliente: string;
  linkConfirmacao: string;
}

export function ConfirmacaoTrocaEmail({
  nomeCliente,
  linkConfirmacao,
}: DadosConfirmacaoTrocaEmail) {
  return (
    <LayoutBaseEmail
      preview="Confirme seu novo e-mail"
      titulo={`Olá, ${nomeCliente.split(' ')[0]}`}
    >
      <Text style={{ fontSize: '14px', color: '#0a0e1a', lineHeight: '1.5' }}>
        Recebemos um pedido pra usar este endereço na sua conta da Atlas Nova Clean. Clique no botão
        abaixo pra confirmar — o link vale por 24 horas. Se você não pediu isso, pode ignorar este
        e-mail: nada muda.
      </Text>

      <Button
        href={linkConfirmacao}
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
        Confirmar novo e-mail
      </Button>
    </LayoutBaseEmail>
  );
}

export default ConfirmacaoTrocaEmail;
