// Vercel Serverless Function for Lunar API Proxy

export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS 요청 처리 (CORS preflight)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { type, solYear, solMonth, solDay, lunYear, lunMonth, lunDay, lunLeapmonth } = req.query;
    const API_KEY = process.env.VITE_SPCDE_API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });
    }

    try {
        let url;
        let params;

        if (type === 'solar-to-lunar') {
            // 양력 → 음력 변환
            url = 'http://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService/getLunCalInfo';
            params = new URLSearchParams({
                serviceKey: API_KEY,
                solYear,
                solMonth,
                solDay
            });
        } else if (type === 'lunar-to-solar') {
            // 음력 → 양력 변환
            url = 'http://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService/getLunToSolInfo';
            params = new URLSearchParams({
                serviceKey: API_KEY,
                lunYear,
                lunMonth,
                lunDay,
                lunLeapmonth
            });
        } else {
            return res.status(400).json({ error: '잘못된 요청 타입입니다.' });
        }

        const response = await fetch(`${url}?${params.toString()}`);
        const text = await response.text();

        // XML 응답을 그대로 반환
        res.setHeader('Content-Type', 'application/xml');
        res.status(200).send(text);
    } catch (error) {
        console.error('API 호출 실패:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
}
