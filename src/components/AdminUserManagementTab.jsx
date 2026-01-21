// src/components/AdminUserManagementTab.jsx
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Users, UserPlus, UserMinus, Search, X, TrendingUp, Calendar, MessageCircle, Mail, User as UserIcon } from 'lucide-react';
import {
  getUserStats,
  searchUserByShareNoteId,
  getUserInquiries,
  deleteUser
} from '../services/adminUserManagementService';
import { showAlert } from '../utils/alertModal';
import ConfirmModal from './ConfirmModal';
import InquiryDetail from './InquiryDetail';

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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

const ChartContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
`;

const ChartTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Chart = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 150px;
  padding: 8px 0;
`;

const ChartBar = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const Bar = styled.div`
  width: 100%;
  background: ${props => props.$color};
  border-radius: 4px 4px 0 0;
  height: ${props => props.$height}%;
  min-height: ${props => props.$height > 0 ? '2px' : '0'};
  transition: height 0.3s;
  position: relative;

  &:hover {
    opacity: 0.8;
  }
`;

const BarLabel = styled.div`
  font-size: 10px;
  color: #666;
  writing-mode: horizontal-tb;
  transform: rotate(-45deg);
  transform-origin: center;
  white-space: nowrap;
`;

const SearchSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
`;

const SearchTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SearchContainer = styled.div`
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 12px 45px 12px 16px;
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

