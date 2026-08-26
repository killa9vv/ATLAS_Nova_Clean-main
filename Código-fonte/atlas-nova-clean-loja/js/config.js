// URL do backend (NestJS). Em produção, troque para a URL pública onde a API estiver hospedada.
export const API_BASE_URL = window.ATLAS_API_BASE_URL || 'http://localhost:3000';

// Chave pública (Public Key) do Mercado Pago — diferente do Access Token, esta é
// feita pra ser exposta no frontend, então não tem problema estar aqui no código.
// Segue o mesmo mecanismo de override de API_BASE_URL acima: defina
// window.ATLAS_MERCADOPAGO_PUBLIC_KEY antes deste script rodar (ex.: numa tag
// <script> inline no HTML) pra trocar a chave por ambiente sem editar este arquivo.
//
// O valor abaixo é de uma CONTA DE TESTE (sandbox), só serve pra desenvolvimento
// local. Antes de publicar o site de verdade, troque pela Public Key de
// PRODUÇÃO da sua conta real — painel → aplicação "Atlas nova clean" →
// aba "Credenciais de produção" → Public Key (começa com APP_USR-).
// Precisa bater com o mesmo Access Token configurado no backend (.env).
export const MERCADOPAGO_PUBLIC_KEY =
  window.ATLAS_MERCADOPAGO_PUBLIC_KEY || 'TEST-fa9ad04f-891d-490e-9ba5-a3e5ca052899';
