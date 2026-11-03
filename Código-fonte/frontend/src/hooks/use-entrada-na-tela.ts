import { useEffect, useRef, useState } from 'react';

// parado: sem animação (estado do HTML do servidor, de quem já chega com o bloco na tela e
// de quem pede menos movimento). aguardando: abaixo da dobra, escondido até o cliente chegar.
// entrando: chegou, hora de animar.
export type EntradaNaTela = 'parado' | 'aguardando' | 'entrando';

// Só esconde depois de confirmar que o bloco está fora da tela: assim o conteúdo nunca some
// de quem está olhando, e sem JS (ou antes dele carregar) tudo continua visível.
// Bloco alto (grade de produtos) precisa de limiar menor, senão fica um vazio na tela
// até uma boa parte dele aparecer.
export function useEntradaNaTela<T extends Element>(limiar = 0.2) {
  const ref = useRef<T>(null);
  const [entrada, setEntrada] = useState<EntradaNaTela>('parado');

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let primeiraLeitura = true;
    const observador = new IntersectionObserver(
      ([registro]) => {
        if (registro.isIntersecting) {
          if (!primeiraLeitura) setEntrada('entrando');
          observador.disconnect();
        } else if (primeiraLeitura) {
          setEntrada('aguardando');
        }
        primeiraLeitura = false;
      },
      { threshold: limiar },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [limiar]);

  return { ref, entrada };
}
