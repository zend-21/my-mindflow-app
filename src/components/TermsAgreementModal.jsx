// 약관 동의 모달 컴포넌트
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Shield, FileText, ChevronDown, ChevronUp, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10005;
  padding: 20px;
  backdrop-filter: blur(8px);
`;

const Modal = styled.div`
  background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
`;

const Header = styled.div`
  padding: 24px 24px 20px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const IconWrapper = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a90e2, #357abd);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
`;

const Title = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #888;
  margin: 0;
  line-height: 1.5;
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
`;

const TermsSection = styled.div`
  margin-bottom: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.02);
`;

const TermsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }
`;

const TermsTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TermsIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${props => props.$color || 'rgba(74, 144, 226, 0.2)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$iconColor || '#4a90e2'};
`;

const TermsTitleText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TermsName = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
`;

const TermsRequired = styled.span`
  font-size: 12px;
  color: #ff6b6b;
  font-weight: 500;
`;

const ExpandIcon = styled.div`
  color: #666;
  transition: transform 0.2s;
`;

const TermsContent = styled.div`
  max-height: ${props => props.$expanded ? '300px' : '0'};
  overflow-y: ${props => props.$expanded ? 'auto' : 'hidden'};
  transition: max-height 0.3s ease;
  border-top: ${props => props.$expanded ? '1px solid rgba(255, 255, 255, 0.08)' : 'none'};

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
`;

const TermsBody = styled.div`
  padding: 16px;
  font-size: 13px;
  color: #999;
  line-height: 1.7;

  h1, h2, h3 {
    color: #ddd;
    margin: 16px 0 8px;
    font-size: 14px;
  }

  h1:first-child, h2:first-child, h3:first-child {
    margin-top: 0;
  }

  p {
    margin: 8px 0;
  }

  ul, ol {
    padding-left: 20px;
    margin: 8px 0;
  }

  li {
    margin: 4px 0;
  }

  strong {
    color: #bbb;
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 8px;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }
`;

const Checkbox = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 2px solid ${props => props.$checked ? '#4a90e2' : 'rgba(255, 255, 255, 0.2)'};
  background: ${props => props.$checked ? '#4a90e2' : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
`;

const CheckboxLabel = styled.span`
  font-size: 14px;
  color: ${props => props.$checked ? '#ffffff' : '#999'};
  font-weight: ${props => props.$checked ? '600' : '400'};
  transition: all 0.2s;
`;

const AllAgreeContainer = styled(CheckboxContainer)`
  background: rgba(74, 144, 226, 0.1);
  border: 1px solid rgba(74, 144, 226, 0.3);
  margin-bottom: 16px;
  margin-top: 0;

  &:hover {
    background: rgba(74, 144, 226, 0.15);
  }
`;

const Footer = styled.div`
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AgreeButton = styled.button`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  border: none;

  background: ${props => props.disabled
    ? 'rgba(255, 255, 255, 0.1)'
    : 'linear-gradient(135deg, #4a90e2, #357abd)'};
  color: ${props => props.disabled ? '#666' : '#ffffff'};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
  }
`;

const CancelButton = styled.button`
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #888;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #aaa;
  }
`;

const VersionInfo = styled.div`
  text-align: center;
  font-size: 11px;
  color: #555;
  margin-top: 4px;
