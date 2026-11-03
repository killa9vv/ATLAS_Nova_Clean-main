'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CLASSES_BOTAO_COMPRAR } from '@/components/ui/botao-comprar';
import { useToast } from '@/components/ui/Toast';
import { CheckoutEtapas } from '@/components/loja/checkout/CheckoutEtapas';
import { CheckoutResumo } from '@/components/loja/checkout/CheckoutResumo';
import { OpcaoCheckout } from '@/components/loja/checkout/OpcaoCheckout';
import { ApiError } from '@/lib/http';
import { useCart, CHAVE_QUERY_CARRINHO } from '@/lib/cart-context';
import { formatarCep, formatarTelefone, somenteDigitos, telefoneValido } from '@/lib/formatos';
import { listarMeusEnderecos, meuPerfil, registrarCliente } from '@/lib/conta';
import { buscarCarrinho } from '@/lib/carrinho-api';
import { buscarEnderecoPorCep, criarCliente } from '@/lib/clientes';
import { cotarFrete } from '@/lib/frete';
import { criarPedido, type PedidoCriado } from '@/lib/pedidos';
import { montarLinkWhatsApp } from '@/lib/whatsapp';
import { obterSessaoCliente, type SessaoCliente } from '@/lib/conta-auth';
import {
  acompanharPagamentoPix,
  desmontarPaymentBrick,
  enviarPagamentoDoBrick,
  renderizarPaymentBrick,
  type PaymentBrickFormData,
} from '@/lib/mercadopago';

const WHATSAPP_NUMERO = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? '';

type ResultadoPagamento =
  | {
      tipo: 'pix';
      qrCode?: string;
      qrCodeBase64?: string;
      status: 'aguardando' | 'timeout' | 'cancelado';
    }
  // Cartão que o Mercado Pago deixou "em análise" (antifraude) — ainda não é venda
  // confirmada, então não pode cair na tela de sucesso.
  | { tipo: 'analise'; status: 'aguardando' | 'timeout' | 'recusado' }
  | { tipo: 'sucesso' }
  | { tipo: 'erro'; mensagem: string; podeTentarDeNovo?: boolean };

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function emailValido(email: string): boolean {
  return email.trim() === '' || /^\S+@\S+\.\S+$/.test(email.trim());
}

interface CheckoutForm {
  nome: string;
  email: string;
  telefone: string;
  criarConta: boolean;
  tipoEntrega: 'ENTREGA' | 'RETIRADA';
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

const FORM_INICIAL: CheckoutForm = {
  nome: '',
  email: '',
  telefone: '',
  criarConta: false,
  tipoEntrega: 'ENTREGA',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
};

const ENDERECO_LOJA = 'Av. Arthur Bernardes, 619 — Campos dos Goytacazes, RJ';
const URL_BUSCA_CEP = 'https://buscacepinter.correios.com.br/app/endereco/index.php';

export default function CheckoutPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const {
    itens,
    hidratado,
    limpar,
    total: subtotalCarrinho,
    descontoAtacado,
    desconto,
    totalComDesconto,
    cupomCodigo,
    aplicarCupom: aplicarCupomNoCarrinho,
    removerCupom: removerCupomDoCarrinho,
  } = useCart();
  const [passo, setPasso] = useState(0);
  const [form, setForm] = useState<CheckoutForm>(FORM_INICIAL);
  const [erroCep, setErroCep] = useState<string | null>(null);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [tocados, setTocados] = useState({ email: false, telefone: false });
  const [pixCopiado, setPixCopiado] = useState(false);
  const numeroRef = useRef<HTMLInputElement>(null);
  const ultimoCepBuscadoRef = useRef('');
  const [enviando, setEnviando] = useState(false);
  const [metodoFechamento, setMetodoFechamento] = useState<'whatsapp' | 'pagar'>('whatsapp');
  const [sdkPronto, setSdkPronto] = useState(false);
  const [sdkFalhou, setSdkFalhou] = useState(false);
  const [pedidoPagamento, setPedidoPagamento] = useState<PedidoCriado | null>(null);
  const [carregandoPagamento, setCarregandoPagamento] = useState(false);
  const [resultadoPagamento, setResultadoPagamento] = useState<ResultadoPagamento | null>(null);
  const [sessaoCliente, setSessaoCliente] = useState<SessaoCliente | null>(null);
  const [cupomInput, setCupomInput] = useState('');
  const [salvandoCupom, setSalvandoCupom] = useState(false);
  const [erroCupom, setErroCupom] = useState<string | null>(null);
  const pararPollingRef = useRef<(() => void) | null>(null);
  const pagamentoAprovado = resultadoPagamento?.tipo === 'sucesso';
  // Último pedido 'site' criado e os dados que o geraram. Trocar pra WhatsApp e
  // voltar, voltar um passo ou tentar recarregar o Brick reaproveita esse pedido
  // enquanto nada mudar — antes cada ida e volta criava um pedido CRIADO novo que
  // ficava órfão no painel admin.
  const pedidoSiteRef = useRef<{ chave: string; pedido: PedidoCriado } | null>(null);
  // E-mail pro qual o link de ativação ("criar conta") já foi pedido nesta visita —
  // trocar de canal ou tentar de novo não manda outro e-mail.
  const ativacaoPedidaParaRef = useRef<string | null>(null);

