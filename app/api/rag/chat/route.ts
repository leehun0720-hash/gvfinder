import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { messages } = data; // Array of { role: 'user'|'model', content: string }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const openaiKey = req.headers.get('x-openai-key') || process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ error: 'OpenAI API Key is missing. Please set it in Settings.' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: openaiKey });

    // Mock Retrieval Step
    const contextText = "이 공모사업의 핵심 평가 기준은 AI 기술의 실현 가능성과 지자체 데이터 연계성입니다.";

    const systemPrompt = `
당신은 국비 공모사업 제안서를 작성하고 분석하는 AI 어시스턴트 '공고 파인더' 입니다.
사용자의 질문에 대해 아래 참고 자료(Context)를 바탕으로 전문적이고 도움이 되는 답변을 작성해주세요.

[참고 자료]
${contextText}
`;

    // Map messages to OpenAI format
    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === 'model' ? 'assistant' : m.role,
        content: m.content
      }))
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: formattedMessages
    });

    const reply = response.choices[0].message.content || "";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
