// src/components/AdminInquiryPanel.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Bell, MessageCircle, Clock, CheckCircle, AlertCircle, User, Mail, Search, Filter } from 'lucide-react';
import {
  getAllInquiries,
  subscribeToAllInquiries,
  getAdminNotifications,
  markNotificationAsRead,
  subscribeToUnreadNotifications
} from '../services/adminInquiryService';
import { getStatusText, getStatusColor } from '../services/inquiryService';
import { showAlert } from '../utils/alertModal';
import InquiryDetail from './InquiryDetail';

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
  max-width: 900px;
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

const AdminBadge = styled.span`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const NotificationButton = styled.button`
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
  position: relative;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: 4px;
  right: 4px;
  background: #e74c3c;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
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

const FilterBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
`;

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
`;

const SearchInput = styled.input`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 10px 16px 10px 40px;
  color: #e0e0e0;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;

  &:focus {
    border-color: #4a90e2;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
  }

  &::placeholder {
    color: #666;
  }
`;

const SearchIconWrapper = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ClearButton = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
`;

const FilterRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const FilterLabel = styled.span`
  color: #888;
  font-size: 14px;
  white-space: nowrap;
`;

const FilterSelect = styled.select`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 10px 16px;
  color: #e0e0e0;
  font-size: 14px;
  outline: none;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    border-color: #4a90e2;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
  }

  &:hover {
    border-color: rgba(255, 255, 255, 0.2);
  }

  option {
    background: #2a2d35;
    color: #e0e0e0;
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

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.$color}22;
  color: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #e0e0e0;
`;

const InquiryItem = styled.div`
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
  flex-wrap: wrap;
