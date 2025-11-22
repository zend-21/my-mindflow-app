// 초대 링크로 접근 시 친구 추가 페이지
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { UserPlus, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { searchByUniqueId } from '../services/userIdService';
import { sendFriendRequest } from '../services/collaborationService';

const AddFriendPage = () => {
  const { uniqueId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadUser();
  }, [uniqueId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError('');

      // 로그인 확인
      const userId = localStorage.getItem('firebaseUserId');
      if (!userId) {
        setError('로그인이 필요합니다');
        setLoading(false);
        return;
      }

      // 사용자 검색
      const foundUser = await searchByUniqueId(uniqueId);

      if (!foundUser) {
        setError('사용자를 찾을 수 없습니다');
      } else if (foundUser.id === userId) {
        setError('자기 자신은 친구로 추가할 수 없습니다');
      } else {
        setUser(foundUser);
      }
    } catch (err) {
      console.error(err);
      setError('사용자 정보를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!user) return;

    try {
      setSending(true);
      setError(''); // 이전 에러 초기화
      await sendFriendRequest(user.id, user.displayName);
      setSuccess(true);

      // 3초 후 홈으로 이동
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || '친구 요청에 실패했습니다');
      setUser(null); // 에러 발생 시 사용자 정보 초기화하여 에러 섹션 표시
    } finally {
      setSending(false);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleLogin = () => {
    navigate('/?login=true'); // 로그인 모달 열기
  };

  return (
    <Container>
      <BackButton onClick={handleGoHome}>
        <ArrowLeft size={20} />
        <span>홈으로</span>
      </BackButton>

      <Card>
        {loading ? (
          <LoadingSection>
            <Spinner />
            <LoadingText>사용자 정보 불러오는 중...</LoadingText>
          </LoadingSection>
        ) : error ? (
          <ErrorSection>
            <AlertCircle size={64} color="#ff6b6b" />
            <ErrorTitle>{error}</ErrorTitle>
            {error === '로그인이 필요합니다' ? (
              <>
                <ErrorText>친구를 추가하려면 먼저 로그인해주세요</ErrorText>
                <LoginButton onClick={handleLogin}>
                  로그인하기
                </LoginButton>
              </>
            ) : (
              <ErrorText>
                링크가 올바르지 않거나<br/>
                사용자가 더 이상 존재하지 않습니다
              </ErrorText>
            )}
          </ErrorSection>
        ) : success ? (
          <SuccessSection>
            <CheckCircle size={64} color="#5ebe26" />
            <SuccessTitle>친구 요청 완료!</SuccessTitle>
            <SuccessText>
              {user.displayName}님에게<br/>
              친구 요청을 보냈습니다
            </SuccessText>
            <AutoRedirect>잠시 후 홈으로 이동합니다...</AutoRedirect>
          </SuccessSection>
        ) : user ? (
          <UserSection>
            <UserAvatar src={user.photoURL || '/default-avatar.png'} alt={user.displayName} />
            <UserName>{user.displayName}</UserName>
            <UserId>@{user.uniqueId}</UserId>

            <InfoBox>
              <InfoIcon>👋</InfoIcon>
              <InfoText>
                <strong>{user.displayName}</strong>님과<br/>
                MindFlow에서 친구가 되어 협업하세요!
              </InfoText>
            </InfoBox>

            <AddButton onClick={handleAddFriend} disabled={sending}>
              {sending ? (
                <>
                  <Spinner small />
                  <span>요청 보내는 중...</span>
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  <span>친구 요청 보내기</span>
                </>
              )}
            </AddButton>

            <Features>
              <FeatureTitle>친구가 되면 할 수 있는 것:</FeatureTitle>
              <FeatureList>
                <FeatureItem>📝 메모 공유 및 협업</FeatureItem>
                <FeatureItem>💬 실시간 채팅</FeatureItem>
                <FeatureItem>📊 작업 진행 상황 공유</FeatureItem>
              </FeatureList>
            </Features>
          </UserSection>
        ) : null}
      </Card>

      <Footer>
        <FooterLogo>MindFlow</FooterLogo>
        <FooterText>생각을 흐름으로, 흐름을 성과로</FooterText>
      </Footer>
    </Container>
  );
};

// 스타일 정의
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1d24 0%, #2d3139 100%);
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 40px;
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 48px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const LoadingSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 60px 0;
`;

const Spinner = styled.div`
  width: ${props => props.small ? '20px' : '48px'};
  height: ${props => props.small ? '20px' : '48px'};
  border: ${props => props.small ? '2px' : '4px'} solid rgba(255, 255, 255, 0.1);
  border-top-color: #5ebe26;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
`;

const ErrorSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px 0;
  text-align: center;
`;

const ErrorTitle = styled.h2`
  color: #ff6b6b;
  font-size: 24px;
  font-weight: 700;
  margin: 0;
`;

const ErrorText = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
`;

const LoginButton = styled.button`
  padding: 16px 32px;
  background: #5ebe26;
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 12px;
  &:hover {
    background: #4fa01f;
    transform: translateY(-2px);
  }
`;

const SuccessSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px 0;
  text-align: center;
`;

const SuccessTitle = styled.h2`
  color: #5ebe26;
  font-size: 24px;
  font-weight: 700;
  margin: 0;
`;

const SuccessText = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 18px;
  line-height: 1.6;
  margin: 0;
`;

const AutoRedirect = styled.div`
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
  margin-top: 12px;
`;

const UserSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
`;

const UserAvatar = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(94, 190, 38, 0.3);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const UserName = styled.h1`
  color: white;
  font-size: 32px;
  font-weight: 700;
  margin: 0;
`;

const UserId = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 16px;
  margin-top: -16px;
`;

const InfoBox = styled.div`
  display: flex;
  gap: 16px;
  padding: 20px;
  background: rgba(94, 190, 38, 0.1);
  border: 1px solid rgba(94, 190, 38, 0.3);
  border-radius: 16px;
  width: 100%;
`;

const InfoIcon = styled.div`
  font-size: 32px;
  flex-shrink: 0;
`;

const InfoText = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 15px;
  line-height: 1.6;
  strong {
    color: #5ebe26;
    font-weight: 700;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 18px 40px;
  background: #5ebe26;
  border: none;
  border-radius: 14px;
  color: white;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  &:hover:not(:disabled) {
    background: #4fa01f;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(94, 190, 38, 0.4);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Features = styled.div`
  width: 100%;
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const FeatureTitle = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FeatureItem = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 15px;
  line-height: 1.5;
`;

const Footer = styled.div`
  margin-top: 60px;
  text-align: center;
`;

const FooterLogo = styled.div`
  color: #5ebe26;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const FooterText = styled.div`
  color: rgba(255, 255, 255, 0.3);
  font-size: 14px;
`;

export default AddFriendPage;
