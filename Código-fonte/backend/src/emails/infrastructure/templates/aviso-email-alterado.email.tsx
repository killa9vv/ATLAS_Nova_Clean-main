import { Text } from '@react-email/components';
import { LayoutBaseEmail } from './layout-base.email';

export interface DadosAvisoEmailAlterado {
  nomeCliente: string;
  novoEmailMascarado: string;
}

export function AvisoEmailAlteradoEmail({
  nomeCliente,
  novoEmailMascarado,
}: DadosAvisoEmailAlterado) {
  return (
    <LayoutBaseEmail
      preview="O e-mail da sua conta foi alterado"
      titulo={`Olá, ${nomeCliente.split(' ')[0]}`}
    >
      <Text style={{ fontSize: '14px', color: '#0a0e1a', lineHeight: '1.5' }}>
        O e-mail da sua conta na Atlas Nova Clean foi alterado para{' '}
        <strong>{novoEmailMascarado}</strong>, e este endereço não será mais usado nela.
      </Text>
      <Text style={{ fontSize: '14px', color: '#0a0e1a', lineHeight: '1.5' }}>
        Se foi você, não precisa fazer nada. Se não foi, fale com a loja o quanto antes pelo
        WhatsApp.
      </Text>
    </LayoutBaseEmail>
  );
}

export default AvisoEmailAlteradoEmail;
