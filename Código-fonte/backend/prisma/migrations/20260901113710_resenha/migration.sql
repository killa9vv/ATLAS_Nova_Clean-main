-- CreateTable
CREATE TABLE "resenhas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resenhas_pkey" PRIMARY KEY ("id")
);
