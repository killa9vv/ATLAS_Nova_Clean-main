// Tokens de injeção para as duas implementações concretas de ShippingQuoteProvider
// (Melhor Envio e tabela regional) — precisam de identificadores próprios porque
// ShippingQuoteProviderComFallback injeta as duas ao mesmo tempo, e o NestJS não
// distingue duas implementações da mesma abstract class sem um token.
export const MELHOR_ENVIO_PROVIDER = Symbol('MELHOR_ENVIO_PROVIDER');
export const TABELA_REGIONAL_PROVIDER = Symbol('TABELA_REGIONAL_PROVIDER');
// ShippingQuoteProviderComCache decora ShippingQuoteProviderComFallback — precisa desse
// token porque ambos "são" ShippingQuoteProvider (mesma razão dos dois tokens acima).
export const SHIPPING_QUOTE_SEM_CACHE = Symbol('SHIPPING_QUOTE_SEM_CACHE');
