// src/components/InquiryList.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Plus, MessageCircle, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { getUserInquiries, getStatusText, getStatusColor } from '../services/inquiryService';
import { showAlert } from '../utils/alertModal';

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
  max-width: 600px;
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

const HeaderButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button`
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

const NewButton = styled.button`
  background: #4a90e2;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    background: #357abd;
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

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #888;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-size: 16px;
  margin-bottom: 8px;
`;

const EmptySubtext = styled.div`
  font-size: 14px;
  color: #666;
`;

const InquiryItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(74, 144, 226, 0.3);
    transform: translateY(-2px);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const InquiryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const UnreadDot = styled.span`
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

const InquiryTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
  flex: 1;
  margin-right: 12px;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  background: ${props => props.$color}22;
  color: ${props => props.$color};
  border: 1px solid ${props => props.$color}44;
`;

const InquiryMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #888;
  margin-top: 8px;
`;

const Category = styled.span`
  color: #4a90e2;
`;

const Date = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const InquiryPreview = styled.div`
  font-size: 14px;
  color: #aaa;
  margin-top: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #888;
  font-size: 14px;
`;

const getStatusIcon = (status) => {
  switch (status) {
    case 'pending':
      return <Clock size={14} />;
    case 'in_progress':
      return <MessageCircle size={14} />;
    case 'resolved':
      return <CheckCircle size={14} />;
    default:
      return <AlertCircle size={14} />;
  }
};

const InquiryList = ({ isOpen, onClose, userId, onSelectInquiry, onNewInquiry }) => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      loadInquiries();
    }
  }, [isOpen, userId]);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      if (!userId) {
        console.error('userId가 없습니다.');
        setLoading(false);
        return;
      }
      console.log('문의 목록 로드 시작:', userId);
      const data = await getUserInquiries(userId);
      console.log('문의 목록 로드 완료:', data);
      setInquiries(data);
    } catch (error) {
      console.error('문의 목록 로드 실패:', error);
      showAlert('문의 목록을 불러오는데 실패했습니다: ' + error.message, '오류');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (timestamp) => {
    // 1. 데이터가 아예 없는 경우 방어
    if (!timestamp) return '날짜 없음';

    try {
      let date;

      // 2. Firestore Timestamp 객체인 경우 (.toDate가 함수인지 확인)
      if (typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      }
      // 3. Firestore 서버 타임스탬프가 아직 반영 안 된 'pending' 상태인 경우
      // ({ seconds: ..., nanoseconds: ... } 형태의 일반 객체)
      else if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
        const timeInMs = timestamp.seconds * 1000;
        date = new Date(timeInMs);
      }
      // 4. 이미 Date 객체인 경우 (getTime 메서드로 확인)
      else if (timestamp && typeof timestamp.getTime === 'function') {
        date = timestamp;
      }
      // 5. 숫자(ms)나 문자열인 경우
      else if (typeof timestamp === 'number' || typeof timestamp === 'string') {
        date = new Date(timestamp);
      }
      else {
        return '날짜 형식 오류';
      }

      // 유효한 날짜인지 확인
      if (!date || typeof date.getTime !== 'function' || isNaN(date.getTime())) {
        return '날짜 오류';
      }

      // 문의 상세 페이지와 동일한 형식으로 표시
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      // 에러를 콘솔에 남기지 않고 조용히 처리
      return '날짜 오류';
    }
  };

  return (
    <Overlay onClick={handleOverlayClick}>
      <Container>
        <Header>
          <Title>
            <MessageCircle size={20} />
            문의 내역
          </Title>
          <HeaderButtons>
            <NewButton onClick={onNewInquiry}>
              <Plus size={16} />
              문의
            </NewButton>
            <IconButton onClick={onClose}>
              <X size={20} />
            </IconButton>
          </HeaderButtons>
        </Header>

        <Content>
          {loading ? (
            <LoadingState>문의 내역을 불러오는 중...</LoadingState>
          ) : inquiries.length === 0 ? (
            <EmptyState>
              <EmptyIcon>📝</EmptyIcon>
              <EmptyText>아직 문의 내역이 없습니다</EmptyText>
              <EmptySubtext>궁금한 점이나 제안하고 싶은 내용을 작성해보세요</EmptySubtext>
            </EmptyState>
          ) : (
            inquiries.map((inquiry) => {
              const statusColor = getStatusColor(inquiry.status);
              const statusIcon = getStatusIcon(inquiry.status);
              const statusText = getStatusText(inquiry.status);

              return (
                <InquiryItem key={inquiry.id} onClick={() => onSelectInquiry(inquiry)}>
                  {inquiry.hasUnreadReplies && <UnreadDot />}
                  <InquiryHeader>
                    <InquiryTitle>{inquiry.title}</InquiryTitle>
                    <StatusBadge $color={statusColor}>
                      {statusIcon}
                      {statusText}
                    </StatusBadge>
                  </InquiryHeader>
                <InquiryMeta>
                  <Category>{inquiry.category}</Category>
                  <Date>
                    <Clock size={12} />
                    {formatDate(inquiry.createdAt)}
                  </Date>
                </InquiryMeta>
                {inquiry.content && (
                  <InquiryPreview>{inquiry.content}</InquiryPreview>
                )}
              </InquiryItem>
              );
            })
          )}
        </Content>
      </Container>
    </Overlay>
  );
};

export default InquiryList;
