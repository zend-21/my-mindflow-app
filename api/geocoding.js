// api/geocoding.js
// Vercel Serverless Function for Nominatim geocoding API proxy

export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept-Language');

    // OPTIONS 요청 처리 (CORS preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // GET 요청만 허용
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { q, format, addressdetails, limit } = req.query;

        // 입력 검증
        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                error: 'q 파라미터(검색어)가 필요합니다 (최소 2자)',
                example: '/api/geocoding?q=Seoul&format=json&addressdetails=1&limit=20'
            });
        }

        // Nominatim API URL 구성
        const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
        nominatimUrl.searchParams.set('q', q.trim());
        nominatimUrl.searchParams.set('format', format || 'json');
        nominatimUrl.searchParams.set('addressdetails', addressdetails || '1');
        nominatimUrl.searchParams.set('limit', limit || '20');

        // Accept-Language 헤더 가져오기 (프론트엔드에서 전달한 언어)
        const acceptLanguage = req.headers['accept-language'] || 'en';

        // Nominatim API 호출
        const response = await fetch(nominatimUrl.toString(), {
            headers: {
                'User-Agent': 'MindFlowApp/1.0 (Vercel Serverless Function)', // Nominatim 정책 준수
                'Accept-Language': acceptLanguage,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Nominatim API 호출 실패: ${response.status}`);
        }

        const data = await response.json();

        // 결과 반환
        return res.status(200).json(data);

    } catch (error) {
        console.error('Geocoding API error:', error);
        return res.status(500).json({
            error: '도시 검색 중 오류가 발생했습니다.',
            message: error.message
        });
    }
}
