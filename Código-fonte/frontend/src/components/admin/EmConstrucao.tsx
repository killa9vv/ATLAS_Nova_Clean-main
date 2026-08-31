import { Card } from '@/components/ui/Card';

export interface EmConstrucaoProps {
  titulo: string;
}

/** Placeholder honesto pras seções do painel admin ainda não implementadas —
 * evita mostrar uma tela que finge funcionar sem estar de fato ligada à API. */
export function EmConstrucao({ titulo }: EmConstrucaoProps) {
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-navy">{titulo}</h1>
      <Card className="max-w-md">
        <p className="text-[13px] text-muted">
          Em construção — próxima etapa do card do painel administrativo.
        </p>
      </Card>
    </div>
  );
}
