// 사용설명서 컴포넌트
import { useState } from 'react';
import styled from 'styled-components';
import { X, ChevronDown, Book, Calendar, MessageCircle, Users, Settings, Smile, Bell, Shield, FileText, Search, Download, Share2, Clock, Trash2, Lock, Menu } from 'lucide-react';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  z-index: 100000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const GuideContainer = styled.div`
  width: 95%;
  max-width: 900px;
  height: 90vh;
  background: linear-gradient(180deg, #1a1a1f 0%, #0f0f14 100%);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: slideUp 0.4s ease;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    width: 100%;
    height: 100vh;
    border-radius: 0;
  }
`;

const Header = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.02);
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const TitleIcon = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
`;

const TitleText = styled.h1`
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: #888;
  padding: 8px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
  }
`;

const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Sidebar = styled.div`
  width: 280px;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  padding: 8px;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const CategorySelector = styled.div`
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const SelectedCategory = styled.div`
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: #ffffff;
  background: rgba(102, 126, 234, 0.1);
  transition: all 0.2s;

  &:hover {
    background: rgba(102, 126, 234, 0.15);
  }

  svg {
    flex-shrink: 0;
  }
`;

const CategoryName = styled.div`
  font-size: 14px;
  font-weight: 600;
  flex: 1;
`;

const ExpandButton = styled.div`
  transition: transform 0.2s;
  transform: ${props => props.$expanded ? 'rotate(180deg)' : 'rotate(0deg)'};
  color: #667eea;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CategoryList = styled.div`
  max-height: ${props => props.$expanded ? '400px' : '0'};
  overflow-y: auto;
  transition: max-height 0.3s ease;
  background: rgba(0, 0, 0, 0.2);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
`;

const CategoryItem = styled.div`
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: ${props => props.$selected ? '#ffffff' : '#888'};
  background: ${props => props.$selected ? 'rgba(102, 126, 234, 0.15)' : 'transparent'};
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s;

  &:hover {
    background: rgba(102, 126, 234, 0.08);
    color: #ffffff;
  }

  &:last-child {
    border-bottom: none;
  }

  svg {
    flex-shrink: 0;
  }
`;

const CategoryItemName = styled.div`
  font-size: 13px;
  font-weight: ${props => props.$selected ? '600' : '500'};
  flex: 1;
`;

const CategoryDescription = styled.div`
  font-size: 11px;
  color: #666;
  margin-top: 2px;
`;

const MainContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 32px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 4px;
  }

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const CategoryTitle = styled.h2`
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 480px) {
    font-size: 22px;
  }
`;

const MainCategoryDescription = styled.p`
  font-size: 15px;
  color: #888;
  margin: 0 0 32px 0;
  line-height: 1.6;
`;

const FeatureSection = styled.div`
  margin-bottom: 40px;
`;

const FeatureTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 10px;

  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const FeatureIconBadge = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, ${props => props.$color1 || '#667eea'}, ${props => props.$color2 || '#764ba2'});
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const FeatureContent = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
`;

const FeatureDescription = styled.p`
  font-size: 15px;
  color: #b0b0b0;
  line-height: 1.7;
  margin: 0 0 16px 0;
`;

const StepList = styled.ol`
  margin: 0;
  padding-left: 24px;
  color: #d0d0d0;

  li {
    margin-bottom: 12px;
    line-height: 1.6;
    font-size: 14px;

    &::marker {
      color: #667eea;
      font-weight: 600;
    }
  }
`;

const BulletList = styled.ul`
  margin: 0;
  padding-left: 24px;
  color: #d0d0d0;

  li {
    margin-bottom: 10px;
    line-height: 1.6;
    font-size: 14px;

    &::marker {
      color: #667eea;
    }
  }
`;

const TipBox = styled.div`
  background: rgba(74, 144, 226, 0.1);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
  display: flex;
  gap: 12px;
`;

const TipIcon = styled.div`
  color: #4a90e2;
  flex-shrink: 0;
`;

