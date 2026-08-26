// Derruba o Postgres embarcado subido em global-setup.ts. Como persistent:false,
// isso também apaga o diretório de dados de teste (.pgdata-test).
interface EmbeddedPostgresLike {
  stop(): Promise<void>;
}

export default async function globalTeardown(): Promise<void> {
  const pg = (globalThis as unknown as { __ATLAS_TEST_PG__?: EmbeddedPostgresLike })
    .__ATLAS_TEST_PG__;
  if (pg) {
    await pg.stop();
  }
}
