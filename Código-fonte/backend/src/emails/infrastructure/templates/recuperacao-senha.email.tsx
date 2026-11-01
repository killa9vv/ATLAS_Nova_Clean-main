import { Button, Text } from '@react-email/components';
import { LayoutBaseEmail } from './layout-base.email';

export interface DadosRecuperacaoSenhaEmail {
  nomeCliente: string;
  linkRedefinicao: string;
}

export function RecuperacaoSenhaEmail({
  nomeCliente,
  linkRedefinicao,
}: DadosRecuperacaoSenhaEmail) {
  return (
    <LayoutBaseEmail preview="Redefina sua senha" titulo={`Olá, ${nomeCliente.split(' ')[0]}`}>
      <Text style={{ fontSize: '14px', color: '#0a0e1a', lineHeight: '1.5' }}>
        Recebemos um pedido pra redefinir sua senha. Clique no botão abaixo pra escolher uma nova
        senha. Se você não pediu isso, pode ignorar este e-mail.
      </Text>

      <Button
        href={linkRedefinicao}
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
        Redefinir senha
      </Button>

      <Text style={{ fontSize: '12px', color: '#5b6b8c', marginTop: '20px' }}>
        Este link expira em 1 hora, por segurança.
      </Text>
    </LayoutBaseEmail>
  );
}

export default RecuperacaoSenhaEmail;
