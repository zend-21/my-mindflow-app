// src/components/InfoPage.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, MessageCircle, HelpCircle, Info, Code, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import InquiryList from './InquiryList';
import InquiryDetail from './InquiryDetail';
import ConfirmModal from './ConfirmModal';
import { showAlert } from '../utils/alertModal';
import { getUserInquiries } from '../services/inquiryService';
import { checkAdminStatus } from '../services/adminManagementService';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  z-index: 10010;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const Container = styled.div`
  background: linear-gradient(180deg, #2a2d35 0%, #1f2229 100%);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #e0e0e0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
`;

const Section = styled.div`
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #4a90e2;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AccordionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(74, 144, 226, 0.3);
  }
`;

const AccordionTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #4a90e2;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AccordionContent = styled.div`
  max-height: ${props => props.$isOpen ? '1000px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
  margin-bottom: ${props => props.$isOpen ? '20px' : '0'};
`;

const InfoItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.div`
  font-size: 12px;
  color: #888;
  margin-bottom: 6px;
`;

const InfoValue = styled.div`
  font-size: 15px;
  color: #e0e0e0;
  line-height: 1.5;
`;

const InfoBox = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
`;

const InfoRow = styled.div`
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoRowLabel = styled.div`
  font-size: 12px;
  color: #888;
  margin-bottom: 6px;
`;

const InfoRowValue = styled.div`
  font-size: 15px;
  color: #e0e0e0;
  line-height: 1.5;
`;

const LinkButton = styled.button`
  width: 100%;
  background: rgba(74, 144, 226, 0.1);
  border: 1px solid rgba(74, 144, 226, 0.3);
  color: #4a90e2;
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
  margin-bottom: 12px;
  position: relative;

  &:hover {
    background: rgba(74, 144, 226, 0.15);
    border-color: rgba(74, 144, 226, 0.5);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const InquiryNotificationDot = styled.span`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 8px;
  height: 8px;
  background: #ff4444;
  border-radius: 50%;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

const WithdrawalContainer = styled.div`
  margin-top: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Divider = styled.div`
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 15%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0.1) 85%,
    transparent 100%
  );
  margin-bottom: 24px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.2) 50%,
      transparent 100%
    );
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }
`;

const DangerButton = styled.button`
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.3);
  color: #ff4444;
  padding: 14px 32px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background: rgba(255, 68, 68, 0.15);
    border-color: rgba(255, 68, 68, 0.5);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const FAQItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(74, 144, 226, 0.3);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const FAQQuestion = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FAQAnswer = styled.div`
  font-size: 13px;
  color: #aaa;
  line-height: 1.6;
  padding-left: 24px;
  display: ${props => props.$isOpen ? 'block' : 'none'};
`;

const InfoPage = ({ isOpen, onClose, userId, showToast }) => {
  const [openFAQ, setOpenFAQ] = useState(null);
  const [openSections, setOpenSections] = useState({
    programInfo: false,
    developerInfo: false,
    faq: false
  });
  const [showInquiryList, setShowInquiryList] = useState(false);
  const [showInquiryDetail, setShowInquiryDetail] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inquiryListKey, setInquiryListKey] = useState(0);
  const [unreadInquiryCount, setUnreadInquiryCount] = useState(0);
  const [showWithdrawalConfirm, setShowWithdrawalConfirm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // 관리자 상태 확인
  useEffect(() => {
    if (isOpen && userId) {
      checkAdminStatus(userId).then(status => {
        setIsAdmin(status.isAdmin);
      }).catch(error => {
        console.error('관리자 상태 확인 실패:', error);
        setIsAdmin(false);
      });
    }
  }, [isOpen, userId]);

  // 읽지 않은 문의 개수 확인
  useEffect(() => {
    if (isOpen && userId) {
      loadUnreadInquiryCount();
    }
  }, [isOpen, userId, inquiryListKey]);

  const loadUnreadInquiryCount = async () => {
    try {
      const inquiries = await getUserInquiries(userId);
      const unreadCount = inquiries.filter(inquiry => inquiry.hasUnreadReplies).length;
      setUnreadInquiryCount(unreadCount);
    } catch (error) {
      console.error('읽지 않은 문의 개수 조회 실패:', error);
    }
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleOpenInquiry = () => {
    console.log('문의 목록 열기, userId:', userId);
    if (!userId) {
      showAlert('로그인이 필요합니다. 먼저 로그인해주세요.', '알림');
      return;
    }
    setShowInquiryList(true);
  };

  const handleCloseInquiryList = () => {
    setShowInquiryList(false);
  };

  const handleNewInquiry = () => {
    setSelectedInquiry(null);
    setShowInquiryDetail(true);
  };

  const handleSelectInquiry = (inquiry) => {
    setSelectedInquiry(inquiry);
    setShowInquiryDetail(true);
  };

  const handleBackToList = () => {
    setShowInquiryDetail(false);
    setSelectedInquiry(null);
  };

  const handleCloseInquiryDetail = () => {
    setShowInquiryDetail(false);
    setSelectedInquiry(null);
  };

  const handleInquirySubmitSuccess = () => {
    setShowInquiryDetail(false);
    setSelectedInquiry(null);
    // InquiryList를 강제로 새로고침하기 위해 key 변경
    setInquiryListKey(prev => prev + 1);
  };

  // 회원 탈퇴 처리
  const handleWithdrawal = async () => {
    if (!userId) return;

    try {
      const { deleteUser } = await import('../services/adminUserManagementService');
      await deleteUser(userId);

      showToast?.('회원 탈퇴가 완료되었습니다. 그동안 감사했습니다.');

      // 로그아웃 처리
      setTimeout(async () => {
        try {
          const { getAuth, signOut } = await import('firebase/auth');
          const auth = getAuth();
          await signOut(auth);
        } catch (logoutError) {
          console.error('로그아웃 실패:', logoutError);
        }

        // 페이지 새로고침으로 완전히 초기화
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('회원 탈퇴 실패:', error);
      showToast?.('회원 탈퇴 처리 중 오류가 발생했습니다.');
    }
  };

  // FAQ 데이터
  const faqs = [
    {
      question: '셰어노트는 무료인가요?',
      answer: '현재 테스트 기간 동안 무료로 제공되고 있습니다. 향후 광고가 추가될 수 있으며, 일부 고급 기능은 유료로 전환될 예정입니다.'
    },
    {
      question: '데이터는 어디에 저장되나요?',
      answer: '데이터는 Google Firestore에 안전하게 저장됩니다. 또한 휴대폰 로컬 저장소에도 백업되어 오프라인에서도 사용 가능합니다.'
    },
    {
      question: '여러 기기에서 동기화가 가능한가요?',
      answer: '네, 같은 계정으로 로그인하면 모든 기기에서 실시간으로 동기화됩니다. 메모, 일정, 알람 등 모든 데이터가 자동으로 동기화됩니다.'
    },
    {
      question: '데이터 백업은 어떻게 하나요?',
      answer: '사이드 메뉴에서 "휴대폰 백업" 또는 "구글 드라이브 백업"을 선택하여 언제든지 백업할 수 있습니다.'
    }
  ];

  return (
    <Overlay onClick={handleOverlayClick}>
      <Container>
        <Header>
          <Title>
            <Info size={20} />
            정보
          </Title>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </Header>

        <Content>
          {/* 프로그램 정보 */}
          <Section>
            <AccordionHeader onClick={() => toggleSection('programInfo')}>
              <AccordionTitle>
                <Info size={16} />
                프로그램 정보
              </AccordionTitle>
              {openSections.programInfo ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </AccordionHeader>
            <AccordionContent $isOpen={openSections.programInfo}>
              <InfoBox>
                <InfoRow>
                  <InfoRowLabel>앱 이름</InfoRowLabel>
                  <InfoRowValue>셰어노트 (ShareNote)</InfoRowValue>
                </InfoRow>
                <InfoRow>
                  <InfoRowLabel>버전</InfoRowLabel>
                  <InfoRowValue>1.0.0</InfoRowValue>
                </InfoRow>
                <InfoRow>
                  <InfoRowLabel>설명</InfoRowLabel>
                  <InfoRowValue>
                    일정 관리, 메모 작성, 친구들과의 협업을 한 곳에서!
                    셰어노트는 당신의 일상을 더욱 효율적으로 만들어주는 올인원 생산성 앱입니다.
                  </InfoRowValue>
                </InfoRow>
              </InfoBox>
            </AccordionContent>
          </Section>

          {/* 개발자 정보 */}
          <Section>
            <AccordionHeader onClick={() => toggleSection('developerInfo')}>
              <AccordionTitle>
                <Code size={16} />
                개발자 정보
              </AccordionTitle>
              {openSections.developerInfo ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </AccordionHeader>
            <AccordionContent $isOpen={openSections.developerInfo}>
              <InfoBox>
                <InfoRow>
                  <InfoRowLabel>개발</InfoRowLabel>
                  <InfoRowValue>ShareNote Development Team</InfoRowValue>
                </InfoRow>
                <InfoRow>
                  <InfoRowLabel>연락처</InfoRowLabel>
                  <InfoRowValue>support@sharenote.app</InfoRowValue>
                </InfoRow>
              </InfoBox>
            </AccordionContent>
          </Section>

          {/* FAQ */}
          <Section>
            <AccordionHeader onClick={() => toggleSection('faq')}>
              <AccordionTitle>
                <HelpCircle size={16} />
                자주 묻는 질문 (FAQ)
              </AccordionTitle>
              {openSections.faq ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </AccordionHeader>
            <AccordionContent $isOpen={openSections.faq}>
              {faqs.map((faq, index) => (
                <FAQItem key={index} onClick={() => toggleFAQ(index)}>
                  <FAQQuestion>
                    Q{index + 1}. {faq.question}
                  </FAQQuestion>
                  <FAQAnswer $isOpen={openFAQ === index}>
                    {faq.answer}
                  </FAQAnswer>
                </FAQItem>
              ))}
            </AccordionContent>
          </Section>

          {/* Q&A 및 피드백 */}
          <Section>
            <SectionTitle>
              <MessageCircle size={16} />
              문의 및 피드백
            </SectionTitle>
            <LinkButton onClick={handleOpenInquiry}>
              {unreadInquiryCount > 0 && <InquiryNotificationDot />}
              <MessageCircle size={18} />
              문의 및 제안하기
            </LinkButton>

            {/* 회원 탈퇴 버튼 - 관리자가 아닐 때만 표시 */}
            {!isAdmin && (
              <WithdrawalContainer>
                <Divider />
                <DangerButton onClick={() => setShowWithdrawalConfirm(true)}>
                  <AlertTriangle size={18} />
                  회원 탈퇴
                </DangerButton>
              </WithdrawalContainer>
            )}
          </Section>
        </Content>
      </Container>

      {/* 문의 목록 모달 */}
      <InquiryList
        key={inquiryListKey}
        isOpen={showInquiryList}
        onClose={handleCloseInquiryList}
        userId={userId}
        onSelectInquiry={handleSelectInquiry}
        onNewInquiry={handleNewInquiry}
      />

      {/* 문의 작성/상세 모달 */}
      <InquiryDetail
        isOpen={showInquiryDetail}
        onClose={handleCloseInquiryDetail}
        userId={userId}
        inquiry={selectedInquiry}
        onBack={showInquiryList ? handleBackToList : null}
        onSubmitSuccess={handleInquirySubmitSuccess}
      />

      {/* 회원 탈퇴 확인 모달 */}
      {showWithdrawalConfirm && (
        <ConfirmModal
          isOpen={showWithdrawalConfirm}
          onClose={() => setShowWithdrawalConfirm(false)}
          onCancel={() => setShowWithdrawalConfirm(false)}
          onConfirm={() => {
            setShowWithdrawalConfirm(false);
            handleWithdrawal();
          }}
          title="⚠️ 회원 탈퇴"
          message={`정말로 회원 탈퇴를 진행하시겠습니까?\n\n다음 데이터가 완전히 삭제됩니다:\n• 모든 메모 및 일정\n• 친구 관계 및 대화 내용\n• 프로필 정보 및 설정\n• 워크스페이스 데이터\n\n💡 문의 내역은 법적 보관 목적으로 유지됩니다.\n\n✅ 언제든 다시 가입하실 수 있습니다.`}
          confirmText="탈퇴하기"
          cancelText="취소"
          showCancel={true}
        />
      )}
    </Overlay>
  );
};

export default InfoPage;
