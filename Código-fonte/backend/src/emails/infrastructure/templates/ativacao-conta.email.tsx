import { Button, Text } from '@react-email/components';
import { LayoutBaseEmail } from './layout-base.email';

export interface DadosAtivacaoContaEmail {
  nomeCliente: string;
  linkAtivacao: string;
}

export function AtivacaoContaEmail({ nomeCliente, linkAtivacao }: DadosAtivacaoContaEmail) {
  return (
    <LayoutBaseEmail preview="Ative sua conta" titulo={`Olá, ${nomeCliente.split(' ')[0]}`}>
      <Text style={{ fontSize: '14px', color: '#0a0e1a', lineHeight: '1.5' }}>
        Recebemos um pedido pra criar uma conta na Atlas Nova Clean com este e-mail. Clique no botão
        abaixo pra confirmar o e-mail e escolher sua senha. Se você não pediu isso, pode ignorar
        este e-mail.
      </Text>

      <Button
        href={linkAtivacao}
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
        Ativar conta
      </Button>

      <Text style={{ fontSize: '12px', color: '#5b6b8c', marginTop: '20px' }}>
        Este link expira em 24 horas, por segurança.
      </Text>
    </LayoutBaseEmail>
  );
}

export default AtivacaoContaEmail;
