import { GoogleGenerativeAI } from '@google/generative-ai';

export async function extractBusinessProfile(text: string, apiKey?: string) {
  const key = apiKey || process.env.GEMINI_API_KEY;
  
  if (!key) {
    console.warn("GEMINI_API_KEY is not set. Returning mock profile.");
    return {
      keywords: ["행정", "AI", "데이터", "스마트", "플랫폼"],
      targetCategories: ["정보화", "스마트시티", "행정효율화"],
      keyCapabilities: ["AI 솔루션 개발", "데이터 분석", "플랫폼 구축"],
      summary: "AI 기반 행정 전환(AX) 및 데이터 솔루션 구축 역량 보유"
    };
  }

  const genAI = new GoogleGenerativeAI(key);

  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

  const prompt = `
다음은 기업 또는 지자체의 사업 제안서/소개서 일부입니다. 이 내용을 바탕으로 이 조직이 수주하거나 참여하기 적합한 '정부/지자체 공모사업 및 용역'을 찾기 위한 비즈니스 프로필을 JSON 형태로 추출해주세요.

[텍스트 시작]
${text.substring(0, 15000)} // 최대 15000자
[텍스트 끝]

아래 JSON 형식으로만 응답해주세요. 마크다운(\`\`\`json)은 제외하고 순수 JSON 텍스트만 출력하세요.
{
  "keywords": ["핵심", "키워드", "배열"],
  "targetCategories": ["관심/타겟 사업 분야 배열 (예: 스마트시티, 복지, 정보화 등)"],
  "keyCapabilities": ["보유한 주요 역량/기술 배열"],
  "summary": "이 조직의 강점과 타겟 공모사업에 대한 1~2줄 요약"
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    if (text.startsWith('\`\`\`json')) {
      text = text.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to extract profile");
  }
}
