// src/components/AdminInquiryTab.jsx
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Bell, MessageCircle, Clock, CheckCircle, AlertCircle, User, Mail, Search, RefreshCw } from 'lucide-react';
import {
  getAllInquiries
} from '../services/adminInquiryService';
import { getStatusText, getStatusColor } from '../services/inquiryService';
import { showAlert } from '../utils/alertModal';
import InquiryDetail from './InquiryDetail';

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const FilterBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
  flex-shrink: 0;
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
  background: rgba(255, 255, 255, 0.05) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 9L1 4h10z'/%3E%3C/svg%3E") no-repeat;
  background-position: right 12px center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 10px 35px 10px 16px;
  color: #e0e0e0;
  font-size: 14px;
  outline: none;
  cursor: pointer;
  transition: all 0.2s;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  &:focus {
    border-color: #4a90e2;
    background-color: rgba(255, 255, 255, 0.08);
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
  position: relative;
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

const StatNotificationDot = styled.span`
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

const DateText = styled.span`
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

const ShareNoteIdRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
`;

const ShareNoteId = styled.span`
  font-size: 12px;
  color: #888;
  font-family: 'Consolas', 'Monaco', monospace;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const CopyIdButton = styled.button`
  background: rgba(74, 144, 226, 0.2);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 6px;
  padding: 4px 8px;
  color: #4a90e2;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: rgba(74, 144, 226, 0.3);
    border-color: rgba(74, 144, 226, 0.5);
  }

  &:active {
    transform: scale(0.95);
  }
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

const AdminInquiryTab = ({ userId, isSuperAdmin = false }) => {
  const [inquiries, setInquiries] = useState([]);
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [currentUserNickname, setCurrentUserNickname] = useState('');

  // 문의 목록 로드 (실시간 리스너 제거 - 비용 절감)
  useEffect(() => {
    if (userId) {
      loadInquiries();
      loadCurrentUserNickname();
    }
  }, [userId]);

  useEffect(() => {
    filterInquiries();
  }, [inquiries, searchTerm, statusFilter]);

  const loadCurrentUserNickname = async () => {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');

      const nicknameDocRef = doc(db, 'nicknames', userId);
      const nicknameDoc = await getDoc(nicknameDocRef);

      if (nicknameDoc.exists()) {
        setCurrentUserNickname(nicknameDoc.data().nickname || '');
      }
    } catch (error) {
      console.error('현재 사용자 닉네임 조회 실패:', error);
    }
  };

  const loadInquiries = async () => {
    try {
      setLoading(true);
      const data = await getAllInquiries();

      // 각 문의의 ShareNote ID와 앱 닉네임 가져오기
      const { collection, query, where, getDocs, doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');

      const inquiriesWithUserData = await Promise.all(
        data.map(async (inquiry) => {
          try {
            // ShareNote ID 조회
            const workspacesRef = collection(db, 'workspaces');
            const q = query(workspacesRef, where('userId', '==', inquiry.userId));
            const snapshot = await getDocs(q);
            const workspaceCode = snapshot.empty ? null : snapshot.docs[0].data().workspaceCode;

            // 앱 닉네임 조회
            let displayName = inquiry.userDisplayName;
            try {
              const nicknameDocRef = doc(db, 'nicknames', inquiry.userId);
              const nicknameDoc = await getDoc(nicknameDocRef);
              if (nicknameDoc.exists()) {
                displayName = nicknameDoc.data().nickname || inquiry.userDisplayName;
              }
            } catch (nicknameError) {
              console.warn('닉네임 조회 실패:', inquiry.userId, nicknameError);
            }

            return {
              ...inquiry,
              userDisplayName: displayName,  // 앱 닉네임 우선
              workspaceCode  // ShareNote ID
            };
          } catch (error) {
            console.error('사용자 데이터 조회 실패:', inquiry.userId, error);
            return inquiry;
          }
        })
      );

      setInquiries(inquiriesWithUserData);
    } catch (error) {
      console.error('문의 목록 로드 실패:', error);
      showAlert('문의 목록을 불러오는데 실패했습니다: ' + error.message, '오류');
    } finally {
      setLoading(false);
    }
  };

  const filterInquiries = () => {
    let filtered = [...inquiries];

    if (searchTerm) {
      filtered = filtered.filter(inquiry => {
        const searchLower = searchTerm.toLowerCase();
        const shareNoteId = inquiry.workspaceCode?.replace(/^ws-/i, '') || '';

        return (
          inquiry.title?.toLowerCase().includes(searchLower) ||
          inquiry.content?.toLowerCase().includes(searchLower) ||
          inquiry.userDisplayName?.toLowerCase().includes(searchLower) ||
          inquiry.userEmail?.toLowerCase().includes(searchLower) ||
          shareNoteId.toLowerCase().includes(searchLower)
        );
      });
    }

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

  const handleCopyShareNoteId = async (e, workspaceCode) => {
    e.stopPropagation(); // 문의 항목 클릭 방지

    if (!workspaceCode) return;

    try {
      // ws- 접두사 제거 후 복사
      const cleanId = workspaceCode.replace(/^ws-/i, '');
      await navigator.clipboard.writeText(cleanId);
      showAlert('ShareNote ID가 클립보드에 복사되었습니다.', '복사 완료');
    } catch (error) {
      console.error('ShareNote ID 복사 실패:', error);
      showAlert('ShareNote ID 복사에 실패했습니다.', '오류');
    }
  };

  const formatDate = (date) => {
    if (!date) return '';

    // Firestore Timestamp를 Date 객체로 변환
    let dateObj;
    if (date.toDate && typeof date.toDate === 'function') {
      // Firestore Timestamp
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else {
      return '';
    }

    const now = new Date();
    const diff = now - dateObj;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return dateObj.toLocaleDateString('ko-KR');
  };

  const getStats = () => {
    const total = inquiries.length;
    const pending = inquiries.filter(i => i.status === 'pending').length;
    const inProgress = inquiries.filter(i => i.status === 'in_progress').length;
    const resolved = inquiries.filter(i => i.status === 'resolved').length;

    return { total, pending, inProgress, resolved };
  };

  const stats = getStats();

  return (
    <>
      <Container>
        <FilterBar>
          <SearchContainer>
            <SearchIconWrapper>
              <Search size={16} />
            </SearchIconWrapper>
            <SearchInput
              type="text"
              placeholder="제목, 내용, 사용자, ShareNote ID로 검색..."
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
              {stats.pending > 0 && <StatNotificationDot />}
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
                  <DateText>
                    <Clock size={12} />
                    {formatDate(inquiry.createdAt)}
                  </DateText>
                </InquiryMeta>
                {inquiry.workspaceCode && (
                  <ShareNoteIdRow>
                    <ShareNoteId>ID: {inquiry.workspaceCode.replace(/^ws-/i, '')}</ShareNoteId>
                    <CopyIdButton onClick={(e) => handleCopyShareNoteId(e, inquiry.workspaceCode)}>
                      복사
                    </CopyIdButton>
                  </ShareNoteIdRow>
                )}
                {inquiry.content && (
                  <InquiryPreview>{inquiry.content}</InquiryPreview>
                )}
              </InquiryItem>
            ))
          )}
        </Content>
      </Container>

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
            // 삭제된 문의 클릭 시 목록 새로고침
            loadInquiries();
          }}
          isAdmin={true}
          isSuperAdmin={isSuperAdmin}
          currentUserId={userId}
          currentUserNickname={currentUserNickname}
        />
      )}
    </>
  );
};

export default AdminInquiryTab;
