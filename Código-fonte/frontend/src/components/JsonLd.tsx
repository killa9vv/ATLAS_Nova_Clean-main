// Renderiza um bloco JSON-LD (schema.org) com segurança — escapa "</" pra um objeto
// de dados nunca poder fechar a tag <script> prematuramente e injetar HTML/JS.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
