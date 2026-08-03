import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ contracts: [] });
  }

  try {
    const contracts = await prisma.contract.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { department: { contains: q } },
          { sourcePortal: { contains: q } },
        ],
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 20, // Limit to 20 results
    });

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: 'Failed to search contracts' }, { status: 500 });
  }
}
