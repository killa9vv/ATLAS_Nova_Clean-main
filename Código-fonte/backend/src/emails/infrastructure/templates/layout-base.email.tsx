import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import type { ReactNode } from 'react';

export interface LayoutBaseEmailProps {
  preview: string;
  titulo: string;
  children: ReactNode;
}

// Componentes do @react-email/components compilam pra HTML baseado em tabelas com
// estilo inline — é o que sobrevive a Outlook/Gmail sem quebrar layout (CSS moderno
// tipo flexbox/grid não tem suporte confiável nesses clientes). Nenhuma classe
// Tailwind aqui de propósito, só style inline via prop `style`.
export function LayoutBaseEmail({ preview, titulo, children }: LayoutBaseEmailProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: '#f7f9fc', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <Container
          style={{
            backgroundColor: '#ffffff',
            margin: '0 auto',
            padding: '32px 24px',
            maxWidth: '480px',
            borderRadius: '8px',
          }}
        >
          <Text
            style={{
              fontSize: '11px',
              fontWeight: 'bold',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#2e9bf5',
              margin: '0 0 4px',
            }}
          >
            Atlas Nova Clean
          </Text>
          <Heading style={{ fontSize: '20px', color: '#0b1f4d', margin: '0 0 20px' }}>
            {titulo}
          </Heading>

          {children}

          <Hr style={{ borderColor: '#dce6f5', margin: '28px 0 16px' }} />
          <Text style={{ fontSize: '12px', color: '#5b6b8c', margin: 0 }}>
            Atlas Nova Clean — Campos dos Goytacazes, RJ. Dúvidas? Responda este e-mail ou fale pelo
            WhatsApp.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function LinhaResumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <Section style={{ margin: '4px 0' }}>
      <Text style={{ fontSize: '13px', color: '#5b6b8c', display: 'inline-block', margin: 0 }}>
        {rotulo}
      </Text>
      <Text
        style={{
          fontSize: '13px',
          fontWeight: 'bold',
          color: '#0b1f4d',
          display: 'inline-block',
          float: 'right',
          margin: 0,
        }}
      >
        {valor}
      </Text>
    </Section>
  );
}
