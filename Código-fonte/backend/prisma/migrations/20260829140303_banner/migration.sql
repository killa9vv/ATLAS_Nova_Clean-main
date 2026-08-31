-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "imagem_url" TEXT,
    "link_url" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);
