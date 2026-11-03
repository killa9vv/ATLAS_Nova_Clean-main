import { useEffect, useRef } from 'react';

const DURACAO_MS = 900;

// Conta até o valor escrevendo direto no nó de texto: seriam dezenas de renders por segundo
// com state. O nó é o mesmo que o React controla (nodeValue, não textContent, que o trocaria
// por outro e faria o React perder as próximas atualizações).
export function useContagemAnimada<T extends HTMLElement>(
  ativo: boolean,
  valor: number,
  formatar: (numero: number) => string,
) {
  const ref = useRef<T>(null);
  const ultimoValor = useRef(0);

  useEffect(() => {
    const texto = ref.current?.firstChild;
    if (!ativo || !texto) return;

    const inicio = performance.now();
    const partida = ultimoValor.current;
    let quadro = requestAnimationFrame(function avancar(agora) {
      const progresso = Math.min((agora - inicio) / DURACAO_MS, 1);
      const suavizado = 1 - (1 - progresso) ** 3;
      texto.nodeValue = formatar(partida + (valor - partida) * suavizado);
      if (progresso < 1) quadro = requestAnimationFrame(avancar);
    });
    return () => {
      cancelAnimationFrame(quadro);
      texto.nodeValue = formatar(valor);
      ultimoValor.current = valor;
    };
  }, [ativo, valor, formatar]);

  return ref;
}
