import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET(req: NextRequest) {
  const openaiKey = req.headers.get('x-openai-key');
  const publicKey = req.headers.get('x-public-api-key');

  let openaiStatus = { status: 'idle', message: '미설정' };
  let publicApiStatus = { status: 'idle', message: '미설정' };

  // Test OpenAI
  if (openaiKey) {
    try {
      const openai = new OpenAI({ apiKey: openaiKey });
      const response = await openai.models.list();
      
      if (response.data && response.data.length > 0) {
        openaiStatus = { status: 'success', message: '정상 연결됨' };
      } else {
        openaiStatus = { status: 'error', message: '응답을 받을 수 없음' };
      }
    } catch (e: any) {
      openaiStatus = { status: 'error', message: e.message || '인증 실패' };
    }
  }

  // Test Public API
  if (publicKey) {
    try {
      const baseUrl = "https://apis.data.go.kr/1051000/MoefOpenAPI2025/T_OPD_ASBS_PBNS_UNITY";
      const url = `${baseUrl}?serviceKey=${encodeURIComponent(publicKey)}&pageNo=1&numOfRows=1&type=json`;
      const response = await fetch(url);
      const text = await response.text();

      if (text.includes('SERVICE_KEY_IS_NOT_REGISTERED_ERROR') || text.includes('등록되지 않은 서비스키')) {
        publicApiStatus = { status: 'warning', message: '연결 실패 (키 동기화 중이거나 미등록 상태)' };
      } else if (text.includes('<OpenAPI_ServiceResponse>') && text.includes('errMsg')) {
        const match = text.match(/<returnAuthMsg>(.*?)<\/returnAuthMsg>/);
        const msg = match ? match[1] : '인증 에러';
        publicApiStatus = { status: 'error', message: msg };
      } else {
        try {
          const data = JSON.parse(text);
          if (data?.response?.header?.resultCode === "00" || data?.response?.body?.items) {
            publicApiStatus = { status: 'success', message: '정상 연결됨' };
          } else if (text.includes('HTTP_ERROR')) {
             publicApiStatus = { status: 'warning', message: '파라미터/HTTP 에러 (키는 유효할 수 있음)' };
          } else {
            publicApiStatus = { status: 'success', message: '연결됨 (응답 구조 다름)' };
          }
        } catch(e) {
          publicApiStatus = { status: 'error', message: '데이터 파싱 실패 (잘못된 포맷)' };
        }
      }
    } catch (e: any) {
      const errorMsg = e.message || '네트워크 에러';
      publicApiStatus = { status: 'error', message: errorMsg.includes('fetch failed') ? '서버 네트워크 연결 오류 (일시적)' : errorMsg };
    }
  }

  return NextResponse.json({
    openai: openaiStatus,
    publicApi: publicApiStatus
  });
}
