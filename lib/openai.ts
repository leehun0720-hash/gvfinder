import OpenAI from 'openai';

export async function extractBusinessProfile(text: string, apiKey?: string) {
  const key = apiKey || process.env.OPENAI_API_KEY;
  
  if (!key) {
    console.warn("OPENAI_API_KEY is not set. Generating mock profile.");
    return {
      coreCompetencies: ["AI 모델 개발", "데이터 분석", "웹 서비스 구축"],
      targetSectors: ["스마트시티", "디지털 트윈", "공공 데이터"],
      pastExperiences: ["지자체 데이터 통합 플랫폼 구축", "AI 기반 민원 처리 챗봇 도입"]
    };
  }

  const openai = new OpenAI({ apiKey: key });

  const prompt = `
다음은 기업 또는 지자체의 사업 제안서/소개서 일부입니다. 이 내용을 바탕으로 이 조직이 수주하거나 참여하기 적합한 '정부/지자체 공모사업 및 용역'을 찾기 위한 비즈니스 프로필을 JSON 형태로 추출해주세요.
반드시 아래 JSON 형식(키 값)을 유지하여 응답해주세요.

{
  "coreCompetencies": ["핵심역량1", "핵심역량2"],
  "targetSectors": ["관심분야1", "관심분야2"],
  "pastExperiences": ["주요경험1", "주요경험2"]
}

문서 내용:
${text}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const resultText = response.choices[0].message.content || "{}";
    
    // Clean up markdown code blocks if any
    const cleanedText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("OpenAI Extraction Error:", error);
    // fallback
    return {
      coreCompetencies: ["문서 분석"],
      targetSectors: ["일반 공공사업"],
      pastExperiences: []
    };
  }
}