  // Comprador logado: pré-preenche identificação (e telefone/endereço padrão salvos
  // na conta) e usa o clienteId da sessão direto — sem isso, o pedido nunca ficaria
  // vinculado à conta e nunca apareceria em /conta/pedidos.
  useEffect(() => {
    const sessao = obterSessaoCliente();
    if (!sessao) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessaoCliente(sessao);
    setForm((prev) => ({
      ...prev,
      nome: sessao.cliente.nome,
      email: sessao.cliente.email ?? prev.email,
    }));

    // Só preenche o que ainda está vazio — nunca sobrescreve o que a pessoa digitou.
    // Falha aqui (ex.: sessão expirada) não bloqueia nada: é só conveniência.
    Promise.all([meuPerfil(), listarMeusEnderecos()])
      .then(([perfil, enderecos]) => {
        const padrao = enderecos.find((endereco) => endereco.padrao) ?? enderecos[0];
        setForm((prev) => ({
          ...prev,
          telefone: prev.telefone || perfil.telefone || '',
          ...(padrao && !prev.cep
            ? {
                cep: padrao.cep,
                logradouro: padrao.logradouro,
                numero: padrao.numero,
                complemento: padrao.complemento ?? '',
                bairro: padrao.bairro,
                cidade: padrao.cidade,
                estado: padrao.estado,
              }
            : {}),
        }));
      })
      .catch(() => {});
  }, []);

  // Mesma queryKey do CartProvider — compartilha o cache (sem round-trip extra) e
  // `.refetch()` aqui atualiza o carrinho pra qualquer outro consumidor também.
  const carrinhoQuery = useQuery({ queryKey: CHAVE_QUERY_CARRINHO, queryFn: buscarCarrinho });

  // Cupom fica salvo no carrinho persistido (ver POST/DELETE /carrinho/cupom) —
  // desconto/totalComDesconto já vêm prontos do useCart(), nenhuma consulta extra
  // aqui, e o cupom continua aplicado se o cliente sair e voltar pro checkout.
  async function aplicarCupom() {
    const codigo = cupomInput.trim().toUpperCase();
    if (!codigo) return;
    setErroCupom(null);
    setSalvandoCupom(true);
    try {
      await aplicarCupomNoCarrinho(codigo);
      setCupomInput('');
    } catch (erro) {
      setErroCupom(
        erro instanceof ApiError ? erro.message : 'Não foi possível aplicar esse cupom.',
      );
    } finally {
      setSalvandoCupom(false);
    }
  }

  async function removerCupom() {
    setErroCupom(null);
    await removerCupomDoCarrinho();
  }

  const cepLimpo = somenteDigitos(form.cep);
  const freteQuery = useQuery({
    queryKey: ['frete-cotacao', cepLimpo, carrinhoQuery.data?.total],
    queryFn: () =>
      cotarFrete({
        cepDestino: cepLimpo,
        quantidadeItens: itens.reduce((soma, item) => soma + item.quantidade, 0),
        valorDeclarado: carrinhoQuery.data!.total,
      }),
    enabled:
      form.tipoEntrega === 'ENTREGA' && cepLimpo.length === 8 && !!carrinhoQuery.data && !erroCep,
  });