`;

const UserInfo = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  color: #4a90e2;
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

const AdminInquiryPanel = ({ isOpen, onClose, userId }) => {
  const [inquiries, setInquiries] = useState([]);
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen && userId) {
      loadInquiries();

      // 실시간 구독
      const unsubscribe = subscribeToAllInquiries((data) => {
        setInquiries(data);
        setLoading(false);
      });

      // 읽지 않은 알림 개수 구독
      const unsubscribeNotifications = subscribeToUnreadNotifications(userId, (count) => {
        setUnreadCount(count);
      });

      return () => {
        unsubscribe();
        unsubscribeNotifications();
      };
    }
  }, [isOpen, userId]);

  useEffect(() => {
    filterInquiries();
  }, [inquiries, searchTerm, statusFilter]);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      const data = await getAllInquiries();
      setInquiries(data);
    } catch (error) {
      console.error('문의 목록 로드 실패:', error);
      showAlert('문의 목록을 불러오는데 실패했습니다: ' + error.message, '오류');
    } finally {
      setLoading(false);
    }
  };

  const filterInquiries = () => {
    let filtered = [...inquiries];

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(inquiry =>
        inquiry.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.userDisplayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inquiry => inquiry.status === statusFilter);
    }

    setFilteredInquiries(filtered);
  };

  const handleInquiryClick = (inquiry) => {
    setSelectedInquiry({
      ...inquiry,
      id: inquiry.id,
    });
    setShowDetail(true);
  };

  const formatDate = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const getStats = () => {
    const total = inquiries.length;
    const pending = inquiries.filter(i => i.status === 'pending').length;
    const inProgress = inquiries.filter(i => i.status === 'in_progress').length;
    const resolved = inquiries.filter(i => i.status === 'resolved').length;

    return { total, pending, inProgress, resolved };
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const stats = getStats();

  return (
    <>
      <Overlay onClick={handleOverlayClick}>
        <Container>
          <Header>
            <Title>
              <MessageCircle size={20} />
              문의 관리
              <AdminBadge>ADMIN</AdminBadge>
            </Title>
            <HeaderButtons>
              <NotificationButton>
                <Bell size={20} />
                {unreadCount > 0 && <NotificationBadge>{unreadCount}</NotificationBadge>}
              </NotificationButton>
              <IconButton onClick={onClose}>
                <X size={20} />
              </IconButton>
            </HeaderButtons>
          </Header>

          <FilterBar>
            <SearchContainer>
              <SearchIconWrapper>
                <Search size={16} />
              </SearchIconWrapper>
              <SearchInput
                type="text"
                placeholder="제목, 내용, 사용자로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <ClearButton onClick={() => setSearchTerm('')}>
                  <X size={16} />
                </ClearButton>
              )}
            </SearchContainer>
            <FilterRow>
              <FilterLabel>상태:</FilterLabel>
              <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">전체 상태</option>
                <option value="pending">답변 대기</option>
                <option value="in_progress">답변 완료</option>
                <option value="resolved">해결 완료</option>
              </FilterSelect>
            </FilterRow>
          </FilterBar>

          <Content>
            <Stats>
              <StatCard>
                <StatIcon $color="#4a90e2">
                  <MessageCircle size={24} />
                </StatIcon>
                <StatInfo>
                  <StatLabel>전체 문의</StatLabel>
                  <StatValue>{stats.total}</StatValue>
                </StatInfo>
              </StatCard>
              <StatCard>
                <StatIcon $color="#f39c12">
                  <Clock size={24} />
                </StatIcon>
                <StatInfo>
                  <StatLabel>답변 대기</StatLabel>
                  <StatValue>{stats.pending}</StatValue>
                </StatInfo>
              </StatCard>
              <StatCard>
                <StatIcon $color="#3498db">
                  <MessageCircle size={24} />
                </StatIcon>
                <StatInfo>
                  <StatLabel>답변 완료</StatLabel>
                  <StatValue>{stats.inProgress}</StatValue>
                </StatInfo>
              </StatCard>
              <StatCard>
                <StatIcon $color="#27ae60">
                  <CheckCircle size={24} />
                </StatIcon>
                <StatInfo>
                  <StatLabel>해결 완료</StatLabel>
                  <StatValue>{stats.resolved}</StatValue>
                </StatInfo>
              </StatCard>
            </Stats>

            {loading ? (
              <LoadingState>문의 내역을 불러오는 중...</LoadingState>
            ) : filteredInquiries.length === 0 ? (
              <EmptyState>
                <EmptyIcon>📝</EmptyIcon>
                <EmptyText>
                  {searchTerm || statusFilter !== 'all'
                    ? '검색 결과가 없습니다'
                    : '아직 문의 내역이 없습니다'}
                </EmptyText>
              </EmptyState>
            ) : (
              filteredInquiries.map((inquiry) => (
                <InquiryItem key={`${inquiry.userId}-${inquiry.id}`} onClick={() => handleInquiryClick(inquiry)}>
                  <InquiryHeader>
                    <InquiryTitle>{inquiry.title}</InquiryTitle>
                    <StatusBadge $color={getStatusColor(inquiry.status)}>
                      {getStatusIcon(inquiry.status)}
                      {getStatusText(inquiry.status)}
                    </StatusBadge>
                  </InquiryHeader>
                  <InquiryMeta>
                    <UserInfo>
                      <User size={12} />
                      {inquiry.userDisplayName}
                    </UserInfo>
                    {inquiry.userEmail && (
                      <UserInfo>
                        <Mail size={12} />
                        {inquiry.userEmail}
                      </UserInfo>
                    )}
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
              ))
            )}
          </Content>
        </Container>
      </Overlay>

      {/* 문의 상세 모달 */}
      {showDetail && selectedInquiry && (
        <InquiryDetail
          isOpen={showDetail}
          onClose={() => {
            setShowDetail(false);
            setSelectedInquiry(null);
          }}
          userId={selectedInquiry.userId}
          inquiry={selectedInquiry}
          onBack={null}
          onSubmitSuccess={() => {
            setShowDetail(false);
            setSelectedInquiry(null);
          }}
        />
      )}
    </>
  );
};

export default AdminInquiryPanel;
