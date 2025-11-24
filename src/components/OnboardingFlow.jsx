// 앱 설치 시 이용약관 동의 프로세스 (현재 비활성화 - 필요 시 활성화)
// 사용방법: App.jsx에서 ENABLE_ONBOARDING을 true로 변경
import { useState } from 'react';
import styled from 'styled-components';
import { Check, ChevronRight, Shield, FileText, Info } from 'lucide-react';

const ENABLE_ONBOARDING = false; // true로 변경하면 온보딩 활성화

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 10010;
`;

const ContentBox = styled.div`
  width: 100%;
  max-width: 600px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

const LogoIcon = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a90e2, #357abd);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  box-shadow: 0 8px 24px rgba(74, 144, 226, 0.4);
`;

const AppName = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
`;

const Welcome = styled.p`
  font-size: 16px;
  color: #888;
  text-align: center;
  margin: 32px 0;
  line-height: 1.6;
`;

const AgreementList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
`;

const AgreementItem = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(74, 144, 226, 0.3);
  }
`;

const AgreementHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Checkbox = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 2px solid ${props => props.$checked ? '#4a90e2' : 'rgba(255, 255, 255, 0.3)'};
  background: ${props => props.$checked ? 'linear-gradient(135deg, #4a90e2, #357abd)' : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
`;

const AgreementContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const AgreementTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`;

const RequiredBadge = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${props => props.$required ? '#ff6b6b' : '#4a90e2'};
  background: ${props => props.$required ? 'rgba(255, 107, 107, 0.2)' : 'rgba(74, 144, 226, 0.2)'};
  border: 1px solid ${props => props.$required ? 'rgba(255, 107, 107, 0.4)' : 'rgba(74, 144, 226, 0.4)'};
  padding: 2px 8px;
  border-radius: 6px;
`;

const AgreementDescription = styled.div`
  font-size: 13px;
  color: #888;
`;

const ViewButton = styled.button`
  background: transparent;
  border: none;
  color: #4a90e2;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 6px;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background: rgba(74, 144, 226, 0.1);
  }
`;

const AllAgreeSection = styled.div`
  margin-bottom: 24px;
  padding: 20px;
  background: rgba(74, 144, 226, 0.1);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(74, 144, 226, 0.15);
  }
`;

const AllAgreeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AllAgreeText = styled.div`
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 32px;
`;

const Button = styled.button`
  flex: 1;
  padding: 16px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background: rgba(255, 255, 255, 0.05);
  color: #888;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
  }
`;

const ContinueButton = styled(Button)`
  background: linear-gradient(135deg, #4a90e2, #357abd);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(74, 144, 226, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const agreements = [
  {
    id: 'terms',
    title: '서비스 이용약관',
    description: 'MindFlow 서비스 이용에 관한 기본 약관',
    required: true,
    icon: FileText
  },
  {
    id: 'privacy',
    title: '개인정보 처리방침',
    description: '개인정보 수집, 이용, 보관 및 삭제 정책',
    required: true,
    icon: Shield
  },
  {
    id: 'security',
    title: '보안 정책',
    description: '엔드투엔드 암호화 및 보안 조치 안내',
    required: false,
    icon: Info
  },
  {
    id: 'marketing',
    title: '마케팅 정보 수신 동의',
    description: '서비스 및 이벤트 안내 수신 (선택)',
    required: false,
    icon: Info
  }
];

const OnboardingFlow = ({ onComplete, onCancel }) => {
  const [agreedItems, setAgreedItems] = useState({});

  const handleToggle = (id) => {
    setAgreedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleToggleAll = () => {
    const allChecked = agreements.every(item => agreedItems[item.id]);

    if (allChecked) {
      // 전체 해제
      setAgreedItems({});
    } else {
      // 전체 선택
      const newState = {};
      agreements.forEach(item => {
        newState[item.id] = true;
      });
      setAgreedItems(newState);
    }
  };

  const handleViewDocument = (id) => {
    // 문서 보기 (SecurityDocViewer 등을 열 수 있음)
    console.log('문서 보기:', id);
    // TODO: 문서 뷰어 열기
  };

  const requiredAgreed = agreements
    .filter(item => item.required)
    .every(item => agreedItems[item.id]);

  const allAgreed = agreements.every(item => agreedItems[item.id]);

  const handleContinue = () => {
    if (requiredAgreed) {
      // 동의 정보 저장
      const agreedData = {
        timestamp: new Date().toISOString(),
        agreements: agreedItems
      };
      localStorage.setItem('onboarding_completed', JSON.stringify(agreedData));
      onComplete?.(agreedItems);
    }
  };

  return (
    <Container>
      <ContentBox>
        <Logo>
          <LogoIcon>🌊</LogoIcon>
          <AppName>MindFlow</AppName>
        </Logo>

        <Welcome>
          MindFlow를 시작하기 전에<br />
          아래 약관을 확인하고 동의해 주세요
        </Welcome>

        {/* 전체 동의 */}
        <AllAgreeSection onClick={handleToggleAll}>
          <AllAgreeHeader>
            <Checkbox $checked={allAgreed}>
              {allAgreed && <Check size={16} color="#ffffff" />}
            </Checkbox>
            <AllAgreeText>전체 동의</AllAgreeText>
          </AllAgreeHeader>
        </AllAgreeSection>

        {/* 개별 동의 */}
        <AgreementList>
          {agreements.map(item => {
            const Icon = item.icon;
            return (
              <AgreementItem key={item.id}>
                <AgreementHeader>
                  <div onClick={() => handleToggle(item.id)}>
                    <Checkbox $checked={agreedItems[item.id]}>
                      {agreedItems[item.id] && <Check size={16} color="#ffffff" />}
                    </Checkbox>
                  </div>
                  <AgreementContent onClick={() => handleToggle(item.id)}>
                    <AgreementTitle>
                      <Icon size={16} />
                      {item.title}
                      <RequiredBadge $required={item.required}>
                        {item.required ? '필수' : '선택'}
                      </RequiredBadge>
                    </AgreementTitle>
                    <AgreementDescription>
                      {item.description}
                    </AgreementDescription>
                  </AgreementContent>
                  <ViewButton onClick={(e) => {
                    e.stopPropagation();
                    handleViewDocument(item.id);
                  }}>
                    보기
                    <ChevronRight size={16} />
                  </ViewButton>
                </AgreementHeader>
              </AgreementItem>
            );
          })}
        </AgreementList>

        {/* 버튼 */}
        <ButtonGroup>
          <CancelButton onClick={onCancel}>
            취소
          </CancelButton>
          <ContinueButton
            onClick={handleContinue}
            disabled={!requiredAgreed}
          >
            {requiredAgreed ? '시작하기' : '필수 약관에 동의해주세요'}
            {requiredAgreed && <ChevronRight size={18} />}
          </ContinueButton>
        </ButtonGroup>
      </ContentBox>
    </Container>
  );
};

// 온보딩 완료 여부 확인 함수
export const checkOnboardingCompleted = () => {
  // 온보딩이 비활성화되어 있으면 항상 완료된 것으로 처리
  if (!ENABLE_ONBOARDING) return true;

  const completed = localStorage.getItem('onboarding_completed');
  return !!completed;
};

// 온보딩 재설정 함수 (테스트용)
export const resetOnboarding = () => {
  localStorage.removeItem('onboarding_completed');
};

export { ENABLE_ONBOARDING };
export default OnboardingFlow;
