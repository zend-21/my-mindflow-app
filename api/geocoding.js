// api/geocoding.js
// Vercel Serverless Function for Nominatim API proxy

export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS 요청 처리 (preflight)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // GET 요청만 허용
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { q, format = 'json', addressdetails = '1', limit = '10' } = req.query;

        if (!q || q.trim().length < 2) {
            res.status(400).json({ error: 'Query parameter "q" is required and must be at least 2 characters' });
            return;
        }

        // Nominatim API 호출
        const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
        nominatimUrl.searchParams.append('q', q.trim());
        nominatimUrl.searchParams.append('format', format);
        nominatimUrl.searchParams.append('addressdetails', addressdetails);
        nominatimUrl.searchParams.append('limit', limit);
        nominatimUrl.searchParams.append('accept-language', 'ko,en,ja');

        const response = await fetch(nominatimUrl.toString(), {
            headers: {
                'User-Agent': 'MindFlowApp/1.0 (Fortune Telling App)',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Nominatim API error: ${response.status}`);
        }

        const data = await response.json();

        // 응답 데이터 반환
        res.status(200).json(data);

    } catch (error) {
        console.error('Geocoding API error:', error);
        res.status(500).json({
            error: 'Failed to fetch geocoding data',
            message: error.message
        });
    }
}