const TipText = styled.div`
  font-size: 14px;
  color: #a0c4e8;
  line-height: 1.6;
`;

const WarningBox = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
  display: flex;
  gap: 12px;
`;

const WarningIcon = styled.div`
  color: #ef4444;
  flex-shrink: 0;
`;

const WarningText = styled.div`
  font-size: 14px;
  color: #f8b4b4;
  line-height: 1.6;
`;

const KeyboardShortcut = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 13px;
  font-family: 'Courier New', monospace;
  color: #4a90e2;
  font-weight: 600;
`;

const CATEGORIES = [
  {
    id: 'home',
    name: '홈화면',
    icon: Book,
    description: '앱의 시작 화면 및 기본 기능',
  },
  {
    id: 'memo',
    name: '메모',
    icon: FileText,
    description: '다양한 형식의 메모 작성 및 관리',
  },
  {
    id: 'schedule',
    name: '스케줄',
    icon: Calendar,
    description: '일정 관리와 스케줄 알람 기능',
  },
  {
    id: 'secret',
    name: '시크릿',
    icon: Lock,
    description: '비밀번호로 보호되는 안전한 메모',
  },
  {
    id: 'chat',
    name: '채팅',
    icon: MessageCircle,
    description: '1:1 대화 및 그룹 채팅 기능',
  },
  {
    id: 'sidemenu',
    name: '사이드 메뉴',
    icon: Menu,
    description: '설정 및 앱 관리 기능',
  },
];

