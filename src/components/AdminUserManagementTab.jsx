// src/components/AdminUserManagementTab.jsx
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Users, UserPlus, UserMinus, Search, X, TrendingUp, MessageCircle, Copy } from 'lucide-react';
import {
  getUserStats,
  searchUserByShareNoteId,
  getUserInquiries,
  deleteUser
} from '../services/adminUserManagementService';
import { showAlert } from '../utils/alertModal';
import ConfirmModal from './ConfirmModal';
import InquiryDetail from './InquiryDetail';
import { avatarList } from './avatars/AvatarIcons';
import { getProfileImageUrl } from '../utils/storageService';

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
  position: relative;
  width: 100%;
  height: 200px;
  padding: 10px 10px 0px 10px;
  overflow-x: auto;
  overflow-y: hidden;

  /* 스크롤바 스타일 */
  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
`;

const ChartSvg = styled.svg`
  display: block;
  min-width: 200px;
  width: 100%;
  height: 100%;
`;

const DateLabel = styled.text`
  font-size: 10px;
  fill: #888;
  text-anchor: middle;
`;

const YAxisLabel = styled.text`
  font-size: 10px;
  fill: #888;
  text-anchor: end;
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
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
`;

const NicknameAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #1E90FF;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  font-weight: 600;
  flex-shrink: 0;
`;

const AvatarIconWrapper = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$bgColor || 'transparent'};
  flex-shrink: 0;
`;

const AvatarIconInner = styled.div`
  width: 70%;
  height: 70%;
`;

// 아바타 배경색 매핑
const BACKGROUND_COLORS = {
  'none': 'transparent',
  'lavender': 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'sunset': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'ocean': 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'forest': 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
  'fire': 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
  'sky': 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  'rose': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'mint': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'peach': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'pink': '#FF69B4',
  'blue': '#4169E1',
  'yellow': '#FFD700',
  'green': '#32CD32',
  'purple': '#9370DB',
};

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
  font-size: 13px;
  color: #888;
  word-break: break-all;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #4a90e2;
  }
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
  font-size: ${props => props.$small ? '13px' : '14px'};
  color: #e0e0e0;
  font-family: ${props => props.$mono ? "'Consolas', 'Monaco', monospace" : 'inherit'};
  display: flex;
  align-items: center;
  gap: 8px;
  word-break: break-all;
`;

const CopyButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 4px 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background: rgba(74, 144, 226, 0.2);
    border-color: rgba(74, 144, 226, 0.4);
    color: #4a90e2;
  }

  &:active {
    transform: scale(0.95);
  }
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

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 50px;
  margin-top: 16px;
`;

const CopyAllButton = styled.button`
  background: rgba(74, 144, 226, 0.2);
  border: 1px solid rgba(74, 144, 226, 0.3);
  color: #4a90e2;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

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

const Toast = styled.div`
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(46, 213, 115, 0.95);
  color: #fff;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  z-index: 9999;
  animation: toastFadeIn 0.3s ease;

  @keyframes toastFadeIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
`;

const AdminUserManagementTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0); // 0: 숨김, 1: 1단계, 2: 2단계, 3: 3단계
  const [showInquiryList, setShowInquiryList] = useState(false);
  const [userInquiries, setUserInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showInquiryDetail, setShowInquiryDetail] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setToastMessage(`${label} 복사됨`);
    setTimeout(() => setToastMessage(''), 2000);
  };

  const copyAllUserInfo = () => {
    if (!searchResult) return;

    const formatDateForCopy = (timestamp) => {
      if (!timestamp) return '-';
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const lines = [
      `닉네임: ${searchResult.nickname}`,
      searchResult.email ? `이메일: ${searchResult.email}` : null,
      searchResult.displayName ? `구글 사용자명: ${searchResult.displayName}` : null,
      `ShareNote ID: ${searchResult.shareNoteId.replace(/^ws-/i, '')}`,
      `UID: ${searchResult.userId}`,
      `${searchResult.isDeleted ? '탈퇴일' : '가입일'}: ${formatDateForCopy(searchResult.isDeleted ? searchResult.deletedAt : searchResult.createdAt)}`
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines);
    setToastMessage('전체 정보 복사됨');
    setTimeout(() => setToastMessage(''), 2000);
  };

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
      setDeleteStep(0);
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

  // 선형 스케일로 Y 좌표 계산 (Y축과 그래프 동일)
  const calculateYPosition = (value, maxValue, height) => {
    if (maxValue === 0) return height;

    // 선형 스케일 계산
    const percentage = (value / maxValue) * 100;

    // 작은 값도 보이도록 최소 3% 높이 보장 (0은 제외)
    const minHeight = value > 0 ? 3 : 0;
    const adjustedPercentage = Math.max(percentage, minHeight);

    // Y축은 위에서 아래로 증가하므로 반전
    return height - (height * adjustedPercentage / 100);
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
              {stats?.chartData && stats.chartData.length > 0 && (
                <ChartSvg viewBox="0 0 240 170" preserveAspectRatio="xMidYMid meet">
                  {(() => {
                    const leftPadding = 25;
                    const topPadding = 10;
                    const chartWidth = 210;
                    const chartHeight = 135;
                    const maxValue = getMaxValue(stats.chartData);
                    const pointSpacing = chartWidth / (stats.chartData.length - 1);

                    // Y축 눈금 개수 (자동 조절, 중복 제거)
                    const getYAxisTicks = (max) => {
                      const ticks = [];

                      // maxValue에 따라 적절한 간격 계산
                      let interval;
                      if (max <= 5) {
                        interval = 1;
                      } else if (max <= 10) {
                        interval = 2;
                      } else if (max <= 20) {
                        interval = 5;
                      } else if (max <= 50) {
                        interval = 10;
                      } else if (max <= 100) {
                        interval = 20;
                      } else {
                        interval = Math.ceil(max / 5 / 10) * 10; // 큰 수는 10단위로
                      }

                      for (let i = 0; i <= max; i += interval) {
                        ticks.push(i);
                      }

                      // 마지막 눈금이 maxValue가 아니면 추가
                      if (ticks[ticks.length - 1] < max) {
                        ticks.push(max);
                      }

                      return ticks;
                    };

                    const yTickValues = getYAxisTicks(maxValue);

                    // 가입자 데이터 (왼쪽/위 패딩 추가)
                    const signupData = stats.chartData.map(d => d.signups);
                    const signupPath = signupData.map((point, index) => {
                      const x = leftPadding + (index * pointSpacing);
                      const y = topPadding + calculateYPosition(point, maxValue, chartHeight);
                      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                    }).join(' ');

                    // 탈퇴자 데이터 (왼쪽/위 패딩 추가)
                    const deletionData = stats.chartData.map(d => d.deletions);
                    const deletionPath = deletionData.map((point, index) => {
                      const x = leftPadding + (index * pointSpacing);
                      const y = topPadding + calculateYPosition(point, maxValue, chartHeight);
                      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                    }).join(' ');

                    return (
                      <>
                        {/* Y축 */}
                        <line
                          x1={leftPadding}
                          y1={topPadding}
                          x2={leftPadding}
                          y2={topPadding + chartHeight}
                          stroke="rgba(255, 255, 255, 0.2)"
                          strokeWidth="1"
                        />

                        {/* Y축 눈금 및 레이블 */}
                        {yTickValues.map((value) => {
                          // Y축 눈금은 최소 높이 보장 없이 정확한 위치 표시
                          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                          const y = topPadding + chartHeight - (chartHeight * percentage / 100);
                          return (
                            <g key={`ytick-${value}`}>
                              <line
                                x1={leftPadding - 5}
                                y1={y}
                                x2={leftPadding}
                                y2={y}
                                stroke="rgba(255, 255, 255, 0.2)"
                                strokeWidth="1"
                              />
                              <YAxisLabel x={leftPadding - 8} y={y + 3}>
                                {value}
                              </YAxisLabel>
                            </g>
                          );
                        })}

                        {/* X축 */}
                        <line
                          x1={leftPadding}
                          y1={topPadding + chartHeight}
                          x2={leftPadding + chartWidth}
                          y2={topPadding + chartHeight}
                          stroke="rgba(255, 255, 255, 0.2)"
                          strokeWidth="1"
                        />

                        {/* 가입자 라인 (녹색) */}
                        <path
                          d={signupPath}
                          fill="none"
                          stroke="rgba(39, 174, 96, 0.8)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* 탈퇴자 라인 (빨간색) */}
                        <path
                          d={deletionPath}
                          fill="none"
                          stroke="rgba(231, 76, 60, 0.8)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* 날짜 라벨 (첫 날짜와 마지막 날짜만) */}
                        {stats.chartData.map((data, index) => {
                          if (index === 0 || index === stats.chartData.length - 1) {
                            const x = leftPadding + (index * pointSpacing);
                            // 첫 날짜는 왼쪽 정렬, 마지막 날짜는 오른쪽 정렬
                            const textAnchor = index === 0 ? 'start' : 'end';
                            return (
                              <text
                                key={`label-${index}`}
                                x={x}
                                y={topPadding + chartHeight + 12}
                                fontSize="10px"
                                fill="#888"
                                textAnchor={textAnchor}
                              >
                                {data.date.slice(5)}
                              </text>
                            );
                          }
                          return null;
                        })}
                      </>
                    );
                  })()}
                </ChartSvg>
              )}
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
                  {(() => {
                    // 프로필 이미지 타입에 따른 렌더링
                    const imageType = searchResult.profileImageType || 'google';
                    const selectedAvatarId = searchResult.selectedAvatarId;
                    const avatarBgColor = searchResult.avatarBgColor || 'none';
                    const profileImageVersion = searchResult.profileImageVersion;

                    // 1. 커스텀 업로드 이미지 (photo 타입)
                    if (imageType === 'photo' && profileImageVersion) {
                      const imageUrl = getProfileImageUrl(searchResult.userId, profileImageVersion);
                      return <Avatar src={imageUrl} alt={searchResult.nickname} />;
                    }

                    // 2. 아바타 선택한 경우
                    if (selectedAvatarId) {
                      const avatar = avatarList.find(a => a.id === selectedAvatarId);
                      if (avatar) {
                        const AvatarComponent = avatar.component;
                        const bgColor = BACKGROUND_COLORS[avatarBgColor] || BACKGROUND_COLORS['none'];
                        return (
                          <AvatarIconWrapper $bgColor={bgColor}>
                            <AvatarIconInner>
                              <AvatarComponent />
                            </AvatarIconInner>
                          </AvatarIconWrapper>
                        );
                      }
                    }

                    // 3. 닉네임 첫 글자 표시 (기본값)
                    // 프로필 이미지를 설정하지 않은 경우 닉네임 첫 글자 표시
                    const nickname = searchResult.nickname || searchResult.displayName || '?';
                    return (
                      <NicknameAvatar>
                        {nickname.charAt(0).toUpperCase()}
                      </NicknameAvatar>
                    );
                  })()}
                  <UserInfo>
                    <UserName>{searchResult.nickname}</UserName>
                    {searchResult.email && (
                      <UserEmail onClick={() => copyToClipboard(searchResult.email, '이메일')}>
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
                    <DetailValue $mono>
                      {searchResult.shareNoteId.replace(/^ws-/i, '')}
                      <CopyButton onClick={() => copyToClipboard(searchResult.shareNoteId.replace(/^ws-/i, ''), 'ShareNote ID')} title="복사">
                        <Copy size={12} />
                      </CopyButton>
                    </DetailValue>
                  </DetailItem>
                  {!searchResult.isDeleted && (
                    <DetailItem>
                      <DetailLabel>UID</DetailLabel>
                      <DetailValue $mono $small>
                        {searchResult.userId}
                        <CopyButton onClick={() => copyToClipboard(searchResult.userId, 'UID')} title="복사">
                          <Copy size={12} />
                        </CopyButton>
                      </DetailValue>
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

                <ButtonGroup>
                  <CopyAllButton onClick={copyAllUserInfo}>
                    <Copy size={14} />
                    전체 복사
                  </CopyAllButton>
                  {!searchResult.isDeleted && (
                    <DeleteButton onClick={() => setDeleteStep(1)}>
                      회원 탈퇴 처리
                    </DeleteButton>
                  )}
                </ButtonGroup>
              </UserCard>
            )}
          </SearchSection>
        </Content>
      </Container>

      {/* 탈퇴 확인 모달 - 1단계 */}
      {deleteStep === 1 && searchResult && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setDeleteStep(0)}
          onCancel={() => setDeleteStep(0)}
          onConfirm={() => setDeleteStep(2)}
          title="⚠️ 회원 탈퇴 처리 (1/3)"
          message={`${searchResult.nickname}님의 계정을 탈퇴 처리하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 사용자의 동의 없이 진행할 경우 법적 책임이 발생할 수 있습니다.`}
          confirmText="다음 단계"
          cancelText="취소"
          showCancel={true}
        />
      )}

      {/* 탈퇴 확인 모달 - 2단계 */}
      {deleteStep === 2 && searchResult && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setDeleteStep(0)}
          onCancel={() => setDeleteStep(0)}
          onConfirm={() => setDeleteStep(3)}
          title="⛔ 법적 경고 (2/3)"
          message={`정말로 ${searchResult.nickname}님의 계정을 삭제하시겠습니까?\n\n• 문의 글을 제외한 모든 개인정보와 데이터가 영구 삭제됩니다\n• 개인정보보호법에 따라 무단 삭제 시 법적 처벌을 받을 수 있습니다\n• 사용자 본인의 요청 또는 정당한 사유가 있어야 합니다`}
          confirmText="최종 확인으로"
          cancelText="취소"
          showCancel={true}
        />
      )}

      {/* 탈퇴 확인 모달 - 3단계 (최종) */}
      {deleteStep === 3 && searchResult && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setDeleteStep(0)}
          onCancel={() => setDeleteStep(0)}
          onConfirm={handleDeleteUser}
          title="🚨 최종 확인 (3/3)"
          message={`[최종 경고]\n\n${searchResult.nickname}님 (${searchResult.email || 'N/A'})\nShareNote ID: ${searchResult.shareNoteId.replace(/^ws-/i, '')}\n\n지금 "탈퇴처리하기"를 누르면 최종적으로 탈퇴 확정이 됩니다.\n\n이 작업은 취소할 수 없습니다.`}
          confirmText="탈퇴처리하기"
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

      {/* 토스트 메시지 */}
      {toastMessage && <Toast>{toastMessage}</Toast>}
    </>
  );
};

export default AdminUserManagementTab;
