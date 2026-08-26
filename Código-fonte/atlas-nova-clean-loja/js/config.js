// URL do backend (NestJS). Em produção, troque para a URL pública onde a API estiver hospedada.
export const API_BASE_URL = window.ATLAS_API_BASE_URL || 'http://localhost:3000';

// Chave pública (Public Key) do Mercado Pago — diferente do Access Token, esta é
// feita pra ser exposta no frontend, então não tem problema estar aqui no código.
//
// O valor abaixo é de uma CONTA DE TESTE (sandbox), só serve pra desenvolvimento
// local. Antes de publicar o site de verdade, troque pela Public Key de
// PRODUÇÃO da sua conta real — painel → aplicação "Atlas nova clean" →
// aba "Credenciais de produção" → Public Key (começa com APP_USR-).
// Precisa bater com o mesmo Access Token configurado no backend (.env).
export const MERCADOPAGO_PUBLIC_KEY = 'APP_USR-e9584142-128e-489a-a43c-4bc74e7ba73f';