`;

// 약관 버전 정보 (변경 시 버전 업데이트)
export const TERMS_VERSION = '1.0.0';
export const PRIVACY_VERSION = '1.0.0';

const TermsAgreementModal = ({
  onAgree,
  onCancel,
  isReConsent = false,  // 재동의 요청 여부
  changedTerms = []     // 변경된 약관 목록 ['terms', 'privacy']
}) => {
  const [termsExpanded, setTermsExpanded] = useState(false);
  const [privacyExpanded, setPrivacyExpanded] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [termsContent, setTermsContent] = useState('');
  const [privacyContent, setPrivacyContent] = useState('');
  const [loading, setLoading] = useState(true);

  // 약관을 한 번 이상 펼쳐봤는지 추적
  const [termsViewed, setTermsViewed] = useState(false);
  const [privacyViewed, setPrivacyViewed] = useState(false);

  // 약관 문서 로드
  useEffect(() => {
    const loadDocuments = async () => {
      setLoading(true);
      try {
        const [termsRes, privacyRes] = await Promise.all([
          fetch('/TERMS_OF_SERVICE.md'),
          fetch('/PRIVACY_POLICY.md')
        ]);

        const [termsText, privacyText] = await Promise.all([
          termsRes.text(),
          privacyRes.text()
        ]);

        setTermsContent(termsText);
        setPrivacyContent(privacyText);
      } catch (error) {
        console.error('약관 문서 로드 오류:', error);
        setTermsContent('# 서비스 이용약관\n\n약관을 불러오는 중 오류가 발생했습니다.');
        setPrivacyContent('# 개인정보 처리방침\n\n약관을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, []);

  const allAgreed = termsAgreed && privacyAgreed;
  const allViewed = termsViewed && privacyViewed;

  // 펼치기/접기 핸들러 (펼칠 때 viewed 상태 업데이트)
  const handleTermsToggle = () => {
    if (!termsExpanded) {
      setTermsViewed(true);
    }
    setTermsExpanded(!termsExpanded);
  };

  const handlePrivacyToggle = () => {
    if (!privacyExpanded) {
      setPrivacyViewed(true);
    }
    setPrivacyExpanded(!privacyExpanded);
  };

  const handleAllAgree = () => {
    // 모든 약관을 확인하지 않았으면 무시
    if (!allViewed) return;

    const newValue = !allAgreed;
    setTermsAgreed(newValue);
    setPrivacyAgreed(newValue);
  };

  const handleTermsAgreeToggle = () => {
    // 약관을 펼쳐보지 않았으면 무시
    if (!termsViewed) return;
    setTermsAgreed(!termsAgreed);
  };

  const handlePrivacyAgreeToggle = () => {
    // 약관을 펼쳐보지 않았으면 무시
    if (!privacyViewed) return;
    setPrivacyAgreed(!privacyAgreed);
  };

  const handleAgree = () => {
    if (allAgreed) {
      onAgree({
        termsVersion: TERMS_VERSION,
        privacyVersion: PRIVACY_VERSION,
        agreedAt: new Date().toISOString()
      });
    }
  };

  // 재동의 시 변경된 약관만 표시할지 결정
  const showTerms = !isReConsent || changedTerms.includes('terms');
  const showPrivacy = !isReConsent || changedTerms.includes('privacy');

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && !isReConsent && onCancel?.()}>
      <Modal>
        <Header>
          <IconWrapper>
            <Shield size={28} color="#ffffff" />
          </IconWrapper>
          <Title>
            {isReConsent ? '약관 변경 안내' : '서비스 이용 동의'}
          </Title>
          <Subtitle>
            {isReConsent
              ? '약관이 변경되었습니다. 계속 이용하시려면 변경된 약관에 동의해 주세요.'
              : '셰어노트를 이용하시려면 아래 약관에 동의해 주세요.'}
          </Subtitle>
        </Header>

        <Content>
          {/* 전체 동의 */}
          <AllAgreeContainer
            onClick={handleAllAgree}
            style={{
              opacity: allViewed ? 1 : 0.5,
              cursor: allViewed ? 'pointer' : 'not-allowed'
            }}
          >
            <Checkbox $checked={allAgreed}>
              {allAgreed && <Check size={16} color="#ffffff" />}
            </Checkbox>
            <CheckboxLabel $checked={allAgreed}>
              {allViewed
                ? '전체 약관에 동의합니다'
                : '약관 내용을 먼저 확인해 주세요'}
            </CheckboxLabel>
          </AllAgreeContainer>

          {/* 서비스 이용약관 */}
          {showTerms && (
            <TermsSection>
              <TermsHeader onClick={handleTermsToggle}>
                <TermsTitle>
                  <TermsIcon $color="rgba(74, 144, 226, 0.2)" $iconColor="#4a90e2">
                    <FileText size={18} />
                  </TermsIcon>
                  <TermsTitleText>
                    <TermsName>서비스 이용약관</TermsName>
                    <TermsRequired>
                      {termsViewed ? '(필수) ✓ 확인됨' : '(필수) - 펼쳐서 확인해 주세요'}
                    </TermsRequired>
                  </TermsTitleText>
                </TermsTitle>
                <ExpandIcon>
                  {termsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </ExpandIcon>
              </TermsHeader>
              <TermsContent $expanded={termsExpanded}>
                <TermsBody>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      로딩 중...
                    </div>
                  ) : (
                    <ReactMarkdown>{termsContent}</ReactMarkdown>
                  )}
                </TermsBody>
              </TermsContent>
              <CheckboxContainer
                onClick={handleTermsAgreeToggle}
                style={{
                  opacity: termsViewed ? 1 : 0.5,
                  cursor: termsViewed ? 'pointer' : 'not-allowed'
                }}
              >
                <Checkbox $checked={termsAgreed}>
                  {termsAgreed && <Check size={16} color="#ffffff" />}
                </Checkbox>
                <CheckboxLabel $checked={termsAgreed}>
                  {termsViewed
                    ? '서비스 이용약관에 동의합니다'
                    : '약관을 먼저 펼쳐서 확인해 주세요'}
                </CheckboxLabel>
              </CheckboxContainer>
            </TermsSection>
          )}

          {/* 개인정보 처리방침 */}
          {showPrivacy && (
            <TermsSection>
              <TermsHeader onClick={handlePrivacyToggle}>
                <TermsTitle>
                  <TermsIcon $color="rgba(46, 213, 115, 0.2)" $iconColor="#2ed573">
                    <Shield size={18} />
                  </TermsIcon>
                  <TermsTitleText>
                    <TermsName>개인정보 처리방침</TermsName>
                    <TermsRequired>
                      {privacyViewed ? '(필수) ✓ 확인됨' : '(필수) - 펼쳐서 확인해 주세요'}
                    </TermsRequired>
                  </TermsTitleText>
                </TermsTitle>
                <ExpandIcon>
                  {privacyExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </ExpandIcon>
              </TermsHeader>
              <TermsContent $expanded={privacyExpanded}>
                <TermsBody>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      로딩 중...
                    </div>
                  ) : (
                    <ReactMarkdown>{privacyContent}</ReactMarkdown>
                  )}
                </TermsBody>
              </TermsContent>
              <CheckboxContainer
                onClick={handlePrivacyAgreeToggle}
                style={{
                  opacity: privacyViewed ? 1 : 0.5,
                  cursor: privacyViewed ? 'pointer' : 'not-allowed'
                }}
              >
                <Checkbox $checked={privacyAgreed}>
                  {privacyAgreed && <Check size={16} color="#ffffff" />}
                </Checkbox>
                <CheckboxLabel $checked={privacyAgreed}>
                  {privacyViewed
                    ? '개인정보 처리방침에 동의합니다'
                    : '약관을 먼저 펼쳐서 확인해 주세요'}
                </CheckboxLabel>
              </CheckboxContainer>
            </TermsSection>
          )}
        </Content>

        <Footer>
          <AgreeButton
            onClick={handleAgree}
            disabled={!allAgreed}
          >
            {allAgreed ? '동의하고 계속하기' : '모든 약관에 동의해 주세요'}
          </AgreeButton>
          {!isReConsent && onCancel && (
            <CancelButton onClick={onCancel}>
              취소
            </CancelButton>
          )}
          <VersionInfo>
            이용약관 v{TERMS_VERSION} · 개인정보처리방침 v{PRIVACY_VERSION}
          </VersionInfo>
        </Footer>
      </Modal>
    </Overlay>
  );
};

export default TermsAgreementModal;
