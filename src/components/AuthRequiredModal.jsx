// 🔐 인증 필요 알림 모달
import React from 'react';

/**
 * 특정 기능 사용 시 휴대폰 인증을 요구하는 모달
 *
 * @param {boolean} isOpen - 모달 열림 여부
 * @param {function} onClose - 모달 닫기 핸들러
 * @param {function} onVerify - 인증하기 버튼 클릭 핸들러
 * @param {string} featureName - 사용하려는 기능 이름 (예: "채팅", "메시지 전송", "친구 추가")
 * @param {string} reason - 인증이 필요한 이유 (선택)
 */
const AuthRequiredModal = ({
    isOpen,
    onClose,
    onVerify,
    featureName = "이 기능",
    reason = "본인 확인을 위해 휴대폰 인증이 필요합니다"
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content auth-required-modal" onClick={(e) => e.stopPropagation()}>
                {/* 헤더 */}
                <div className="modal-header">
                    <h2>🔐 휴대폰 인증 필요</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                {/* 본문 */}
                <div className="modal-body">
                    <div className="auth-required-content">
                        <div className="feature-icon">
                            🔒
                        </div>
                        <h3>{featureName}</h3>
                        <p className="auth-reason">{reason}</p>

                        <div className="auth-benefits">
                            <h4>인증하면 이용할 수 있는 기능:</h4>
                            <ul>
                                <li>💬 실시간 채팅 및 메시지 전송</li>
                                <li>👥 친구 추가 및 관리</li>
                                <li>📝 공유 노트 생성 및 협업</li>
                                <li>🏠 워크스페이스 공유</li>
                                <li>🔔 알림 및 실시간 업데이트</li>
                            </ul>
                        </div>

                        <div className="auth-security-note">
                            <small>
                                🔒 휴대폰 인증은 1회만 진행하면 됩니다.<br/>
                                보안과 개인정보 보호를 위해 필요합니다.
                            </small>
                        </div>
                    </div>
                </div>

                {/* 푸터 */}
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>
                        나중에 하기
                    </button>
                    <button className="btn-primary" onClick={onVerify}>
                        지금 인증하기
                    </button>
                </div>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 100000; /* Much higher than footer (9999) and ad banner (10000) */
                    padding: 20px;
                    overflow-y: auto;
                }

                .modal-content {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .modal-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px 24px;
                    border-bottom: 1px solid #eee;
                }

                .modal-header h2 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 600;
                    color: #333;
                }

                .close-button {
                    background: none;
                    border: none;
                    font-size: 28px;
                    color: #999;
                    cursor: pointer;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s;
                }

                .close-button:hover {
                    background: #f5f5f5;
                    color: #333;
                }

                .modal-body {
                    padding: 24px;
                }

                .auth-required-modal {
                    max-width: 480px;
                }

                .auth-required-content {
                    text-align: center;
                    padding: 20px 0;
                }

                .feature-icon {
                    font-size: 64px;
                    margin-bottom: 16px;
                }

                .auth-required-content h3 {
                    font-size: 20px;
                    font-weight: 600;
                    margin-bottom: 12px;
                    color: #333;
                }

                .auth-reason {
                    color: #666;
                    font-size: 15px;
                    margin-bottom: 24px;
                }

                .auth-benefits {
                    background: #f8f9fa;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 20px;
                    text-align: left;
                }

                .auth-benefits h4 {
                    font-size: 14px;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 12px;
                }

                .auth-benefits ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .auth-benefits li {
                    padding: 8px 0;
                    font-size: 14px;
                    color: #555;
                    display: flex;
                    align-items: center;
                }

                .auth-security-note {
                    background: #e3f2fd;
                    border-left: 3px solid #2196F3;
                    padding: 12px;
                    border-radius: 6px;
                    text-align: left;
                }

                .auth-security-note small {
                    color: #1976D2;
                    line-height: 1.6;
                }

                .modal-footer {
                    display: flex;
                    gap: 12px;
                    padding: 20px 24px;
                    border-top: 1px solid #eee;
                }

                .btn-cancel {
                    flex: 1;
                    padding: 12px 20px;
                    background: #f5f5f5;
                    color: #666;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-cancel:hover {
                    background: #eeeeee;
                }

                .btn-primary {
                    flex: 1;
                    padding: 12px 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-primary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                }
            `}</style>
        </div>
    );
};

export default AuthRequiredModal;
