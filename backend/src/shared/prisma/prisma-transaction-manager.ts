import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TransactionManager } from './transaction-manager';

@Injectable()
export class PrismaTransactionManager extends TransactionManager {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async executar<T>(fn: (contexto: unknown) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx) => fn(tx));
  }
}
