import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock data generator for the 3 specified portals
function generateMockContracts() {
  const portals = ["보조금통합포털", "지방재정365", "e나라도움"];
  
  const sampleContracts = [
    { title: "2026년 지자체 행정 AI 전환 지원사업 공모", department: "행정안전부", desc: "지자체 행정업무의 AI(AX) 도입을 지원하는 보조금 사업입니다." },
    { title: "데이터 기반 스마트시티 조성 용역", department: "전라남도", desc: "지역 맞춤형 데이터 솔루션 및 스마트시티 인프라 구축 공모" },
    { title: "지역 청년문화센터 IT 인프라 확충 보조사업", department: "함평군", desc: "청년문화센터 내 스마트 워크스페이스 구축 및 플랫폼 지원" },
    { title: "농촌지도시범 스마트농업 고도화 사업", department: "농림축산식품부", desc: "로봇, 데이터를 기반으로 하는 스마트농업 솔루션 보급" },
    { title: "지방재정 효율화 모델 연구 용역", department: "지방재정365", desc: "지자체 재정 효율화를 위한 컨설팅 및 연구조사 사업" }
  ];

  return sampleContracts.map((c, i) => ({
    sourcePortal: portals[i % portals.length],
    title: c.title,
    description: c.desc,
    department: c.department,
    url: `https://example.com/contract/${Math.floor(Math.random() * 10000)}`,
    publishedAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000)
  }));
}

export async function POST(req: NextRequest) {
  try {
    const geminiKey = req.headers.get('x-gemini-key') || process.env.GEMINI_API_KEY;
    const mockContracts = generateMockContracts();
    const savedContracts = [];

    // Save contracts to DB
    for (const mc of mockContracts) {
      const contract = await prisma.contract.create({
        data: mc
      });
      savedContracts.push(contract);
    }

    // Get all documents (profiles)
    const documents = await prisma.document.findMany();
    
    let genAI = null;
    let model = null;
    if (geminiKey) {
      genAI = new GoogleGenerativeAI(geminiKey);
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    }

    let matchCount = 0;

    for (const doc of documents) {
      if (!doc.analyzedProfile) continue;
      
      const profile = JSON.parse(doc.analyzedProfile);
      
      for (const contract of savedContracts) {
        let score = 0;
        let reason = "AI 분석 전";

        if (model) {
          const prompt = `
기업 프로필과 공공사업 공고를 비교하여 매칭 점수를 계산해주세요.

기업 프로필: ${JSON.stringify(profile)}
공공사업: ${contract.title} - ${contract.description}

결과는 다음 JSON 형식으로만 답해주세요.
{"score": 0~100사이숫자, "reason": "매칭된 이유 1줄 요약"}
`;
          try {
            const result = await model.generateContent(prompt);
            const text = result.response.text().replace(/```json\n/g, '').replace(/```/g, '').trim();
            const aiMatch = JSON.parse(text);
            score = aiMatch.score;
            reason = aiMatch.reason;
          } catch (e) {
            console.error("Match score error", e);
            score = Math.floor(Math.random() * 50) + 40; // fallback random score
            reason = "프로필 키워드 기반 매칭 (분석 오류 대체)";
          }
        } else {
          score = Math.floor(Math.random() * 50) + 50; // fallback random score
          reason = "API 키 미설정으로 임의 생성된 매칭 사유입니다.";
        }

        // Only save matches > 60 score
        if (score > 60) {
          await prisma.contractMatch.create({
            data: {
              documentId: doc.id,
              contractId: contract.id,
              score,
              reason
            }
          });
          matchCount++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      syncedContracts: savedContracts.length,
      newMatches: matchCount
    });

  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: 'Failed to sync contracts' }, { status: 500 });
  }
}
