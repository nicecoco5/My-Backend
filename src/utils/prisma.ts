/**
 * Prisma Client Singleton
 * 
 * 이 파일은 PrismaClient를 싱글톤 패턴으로 관리합니다.
 * 싱글톤을 사용하는 이유:
 * - 개발 환경에서 hot-reload 시 여러 PrismaClient 인스턴스가 생성되는 것을 방지
 * - 데이터베이스 연결 수를 최소화
 * - 메모리 누수 방지
 */

import { PrismaClient } from '@prisma/client';

// globalThis에 prisma 타입 선언 (TypeScript용)
declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

// 싱글톤: 이미 존재하면 재사용, 없으면 새로 생성
const prisma = globalThis.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
});

// 개발 환경에서만 globalThis에 저장 (hot-reload 대응)
if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}

export default prisma;
