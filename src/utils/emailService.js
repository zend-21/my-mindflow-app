// src/utils/emailService.js
// 이메일 발송 서비스 (Resend 사용)

import { Resend } from 'resend';

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;

// 개발 모드 플래그 (true: 콘솔만 출력, false: 실제 이메일 발송)
// ⚠️ 주의: 브라우저에서 Resend API를 직접 호출하면 CORS 오류가 발생합니다.
// 실제 이메일 발송을 위해서는 백엔드 서버 또는 Serverless Function이 필요합니다.
const DEV_MODE = true; // TODO: 백엔드 구현 후 false로 변경

/**
 * 임시 PIN 이메일 발송
 * @param {string} toEmail - 수신자 이메일 주소
 * @param {string} tempPin - 임시 PIN 번호
 * @param {number} expiresAt - 만료 시간 (타임스탬프)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendTempPinEmail = async (toEmail, tempPin, expiresAt) => {
    try {
        // 만료 시간 포맷팅
        const expiresDate = new Date(expiresAt);
        const expiresDateStr = expiresDate.toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Seoul'
        });

        // 개발 모드: 콘솔에만 출력
        if (DEV_MODE) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📧 [개발 모드] 임시 PIN 이메일 발송 시뮬레이션');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📬 수신자:', toEmail);
            console.log('🔑 임시 PIN:', tempPin);
            console.log('⏰ 만료 시간:', expiresDateStr);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('💡 이 PIN을 사용하여 로그인할 수 있습니다.');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            return {
                success: true,
                message: '(개발 모드) 콘솔에서 임시 PIN을 확인하세요.'
            };
        }

        // 프로덕션 모드: 실제 이메일 발송
        // API 키 확인
        if (!RESEND_API_KEY || RESEND_API_KEY === 'your_resend_api_key_here') {
            console.warn('⚠️ Resend API 키가 설정되지 않았습니다.');
            return {
                success: false,
                message: '이메일 서비스가 설정되지 않았습니다.'
            };
        }

        const resend = new Resend(RESEND_API_KEY);

        // 이메일 전송
        const { data, error } = await resend.emails.send({
            from: 'MindFlow <noreply@resend.dev>', // Resend 무료 플랜 기본 도메인
            to: [toEmail],
            subject: '[MindFlow] 임시 PIN 번호 안내',
            html: getEmailTemplate(tempPin, expiresDateStr)
        });

        if (error) {
            console.error('이메일 발송 오류:', error);
            return {
                success: false,
                message: '이메일 발송에 실패했습니다.'
            };
        }

        console.log('✅ 이메일 발송 성공:', data);
        return {
            success: true,
            message: '이메일이 성공적으로 발송되었습니다.'
        };

    } catch (error) {
        console.error('이메일 발송 오류:', error);
        return {
            success: false,
            message: '이메일 발송 중 오류가 발생했습니다.'
        };
    }
};

/**
 * 이메일 HTML 템플릿
 * @param {string} tempPin - 임시 PIN
 * @param {string} expiresDateStr - 만료 시간 문자열
 * @returns {string} HTML 템플릿
 */
const getEmailTemplate = (tempPin, expiresDateStr) => {
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MindFlow - 임시 PIN 번호</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <!-- 메인 컨테이너 -->
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden;">

                    <!-- 헤더 -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">
                                🔐 MindFlow
                            </h1>
                            <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                                시크릿 페이지 임시 PIN 안내
                            </p>
                        </td>
                    </tr>

                    <!-- 본문 -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                안녕하세요,
                            </p>
                            <p style="margin: 0 0 30px 0; color: #666666; font-size: 15px; line-height: 1.6;">
                                MindFlow 시크릿 페이지의 임시 PIN 번호를 요청하셨습니다.<br/>
                                아래의 임시 PIN을 사용하여 로그인하신 후, 새로운 PIN을 설정해주세요.
                            </p>

                            <!-- PIN 박스 -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px 0;">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 12px; padding: 30px; text-align: center;">
                                        <p style="margin: 0 0 10px 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 600;">
                                            임시 PIN 번호
                                        </p>
                                        <p style="margin: 0; color: #ffffff; font-size: 48px; font-weight: 700; letter-spacing: 8px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">
                                            ${tempPin}
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- 안내 사항 -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff9e6; border-left: 4px solid #ffc107; border-radius: 8px; margin: 0 0 30px 0;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0 0 12px 0; color: #f57c00; font-size: 14px; font-weight: 600;">
                                            ⚠️ 중요 안내
                                        </p>
                                        <ul style="margin: 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 1.8;">
                                            <li>이 임시 PIN은 <strong style="color: #f57c00;">${expiresDateStr}</strong>까지 유효합니다.</li>
                                            <li>로그인 후 반드시 새로운 PIN을 설정해주세요.</li>
                                            <li>본인이 요청하지 않았다면 이 메일을 무시하세요.</li>
                                            <li>임시 PIN은 누구에게도 공유하지 마세요.</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>

                            <!-- 사용 방법 -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin: 0 0 30px 0;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0 0 12px 0; color: #333333; font-size: 14px; font-weight: 600;">
                                            📝 사용 방법
                                        </p>
                                        <ol style="margin: 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 1.8;">
                                            <li>MindFlow 앱의 시크릿 페이지로 이동</li>
                                            <li>위의 임시 PIN 입력</li>
                                            <li>로그인 후 자동으로 표시되는 PIN 변경 화면에서 새 PIN 설정</li>
                                            <li>완료!</li>
                                        </ol>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.6;">
                                궁금한 점이 있으시면 언제든지 문의해주세요.<br/>
                                감사합니다.
                            </p>
                        </td>
                    </tr>

                    <!-- 푸터 -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0 0 10px 0; color: #999999; font-size: 13px;">
                                이 메일은 MindFlow에서 자동으로 발송되었습니다.
                            </p>
                            <p style="margin: 0; color: #cccccc; font-size: 12px;">
                                © ${new Date().getFullYear()} MindFlow. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};
