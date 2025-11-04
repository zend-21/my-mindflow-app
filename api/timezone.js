// api/timezone.js
// Vercel Serverless Function for timezone calculation using geo-tz
import { find } from 'geo-tz';

export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS 요청 처리 (CORS preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // GET 요청만 허용
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { lat, lon } = req.query;

        // 입력 검증
        if (!lat || !lon) {
            return res.status(400).json({
                error: 'lat과 lon 파라미터가 필요합니다.',
                example: '/api/timezone?lat=37.5665&lon=126.9780'
            });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        // 숫자 유효성 검사
        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({
                error: 'lat과 lon은 유효한 숫자여야 합니다.'
            });
        }

        // 범위 검사
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({
                error: 'lat은 -90~90, lon은 -180~180 범위여야 합니다.'
            });
        }

        // geo-tz로 타임존 계산
        const timezones = find(latitude, longitude);

        if (timezones && timezones.length > 0) {
            return res.status(200).json({
                timezone: timezones[0],
                lat: latitude,
                lon: longitude,
                allTimezones: timezones // 여러 타임존이 겹치는 경우 (드문 경우)
            });
        }

        // 타임존을 찾지 못한 경우
        return res.status(404).json({
            error: '해당 좌표에서 타임존을 찾을 수 없습니다.',
            lat: latitude,
            lon: longitude
        });

    } catch (error) {
        console.error('Timezone API error:', error);
        return res.status(500).json({
            error: '타임존 계산 중 오류가 발생했습니다.',
            message: error.message
        });
    }
}
