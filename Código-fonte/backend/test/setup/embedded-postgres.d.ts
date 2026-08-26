// embedded-postgres é um pacote ESM-only sem campo "main" no package.json — o
// "moduleResolution" clássico usado pelo tsconfig do projeto não enxerga o
// campo "exports" dele e não consegue resolver os tipos publicados. Esta
// declaração ambiente cobre só a API que usamos em test/setup/*.
declare module 'embedded-postgres' {
  interface EmbeddedPostgresOptions {
    databaseDir: string;
    user?: string;
    password?: string;
    port?: number;
    persistent?: boolean;
  }

  export default class EmbeddedPostgres {
    constructor(options: EmbeddedPostgresOptions);
    initialise(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    createDatabase(name: string): Promise<void>;
    dropDatabase(name: string): Promise<void>;
  }
}
