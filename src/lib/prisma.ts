import { PrismaClient } from "@prisma/client";

// Prevent hot-reload in dev from creating a new Prisma Client on every save.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