  // Carrinho vazio não tem o que revisar — manda de volta pro catálogo em vez de
  // deixar o wizard num estado sem sentido. Só decide isso depois de `hidratado`:
  // logo após montar, o carrinho começa vazio até terminar de ler o localStorage
  // (ver CartProvider) — sem esperar, um acesso direto/reload de /checkout com
  // carrinho não vazio seria expulso por engano antes da hidratação terminar.
  // O pagamento aprovado esvazia o carrinho, e é a hora de mostrar a confirmação: sem essa
  // exceção, quem acabou de pagar era mandado pro catálogo sem ver nada e podia pagar de novo.
  useEffect(() => {
    if (hidratado && itens.length === 0 && !pagamentoAprovado) {
      router.replace('/catalogo');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidratado, itens.length, pagamentoAprovado]);

  // Cada etapa começa do topo: no celular, o botão "Continuar" fica lá embaixo.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [passo]);

  // Desmonta o Brick e para o polling do Pix ao sair da página — evita Brick
  // fantasma sobrepondo outra tela, ou polling rodando sem ninguém olhando.
  useEffect(() => {
    return () => {
      pararPollingRef.current?.();
      desmontarPaymentBrick();
    };
  }, []);

  if ((!hidratado || itens.length === 0) && !pagamentoAprovado) {
    return null;
  }

  // Busca ao completar os 8 dígitos, sem esperar sair do campo. Só busca quando o CEP muda:
  // assim não apaga o que a pessoa já ajustou à mão no endereço.
  async function aoMudarCep(valor: string) {
    const cep = formatarCep(valor);
    const digitos = somenteDigitos(cep);
    setForm((prev) => ({ ...prev, cep }));
    setErroCep(null);
    if (digitos.length !== 8 || digitos === ultimoCepBuscadoRef.current) return;

    ultimoCepBuscadoRef.current = digitos;
    setBuscandoCep(true);
    try {
      const endereco = await buscarEnderecoPorCep(digitos);
      if (ultimoCepBuscadoRef.current !== digitos) return;
      setForm((prev) => ({
        ...prev,
        logradouro: endereco.logradouro,
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        estado: endereco.estado,
      }));
      numeroRef.current?.focus();
    } catch (erro) {
      setErroCep(
        erro instanceof ApiError
          ? `${erro.message} Preencha o endereço manualmente.`
          : 'Não conseguimos buscar esse CEP. Preencha o endereço manualmente.',
      );
    } finally {
      setBuscandoCep(false);
    }
  }

  function podeAvancarPasso0() {
    // Criar conta precisa de e-mail — é pra onde vai o link de ativação.
    const emailOk = !form.criarConta || form.email.trim() !== '';
    return (
      form.nome.trim().length > 0 &&
      emailOk &&
      emailValido(form.email) &&
      telefoneValido(form.telefone)
    );
  }

  function camposFaltandoPasso1(): string[] {
    if (form.tipoEntrega === 'RETIRADA') return [];
    const campos: [string, boolean][] = [
      ['CEP', cepLimpo.length === 8],
      ['rua', form.logradouro.trim().length > 0],
      ['número', form.numero.trim().length > 0],
      ['bairro', form.bairro.trim().length > 0],
      ['cidade', form.cidade.trim().length > 0],
      ['UF', form.estado.trim().length === 2],
    ];
    return campos.filter(([, preenchido]) => !preenchido).map(([nome]) => nome);
  }

  function podeAvancarPasso1() {
    if (form.tipoEntrega === 'RETIRADA') return true;
    return (
      cepLimpo.length === 8 &&
      form.logradouro.trim().length > 0 &&
      form.numero.trim().length > 0 &&
      form.bairro.trim().length > 0 &&
      form.cidade.trim().length > 0 &&
      form.estado.trim().length === 2
    );
  }

  // Compartilhado pelos dois caminhos de fechamento (WhatsApp e pagamento online) —
  // a única diferença real entre eles é o `canal`. "Criar conta" funciona igual nos
  // dois; como POST /clientes é upsert por e-mail, chamar de novo se o usuário mudar
  // de canal no meio do caminho não duplica nem quebra nada.
  async function criarPedidoNoBackend(canal: 'whatsapp' | 'site'): Promise<PedidoCriado> {
    // Última revalidação antes de criar o pedido — pega estoque/preço mais recentes.
    const carrinhoAtual = await carrinhoQuery.refetch();
    if (carrinhoAtual.error) throw carrinhoAtual.error;

    // "Criar conta" no checkout de convidado: o pedido fica vinculado ao cadastro
    // desse e-mail (POST /clientes, upsert) e, depois do pedido criado, manda o link
    // de ativação — quando a pessoa ativar, o pedido já aparece em "Meus pedidos".
    // Se o e-mail já for de uma conta com senha, o backend não vincula pedido
    // anônimo a ela (precisa entrar) — ver enviarLinkDeAtivacao.
    const querCriarConta = !sessaoCliente && form.criarConta && !!form.email;
    let clienteId: string | undefined = sessaoCliente?.cliente.id;
    if (querCriarConta) {
      const cliente = await criarCliente({
        nome: form.nome,
        email: form.email,
        telefone: form.telefone || undefined,
      });
      clienteId = cliente.id;
    }

    const pedido = await criarPedido(
      {
        itens: itens.map((item) => ({ produtoId: item.produtoId, quantidade: item.quantidade })),
        tipoEntrega: form.tipoEntrega,
        endereco:
          form.tipoEntrega === 'ENTREGA'
            ? {
                cep: cepLimpo,
                logradouro: form.logradouro,
                numero: form.numero,
                complemento: form.complemento || undefined,
                bairro: form.bairro,
                cidade: form.cidade,
                estado: form.estado,
              }
            : undefined,
        contato: {
          nome: form.nome,
          email: form.email || undefined,
          telefone: form.telefone || undefined,
        },
        clienteId,
        canal,
        cupomCodigo,
      },
      // Comprador logado: manda o token pra vincular ao cliente autenticado de
      // verdade (o backend ignora `clienteId` acima quando autenticado — ver
      // PedidosController.criar). Sem isso o pedido cairia no caminho anônimo/
      // "salvar meus dados" mesmo com sessão ativa.
      sessaoCliente
        ? { headers: { Authorization: `Bearer ${sessaoCliente.accessToken}` } }
        : undefined,
    );

    if (querCriarConta) {
      void enviarLinkDeAtivacao();
    }
    return pedido;
  }

  // Não bloqueia o pedido: se falhar, a compra segue como convidado normalmente.
  async function enviarLinkDeAtivacao() {
    const email = form.email.trim().toLowerCase();
    if (ativacaoPedidaParaRef.current === email) return;
    ativacaoPedidaParaRef.current = email;
    try {
      await registrarCliente({
        nome: form.nome,
        email: form.email,
        telefone: form.telefone || undefined,
      });
      showToast('Enviamos um link pro seu e-mail pra ativar sua conta.', 'success');
    } catch (erro) {
      showToast(
        erro instanceof ApiError && erro.status === 409
          ? 'Esse e-mail já tem conta. Entre nela pra os próximos pedidos aparecerem lá.'
          : 'Não conseguimos enviar o link pra criar sua conta agora — tente em "Criar conta".',
      );
    }
  }

  async function confirmarPedidoWhatsApp() {
    setEnviando(true);
    try {
      const pedido = await criarPedidoNoBackend('whatsapp');
      void limpar();
      const link = montarLinkWhatsApp(WHATSAPP_NUMERO, pedido);
      // Depois de um await, o navegador pode bloquear a aba nova. Com o carrinho já limpo, a
      // pessoa perderia o caminho pro WhatsApp: nesse caso, abre o link na própria aba.
      if (window.open(link, '_blank')) {
        router.push('/catalogo');
      } else {
        window.location.href = link;
      }
      showToast('Pedido registrado! Continue pelo WhatsApp pra fechar.', 'success');
    } catch (erro) {
      showToast(
        erro instanceof ApiError ? erro.message : 'Não foi possível criar o pedido. Tente de novo.',
        'error',
      );
    } finally {
      setEnviando(false);
    }
  }

  // Tudo que entra no POST /pedidos — se nada disso mudou, o pedido 'site' já
  // criado continua valendo e pode ser reaproveitado.
  function chaveDoPedidoSite(): string {
    return JSON.stringify({
      form,
      itens: itens.map((item) => [item.produtoId, item.quantidade]),
      cupomCodigo,
      clienteId: sessaoCliente?.cliente.id,
    });
  }

  // Chamado ao escolher "Pagar agora" (ou "Tentar novamente"): reaproveita o pedido
  // 'site' pendente se os dados não mudaram, senão cria um (fica CRIADO aguardando
  // pagamento), e monta o Brick com o total real devolvido pelo backend (já inclui frete).
  async function iniciarPagamentoNoSite() {
    if (carregandoPagamento) return;
    setCarregandoPagamento(true);
    setResultadoPagamento(null);

    let pedido: PedidoCriado;
    try {
      const chave = chaveDoPedidoSite();
      pedido =
        pedidoSiteRef.current?.chave === chave
          ? pedidoSiteRef.current.pedido
          : await criarPedidoNoBackend('site');
      pedidoSiteRef.current = { chave, pedido };
      setPedidoPagamento(pedido);
    } catch (erro) {
      showToast(
        erro instanceof ApiError ? erro.message : 'Não foi possível iniciar o pagamento.',
        'error',
      );
      setMetodoFechamento('whatsapp');
      setCarregandoPagamento(false);
      return;
    }

    try {
      await renderizarPaymentBrick({
        containerId: 'payment-brick-container',
        valor: pedido.total,
        emailPagador: form.email || undefined,
        onSubmit: async (formData: PaymentBrickFormData) => {
          const resultado = await enviarPagamentoDoBrick(pedido.id, formData);
          await desmontarPaymentBrick();
          tratarResultadoPagamento(resultado, formData.payment_method_id === 'pix', pedido.id);
        },
        onErro: (erro) => {
          const mensagem =
            erro instanceof ApiError
              ? erro.message
              : erro instanceof Error
                ? erro.message
                : 'Não foi possível processar o pagamento. Confira os dados e tente novamente.';
          setResultadoPagamento({ tipo: 'erro', mensagem });
        },
      });
    } catch {
      // O formulário do Mercado Pago não carregou (detalhe técnico já foi pro
      // console em renderizarPaymentBrick). Mensagem fica na tela, com opção de
      // tentar de novo — o pedido criado acima é reaproveitado na nova tentativa.
      setResultadoPagamento({
        tipo: 'erro',
        mensagem:
          'Não conseguimos carregar o pagamento online agora. Tente de novo ou feche o pedido pelo WhatsApp.',
        podeTentarDeNovo: true,
      });
    } finally {
      setCarregandoPagamento(false);
    }
  }

  function tratarResultadoPagamento(
    resultado: { status: string; qrCode?: string; qrCodeBase64?: string },
    ehPix: boolean,
    pedidoId: string,
  ) {
    if (ehPix) {
      setResultadoPagamento({
        tipo: 'pix',
        qrCode: resultado.qrCode,
        qrCodeBase64: resultado.qrCodeBase64,
        status: 'aguardando',
      });
      pararPollingRef.current?.();
      pararPollingRef.current = acompanharPagamentoPix(pedidoId, {
        aoAtualizar: (status) => {
          if (status === 'PAGO') {
            void limpar();
            setResultadoPagamento({ tipo: 'sucesso' });
          } else if (status === 'CANCELADO' || status === 'ESTORNADO' || status === 'RECUSADO') {
            setResultadoPagamento((prev) =>
              prev?.tipo === 'pix' ? { ...prev, status: 'cancelado' } : prev,
            );
          } else {
            setResultadoPagamento((prev) =>
              prev?.tipo === 'pix' ? { ...prev, status: 'timeout' } : prev,
            );
          }
        },
      });
    } else if (resultado.status === 'APROVADO') {
      // RECUSADO nunca chega aqui — o backend lança PagamentoRecusadoException (402),
      // capturado no catch do onSubmit acima e tratado via onErro.
      void limpar();
      setResultadoPagamento({ tipo: 'sucesso' });
    } else {
      // PENDENTE/EM_PROCESSAMENTO: o banco ainda vai decidir. Acompanha o pedido como
      // no Pix; o carrinho só é limpo se virar PAGO. "Tentar outro cartão" só aparece
      // depois da recusa — antes, se a análise aprovasse, o cliente pagaria duas vezes.
      setResultadoPagamento({ tipo: 'analise', status: 'aguardando' });
      pararPollingRef.current?.();
      pararPollingRef.current = acompanharPagamentoPix(pedidoId, {
        aoAtualizar: (status) => {
          if (status === 'PAGO') {
            void limpar();
            setResultadoPagamento({ tipo: 'sucesso' });
          } else {
            setResultadoPagamento({
              tipo: 'analise',
              status: status === 'TIMEOUT' ? 'timeout' : 'recusado',
            });
          }
        },
      });
    }
  }

  function escolherMetodoFechamento(metodo: 'whatsapp' | 'pagar') {
    setMetodoFechamento(metodo);
    if (metodo === 'whatsapp') {
      pararPollingRef.current?.();
      pararPollingRef.current = null;
      desmontarPaymentBrick();
      setPedidoPagamento(null);
      setResultadoPagamento(null);
    } else {
      iniciarPagamentoNoSite();
    }
  }

  function comprarNovamente() {
    router.push('/catalogo');
  }

  // Sair do passo Revisão enquanto o Brick está ativo deixaria o controller do MP
  // apontando pra um container que o React acabou de desmontar — limpa tudo antes de
  // voltar (mesmo cleanup de trocar pra WhatsApp). Se o usuário voltar pra cá depois e
  // escolher "Pagar agora" de novo, o pedido 'site' anterior é reaproveitado se ele não
  // mudou nada (ver pedidoSiteRef); se mudou endereço/itens/cupom, um novo é criado.
  function irParaPasso(destino: number) {
    if (metodoFechamento === 'pagar') {
      escolherMetodoFechamento('whatsapp');
    }
    setPasso(destino);
  }

  async function copiarCodigoPix(codigo: string) {
    try {
      await navigator.clipboard.writeText(codigo);
      setPixCopiado(true);
      setTimeout(() => setPixCopiado(false), 2500);
    } catch {
      // Sem permissão pra área de transferência, o campo com o código continua na tela.
      showToast('Não foi possível copiar. Selecione o código e copie manualmente.', 'error');
    }
  }

  // Enquanto o banco analisa o cartão, sair daqui permitiria pagar de novo o mesmo pedido.
  const pagamentoEmAnalise =
    resultadoPagamento?.tipo === 'analise' && resultadoPagamento.status === 'aguardando';

  const opcaoEntrega = freteQuery.data?.opcoes.find((opcao) => opcao.tipo === 'ENTREGA');
  const ehRetirada = form.tipoEntrega === 'RETIRADA';
  // Com o pedido criado, valem os valores devolvidos pelo backend, os mesmos da cobrança.
  const valorFrete = pedidoPagamento?.valorFrete ?? (ehRetirada ? 0 : opcaoEntrega?.valor);
  const textoFrete =
    valorFrete !== undefined
      ? valorFrete === 0
        ? 'Grátis'
        : formatarMoeda(valorFrete)
      : cepLimpo.length !== 8
        ? 'Informe o CEP'
        : freteQuery.isError
          ? 'A confirmar'
          : 'Calculando…';
  const totalPedido = pedidoPagamento?.total ?? totalComDesconto + (valorFrete ?? 0);
  const faltandoPasso1 = camposFaltandoPasso1();
  const mostrarEndereco = cepLimpo.length === 8 || form.logradouro.trim().length > 0;

  const blocoCupom = (
    <div>
      {cupomCodigo ? (
        <div className="flex items-center justify-between gap-2 text-[13px]">
          <span className="min-w-0 text-ink">
            Cupom <span className="font-mono font-semibold text-[#14753c]">{cupomCodigo}</span>{' '}
            aplicado
          </span>
          {metodoFechamento !== 'pagar' && (
            <button
              type="button"
              onClick={() => void removerCupom()}
              className="shrink-0 font-semibold text-blue hover:underline"
            >
              Remover
            </button>
          )}
        </div>
      ) : metodoFechamento === 'pagar' ? (
        // O pedido da cobrança já foi criado: um cupom novo aqui mudaria o total na tela,
        // mas não o valor cobrado.
        <p className="text-[12px] text-muted">
          Para usar um cupom, escolha &quot;Fechar pelo WhatsApp&quot; e aplique antes de pagar.
        </p>
      ) : (
        <div className="flex gap-2">
          <input
            value={cupomInput}
            onChange={(e) => setCupomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void aplicarCupom();
              }
            }}
            placeholder="Código do cupom"
            aria-label="Código do cupom"
            className="min-w-0 flex-1 rounded-atlas-sm border border-line bg-white px-3 py-2 text-[13px] uppercase placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-blue/40"
          />
          <Button
            variant="secondary"
            onClick={() => void aplicarCupom()}
            disabled={!cupomInput.trim() || salvandoCupom}
          >
            Aplicar
          </Button>
        </div>
      )}
      {erroCupom && <p className="mt-1.5 text-[12.5px] text-red-600">{erroCupom}</p>}
    </div>
  );

  return (
    <main className="mx-auto max-w-[1040px] px-5 py-10">
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        strategy="afterInteractive"
        onLoad={() => setSdkPronto(true)}
        onError={() => setSdkFalhou(true)}
      />

      {pagamentoAprovado ? (
        <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-atlas border border-line bg-white p-8 text-center shadow-atlas">
          <div className="estrela-pop flex h-16 w-16 items-center justify-center rounded-full bg-[#14753c] text-white">
            <svg
              aria-hidden="true"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-navy" role="status">
            Pagamento aprovado!
          </h1>
          <p className="text-[14px] text-muted">
            Pedido{' '}
            <span className="font-mono font-semibold text-navy">
              #{pedidoPagamento?.id.slice(0, 8)}
            </span>{' '}
            — já estamos preparando.
          </p>
          {pedidoPagamento && (
            <p className="text-[14px] text-navy">
              Total pago:{' '}
              <span className="font-mono font-bold">{formatarMoeda(pedidoPagamento.total)}</span>
            </p>
          )}
          {form.tipoEntrega === 'RETIRADA' && (
            <p className="text-[13px] text-muted">
              Retire em {ENDERECO_LOJA}, de segunda a sábado, das 8h às 18h, assim que a loja
              confirmar que o pedido está pronto.
            </p>
          )}
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {sessaoCliente && (
              <Link
                href="/conta/pedidos"
                className="inline-flex items-center rounded-atlas-sm bg-navy px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-navy-2"
              >
                Ver meus pedidos
              </Link>
            )}
            <Button variant={sessaoCliente ? 'secondary' : 'primary'} onClick={comprarNovamente}>
              Continuar comprando
            </Button>
          </div>
        </div>
      ) : (
        <>
          <h1 className="mb-3 font-display text-2xl font-bold text-navy">Finalizar pedido</h1>
          <CheckoutEtapas atual={passo} aoIrPara={pagamentoEmAnalise ? undefined : irParaPasso} />

          <div className="grid gap-6 nav:grid-cols-[minmax(0,1fr)_340px] nav:items-start">
            <aside className="order-first min-w-0 nav:sticky nav:top-[90px] nav:order-last">
              <CheckoutResumo
                itens={carrinhoQuery.data?.itens ?? itens}
                subtotal={subtotalCarrinho}
                descontoAtacado={descontoAtacado}
                desconto={desconto}
                cupomCodigo={cupomCodigo}
                frete={textoFrete}
                rotuloTotal={valorFrete === undefined ? 'Total sem frete' : 'Total'}
                total={totalPedido}
                cupom={blocoCupom}
              />
            </aside>

            <div className="min-w-0">
              {passo === 0 && (
                <form
                  className="flex flex-col gap-4"
                  onSubmit={(evento) => {
                    evento.preventDefault();
                    if (podeAvancarPasso0()) setPasso(1);
                  }}
                >
                  <Input
                    label="Nome completo"
                    required
                    autoComplete="name"
                    enterKeyHint="next"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  />
                  <Input
                    label={form.criarConta ? 'E-mail' : 'E-mail (opcional)'}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    enterKeyHint="next"
                    placeholder="Para receber a confirmação do pedido"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    onBlur={() => setTocados((prev) => ({ ...prev, email: true }))}
                    error={
                      tocados.email && !emailValido(form.email)
                        ? 'Confira o e-mail: parece incompleto.'
                        : undefined
                    }
                  />
                  <Input
                    label="Telefone (opcional)"
                    type="tel"
                    autoComplete="tel-national"
                    inputMode="tel"
                    enterKeyHint="next"
                    placeholder="(22) 99999-8888"
                    value={formatarTelefone(form.telefone)}
                    onChange={(e) =>
                      setForm({ ...form, telefone: formatarTelefone(e.target.value) })
                    }
                    onBlur={() => setTocados((prev) => ({ ...prev, telefone: true }))}
                    error={
                      tocados.telefone && !telefoneValido(form.telefone)
                        ? 'Informe o DDD e o número completo.'
                        : undefined
                    }
                  />
                  {sessaoCliente ? (
                    <p className="text-[13px] text-muted">
                      Comprando como{' '}
                      <span className="font-semibold text-navy">{sessaoCliente.cliente.nome}</span>{' '}
                      — este pedido vai aparecer em{' '}
                      <Link
                        href="/conta/pedidos"
                        className="font-semibold text-blue hover:underline"
                      >
                        Meus pedidos
                      </Link>
                      .
                    </p>
                  ) : (
                    <>
                      <label className="flex items-start gap-2 text-[13px] text-ink">
                        <input
                          type="checkbox"
                          checked={form.criarConta}
                          onChange={(e) => setForm({ ...form, criarConta: e.target.checked })}
                          className="mt-0.5 h-4 w-4 accent-blue"
                        />
                        <span>
                          Criar uma conta pra acompanhar este pedido
                          <span className="block text-muted">
                            Enviamos um link pro seu e-mail pra você escolher a senha.
                          </span>
                        </span>
                      </label>
                      {form.criarConta && !form.email.trim() && (
                        <p className="text-[12.5px] text-red-600">
                          Informe o e-mail pra criar a conta.
                        </p>
                      )}
                      <p className="text-[13px] text-muted">
                        Já tem conta?{' '}
                        <Link
                          href="/conta/entrar?voltar=/checkout"
                          className="font-semibold text-blue hover:underline"
                        >
                          Entrar
                        </Link>{' '}
                        pra usar seus dados salvos.
                      </p>
                    </>
                  )}
                  <Button type="submit" disabled={!podeAvancarPasso0()}>
                    Continuar para a entrega
                  </Button>
                </form>
              )}

              {passo === 1 && (
                <form
                  className="flex flex-col gap-4"
                  onSubmit={(evento) => {
                    evento.preventDefault();
                    if (podeAvancarPasso1()) setPasso(2);
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <OpcaoCheckout
                      nome="tipoEntrega"
                      titulo="Entrega"
                      descricao={
                        opcaoEntrega
                          ? `${opcaoEntrega.valor === 0 ? 'Grátis' : formatarMoeda(opcaoEntrega.valor)} · ${opcaoEntrega.prazoEstimadoDias} ${opcaoEntrega.prazoEstimadoDias === 1 ? 'dia' : 'dias'}`
                          : 'Valor e prazo pelo seu CEP'
                      }
                      checked={!ehRetirada}
                      onChange={() => setForm({ ...form, tipoEntrega: 'ENTREGA' })}
                    />
                    <OpcaoCheckout
                      nome="tipoEntrega"
                      titulo="Retirada na loja"
                      descricao="Grátis · em Campos dos Goytacazes"
                      checked={ehRetirada}
                      onChange={() => setForm({ ...form, tipoEntrega: 'RETIRADA' })}
                    />
                  </div>

                  {ehRetirada ? (
                    <div className="bolha-chega rounded-atlas-sm border border-line bg-white p-3.5 text-[13px]">
                      <p className="font-semibold text-navy">{ENDERECO_LOJA}</p>
                      <p className="mt-0.5 text-muted">
                        Segunda a sábado, das 8h às 18h, assim que a loja confirmar que o pedido
                        está pronto.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-1">
                        <Input
                          label="CEP"
                          required
                          autoComplete="postal-code"
                          inputMode="numeric"
                          placeholder="00000-000"
                          value={formatarCep(form.cep)}
                          onChange={(e) => void aoMudarCep(e.target.value)}
                          error={erroCep ?? undefined}
                        />
                        <p className="text-[12px] text-muted" aria-live="polite">
                          {buscandoCep ? (
                            'Buscando endereço…'
                          ) : (
                            <a
                              href={URL_BUSCA_CEP}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue hover:underline"
                            >
                              Não sei meu CEP
                            </a>
                          )}
                        </p>
                      </div>

                      {mostrarEndereco && (
                        <div className="bolha-chega flex flex-col gap-4">
                          <Input
                            label="Rua"
                            required
                            autoComplete="address-line1"
                            value={form.logradouro}
                            onChange={(e) => setForm({ ...form, logradouro: e.target.value })}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              ref={numeroRef}
                              label="Número"
                              required
                              inputMode="numeric"
                              value={form.numero}
                              onChange={(e) => setForm({ ...form, numero: e.target.value })}
                            />
                            <Input
                              label="Complemento (opcional)"
                              autoComplete="address-line2"
                              value={form.complemento}
                              onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                            />
                          </div>
                          <Input
                            label="Bairro"
                            required
                            autoComplete="address-level3"
                            value={form.bairro}
                            onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                          />
                          <div className="grid grid-cols-[1fr_96px] gap-3">
                            <Input
                              label="Cidade"
                              required
                              autoComplete="address-level2"
                              value={form.cidade}
                              onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                            />
                            <Input
                              label="UF"
                              required
                              autoComplete="address-level1"
                              maxLength={2}
                              value={form.estado}
                              onChange={(e) =>
                                setForm({ ...form, estado: e.target.value.toUpperCase() })
                              }
                            />
                          </div>
                        </div>
                      )}

                      {freteQuery.isError && (
                        <p className="text-[12.5px] text-muted">
                          Não conseguimos calcular o frete agora. O valor aparece na revisão, antes
                          de pagar.
                        </p>
                      )}
                    </>
                  )}

                  {faltandoPasso1.length > 0 && (
                    <p className="text-[12.5px] text-muted">
                      Falta preencher: {faltandoPasso1.join(', ')}.
                    </p>
                  )}
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setPasso(0)}
                      className="flex-1"
                    >
                      Voltar
                    </Button>
                    <Button type="submit" disabled={!podeAvancarPasso1()} className="flex-[2]">
                      Revisar pedido
                    </Button>
                  </div>
                </form>
              )}

              {passo === 2 && (
                <div className="flex flex-col gap-4">
                  <div className="divide-y divide-line rounded-atlas border border-line bg-white shadow-atlas">
                    <div className="flex items-start justify-between gap-3 p-4">
                      <div className="min-w-0 text-[13px]">
                        <h2 className="mb-1 font-display text-[14px] font-bold text-navy">
                          Contato
                        </h2>
                        <p className="text-ink">{form.nome}</p>
                        {form.email && <p className="break-words text-muted">{form.email}</p>}
                        {form.telefone && (
                          <p className="text-muted">{formatarTelefone(form.telefone)}</p>
                        )}
                      </div>
                      {!pagamentoEmAnalise && (
                        <button
                          type="button"
                          onClick={() => irParaPasso(0)}
                          aria-label="Alterar contato"
                          className="shrink-0 py-1 text-[13px] font-semibold text-blue hover:underline"
                        >
                          Alterar
                        </button>
                      )}
                    </div>
                    <div className="flex items-start justify-between gap-3 p-4">
                      <div className="min-w-0 text-[13px]">
                        <h2 className="mb-1 font-display text-[14px] font-bold text-navy">
                          {ehRetirada ? 'Retirada na loja' : 'Entrega'}
                        </h2>
                        {ehRetirada ? (
                          <p className="text-ink">{ENDERECO_LOJA}</p>
                        ) : (
                          <p className="text-ink">
                            {form.logradouro}, {form.numero}
                            {form.complemento ? ` (${form.complemento})` : ''} — {form.bairro},{' '}
                            {form.cidade}/{form.estado}
                          </p>
                        )}
                        <p className="text-muted">
                          Frete: {textoFrete}
                          {!ehRetirada &&
                            opcaoEntrega &&
                            ` · ${opcaoEntrega.prazoEstimadoDias} ${opcaoEntrega.prazoEstimadoDias === 1 ? 'dia' : 'dias'}`}
                        </p>
                      </div>
                      {!pagamentoEmAnalise && (
                        <button
                          type="button"
                          onClick={() => irParaPasso(1)}
                          aria-label="Alterar entrega"
                          className="shrink-0 py-1 text-[13px] font-semibold text-blue hover:underline"
                        >
                          Alterar
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h2 className="mb-2 font-display text-[15px] font-bold text-navy">
                      Como você quer pagar?
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <OpcaoCheckout
                        nome="metodoFechamento"
                        titulo="Pagar agora"
                        descricao={
                          sdkPronto
                            ? 'Pix ou cartão, via Mercado Pago'
                            : sdkFalhou
                              ? 'Indisponível no momento'
                              : 'Carregando…'
                        }
                        checked={metodoFechamento === 'pagar'}
                        disabled={!sdkPronto}
                        onChange={() => escolherMetodoFechamento('pagar')}
                      />
                      <OpcaoCheckout
                        nome="metodoFechamento"
                        titulo="Fechar pelo WhatsApp"
                        descricao="Você combina o pagamento com a loja"
                        checked={metodoFechamento === 'whatsapp'}
                        disabled={pagamentoEmAnalise}
                        onChange={() => escolherMetodoFechamento('whatsapp')}
                      />
                    </div>
                  </div>

                  {metodoFechamento === 'whatsapp' && (
                    <div className="flex items-start gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => irParaPasso(1)}
                        className="flex-1 py-3.5"
                        disabled={enviando}
                      >
                        Voltar
                      </Button>
                      <button
                        type="button"
                        onClick={confirmarPedidoWhatsApp}
                        disabled={enviando}
                        className={`${CLASSES_BOTAO_COMPRAR} mb-1 flex-[2] px-4 py-3.5`}
                      >
                        {enviando ? 'Enviando…' : 'Fechar pedido pelo WhatsApp'}
                      </button>
                    </div>
                  )}

                  {metodoFechamento === 'pagar' && (
                    <div className="flex flex-col gap-3">
                      {carregandoPagamento && (
                        <div
                          className="rounded-atlas border border-line bg-white p-4"
                          role="status"
                        >
                          <p className="text-[13px] font-semibold text-navy">
                            Preparando o pagamento seguro…
                          </p>
                          <div className="mt-3 flex flex-col gap-2" aria-hidden="true">
                            <div className="h-11 animate-pulse rounded-atlas-sm bg-line motion-reduce:animate-none" />
                            <div className="h-11 animate-pulse rounded-atlas-sm bg-line motion-reduce:animate-none" />
                          </div>
                        </div>
                      )}

                      {resultadoPagamento?.tipo === 'analise' && (
                        <div className="flex flex-col gap-2 rounded-atlas border border-line bg-white p-4 text-center shadow-atlas">
                          <p className="text-[13px] font-semibold text-navy" role="status">
                            {resultadoPagamento.status === 'aguardando' &&
                              'Seu pagamento está em análise pelo banco. Aguarde nesta página…'}
                            {resultadoPagamento.status === 'timeout' &&
                              'O banco ainda está analisando o pagamento. Assim que ele responder, você recebe um e-mail com o resultado — não pague de novo enquanto isso.'}
                            {resultadoPagamento.status === 'recusado' &&
                              'O banco não aprovou o pagamento. Nenhum valor foi cobrado.'}
                          </p>
                          {resultadoPagamento.status === 'recusado' && (
                            <div className="flex justify-center gap-3 text-[13px]">
                              <button
                                type="button"
                                onClick={() => void iniciarPagamentoNoSite()}
                                className="font-semibold text-blue hover:underline"
                              >
                                Tentar com outro cartão
                              </button>
                              <button
                                type="button"
                                onClick={() => escolherMetodoFechamento('whatsapp')}
                                className="font-semibold text-blue hover:underline"
                              >
                                Fechar pelo WhatsApp
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {resultadoPagamento?.tipo === 'pix' && (
                        <div className="flex flex-col items-center gap-3 rounded-atlas border border-line bg-white p-5 text-center shadow-atlas">
                          <h2 className="font-display text-base font-bold text-navy">
                            Pague {formatarMoeda(totalPedido)} com Pix
                          </h2>
                          <p className="text-[13px] text-ink">
                            Escaneie o QR Code ou copie o código Pix abaixo.
                          </p>
                          {resultadoPagamento.qrCodeBase64 && (
                            // next/image otimiza imagem remota (lazy load, formato, cache) — nada disso
                            // se aplica a um data: URI gerado na hora pelo Mercado Pago, então fica <img>.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`data:image/png;base64,${resultadoPagamento.qrCodeBase64}`}
                              alt="QR Code Pix"
                              className="h-48 w-48"
                            />
                          )}
                          {resultadoPagamento.qrCode && (
                            <>
                              <button
                                type="button"
                                onClick={() => void copiarCodigoPix(resultadoPagamento.qrCode!)}
                                className={`${CLASSES_BOTAO_COMPRAR} mb-1 w-full px-5 py-3`}
                              >
                                {pixCopiado ? 'Código copiado ✓' : 'Copiar código Pix'}
                              </button>
                              <textarea
                                readOnly
                                rows={3}
                                aria-label="Código Pix"
                                value={resultadoPagamento.qrCode}
                                onClick={(e) => e.currentTarget.select()}
                                className="w-full rounded-atlas-sm border border-line bg-paper px-3 py-2 font-mono text-[12px] text-ink"
                              />
                            </>
                          )}
                          <p
                            className="flex items-center gap-2 text-[13px] font-semibold text-navy"
                            role="status"
                          >
                            {resultadoPagamento.status === 'aguardando' && (
                              <span
                                aria-hidden="true"
                                className="h-2 w-2 animate-ping rounded-full bg-[#14753c] motion-reduce:animate-none"
                              />
                            )}
                            <span>
                              {resultadoPagamento.status === 'aguardando' &&
                                'Aguardando confirmação do pagamento…'}
                              {resultadoPagamento.status === 'timeout' &&
                                'Ainda não recebemos a confirmação — se você já pagou, seu pedido será atualizado automaticamente assim que o banco confirmar.'}
                              {resultadoPagamento.status === 'cancelado' && 'Pagamento cancelado.'}
                            </span>
                          </p>
                        </div>
                      )}

                      {/* O Brick se monta aqui dentro (ver iniciarPagamentoNoSite em mercadopago.ts) —
                          fica vazio depois de desmontado num Pix/cartão aprovado. */}
                      <div id="payment-brick-container" />

                      {/* Logo abaixo do Brick, não acima: o formulário é longo e quem acabou de clicar
                          em "Pagar" está aqui embaixo — acima, a recusa ficava fora da tela. */}
                      {resultadoPagamento?.tipo === 'erro' && (
                        <div className="flex flex-col gap-2 rounded-atlas-sm bg-red-50 px-4 py-3 text-[13px] text-red-600">
                          <p role="alert">{resultadoPagamento.mensagem}</p>
                          {resultadoPagamento.podeTentarDeNovo && (
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => void iniciarPagamentoNoSite()}
                                className="font-semibold text-blue hover:underline"
                              >
                                Tentar novamente
                              </button>
                              <button
                                type="button"
                                onClick={() => escolherMetodoFechamento('whatsapp')}
                                className="font-semibold text-blue hover:underline"
                              >
                                Fechar pelo WhatsApp
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <p className="text-center text-[12px] text-muted">
                        Pagamento processado pelo Mercado Pago. Os dados do cartão não passam pela
                        loja.
                      </p>

                      <Button
                        variant="secondary"
                        onClick={() => irParaPasso(1)}
                        disabled={enviando || pagamentoEmAnalise}
                      >
                        Voltar
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
