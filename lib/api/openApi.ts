/**
 * Open API integration for government portals.
 */
export async function fetchContractsFromOpenAPI(keyword: string, apiKey?: string) {
  console.log(`Fetching contracts from Open API with keyword: ${keyword}`);
  
  if (!apiKey) {
    console.warn("No Public API Key provided. Returning mock data.");
    return generateFallbackData(keyword);
  }

  // data.go.kr Open API Endpoint with specific operation
  const baseUrl = "https://apis.data.go.kr/1051000/MoefOpenAPI2025/T_OPD_ASBS_PBNS_UNITY";
  
  try {
    // Usually type=json or resultType=json
    const url = `${baseUrl}?serviceKey=${encodeURIComponent(apiKey)}&pageNo=1&numOfRows=20&type=json`;
    const response = await fetch(url);
    const text = await response.text();
    
    // Check if it's an XML error from the gateway
    if (text.includes('<OpenAPI_ServiceResponse>')) {
      console.warn("Open API Gateway Error:", text);
      return generateFallbackData(keyword);
    }

    try {
      const data = JSON.parse(text);
      console.log("Open API Success Data structure:", Object.keys(data));
      
      // Standard data.go.kr json structure
      const items = data?.response?.body?.items?.item || data?.items || [];
      
      if (items.length > 0) {
        return items.map((item: any, index: number) => ({
          title: item.pbnsNm || item.bizNm || item.title || `[API 수집] 정부 공모사업 ${index+1}`,
          department: item.instNm || item.deptNm || "기획재정부(국고보조금)",
          publishedAt: new Date(),
          sourcePortal: "보조금통합포털",
          description: item.bizCn || item.pbnsCn || "상세 내용을 확인하려면 공고 원문을 참조하세요."
        }));
      }

      return generateFallbackData(keyword);
    } catch (e) {
      console.warn("Failed to parse JSON from API:", e);
      return generateFallbackData(keyword);
    }

  } catch (error) {
    console.error("Open API fetch error:", error);
    return generateFallbackData(keyword);
  }
}

function generateFallbackData(keyword: string) {
  return [
    {
      title: `[OpenAPI] ${keyword} 지원사업`,
      department: "행정안전부",
      publishedAt: new Date(),
      sourcePortal: "보조금통합포털",
      description: "API 연동 테스트용 가상 데이터입니다. (실제 데이터 수집 실패 시 표시됨)"
    }
  ];
}
