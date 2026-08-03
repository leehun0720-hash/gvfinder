import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const matches = await prisma.contractMatch.findMany({
      include: {
        contract: true,
      },
      orderBy: {
        score: 'desc'
      },
      take: 10
    });

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Fetch matches error:", error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}