const SearchButton = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: #4a90e2;
  border: none;
  border-radius: 6px;
  color: #fff;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;

  &:hover {
    background: #357abd;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const UserCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  margin-top: 16px;
`;

const UserHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Avatar = styled.img`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
`;

const AvatarPlaceholder = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  font-size: 32px;
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #e0e0e0;
  margin-bottom: 4px;
`;

const UserEmail = styled.div`
  font-size: 14px;
  color: #888;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const UserDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
`;

const DetailItem = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
`;

const DetailLabel = styled.div`
  font-size: 12px;
  color: #888;
  margin-bottom: 6px;
`;

const DetailValue = styled.div`
  font-size: 14px;
  color: #e0e0e0;
  font-family: ${props => props.$mono ? "'Consolas', 'Monaco', monospace" : 'inherit'};
`;

const InquiryCount = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(74, 144, 226, 0.2);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  color: #4a90e2;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(74, 144, 226, 0.3);
    border-color: rgba(74, 144, 226, 0.5);
  }
`;

const DeleteButton = styled.button`
  background: rgba(255, 107, 107, 0.2);
  border: 1px solid rgba(255, 107, 107, 0.3);
  color: #ff6b6b;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 16px;

  &:hover {
    background: rgba(255, 107, 107, 0.3);
    border-color: rgba(255, 107, 107, 0.5);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DeletedBadge = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background: rgba(255, 107, 107, 0.2);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 8px;
  color: #ff6b6b;
  font-size: 12px;
  font-weight: 600;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #888;
`;

const InquiryListModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const InquiryListContainer = styled.div`
  background: #2a2d35;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #e0e0e0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
`;

const InquiryList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;

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

const InquiryItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 12px;
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

const InquiryTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 4px;
`;

const InquiryDate = styled.div`
  font-size: 12px;
  color: #888;
`;

const AdminUserManagementTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInquiryList, setShowInquiryList] = useState(false);
  const [userInquiries, setUserInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showInquiryDetail, setShowInquiryDetail] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getUserStats();
      setStats(data);
    } catch (error) {
      console.error('통계 로드 실패:', error);
      showAlert('통계를 불러오는데 실패했습니다.', '오류');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      showAlert('ShareNote ID를 입력해주세요.', '알림');
      return;
    }

    try {
      setSearching(true);
      const result = await searchUserByShareNoteId(searchTerm.trim());

      if (!result) {
        showAlert('해당 ShareNote ID를 가진 사용자를 찾을 수 없습니다.', '검색 결과');
        setSearchResult(null);
      } else {
        setSearchResult(result);
      }
    } catch (error) {
      console.error('사용자 검색 실패:', error);
      showAlert('사용자 검색에 실패했습니다.', '오류');
    } finally {
      setSearching(false);
    }
  };

  const handleShowInquiries = async () => {
    if (!searchResult) return;

    try {
      const inquiries = await getUserInquiries(searchResult.userId);
      setUserInquiries(inquiries);
      setShowInquiryList(true);
    } catch (error) {
      console.error('문의 목록 로드 실패:', error);
      showAlert('문의 목록을 불러오는데 실패했습니다.', '오류');
    }
  };

  const handleInquiryClick = (inquiry) => {
    setSelectedInquiry(inquiry);
    setShowInquiryList(false);
    setShowInquiryDetail(true);
  };

  const handleDeleteUser = async () => {
    if (!searchResult) return;

    try {
      await deleteUser(searchResult.userId);
      showAlert('회원 탈퇴 처리가 완료되었습니다.', '완료');
      setShowDeleteConfirm(false);
      setSearchResult(null);
      setSearchTerm('');
      await loadStats();
    } catch (error) {
      console.error('회원 탈퇴 처리 실패:', error);
      showAlert('회원 탈퇴 처리에 실패했습니다.', '오류');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMaxValue = (data) => {
    return Math.max(...data.map(d => Math.max(d.signups, d.deletions)), 1);
  };

  if (loading) {
    return (
      <Container>
        <Content>
          <EmptyState>통계를 불러오는 중...</EmptyState>
        </Content>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <Content>
          {/* 통계 카드 */}
          <Stats>
            <StatCard>
              <StatIcon $color="#4a90e2">
                <Users size={24} />
              </StatIcon>
              <StatInfo>
                <StatLabel>총 가입자 수</StatLabel>
                <StatValue>{stats?.totalUsers || 0}</StatValue>
              </StatInfo>
            </StatCard>
            <StatCard>
              <StatIcon $color="#27ae60">
                <UserPlus size={24} />
              </StatIcon>
              <StatInfo>
                <StatLabel>오늘의 가입자</StatLabel>
                <StatValue>{stats?.todaySignups || 0}</StatValue>
              </StatInfo>
            </StatCard>
            <StatCard>
              <StatIcon $color="#e74c3c">
                <UserMinus size={24} />
              </StatIcon>
              <StatInfo>
                <StatLabel>총 탈퇴자 수</StatLabel>
                <StatValue>{stats?.deletedUsers || 0}</StatValue>
              </StatInfo>
            </StatCard>
          </Stats>

          {/* 차트 */}
          <ChartContainer>
            <ChartTitle>
              <TrendingUp size={18} />
              최근 30일 가입/탈퇴 현황
            </ChartTitle>
            <Chart>
              {stats?.chartData?.map((data, index) => {
                const maxValue = getMaxValue(stats.chartData);
                const signupHeight = (data.signups / maxValue) * 100;
                const deletionHeight = (data.deletions / maxValue) * 100;

                return (
                  <ChartBar key={index}>
                    <Bar $color="rgba(39, 174, 96, 0.6)" $height={signupHeight} title={`가입: ${data.signups}`} />
                    <Bar $color="rgba(231, 76, 60, 0.6)" $height={deletionHeight} title={`탈퇴: ${data.deletions}`} />
                    {index % 5 === 0 && (
                      <BarLabel>{data.date.slice(5)}</BarLabel>
                    )}
                  </ChartBar>
                );
              })}
            </Chart>
          </ChartContainer>

          {/* 검색 섹션 */}
          <SearchSection>
            <SearchTitle>
              <Search size={18} />
              회원 검색
            </SearchTitle>
            <SearchContainer>
              <SearchInput
                type="text"
                placeholder="ShareNote ID를 입력하세요 (예: WSHGZ3)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <SearchButton onClick={handleSearch} disabled={searching}>
                <Search size={14} />
                검색
              </SearchButton>
            </SearchContainer>

            {/* 검색 결과 */}
            {searchResult && (
              <UserCard>
                <UserHeader>
                  {searchResult.photoURL ? (
                    <Avatar src={searchResult.photoURL} alt={searchResult.nickname} />
                  ) : (
                    <AvatarPlaceholder>
                      <UserIcon size={32} />
                    </AvatarPlaceholder>
                  )}
                  <UserInfo>
                    <UserName>{searchResult.nickname}</UserName>
                    {searchResult.email && (
                      <UserEmail>
                        <Mail size={14} />
                        {searchResult.email}
                      </UserEmail>
                    )}
                  </UserInfo>
                  {searchResult.isDeleted && (
                    <DeletedBadge>탈퇴한 회원</DeletedBadge>
                  )}
                </UserHeader>

                <UserDetails>
                  {!searchResult.isDeleted && searchResult.displayName && (
                    <DetailItem>
                      <DetailLabel>구글 사용자명</DetailLabel>
                      <DetailValue>{searchResult.displayName}</DetailValue>
                    </DetailItem>
                  )}
                  <DetailItem>
                    <DetailLabel>ShareNote ID</DetailLabel>
                    <DetailValue $mono>{searchResult.shareNoteId.replace(/^ws-/i, '')}</DetailValue>
                  </DetailItem>
                  {!searchResult.isDeleted && (
                    <DetailItem>
                      <DetailLabel>UID</DetailLabel>
                      <DetailValue $mono>{searchResult.userId}</DetailValue>
                    </DetailItem>
                  )}
                  <DetailItem>
                    <DetailLabel>{searchResult.isDeleted ? '탈퇴일' : '가입일'}</DetailLabel>
                    <DetailValue>
                      {formatDate(searchResult.isDeleted ? searchResult.deletedAt : searchResult.createdAt)}
                    </DetailValue>
                  </DetailItem>
                  {!searchResult.isDeleted && (
                    <DetailItem>
                      <DetailLabel>문의 등록 건수</DetailLabel>
                      <InquiryCount onClick={handleShowInquiries}>
                        <MessageCircle size={14} />
                        {searchResult.inquiryCount}건
                      </InquiryCount>
                    </DetailItem>
                  )}
                </UserDetails>

                {!searchResult.isDeleted && (
                  <DeleteButton onClick={() => setShowDeleteConfirm(true)}>
                    회원 탈퇴 처리
                  </DeleteButton>
                )}
              </UserCard>
            )}
          </SearchSection>
        </Content>
      </Container>

      {/* 탈퇴 확인 모달 */}
      {showDeleteConfirm && searchResult && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteUser}
          title="⚠️ 회원 탈퇴 처리"
          message={`${searchResult.nickname}님의 계정을 탈퇴 처리하시겠습니까?\n\n문의 글을 제외한 모든 개인정보와 데이터가 삭제되며, 이 작업은 되돌릴 수 없습니다.`}
          confirmText="탈퇴 처리"
          cancelText="취소"
          showCancel={true}
        />
      )}

      {/* 문의 목록 모달 */}
      {showInquiryList && (
        <InquiryListModal onClick={() => setShowInquiryList(false)}>
          <InquiryListContainer onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>문의 내역 ({userInquiries.length}건)</ModalTitle>
              <CloseButton onClick={() => setShowInquiryList(false)}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <InquiryList>
              {userInquiries.length === 0 ? (
                <EmptyState>문의 내역이 없습니다.</EmptyState>
              ) : (
                userInquiries.map((inquiry) => (
                  <InquiryItem key={inquiry.id} onClick={() => handleInquiryClick(inquiry)}>
                    <InquiryTitle>{inquiry.title}</InquiryTitle>
                    <InquiryDate>{formatDate(inquiry.createdAt)}</InquiryDate>
                  </InquiryItem>
                ))
              )}
            </InquiryList>
          </InquiryListContainer>
        </InquiryListModal>
      )}

      {/* 문의 상세 모달 */}
      {showInquiryDetail && selectedInquiry && (
        <InquiryDetail
          isOpen={showInquiryDetail}
          onClose={() => {
            setShowInquiryDetail(false);
            setSelectedInquiry(null);
            setShowInquiryList(true);
          }}
          userId={selectedInquiry.userId}
          inquiry={selectedInquiry}
          onBack={() => {
            setShowInquiryDetail(false);
            setSelectedInquiry(null);
            setShowInquiryList(true);
          }}
        />
      )}
    </>
  );
};

export default AdminUserManagementTab;