const UserGuide = ({ isOpen, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('home');
  const [isListExpanded, setIsListExpanded] = useState(false);

  const handleCategorySelect = (categoryId) => {
    setActiveCategory(categoryId);
    setIsListExpanded(false); // 카테고리 선택 시 자동으로 접기
  };

  if (!isOpen) return null;

  const selectedCategoryData = CATEGORIES.find(cat => cat.id === activeCategory);

  const renderContent = () => {
    switch (activeCategory) {
      case 'home':
        return (
          <>
            <CategoryTitle>
              <Book size={32} />
              홈화면
            </CategoryTitle>
            <MainCategoryDescription>
              앱의 시작 화면 및 기본 기능을 소개합니다.
            </MainCategoryDescription>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#667eea" $color2="#764ba2">
                  <Book size={18} />
                </FeatureIconBadge>
                홈화면 소개
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  홈화면에 대한 자세한 설명은 추후 업데이트될 예정입니다.
                </FeatureDescription>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    <strong>참고:</strong> 홈화면 기능은 현재 개발 중입니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>
          </>
        );

      case 'schedule':
        return (
          <>
            <CategoryTitle>
              <Calendar size={32} />
              캘린더
            </CategoryTitle>
            <MainCategoryDescription>
              일정을 체계적으로 관리하고 중요한 스케줄을 놓치지 않도록 스케줄 알람을 설정할 수 있습니다.
            </MainCategoryDescription>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#667eea" $color2="#764ba2">
                  <Calendar size={18} />
                </FeatureIconBadge>
                일정 추가하기
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  캘린더에서 원하는 날짜를 선택하여 새로운 일정을 추가할 수 있습니다.
                </FeatureDescription>
                <StepList>
                  <li>캘린더에서 날짜를 탭하여 해당 날짜 선택</li>
                  <li>우측 하단의 <strong>+ 버튼</strong> 탭</li>
                  <li>제목, 내용, 시간 등을 입력</li>
                  <li><strong>저장</strong> 버튼을 눌러 일정 등록</li>
                </StepList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    <strong>팁:</strong> 일정 작성 시 시간을 설정하면 해당 시간에 알람이 울립니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#f093fb" $color2="#f5576c">
                  <Bell size={18} />
                </FeatureIconBadge>
                스케줄 알람
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  중요한 일정을 놓치지 않도록 알람을 설정할 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>알람 시간 설정:</strong> 일정 작성 시 시간을 지정하면 자동으로 알람 설정</li>
                  <li><strong>알람 소리:</strong> 설정에서 원하는 알람음 선택 가능</li>
                  <li><strong>알람 반복:</strong> 알림창이 떠 있는 동안 일정 시간마다 알람 재생</li>
                  <li><strong>알람 종료:</strong> 알림창의 <strong>확인</strong> 또는 <strong>닫기</strong> 버튼으로 종료</li>
                </BulletList>
                <WarningBox>
                  <WarningIcon>⚠️</WarningIcon>
                  <WarningText>
                    <strong>주의:</strong> 알람이 제대로 작동하려면 앱이 백그라운드에서도 실행 중이어야 하며, 알림 권한이 허용되어 있어야 합니다.
                  </WarningText>
                </WarningBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#4facfe" $color2="#00f2fe">
                  <Search size={18} />
                </FeatureIconBadge>
                일정 조회 및 수정
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  등록된 일정을 확인하고 수정하거나 삭제할 수 있습니다.
                </FeatureDescription>
                <StepList>
                  <li>캘린더에서 일정이 있는 날짜 탭 (색상 점으로 표시됨)</li>
                  <li>해당 날짜의 일정 목록이 하단에 표시</li>
                  <li>일정을 탭하여 상세 내용 확인</li>
                  <li><strong>수정</strong> 버튼으로 내용 변경 또는 <strong>삭제</strong> 버튼으로 제거</li>
                </StepList>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#43e97b" $color2="#38f9d7">
                  <Clock size={18} />
                </FeatureIconBadge>
                월/주/일 보기
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  캘린더를 다양한 형식으로 볼 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>월 보기:</strong> 한 달 전체의 일정을 한눈에 확인</li>
                  <li><strong>주 보기:</strong> 일주일 단위로 상세하게 확인</li>
                  <li><strong>일 보기:</strong> 하루 일정을 시간대별로 확인</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    화면 상단의 <strong>보기 모드</strong> 버튼으로 전환할 수 있습니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>
          </>
        );

      case 'memo':
        return (
          <>
            <CategoryTitle>
              <FileText size={32} />
              메모
            </CategoryTitle>
            <MainCategoryDescription>
              다양한 형식의 메모를 작성하고, 중요한 메모는 비밀 메모로 보호할 수 있습니다.
            </MainCategoryDescription>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#667eea" $color2="#764ba2">
                  <FileText size={18} />
                </FeatureIconBadge>
                메모 작성하기
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  리치 텍스트 에디터로 다양한 형식의 메모를 작성할 수 있습니다.
                </FeatureDescription>
                <StepList>
                  <li>우측 하단의 <strong>+ 버튼</strong> 탭</li>
                  <li>제목과 내용 입력</li>
                  <li>서식 도구로 텍스트 꾸미기 (굵게, 기울임, 밑줄 등)</li>
                  <li>이미지 추가, 링크 삽입 가능</li>
                  <li><strong>저장</strong> 버튼으로 메모 저장</li>
                </StepList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    <strong>팁:</strong> 작성 중인 메모는 자동으로 임시 저장되어 앱을 종료해도 내용이 유지됩니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#f093fb" $color2="#f5576c">
                  <Lock size={18} />
                </FeatureIconBadge>
                비밀 메모
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  중요하거나 개인적인 메모는 비밀번호로 보호할 수 있습니다.
                </FeatureDescription>
                <StepList>
                  <li>메모 작성 시 <strong>비밀 메모</strong> 옵션 활성화</li>
                  <li>비밀번호 설정 (최초 1회)</li>
                  <li>비밀 메모는 별도 탭에서 관리</li>
                  <li>비밀 메모 조회 시 비밀번호 입력 필요</li>
                </StepList>
                <WarningBox>
                  <WarningIcon>⚠️</WarningIcon>
                  <WarningText>
                    <strong>주의:</strong> 비밀번호를 분실하면 메모를 복구할 수 없습니다. 반드시 기억할 수 있는 비밀번호를 설정하세요.
                  </WarningText>
                </WarningBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#4facfe" $color2="#00f2fe">
                  <Search size={18} />
                </FeatureIconBadge>
                메모 검색 및 정렬
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  작성한 메모를 빠르게 찾고 원하는 방식으로 정렬할 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>검색:</strong> 상단 검색창에서 제목이나 내용으로 메모 검색</li>
                  <li><strong>정렬 옵션:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      <li>최신순 / 오래된 순</li>
                      <li>제목 가나다순</li>
                      <li>수정일 순</li>
                    </ul>
                  </li>
                  <li><strong>필터링:</strong> 일반 메모 / 비밀 메모 탭으로 구분</li>
                </BulletList>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#43e97b" $color2="#38f9d7">
                  <Trash2 size={18} />
                </FeatureIconBadge>
                휴지통
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  삭제한 메모는 휴지통에 임시 보관되며, 완전히 삭제하거나 복원할 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li>삭제된 메모는 30일간 휴지통에 보관</li>
                  <li>휴지통에서 메모 복원 또는 영구 삭제 가능</li>
                  <li><strong>전체 비우기</strong>로 휴지통의 모든 메모를 한 번에 삭제</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    30일이 지나면 휴지통의 메모는 자동으로 영구 삭제됩니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>
          </>
        );

      case 'secret':
        return (
          <>
            <CategoryTitle>
              <Lock size={32} />
              시크릿
            </CategoryTitle>
            <MainCategoryDescription>
              비밀번호로 보호되는 안전한 메모 공간입니다. 중요하거나 개인적인 내용을 안전하게 보관할 수 있습니다.
            </MainCategoryDescription>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#667eea" $color2="#764ba2">
                  <Lock size={18} />
                </FeatureIconBadge>
                시크릿 메모란?
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  시크릿 메모는 비밀번호로 보호되는 특별한 메모 공간입니다. 일반 메모와 별도로 관리되며, 접근 시 비밀번호 입력이 필요합니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>강력한 보안:</strong> 설정한 비밀번호로만 접근 가능</li>
                  <li><strong>별도 저장:</strong> 일반 메모와 완전히 분리된 공간</li>
                  <li><strong>자동 잠금:</strong> 일정 시간 이후 자동으로 잠금</li>
                </BulletList>
                <WarningBox>
                  <WarningIcon>⚠️</WarningIcon>
                  <WarningText>
                    <strong>중요:</strong> 비밀번호를 분실하면 시크릿 메모를 복구할 수 없습니다. 반드시 기억할 수 있는 비밀번호를 사용하세요.
                  </WarningText>
                </WarningBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#f093fb" $color2="#f5576c">
                  <Shield size={18} />
                </FeatureIconBadge>
                비밀번호 설정
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  시크릿 메모를 처음 사용할 때 비밀번호를 설정합니다.
                </FeatureDescription>
                <StepList>
                  <li><strong>시크릿</strong> 탭 선택</li>
                  <li>비밀번호 설정 화면에서 원하는 비밀번호 입력 (4~20자)</li>
                  <li>비밀번호 확인을 위해 한 번 더 입력</li>
                  <li><strong>설정</strong> 버튼으로 비밀번호 등록</li>
                </StepList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    <strong>팁:</strong> 비밀번호는 숫자, 문자, 특수문자를 조합하여 안전하게 만드세요.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#4facfe" $color2="#00f2fe">
                  <FileText size={18} />
                </FeatureIconBadge>
                시크릿 메모 작성
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  일반 메모와 동일한 방식으로 작성하되, 비밀번호로 보호됩니다.
                </FeatureDescription>
                <StepList>
                  <li><strong>시크릿</strong> 탭에서 비밀번호 입력</li>
                  <li>우측 하단의 <strong>+ 버튼</strong> 탭</li>
                  <li>제목과 내용 입력</li>
                  <li>서식 도구로 텍스트 꾸미기 가능</li>
                  <li><strong>저장</strong> 버튼으로 메모 저장</li>
                </StepList>
                <BulletList>
                  <li>이미지 첨부 가능</li>
                  <li>링크 삽입 가능</li>
                  <li>리치 텍스트 편집 지원</li>
                </BulletList>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#43e97b" $color2="#38f9d7">
                  <Search size={18} />
                </FeatureIconBadge>
                시크릿 메모 관리
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  작성한 시크릿 메모를 검색하고 관리할 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>검색:</strong> 상단 검색창에서 제목이나 내용으로 검색</li>
                  <li><strong>정렬:</strong> 최신순, 오래된 순, 제목순으로 정렬</li>
                  <li><strong>수정:</strong> 메모를 탭하여 내용 수정</li>
                  <li><strong>삭제:</strong> 휴지통으로 이동 (30일간 보관)</li>
                </BulletList>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#fa709a" $color2="#fee140">
                  <Lock size={18} />
                </FeatureIconBadge>
                비밀번호 변경
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  보안을 위해 정기적으로 비밀번호를 변경할 수 있습니다.
                </FeatureDescription>
                <StepList>
                  <li>시크릿 탭 우측 상단 <strong>⋮</strong> 메뉴 탭</li>
                  <li><strong>비밀번호 변경</strong> 선택</li>
                  <li>현재 비밀번호 입력</li>
                  <li>새 비밀번호 입력 및 확인</li>
                  <li><strong>변경</strong> 버튼으로 적용</li>
                </StepList>
                <WarningBox>
                  <WarningIcon>⚠️</WarningIcon>
                  <WarningText>
                    비밀번호 변경 후에는 새 비밀번호로만 시크릿 메모에 접근할 수 있습니다.
                  </WarningText>
                </WarningBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#a8edea" $color2="#fed6e3">
                  <Clock size={18} />
                </FeatureIconBadge>
                자동 잠금
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  일정 시간 동안 활동이 없으면 자동으로 잠금되어 보안을 강화합니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>즉시 잠금:</strong> 다른 탭으로 이동 시 즉시 잠금</li>
                  <li><strong>시간 설정:</strong> 1분, 5분, 10분 후 자동 잠금 (설정 가능)</li>
                  <li><strong>앱 종료 시:</strong> 앱을 종료하면 자동으로 잠금</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    보안을 위해 시크릿 메모 사용 후에는 반드시 잠금 또는 다른 탭으로 이동하세요.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>
          </>
        );

      case 'sidemenu':
        return (
          <>
            <CategoryTitle>
              <Menu size={32} />
              사이드 메뉴
            </CategoryTitle>
            <MainCategoryDescription>
              앱의 각종 설정과 계정 관리, 데이터 백업 등의 기능을 제공합니다.
            </MainCategoryDescription>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#667eea" $color2="#764ba2">
                  <Users size={18} />
                </FeatureIconBadge>
                프로필 설정
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  프로필 사진과 닉네임을 설정하여 자신을 표현할 수 있습니다.
                </FeatureDescription>
                <StepList>
                  <li>좌측 상단의 <strong>프로필 사진</strong> 탭</li>
                  <li><strong>프로필 편집</strong> 선택</li>
                  <li>닉네임 변경 또는 프로필 사진 선택</li>
                  <li>아바타 또는 갤러리에서 사진 선택 가능</li>
                  <li><strong>저장</strong> 버튼으로 변경 사항 적용</li>
                </StepList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    프로필 사진은 채팅방과 친구 목록에서 다른 사용자에게 표시됩니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#f093fb" $color2="#f5576c">
                  <Users size={18} />
                </FeatureIconBadge>
                친구 관리
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  친구를 추가하고 관리할 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>친구 추가:</strong> ShareNote ID로 친구 검색 및 추가</li>
                  <li><strong>친구 요청:</strong> 받은 친구 요청 수락/거부</li>
                  <li><strong>친구 목록:</strong> 추가된 친구 목록 확인</li>
                  <li><strong>친구 삭제:</strong> 더 이상 친구로 유지하고 싶지 않은 경우 삭제</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    ShareNote ID는 사용자 프로필에서 확인할 수 있으며, 복사하여 친구에게 공유할 수 있습니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#4facfe" $color2="#00f2fe">
                  <Shield size={18} />
                </FeatureIconBadge>
                차단 관리
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  원하지 않는 사용자를 차단하여 메시지를 받지 않을 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>차단하기:</strong> 그룹 채팅에서 사용자 프로필 탭 후 차단하기 선택</li>
                  <li><strong>차단 목록:</strong> 사이드 메뉴에서 차단한 사용자 목록 확인</li>
                  <li><strong>차단 해제:</strong> 차단 목록에서 차단 해제 가능</li>
                  <li><strong>차단 효과:</strong> 차단한 사용자의 메시지는 보이지 않으며, 1:1 대화 불가</li>
                </BulletList>
                <WarningBox>
                  <WarningIcon>⚠️</WarningIcon>
                  <WarningText>
                    차단 해제 후 다시 친구로 추가하려면 해당 사용자의 ShareNote ID가 필요합니다.
                  </WarningText>
                </WarningBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#43e97b" $color2="#38f9d7">
                  <Bell size={18} />
                </FeatureIconBadge>
                알림 설정
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  앱의 알림과 소리를 원하는 대로 설정할 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>알림 켜기/끄기:</strong> 전체 알림 활성화/비활성화</li>
                  <li><strong>소리 설정:</strong> 알림음 켜기/끄기 및 음량 조절</li>
                  <li><strong>알림음 선택:</strong> 원하는 알림음 선택</li>
                  <li><strong>진동 설정:</strong> 알림 수신 시 진동 활성화/비활성화</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    채팅방별로 개별 알림 설정도 가능합니다. 채팅방 설정 메뉴를 이용하세요.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#fa709a" $color2="#fee140">
                  <Download size={18} />
                </FeatureIconBadge>
                데이터 백업 및 복원
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  중요한 데이터를 백업하고 다른 기기에서 복원할 수 있습니다.
                </FeatureDescription>
                <StepList>
                  <li>사이드 메뉴에서 <strong>데이터 백업</strong> 선택</li>
                  <li>Firestore에 현재 기기의 데이터 백업</li>
                  <li>다른 기기에서 <strong>데이터 복원</strong> 선택</li>
                  <li>백업된 데이터를 불러와 복원</li>
                </StepList>
                <WarningBox>
                  <WarningIcon>⚠️</WarningIcon>
                  <WarningText>
                    <strong>주의:</strong> 데이터 복원 시 현재 기기의 로컬 데이터가 백업 데이터로 대체됩니다. 복원 전 현재 데이터를 백업하는 것을 권장합니다.
                  </WarningText>
                </WarningBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#a8edea" $color2="#fed6e3">
                  <Trash2 size={18} />
                </FeatureIconBadge>
                기기 데이터 삭제
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  현재 기기의 로컬 데이터를 완전히 삭제할 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li>모든 메모, 스케줄, 비밀 메모 등 로컬 데이터 삭제</li>
                  <li>Firestore 데이터는 삭제되지 않음</li>
                  <li>삭제 후 데이터 복원을 통해 다시 불러올 수 있음</li>
                </BulletList>
                <WarningBox>
                  <WarningIcon>⚠️</WarningIcon>
                  <WarningText>
                    <strong>경고:</strong> 이 작업은 되돌릴 수 없습니다. 삭제 전 반드시 데이터를 백업하세요.
                  </WarningText>
                </WarningBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#667eea" $color2="#764ba2">
                  <Book size={18} />
                </FeatureIconBadge>
                사용설명서
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  앱의 모든 기능을 자세히 설명하는 가이드입니다.
                </FeatureDescription>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    <strong>팁:</strong> 지금 보고 계신 이 화면이 바로 사용설명서입니다! 언제든지 사이드 메뉴에서 다시 열 수 있습니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#f093fb" $color2="#f5576c">
                  <Trash2 size={18} />
                </FeatureIconBadge>
                휴지통
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  삭제한 메모를 확인하고 복원하거나 영구 삭제할 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li>삭제된 메모는 30일간 휴지통에 보관</li>
                  <li>메모 복원 또는 영구 삭제 가능</li>
                  <li><strong>전체 비우기</strong>로 모든 메모 한 번에 삭제</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    30일이 지나면 휴지통의 메모는 자동으로 영구 삭제됩니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>
          </>
        );

      case 'chat':
        return (
          <>
            <CategoryTitle>
              <MessageCircle size={32} />
              채팅
            </CategoryTitle>
            <MainCategoryDescription>
              친구들과 1:1 대화를 나누고, 그룹 채팅방에서 여러 사람과 소통할 수 있습니다.
            </MainCategoryDescription>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#667eea" $color2="#764ba2">
                  <MessageCircle size={18} />
                </FeatureIconBadge>
                1:1 대화
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  친구와 개인적인 대화를 나눌 수 있습니다.
                </FeatureDescription>
                <StepList>
                  <li><strong>친구</strong> 탭에서 대화하고 싶은 친구 선택</li>
                  <li><strong>메시지 보내기</strong> 버튼 탭</li>
                  <li>대화창에서 메시지 입력 및 전송</li>
                  <li>사진, 이모티콘 전송 가능</li>
                </StepList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    읽지 않은 메시지는 채팅 목록에 <strong>빨간 숫자</strong>로 표시됩니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#f093fb" $color2="#f5576c">
                  <Users size={18} />
                </FeatureIconBadge>
                그룹 채팅
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  여러 친구들과 함께 그룹 채팅방을 만들어 대화할 수 있습니다.
                </FeatureDescription>
                <StepList>
                  <li><strong>채팅</strong> 탭에서 <strong>+ 그룹 만들기</strong> 버튼 탭</li>
                  <li>그룹 이름 입력</li>
                  <li>초대할 친구 선택</li>
                  <li><strong>만들기</strong> 버튼으로 그룹 생성</li>
                </StepList>
                <BulletList>
                  <li><strong>멤버 초대:</strong> 그룹 설정에서 추가 멤버 초대 가능</li>
                  <li><strong>초대 코드:</strong> 6자리 코드로 다른 사용자 초대</li>
                  <li><strong>권한 관리:</strong> 방장이 부방장 지정, 멤버 강퇴 가능</li>
                </BulletList>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#4facfe" $color2="#00f2fe">
                  <Search size={18} />
                </FeatureIconBadge>
                대화 검색
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  대화 내용에서 특정 메시지를 빠르게 찾을 수 있습니다.
                </FeatureDescription>
                <StepList>
                  <li>대화창 우측 상단 <strong>⋮</strong> 메뉴 탭</li>
                  <li><strong>대화 검색</strong> 선택</li>
                  <li>검색어 입력</li>
                  <li>화살표 버튼으로 검색 결과 이동</li>
                </StepList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    검색은 현재 불러온 메시지 중에서만 가능합니다. <strong>이전 대화 불러오기</strong>로 더 많은 메시지를 불러온 후 검색하세요.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#43e97b" $color2="#38f9d7">
                  <FileText size={18} />
                </FeatureIconBadge>
                협업 문서
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  그룹 채팅방에서 함께 문서를 작성하고 편집할 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>문서 생성:</strong> 우측 상단 메뉴에서 <strong>협업 문서</strong> 선택</li>
                  <li><strong>실시간 동기화:</strong> 여러 사람이 동시에 편집 가능</li>
                  <li><strong>버전 관리:</strong> 자동 저장 및 변경 이력 추적</li>
                  <li><strong>마커 댓글:</strong> 문서의 특정 부분에 댓글 달기</li>
                  <li><strong>문서 다운로드:</strong> HTML 또는 텍스트 형식으로 다운로드</li>
                </BulletList>
                <WarningBox>
                  <WarningIcon>⚠️</WarningIcon>
                  <WarningText>
                    협업 문서는 그룹 채팅방에서만 사용할 수 있습니다.
                  </WarningText>
                </WarningBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#fa709a" $color2="#fee140">
                  <Smile size={18} />
                </FeatureIconBadge>
                이모티콘
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  다양한 이모티콘으로 대화를 더 풍성하게 만들 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li>메시지 입력창 좌측의 <strong>😊</strong> 버튼 탭</li>
                  <li>카테고리별로 정리된 이모티콘 선택</li>
                  <li>탭 한 번으로 메시지에 삽입</li>
                </BulletList>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#a8edea" $color2="#fed6e3">
                  <Bell size={18} />
                </FeatureIconBadge>
                알림 설정
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  채팅방별로 알림을 개별 설정할 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li>대화창에서 <strong>⋮</strong> 메뉴 → <strong>채팅방 설정</strong></li>
                  <li><strong>알림 켜기/끄기:</strong> 채팅방별 알림 제어</li>
                  <li><strong>알림음 선택:</strong> 원하는 알림음 설정</li>
                  <li><strong>음량 조절:</strong> 알림음 크기 조절</li>
                </BulletList>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#667eea" $color2="#764ba2">
                  <Shield size={18} />
                </FeatureIconBadge>
                차단 기능
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  원하지 않는 사용자를 차단하여 메시지를 받지 않을 수 있습니다.
                </FeatureDescription>
                <StepList>
                  <li>그룹 채팅방에서 차단하려는 사용자의 프로필 사진 탭</li>
                  <li><strong>차단하기</strong> 버튼 선택</li>
                  <li>확인 후 차단 완료</li>
                </StepList>
                <BulletList>
                  <li>차단한 사용자의 메시지는 보이지 않음</li>
                  <li>차단된 사용자는 나에게 1:1 대화를 걸 수 없음</li>
                  <li><strong>설정</strong> → <strong>차단 목록</strong>에서 차단 해제 가능</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    차단 해제 후 다시 친구로 추가하려면 해당 사용자의 ID를 복사해두세요.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Overlay onClick={onClose}>
      <GuideContainer onClick={(e) => e.stopPropagation()}>
        <Header>
          <HeaderTitle>
            <TitleIcon>
              <Book size={22} />
            </TitleIcon>
            <TitleText>ShareNote 사용설명서</TitleText>
          </HeaderTitle>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </Header>

        <ContentWrapper>
          <Sidebar>
            <CategorySelector>
              {/* 선택된 카테고리 표시 */}
              <SelectedCategory onClick={() => setIsListExpanded(!isListExpanded)}>
                {selectedCategoryData && (
                  <>
                    {(() => {
                      const Icon = selectedCategoryData.icon;
                      return <Icon size={18} />;
                    })()}
                    <CategoryName>{selectedCategoryData.name}</CategoryName>
                  </>
                )}
                <ExpandButton $expanded={isListExpanded}>
                  <ChevronDown size={16} />
                </ExpandButton>
              </SelectedCategory>

              {/* 펼쳐지는 카테고리 리스트 */}
              <CategoryList $expanded={isListExpanded}>
                {CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const isSelected = category.id === activeCategory;

                  return (
                    <CategoryItem
                      key={category.id}
                      $selected={isSelected}
                      onClick={() => handleCategorySelect(category.id)}
                    >
                      <Icon size={16} />
                      <CategoryItemName $selected={isSelected}>
                        {category.name}
                      </CategoryItemName>
                    </CategoryItem>
                  );
                })}
              </CategoryList>
            </CategorySelector>
          </Sidebar>

          <MainContent>
            {activeCategory && renderContent()}
          </MainContent>
        </ContentWrapper>
      </GuideContainer>
    </Overlay>
  );
};

export default UserGuide;
