import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { contractId, question } = await req.json();
    if (!contractId || !question) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // In a real RAG system:
    // 1. Embed the question
    // 2. Search DocumentChunk for similar embeddings
    // 3. Pass top chunks to LLM

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Mock Retrieval Step
    const contextText = "이 공모사업의 핵심 평가 기준은 AI 기술의 실현 가능성과 지자체 데이터 연계성입니다.";

    const prompt = `
사용자 질문: ${question}

공모사업 컨텍스트:
${contextText}

컨텍스트를 바탕으로 답변해주세요.
`;

    const result = await model.generateContent(prompt);
    const answer = await result.response.text();

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("RAG Chat error:", error);
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}
