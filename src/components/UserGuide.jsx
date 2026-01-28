// 사용설명서 컴포넌트
import { useState } from 'react';
import styled from 'styled-components';
import { X, ChevronDown, Book, Calendar, MessageCircle, Users, Settings, Smile, Bell, Shield, FileText, Search, Download, Share2, Clock, Trash2, Lock, Menu, Snowflake, Link, Star, Eye } from 'lucide-react';
import topToolbarImage from '../assets/images/top1.png';
import bottomToolbarImage from '../assets/images/bottom1.png';

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

const ToolbarImage = styled.img`
  width: 100%;
  max-width: 600px;
  height: auto;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin: 16px 0;
  display: block;
`;

const ImageCaption = styled.div`
  font-size: 13px;
  color: #888;
  text-align: center;
  margin-top: -8px;
  margin-bottom: 16px;
`;

const InlineBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  vertical-align: middle;
  margin: 0 4px;

  ${props => props.$type === 'frozen' && `
    background: rgba(74, 144, 226, 0.2);
    border: 1px solid #4a90e2;
    color: #4a90e2;
  `}

  ${props => props.$type === 'shared' && `
    background: rgba(102, 126, 234, 0.2);
    border: 1px solid #667eea;
    color: #667eea;
  `}

  ${props => props.$type === 'folder' && `
    background: rgba(34, 197, 94, 0.2);
    border: 1px solid rgba(34, 197, 94, 0.5);
    color: #22c55e;
  `}

  ${props => props.$type === 'important' && `
    background: rgba(255, 193, 7, 0.15);
    color: #ffc107;
    border: 1px solid #ffc107;
  `}
`;

const CATEGORIES = [
  {
    id: 'home',
    name: '홈화면',
    icon: Book,
    description: '앱의 시작 화면 및 기본 기능',
  },
  {
    id: 'sidemenu',
    name: '사이드 메뉴',
    icon: Menu,
    description: '설정 및 앱 관리 기능',
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
              ShareNote 앱의 시작 화면입니다. 메모, 일정, 대화 등 모든 기능에 빠르게 접근할 수 있습니다.
            </MainCategoryDescription>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#667eea" $color2="#764ba2">
                  <Book size={18} />
                </FeatureIconBadge>
                헤더 영역
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  화면 상단에 위치한 헤더는 프로필 정보와 주요 기능 버튼을 제공합니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>프로필 영역 (좌측):</strong> 프로필 사진/아바타, 닉네임, 인사말이 표시됩니다. 탭하면 프로필 페이지로 이동하며, 로그아웃 상태에서는 "로그인" 텍스트가 표시되어 로그인 모달을 엽니다.</li>
                  <li><strong>검색 버튼 (우측):</strong> 메모, 일정, 휴지통 항목 등을 통합 검색할 수 있습니다.</li>
                  <li><strong>햄버거 메뉴 (우측):</strong> 사이드 메뉴를 열어 설정, 친구 관리, 휴지통, 백업/복원 등의 기능에 접근할 수 있습니다.</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    <strong>팁:</strong> 프로필 영역을 탭하면 프로필 편집, ShareNote ID 확인, 문의하기 등을 이용할 수 있습니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#f093fb" $color2="#f5576c">
                  <FileText size={18} />
                </FeatureIconBadge>
                위젯 영역
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  홈화면 중앙에는 주요 기능의 현황을 한눈에 볼 수 있는 위젯이 배치되어 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>메모장 위젯:</strong> 전체 메모 개수가 표시되며, 탭하면 메모 페이지로 이동합니다.</li>
                  <li><strong>캘린더 위젯:</strong> 등록된 일정 개수가 표시되며, 탭하면 캘린더 페이지로 이동합니다.</li>
                  <li><strong>시크릿 위젯:</strong> 비밀번호로 보호되는 시크릿 메모 개수가 표시되며, 탭하면 시크릿 페이지로 이동합니다.</li>
                  <li><strong>대화 위젯:</strong> 최근 받은 메시지가 미리보기로 표시되며, 탭하면 채팅 페이지로 이동합니다.</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    위젯을 탭하면 해당 기능 페이지로 바로 이동할 수 있어, 원하는 작업을 빠르게 시작할 수 있습니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#4facfe" $color2="#00f2fe">
                  <Clock size={18} />
                </FeatureIconBadge>
                최근 활동
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  앱에서 수행한 주요 작업들이 시간 순서대로 기록됩니다. 활동 기록을 탭하면 해당 항목으로 바로 이동할 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>메모 관련:</strong> 메모 작성, 수정, 삭제, 복원</li>
                  <li><strong>일정 관련:</strong> 스케줄 등록, 수정, 삭제, 복원</li>
                  <li><strong>알람 관련:</strong> 알람 등록, 수정, 삭제</li>
                  <li><strong>백업/복원:</strong> 백업 완료(휴대폰/Google Drive), 복원 완료(휴대폰/Google Drive)</li>
                  <li><strong>동기화:</strong> Firestore 동기화 완료</li>
                  <li><strong>비밀글:</strong> 비밀글 복원</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    최근 활동 기록은 작업 내역을 추적하고, 실수로 삭제한 항목을 빠르게 찾는 데 유용합니다. 각 활동 우측의 <strong>×</strong> 버튼으로 기록을 삭제할 수 있습니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#43e97b" $color2="#38f9d7">
                  <Menu size={18} />
                </FeatureIconBadge>
                푸터 영역 (하단 탭)
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  화면 하단에는 주요 기능 페이지로 빠르게 이동할 수 있는 탭 버튼이 배치되어 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>홈:</strong> 홈화면으로 이동</li>
                  <li><strong>메모:</strong> 메모 페이지로 이동</li>
                  <li><strong>캘린더:</strong> 일정 관리 페이지로 이동</li>
                  <li><strong>시크릿:</strong> 비밀 메모 페이지로 이동</li>
                  <li><strong>채팅:</strong> 채팅 목록 페이지로 이동</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    위젯을 탭하거나 하단 탭 버튼을 사용하여 원하는 페이지로 자유롭게 이동할 수 있습니다.
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
              일정을 체계적으로 관리하고 중요한 스케줄을 알람으로 놓치지 않을 수 있습니다. 기념일 반복 설정과 다양한 알람 옵션을 제공합니다.
            </MainCategoryDescription>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#667eea" $color2="#764ba2">
                  <Calendar size={18} />
                </FeatureIconBadge>
                캘린더 날짜 선택하기
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  캘린더에서 날짜를 선택하여 일정을 추가하거나 확인할 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>날짜 탭:</strong> 캘린더에서 원하는 날짜를 탭하여 선택</li>
                  <li><strong>일정 표시:</strong> 일정이 등록된 날짜는 색상 점으로 표시됩니다</li>
                  <li><strong>오늘 날짜:</strong> 오늘 날짜는 특별한 색상으로 강조 표시</li>
                  <li><strong>미리보기:</strong> 선택한 날짜의 일정이 하단에 미리보기로 표시됩니다</li>
                </BulletList>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#f093fb" $color2="#f5576c">
                  <FileText size={18} />
                </FeatureIconBadge>
                일정 작성하기 (편집 화면)
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  날짜를 선택한 후 + 버튼을 탭하면 일정 편집 화면이 열립니다. 메모와 동일한 리치 텍스트 에디터를 사용합니다.
                </FeatureDescription>
                <StepList>
                  <li>캘린더에서 날짜를 탭하여 선택</li>
                  <li>우측 하단의 <strong>+ 버튼</strong> 탭 (또는 미리보기 영역을 더블클릭)</li>
                  <li>일정 편집 화면에서 내용 입력</li>
                  <li>우측 상단의 <strong>저장</strong> 버튼 탭 (또는 화면을 더블클릭하여 저장)</li>
                </StepList>
                <BulletList>
                  <li><strong>텍스트 서식:</strong> 굵게, 기울임, 밑줄, 취소선 등 다양한 서식 지원</li>
                  <li><strong>색상:</strong> 글자색 변경, 형광펜/배경색 적용</li>
                  <li><strong>정렬:</strong> 왼쪽, 가운데, 오른쪽 정렬</li>
                  <li><strong>목록:</strong> 글머리 기호, 번호 매기기</li>
                  <li><strong>인용구:</strong> 인용 블록 삽입</li>
                  <li><strong>이미지:</strong> 이미지 삽입 (최대 5MB, 자동 리사이즈)</li>
                  <li><strong>YouTube:</strong> YouTube 영상 삽입</li>
                  <li><strong>링크:</strong> 웹 링크 삽입</li>
                  <li><strong>실행 취소/다시 실행:</strong> 작성 내용 되돌리기</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    일정 편집 화면에서 화면을 더블클릭하면 빠르게 저장할 수 있습니다. 변경 사항이 없으면 더블클릭 시 바로 닫힙니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#4facfe" $color2="#00f2fe">
                  <Eye size={18} />
                </FeatureIconBadge>
                미리보기 창
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  캘린더 하단의 미리보기 영역에서 선택한 날짜의 일정을 바로 확인할 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>일정 내용 확인:</strong> 선택한 날짜에 등록된 일정 내용이 미리보기로 표시</li>
                  <li><strong>더블클릭으로 편집:</strong> 미리보기 영역을 더블클릭하면 편집 화면으로 전환</li>
                  <li><strong>알람 버튼:</strong> 미리보기 우측의 알람 아이콘을 탭하여 알람 설정 화면 열기</li>
                  <li><strong>빠른 확인:</strong> 일정을 클릭하지 않고도 내용을 빠르게 확인 가능</li>
                </BulletList>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#43e97b" $color2="#38f9d7">
                  <Bell size={18} />
                </FeatureIconBadge>
                알람 등록하기
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  일정에 알람을 등록하여 중요한 스케줄을 놓치지 않을 수 있습니다.
                </FeatureDescription>
                <StepList>
                  <li>캘린더에서 날짜를 선택한 후 미리보기 영역의 <Bell size={16} style={{display: 'inline-block', verticalAlign: 'middle'}} /> 알람 아이콘 탭</li>
                  <li>알람 설정 화면에서 <strong>알람 제목</strong> 입력</li>
                  <li><strong>시간 설정:</strong> 시(00-23)와 분(00-59) 입력</li>
                  <li><strong>등록</strong> 버튼을 탭하여 알람 저장</li>
                </StepList>
                <BulletList>
                  <li><strong>알람 목록:</strong> 해당 날짜에 등록된 모든 알람이 목록으로 표시됩니다</li>
                  <li><strong>알람 수정:</strong> 알람을 탭하면 수정 화면이 열립니다</li>
                  <li><strong>알람 삭제:</strong> 알람 옆의 삭제 버튼으로 제거 가능</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    하나의 날짜에 여러 개의 알람을 등록할 수 있습니다. 예를 들어, 같은 날 오전 회의와 오후 미팅 알람을 각각 설정할 수 있습니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#fa709a" $color2="#fee140">
                  <Settings size={18} />
                </FeatureIconBadge>
                알람 설정 옵션
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  알람 등록 화면 하단의 "알람 옵션 표시" 버튼을 탭하면 상세 옵션을 설정할 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>알림 유형:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      <li><strong>소리만:</strong> 알람음만 재생</li>
                      <li><strong>진동만:</strong> 진동만 작동</li>
                      <li><strong>소리+진동:</strong> 알람음과 진동 함께 작동 (기본값)</li>
                    </ul>
                  </li>
                  <li><strong>알람 소리 설정:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      <li><strong>기본 알람음:</strong> 앱에서 제공하는 기본 소리</li>
                      <li><strong>사용자 지정:</strong> 파일 선택 버튼으로 원하는 소리 파일 업로드 가능</li>
                      <li><strong>미리듣기:</strong> 재생 버튼으로 선택한 알람음 확인</li>
                    </ul>
                  </li>
                  <li><strong>음량 조절:</strong> 슬라이더로 알람 음량 조절 (0-100%)</li>
                  <li><strong>사전 알림:</strong> 알람 시간 전에 미리 알림 (1분 전, 5분 전, 10분 전, 30분 전, 1시간 전)</li>
                  <li><strong>반복 설정:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      <li><strong>반복 간격:</strong> 알람이 꺼지지 않을 때 재생 간격 (1분, 3분, 5분, 10분)</li>
                      <li><strong>반복 횟수:</strong> 최대 몇 번까지 반복할지 설정 (1-10회)</li>
                    </ul>
                  </li>
                </BulletList>
                <WarningBox>
                  <WarningIcon>⚠️</WarningIcon>
                  <WarningText>
                    <strong>중요:</strong> 알람이 제대로 작동하려면 다음 조건이 필요합니다:<br/>
                    1. <strong>앱이 실행 중이어야 함</strong> - 앱을 스와이프로 완전 종료하면 알람이 울리지 않습니다<br/>
                    2. <strong>백그라운드 실행 허용</strong> - 배터리 최적화에서 앱을 제외해야 합니다<br/>
                    3. <strong>알림 권한 허용</strong> - 설정에서 알림 권한과 정확한 알람 권한을 허용해야 합니다
                  </WarningText>
                </WarningBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#a8edea" $color2="#fed6e3">
                  <Clock size={18} />
                </FeatureIconBadge>
                기념일과 일반 알람의 구분
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  알람은 일반 알람과 기념일로 구분되며, 기념일은 주기적으로 자동 반복됩니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>일반 알람:</strong> 특정 날짜 한 번만 울리는 알람 (회의, 약속 등)</li>
                  <li><strong>기념일:</strong> 주기적으로 반복되는 알람 (생일, 결혼기념일, 정기 모임 등)
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      <li>알람 등록 시 <strong>"기념일로 설정"</strong> 체크박스 선택</li>
                      <li>알람 주기를 <strong>매일, 매주, 매월, 매년</strong> 중 선택 가능</li>
                      <li>선택한 주기에 맞춰 자동으로 알람이 반복됩니다</li>
                    </ul>
                  </li>
                </BulletList>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#667eea" $color2="#764ba2">
                  <Calendar size={18} />
                </FeatureIconBadge>
                기념일 반복 주기 설정
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  기념일의 반복 주기를 다양하게 설정할 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>매일:</strong> 매일 같은 시간에 알람
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      <li>매일 복용하는 약, 매일 해야 하는 루틴 등에 활용</li>
                      <li><strong>중요:</strong> 매일 주기는 등록일에만 캘린더에 빨간색 점이 표시되며, 등록일 이후의 날짜에는 점 표시가 되지 않습니다</li>
                    </ul>
                  </li>
                  <li><strong>매주:</strong> 매주 같은 요일, 같은 시간에 알람
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      <li>주간 회의, 정기 모임 등에 활용</li>
                      <li>예: 매주 월요일 오전 10시</li>
                    </ul>
                  </li>
                  <li><strong>매월:</strong> 매월 같은 날짜, 같은 시간에 알람
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      <li>월세, 관리비, 정기 점검 등에 활용</li>
                      <li>예: 매월 25일 오후 2시</li>
                    </ul>
                  </li>
                  <li><strong>매년:</strong> 매년 같은 날짜, 같은 시간에 알람
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      <li>생일, 결혼기념일, 설날/추석 등에 활용</li>
                      <li>예: 매년 5월 15일 오전 9시</li>
                    </ul>
                  </li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    기념일 주기를 설정할 때 "알림시기"도 함께 설정할 수 있습니다. "당일"을 선택하면 기념일 당일에만 알람이 울리고, "N일 전"을 선택하면 기념일 며칠 전부터 카운트다운 알람을 받을 수 있습니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#fa709a" $color2="#fee140">
                  <Bell size={18} />
                </FeatureIconBadge>
                기념일 D-Day 알림 설정
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  기념일 며칠 전부터 카운트다운 알림을 받을 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>알림시기 선택:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      <li><strong>당일:</strong> 기념일 당일에만 알람</li>
                      <li><strong>N일 전:</strong> 기념일 며칠 전부터 알람 (D-Day 카운트다운)</li>
                    </ul>
                  </li>
                  <li><strong>D-Day 설정 방법:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      <li>"알림시기"에서 <strong>"N일 전"</strong> 선택</li>
                      <li>며칠 전부터 알림을 받을지 숫자 입력 (예: 7 입력)</li>
                      <li>입력한 일수만큼 기념일 전부터 매일 알람이 울립니다</li>
                    </ul>
                  </li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    예시: 5월 15일 생일을 매년 반복, 7일 전 알림 설정 시 → 매년 5월 8일(D-7)부터 5월 15일(D-Day)까지 매일 설정한 시간에 알람이 울립니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#4facfe" $color2="#00f2fe">
                  <FileText size={18} />
                </FeatureIconBadge>
                일정 및 알람 수정하기
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  등록된 일정과 알람을 수정하거나 삭제할 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>일정 수정:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      <li>캘린더에서 수정할 날짜 선택</li>
                      <li>미리보기 영역을 더블클릭하여 편집 화면 열기</li>
                      <li>내용 수정 후 저장 버튼 또는 더블클릭으로 저장</li>
                    </ul>
                  </li>
                  <li><strong>일반 알람 수정/삭제:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      <li>미리보기 영역의 알람 아이콘 탭</li>
                      <li>알람 목록에서 수정할 알람 탭하여 수정</li>
                      <li>삭제 버튼으로 알람 삭제 가능</li>
                    </ul>
                  </li>
                  <li><strong>기념일 알람 수정/삭제:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      <li><strong>중요:</strong> 기념일은 <strong>등록한 원본 날짜에서만</strong> 수정하거나 삭제할 수 있습니다</li>
                      <li>반복된 날짜(예: 다음 해 같은 날)에서는 수정/삭제 불가</li>
                      <li>기념일을 완전히 제거하려면 처음 등록한 날짜로 가서 삭제해야 합니다</li>
                    </ul>
                  </li>
                  <li><strong>일정 삭제:</strong> 편집 화면에서 내용을 모두 지우고 저장하면 일정 삭제</li>
                </BulletList>
                <WarningBox>
                  <WarningIcon>⚠️</WarningIcon>
                  <WarningText>
                    <strong>기념일 삭제 주의:</strong> 기념일은 등록한 원본 날짜에서만 삭제할 수 있습니다. 반복된 기념일(예: 2025년 생일, 2026년 생일)은 각각 별개의 날짜이므로, 원본 날짜(처음 등록한 날짜)에서 삭제해야 모든 반복이 중단됩니다.
                  </WarningText>
                </WarningBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#4facfe" $color2="#00f2fe">
                  <Bell size={18} />
                </FeatureIconBadge>
                알람 작동 방식
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  설정한 시간이 되면 알람이 울리고 알림창이 표시됩니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>알람 토스트:</strong> 화면에 알람 내용과 시간이 표시됩니다</li>
                  <li><strong>알람 소리:</strong> 설정한 알람음이 재생됩니다</li>
                  <li><strong>진동:</strong> 진동 옵션 선택 시 함께 작동</li>
                  <li><strong>알람 종료:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      <li><strong>확인 버튼:</strong> 알람 종료</li>
                      <li><strong>닫기 버튼:</strong> 알람 종료</li>
                      <li><strong>자동 반복:</strong> 종료하지 않으면 설정한 간격으로 다시 울림</li>
                    </ul>
                  </li>
                </BulletList>
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
              생각, 아이디어, 할 일 등을 자유롭게 기록하고 체계적으로 관리할 수 있는 메모 기능입니다. 리치 텍스트 편집, 폴더 정리, 검색, 공유 등 다양한 기능을 제공합니다.
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
                  강력한 리치 텍스트 에디터로 다양한 서식을 활용하여 메모를 작성할 수 있습니다.
                </FeatureDescription>
                <StepList>
                  <li>메모 페이지에서 우측 하단의 <strong>+ 버튼</strong> 탭</li>
                  <li>본문 내용 입력 및 서식 적용</li>
                  <li>상단/하단 도구바를 사용하여 텍스트 꾸미기</li>
                  <li>우측 상단의 <strong>저장</strong> 버튼 탭</li>
                </StepList>
                <BulletList>
                  <li><strong>텍스트 서식:</strong> 굵게(Ctrl+B), 기울임(Ctrl+I), 밑줄(Ctrl+U), 취소선</li>
                  <li><strong>색상:</strong> 글자색 변경 (프리셋 + 커스텀), 형광펜/배경색 (프리셋 + 커스텀)</li>
                  <li><strong>정렬:</strong> 왼쪽, 가운데, 오른쪽 정렬</li>
                  <li><strong>목록:</strong> 글머리 기호, 번호 매기기</li>
                  <li><strong>인용구:</strong> 인용 블록 삽입</li>
                  <li><strong>실행 취소/다시 실행:</strong> Ctrl+Z / Ctrl+Y</li>
                  <li><strong>이미지 삽입:</strong> 최대 5MB, 자동 리사이즈 (1200x1200)</li>
                  <li><strong>YouTube 영상 삽입:</strong> YouTube 링크로 영상 삽입</li>
                  <li><strong>매크로:</strong> 자주 사용하는 텍스트를 등록하여 빠르게 입력</li>
                </BulletList>
                <ToolbarImage src={topToolbarImage} alt="상단 도구바" />
                <ImageCaption>상단 도구바: 실행 취소/다시 실행, 텍스트 서식, 색상, 매크로</ImageCaption>
                <ToolbarImage src={bottomToolbarImage} alt="하단 도구바" />
                <ImageCaption>하단 도구바: 정렬, 목록, 인용구, 이미지/YouTube/링크 삽입</ImageCaption>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    <strong>팁:</strong> 매크로 기능을 사용하면 자주 쓰는 인사말, 주소, 연락처 등을 빠르게 입력할 수 있습니다. 사이드 메뉴의 "매크로"에서 등록하세요.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#f093fb" $color2="#f5576c">
                  <FileText size={18} />
                </FeatureIconBadge>
                읽기 모드와 편집 모드
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  메모는 읽기 모드와 편집 모드로 나뉘어 최적화된 경험을 제공합니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>읽기 모드 (기본):</strong> 다크 테마의 책/노트 스타일로 메모를 편안하게 읽을 수 있습니다.</li>
                  <li><strong>편집 모드 전환:</strong> 메모 본문을 더블클릭하거나 우측 상단의 편집 버튼을 탭하여 편집 모드로 전환</li>
                  <li><strong>텍스트 선택/복사:</strong> 읽기 모드에서도 텍스트 선택 및 복사 가능</li>
                  <li><strong>이미지 확대:</strong> 이미지를 탭하면 전체 화면으로 확대하여 볼 수 있습니다</li>
                  <li><strong>취소/저장:</strong> 편집 모드에서 취소 시 원본으로 복원, 저장 시 읽기 모드로 전환</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    읽기 모드에서는 스와이프로 이전/다음 메모로 빠르게 이동할 수 있지만, 편집 모드에서는 스와이프가 비활성화되어 텍스트 편집에 집중할 수 있습니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#4facfe" $color2="#00f2fe">
                  <Settings size={18} />
                </FeatureIconBadge>
                레이아웃 및 정렬
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  메모 목록을 다양한 방식으로 보고 정렬할 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>레이아웃 전환:</strong> 우측 상단의 레이아웃 버튼으로 그리드 뷰 ↔ 리스트 뷰 전환</li>
                  <li><strong>그리드 뷰:</strong> 메모를 카드 형태로 표시하여 한눈에 여러 메모 확인</li>
                  <li><strong>리스트 뷰:</strong> 메모를 목록 형태로 표시하여 많은 메모를 빠르게 탐색</li>
                  <li><strong>정렬 옵션:</strong> 날짜순, 중요도순 정렬 및 오름차순/내림차순 전환</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    중요한 메모를 먼저 보고 싶다면 중요도순 정렬을 사용하세요. 별표를 표시한 메모가 상단에 표시됩니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#43e97b" $color2="#38f9d7">
                  <FileText size={18} />
                </FeatureIconBadge>
                폴더로 메모 정리하기
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  메모를 폴더로 분류하여 체계적으로 관리할 수 있습니다. 공유 폴더 <InlineBadge $type="folder"><Share2 size={14} /> 공유</InlineBadge>를 제외하고 사용자 정의 폴더는 최대 4개까지 생성할 수 있습니다.
                </FeatureDescription>
                <StepList>
                  <li>메모 목록 상단의 폴더 탭에서 <strong>+ 버튼</strong> 탭</li>
                  <li>폴더 이름 입력 및 아이콘 선택 (26가지 아이콘 제공)</li>
                  <li><strong>추가</strong> 버튼으로 폴더 생성 (최대 4개)</li>
                  <li>메모 작성 시 현재 폴더에 자동 저장 또는 상세 화면에서 폴더 변경</li>
                </StepList>
                <BulletList>
                  <li><strong>폴더 개수 제한:</strong> 기본 폴더(전체 📋, 공유 🔗) 외에 사용자 정의 폴더는 최대 4개까지 생성 가능</li>
                  <li><strong>폴더 전환:</strong> 상단의 폴더 탭을 탭하여 원하는 폴더의 메모만 보기</li>
                  <li><strong>폴더 편집:</strong> 폴더를 길게 누르면 이름, 아이콘 변경 및 삭제 가능</li>
                  <li><strong>폴더 삭제:</strong> 폴더를 삭제해도 메모는 삭제되지 않고 "전체" 폴더로 이동</li>
                  <li><strong>전체 폴더 📋:</strong> 모든 메모를 표시하는 기본 폴더 (삭제 불가)</li>
                  <li><strong>공유 폴더 <InlineBadge $type="folder"><Share2 size={14} /> 공유</InlineBadge>:</strong> ShareNote의 기본 폴더이며 삭제할 수 없습니다. <strong>대화방에서 공유할 수 있는 문서는 이 폴더 안에 있는 메모만 가능합니다.</strong> 공유 기능을 사용하려면 먼저 메모를 이 폴더로 이동해야 합니다.</li>
                </BulletList>
                <WarningBox>
                  <WarningIcon>⚠️</WarningIcon>
                  <WarningText>
                    <strong>중요:</strong> 공유 폴더 <InlineBadge $type="folder"><Share2 size={14} /> 공유</InlineBadge>는 ShareNote의 핵심 기능입니다. 채팅방에서 협업 문서로 공유하려면 반드시 이 폴더에 메모를 넣어야 합니다. 공유 폴더는 삭제할 수 없는 기본 폴더입니다.
                  </WarningText>
                </WarningBox>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    폴더는 "업무", "개인", "아이디어", "학습" 등 주제별로 분류하여 메모를 효율적으로 관리할 수 있습니다. 각 폴더마다 고유한 아이콘을 설정하면 더욱 쉽게 구분할 수 있습니다. 기본 폴더 2개(전체, 공유)를 제외하고 최대 4개의 사용자 정의 폴더를 만들어 총 6개의 폴더를 사용할 수 있습니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#fa709a" $color2="#fee140">
                  <FileText size={18} />
                </FeatureIconBadge>
                선택 모드 및 일괄 작업
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  여러 메모를 동시에 선택하여 일괄 작업을 수행할 수 있습니다.
                </FeatureDescription>
                <StepList>
                  <li>메모 목록 우측 상단의 <strong>선택</strong> 버튼 탭 (또는 메모를 길게 눌러 선택 모드 진입)</li>
                  <li>작업할 메모들을 탭하여 선택 (선택된 메모는 체크 표시)</li>
                  <li>하단에 나타나는 작업 버튼 선택:
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      <li><strong>중요 표시/해제:</strong> 선택한 메모를 중요 메모로 표시하거나 해제</li>
                      <li><strong>폴더 이동:</strong> 선택한 메모를 다른 폴더로 이동</li>
                      <li><strong>공유:</strong> 선택한 메모를 공유 폴더로 이동</li>
                      <li><strong>삭제:</strong> 선택한 메모를 휴지통으로 이동</li>
                    </ul>
                  </li>
                  <li><strong>완료</strong> 버튼으로 선택 모드 종료</li>
                </StepList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    여러 메모를 한 번에 정리할 때 <strong>메모를 길게 눌러</strong> 선택 모드로 진입하면 더욱 빠릅니다. 예를 들어, 완료된 할 일 메모들을 선택하여 한 번에 삭제하거나 보관 폴더로 이동할 수 있습니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#a8edea" $color2="#fed6e3">
                  <Star size={18} />
                </FeatureIconBadge>
                중요 메모
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  중요한 메모를 <InlineBadge $type="important"><Star size={14} /></InlineBadge> 별표로 표시하여 우선순위를 관리할 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>중요 표시:</strong> 메모 상세 화면 우측 상단의 <Star size={16} style={{display: 'inline-block', verticalAlign: 'middle'}} /> 별표 아이콘을 탭하여 중요 메모로 표시. 중요 메모는 <InlineBadge $type="important"><Star size={14} /></InlineBadge> 배지가 표시됩니다.</li>
                  <li><strong>일괄 중요 표시:</strong> 선택 모드에서 여러 메모를 선택한 후 중요 표시 버튼으로 한 번에 설정 가능</li>
                  <li><strong>중요 메모 정렬:</strong> 정렬 옵션에서 "중요도순"을 선택하면 중요 메모가 상단에 표시됨</li>
                  <li><strong>중요 표시 해제:</strong> 별표 아이콘을 다시 탭하여 일반 메모로 변경</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    중요 메모 기능을 활용하여 급한 업무, 중요한 아이디어, 우선 처리할 할 일 등을 효과적으로 관리할 수 있습니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#667eea" $color2="#764ba2">
                  <Share2 size={18} />
                </FeatureIconBadge>
                메모 공유하기
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  작성한 메모를 공유 폴더 <InlineBadge $type="folder"><Share2 size={14} /> 공유</InlineBadge>로 이동하여 대화방에서 공유하거나, 외부 앱으로 공유할 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>공유 폴더로 이동:</strong> 선택 모드에서 메모를 선택한 후 <InlineBadge $type="shared"><Share2 size={14} /> 공유</InlineBadge> 버튼을 탭하면 공유 폴더로 이동됩니다. <strong>이 폴더에 있는 메모만 대화방에서 공유할 수 있습니다.</strong></li>
                  <li><strong>대화방에서 공유:</strong> 공유 폴더 <InlineBadge $type="folder"><Share2 size={14} /> 공유</InlineBadge>의 메모만 채팅방의 협업 문서로 공유 가능</li>
                  <li><strong>외부 공유:</strong> 메모 상세 화면에서 ⋮ 메뉴 → "공유" 선택
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      <li><strong>텍스트로 공유:</strong> 서식 없이 순수 텍스트만 공유</li>
                      <li><strong>HTML로 공유:</strong> 굵게, 색상 등 서식이 포함된 형태로 공유</li>
                    </ul>
                  </li>
                  <li><strong>공유 해제:</strong> 공유 폴더의 메모를 선택하여 공유 해제 가능 (다른 폴더로 이동)</li>
                </BulletList>
                <WarningBox>
                  <WarningIcon>⚠️</WarningIcon>
                  <WarningText>
                    <strong>중요:</strong> 대화방에서 문서를 공유하려면 반드시 공유 폴더 <InlineBadge $type="folder"><Share2 size={14} /> 공유</InlineBadge>에 메모가 있어야 합니다. 다른 폴더의 메모는 대화방 공유가 불가능합니다.
                  </WarningText>
                </WarningBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#f093fb" $color2="#f5576c">
                  <Search size={18} />
                </FeatureIconBadge>
                메모 검색
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  많은 메모 중에서 원하는 메모를 빠르게 찾을 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>통합 검색:</strong> 홈화면 헤더의 검색 버튼을 탭하면 통합 검색 모달 열림</li>
                  <li><strong>검색 범위:</strong> 메모 내용, 제목, 일정, 휴지통 항목 검색 (비밀 메모 제외)</li>
                  <li><strong>검색 결과:</strong> 검색 결과를 탭하면 해당 메모/일정이 바로 열림</li>
                  <li><strong>실시간 검색:</strong> 입력하는 동안 즉시 검색 결과 표시</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    검색어를 입력할 때 키워드 일부만 입력해도 관련 메모를 찾을 수 있습니다. 예를 들어 "회의"를 검색하면 "회의록", "회의 준비" 등이 모두 검색됩니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#4facfe" $color2="#00f2fe">
                  <Clock size={18} />
                </FeatureIconBadge>
                메모 내비게이션
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  메모 상세 화면에서 이전/다음 메모로 빠르게 이동할 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>화살표 버튼:</strong> 메모 상세 화면 하단의 ← → 버튼으로 이전/다음 메모 이동</li>
                  <li><strong>스와이프 제스처:</strong> 읽기 모드에서 좌우로 스와이프하여 이동 (편집 모드에서는 비활성화)</li>
                  <li><strong>순서 유지:</strong> 현재 적용된 정렬 순서(날짜순/중요도순)대로 메모 탐색</li>
                  <li><strong>끝 알림:</strong> 첫 번째 또는 마지막 메모에 도달하면 더 이상 이동 불가</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    여러 메모를 연속으로 확인할 때 매번 목록으로 돌아갈 필요 없이 스와이프로 빠르게 탐색할 수 있어 편리합니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#43e97b" $color2="#38f9d7">
                  <Trash2 size={18} />
                </FeatureIconBadge>
                메모 삭제 및 휴지통
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  삭제한 메모는 휴지통에 임시 보관되며, 복원하거나 영구 삭제할 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>메모 삭제:</strong> 메모 상세 화면에서 ⋮ 메뉴 → "삭제" 또는 선택 모드에서 일괄 삭제</li>
                  <li><strong>휴지통 열기:</strong> 사이드 메뉴(☰)에서 "휴지통" 선택</li>
                  <li><strong>메모 복원:</strong> 휴지통에서 메모 탭 → "복원" 버튼으로 원래 폴더로 복원</li>
                  <li><strong>영구 삭제:</strong> 휴지통에서 메모 탭 → "영구 삭제" 버튼 (복구 불가)</li>
                  <li><strong>전체 비우기:</strong> 휴지통의 모든 항목을 한 번에 영구 삭제</li>
                  <li><strong>자동 삭제:</strong> 휴지통에 보관된 지 7일이 지난 메모는 자동으로 영구 삭제됨</li>
                </BulletList>
                <WarningBox>
                  <WarningIcon>⚠️</WarningIcon>
                  <WarningText>
                    <strong>주의:</strong> 휴지통에서 영구 삭제하거나 7일이 지나면 복구할 수 없습니다. 중요한 메모는 신중하게 삭제하세요.
                  </WarningText>
                </WarningBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#fa709a" $color2="#fee140">
                  <Snowflake size={18} />
                </FeatureIconBadge>
                프리즈(동결) 문서
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  협업 기능으로 생성된 프리즈(동결) 문서는 특별한 제한이 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>프리즈란:</strong> 채팅방의 협업 문서로 공유된 메모입니다.</li>
                  <li><strong>배지 표시:</strong> 메모 목록에서는 <InlineBadge $type="frozen"><Snowflake size={14} /></InlineBadge> 얼음 결정 아이콘으로 표시되며, 메모 상세 화면 상단에는 <InlineBadge $type="frozen">❄️ 작업중</InlineBadge> 배지가 표시됩니다</li>
                  <li><strong>편집 제한:</strong> 프리즈된 문서는 직접 편집할 수 없음</li>
                  <li><strong>읽기 전용:</strong> 내용 확인만 가능하며 수정/삭제 불가</li>
                  <li><strong>폴더 이동 제한:</strong> 선택 모드에서 프리즈 문서가 포함되면 폴더 이동 불가</li>
                  <li><strong>대화방 정보:</strong> 프리즈 문서를 열면 어느 대화방의 문서인지 표시됨</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    프리즈 문서를 수정하려면 원래 대화방에 가서 협업 문서 기능을 통해 수정해야 합니다. <InlineBadge $type="frozen"><Snowflake size={14} /></InlineBadge> 얼음 결정 아이콘이 보이면 대화방에서 작업 중인 문서임을 의미합니다.
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
              6자리 PIN으로 보호되는 안전한 메모 공간입니다. 중요하거나 개인적인 내용을 암호화하여 안전하게 보관할 수 있습니다.
            </MainCategoryDescription>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#667eea" $color2="#764ba2">
                  <Lock size={18} />
                </FeatureIconBadge>
                시크릿 문서란?
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  시크릿 문서는 6자리 PIN으로 보호되는 특별한 메모 공간입니다. 일반 메모와 완전히 분리되어 있으며, PIN 입력 후에만 접근할 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>강력한 암호화:</strong> 6자리 PIN 기반 암호화로 문서 보호</li>
                  <li><strong>별도 저장:</strong> 일반 메모와 완전히 분리된 독립 공간</li>
                  <li><strong>카테고리 관리:</strong> 금융, 개인, 업무, 일기 등 4가지 카테고리로 분류 (이름 및 아이콘 변경 가능)</li>
                  <li><strong>개별 비밀번호:</strong> 문서마다 추가 비밀번호 설정 가능 (이중 보안)</li>
                  <li><strong>자동 잠금:</strong> 백그라운드 전환 시 즉시 잠금, 비활성 시 자동 잠금 (기본 5분)</li>
                </BulletList>
                <WarningBox>
                  <WarningIcon>⚠️</WarningIcon>
                  <WarningText>
                    <strong>중요:</strong> PIN 번호를 분실하면 시크릿 문서를 복구할 수 없습니다. 이메일 계정 연동 시 임시 PIN 발급이 가능하므로 가급적 이메일 계정을 연동해주세요.
                  </WarningText>
                </WarningBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#f093fb" $color2="#f5576c">
                  <Shield size={18} />
                </FeatureIconBadge>
                초기 PIN 설정
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  시크릿 페이지를 처음 사용할 때 6자리 PIN을 설정합니다.
                </FeatureDescription>
                <StepList>
                  <li>하단 네비게이션에서 <strong>시크릿</strong> 탭 선택</li>
                  <li>PIN 설정 화면에서 6자리 숫자 입력</li>
                  <li>확인을 위해 동일한 6자리 숫자를 한 번 더 입력</li>
                  <li>PIN이 일치하면 자동으로 시크릿 페이지 진입</li>
                </StepList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    <strong>팁:</strong> 생일이나 연속된 숫자보다는 기억하기 쉽지만 타인이 추측하기 어려운 숫자 조합을 사용하세요.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#fa709a" $color2="#fee140">
                  <Lock size={18} />
                </FeatureIconBadge>
                PIN 분실 시 복구 방법
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  PIN 번호를 분실한 경우 이메일로 임시 PIN을 발급받아 복구할 수 있습니다.
                </FeatureDescription>

                <Subsection>
                  <SubsectionTitle>1. 임시 PIN 발급 (이메일 인증)</SubsectionTitle>
                  <StepList>
                    <li>PIN 입력 화면 하단의 <strong>"PIN 번호를 분실하셨나요?"</strong> 버튼 탭</li>
                    <li>등록된 이메일 주소가 마스킹되어 표시됨 (예: abc***@gmail.com)</li>
                    <li>확인 모달에서 <strong>전송</strong> 버튼 탭</li>
                    <li>해당 이메일로 6자리 임시 PIN이 전송됨 (24시간 유효)</li>
                  </StepList>
                  <WarningBox>
                    <WarningIcon>⏱️</WarningIcon>
                    <WarningText>
                      <strong>주의:</strong> 임시 PIN은 발급 시점부터 24시간 동안만 유효합니다. 24시간이 지나면 만료되어 사용할 수 없으므로, 반드시 24시간 이내에 임시 PIN을 입력하고 새 PIN을 설정해주세요.
                    </WarningText>
                  </WarningBox>
                </Subsection>

                <Subsection>
                  <SubsectionTitle>2. 임시 PIN으로 새 PIN 설정</SubsectionTitle>
                  <StepList>
                    <li>이메일로 받은 6자리 임시 PIN을 PIN 입력 화면에 입력</li>
                    <li>임시 PIN 인증 성공 시 자동으로 <strong>새 PIN 설정 화면</strong>으로 전환됨</li>
                    <li>새로운 6자리 PIN 입력 (임시 PIN과 동일한 번호는 사용 불가)</li>
                    <li>확인을 위해 동일한 번호를 한 번 더 입력</li>
                    <li>새 PIN 설정 완료 후 자동으로 시크릿 페이지 진입</li>
                  </StepList>
                  <TipBox>
                    <TipIcon>💡</TipIcon>
                    <TipText>
                      <strong>팁:</strong> 임시 PIN 입력 후에는 반드시 새로운 PIN을 설정해야 시크릿 페이지에 접근할 수 있습니다. 임시 PIN 자체로는 로그인할 수 없습니다.
                    </TipText>
                  </TipBox>
                </Subsection>

                <Subsection>
                  <SubsectionTitle>3. 임시 PIN 만료 처리</SubsectionTitle>
                  <BulletList>
                    <li><strong>24시간 경과:</strong> 임시 PIN이 자동으로 만료되며 기존 PIN도 함께 리셋됩니다</li>
                    <li><strong>만료 후 재발급:</strong> 하단의 <strong>"PIN 번호를 분실하셨나요?"</strong> 버튼을 다시 탭하여 새로운 임시 PIN을 발급받아야 합니다</li>
                    <li><strong>발급 제한:</strong> 임시 PIN은 24시간에 1회만 발급 가능합니다 (보안상 제한)</li>
                  </BulletList>
                </Subsection>

                <WarningBox>
                  <WarningIcon>⚠️</WarningIcon>
                  <WarningText>
                    <strong>중요:</strong> 이메일 계정이 등록되지 않은 경우 임시 PIN 발급이 불가능합니다. 이 경우 PIN 복구 방법이 없으므로 시크릿 문서에 접근할 수 없게 됩니다. 반드시 이메일 계정을 연동해주세요.
                  </WarningText>
                </WarningBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#4facfe" $color2="#00f2fe">
                  <Shield size={18} />
                </FeatureIconBadge>
                PIN 변경
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  보안 강화를 위해 정기적으로 PIN을 변경할 수 있습니다.
                </FeatureDescription>
                <StepList>
                  <li>PIN 입력 화면 하단의 <strong>"PIN 변경"</strong> 버튼 탭</li>
                  <li>현재 PIN 6자리 입력</li>
                  <li>새로운 PIN 6자리 입력</li>
                  <li>확인을 위해 새 PIN을 한 번 더 입력</li>
                  <li>PIN 변경 완료 후 자동으로 시크릿 페이지 진입</li>
                </StepList>
                <WarningBox>
                  <WarningIcon>⚠️</WarningIcon>
                  <WarningText>
                    PIN 변경 후에는 새로운 PIN으로만 시크릿 페이지에 접근할 수 있습니다. 변경된 PIN을 반드시 기억해주세요.
                  </WarningText>
                </WarningBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#43e97b" $color2="#38f9d7">
                  <FileText size={18} />
                </FeatureIconBadge>
                시크릿 문서 작성
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  일반 메모와 동일한 방식으로 작성하되, PIN으로 암호화되어 보호됩니다.
                </FeatureDescription>
                <StepList>
                  <li><strong>시크릿</strong> 탭에서 PIN 입력하여 시크릿 페이지 진입</li>
                  <li>우측 하단의 <strong>가면 모양 + 버튼</strong> 탭 (또는 상단 + 버튼)</li>
                  <li>제목과 내용 입력 (리치 텍스트 에디터 지원)</li>
                  <li>카테고리 선택 (금융, 개인, 업무, 일기 중 선택)</li>
                  <li>필요시 태그 추가, 중요 표시 설정</li>
                  <li>필요시 개별 비밀번호 설정 (이중 보안)</li>
                  <li>상단 <strong>저장</strong> 버튼으로 문서 저장</li>
                </StepList>
                <BulletList>
                  <li><strong>리치 텍스트 편집:</strong> 굵게, 기울임, 밑줄, 색상, 정렬 등</li>
                  <li><strong>이미지 첨부:</strong> 갤러리에서 이미지 추가 가능</li>
                  <li><strong>YouTube 링크:</strong> YouTube 동영상 삽입 가능</li>
                  <li><strong>일반 링크:</strong> 웹 URL 삽입 및 클릭 가능</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    <strong>팁:</strong> 가면 모양 버튼은 길게 누르면 위아래로 드래그하여 위치를 조정할 수 있습니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#667eea" $color2="#764ba2">
                  <Folder size={18} />
                </FeatureIconBadge>
                카테고리 관리
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  시크릿 문서는 4가지 카테고리로 분류할 수 있으며, 각 카테고리의 이름과 아이콘을 자유롭게 변경할 수 있습니다.
                </FeatureDescription>

                <Subsection>
                  <SubsectionTitle>1. 기본 카테고리</SubsectionTitle>
                  <BulletList>
                    <li><strong>전체:</strong> 모든 문서 보기 (변경 불가)</li>
                    <li><strong>금융 💰:</strong> 금융 관련 문서 (계좌번호, 카드정보 등)</li>
                    <li><strong>개인 👤:</strong> 개인 정보 문서 (주민번호, 비밀번호 등)</li>
                    <li><strong>업무 💼:</strong> 업무 관련 문서 (프로젝트, 회의록 등)</li>
                    <li><strong>일기 📔:</strong> 일기 및 개인 기록</li>
                  </BulletList>
                </Subsection>

                <Subsection>
                  <SubsectionTitle>2. 카테고리 이름 및 아이콘 변경</SubsectionTitle>
                  <StepList>
                    <li>상단 필터 버튼에서 변경하고 싶은 카테고리 버튼을 <strong>길게 누름</strong> (0.5초)</li>
                    <li>카테고리 편집 모달이 열림</li>
                    <li>원하는 이름으로 변경 (예: 금융 → 자산관리)</li>
                    <li>아이콘 목록에서 원하는 아이콘 선택</li>
                    <li><strong>저장</strong> 버튼으로 변경 완료</li>
                  </StepList>
                  <TipBox>
                    <TipIcon>💡</TipIcon>
                    <TipText>
                      <strong>팁:</strong> "전체" 카테고리는 시스템 카테고리로 이름 및 아이콘을 변경할 수 없습니다.
                    </TipText>
                  </TipBox>
                </Subsection>

                <Subsection>
                  <SubsectionTitle>3. 문서의 카테고리 변경</SubsectionTitle>
                  <StepList>
                    <li>문서 카드 우측 상단의 <strong>카테고리 뱃지를 길게 누름</strong> (0.5초)</li>
                    <li>카테고리 선택 모달이 열림</li>
                    <li>이동할 카테고리 탭</li>
                    <li>카테고리가 즉시 변경됨</li>
                  </StepList>
                </Subsection>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#f093fb" $color2="#f5576c">
                  <Lock size={18} />
                </FeatureIconBadge>
                개별 문서 비밀번호 설정 (이중 보안)
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  특정 문서에 추가로 비밀번호를 설정하여 이중 보안을 적용할 수 있습니다. PIN 입력 후에도 해당 문서는 개별 비밀번호를 입력해야 열람할 수 있습니다.
                </FeatureDescription>

                <Subsection>
                  <SubsectionTitle>1. 개별 비밀번호 설정</SubsectionTitle>
                  <StepList>
                    <li>문서 작성 또는 수정 화면에서 <strong>"개별 비밀번호 설정"</strong> 토글 활성화</li>
                    <li>원하는 비밀번호 입력 (문자, 숫자, 특수문자 조합 가능)</li>
                    <li>비밀번호 확인을 위해 한 번 더 입력</li>
                    <li>문서 저장 시 개별 비밀번호가 함께 저장됨</li>
                  </StepList>
                  <BulletList>
                    <li><strong>표시:</strong> 개별 비밀번호가 설정된 문서는 카드에 자물쇠 아이콘 🔒이 표시됩니다</li>
                    <li><strong>암호화:</strong> 문서 내용이 별도로 암호화되어 저장됩니다</li>
                    <li><strong>미리보기:</strong> 비밀번호가 설정된 문서는 목록에서 "🔐 비밀번호로 보호된 문서입니다"로 표시됩니다</li>
                  </BulletList>
                </Subsection>

                <Subsection>
                  <SubsectionTitle>2. 개별 비밀번호로 보호된 문서 열기</SubsectionTitle>
                  <StepList>
                    <li>🔒 아이콘이 표시된 문서 카드 탭</li>
                    <li>비밀번호 입력 모달이 표시됨</li>
                    <li>문서 저장 시 설정한 개별 비밀번호 입력</li>
                    <li>확인 버튼 탭하여 문서 열기</li>
                  </StepList>
                </Subsection>

                <Subsection>
                  <SubsectionTitle>3. 개별 비밀번호 분실 시 복구</SubsectionTitle>
                  <StepList>
                    <li>비밀번호 입력 화면에서 3회 이상 실패</li>
                    <li>하단에 <strong>"비밀번호를 잊으셨나요? (PIN으로 확인)"</strong> 버튼 표시됨</li>
                    <li>해당 버튼 탭</li>
                    <li>시크릿 페이지 PIN을 재입력</li>
                    <li>PIN 인증 성공 시 문서가 자동으로 열림</li>
                  </StepList>
                  <TipBox>
                    <TipIcon>💡</TipIcon>
                    <TipText>
                      <strong>팁:</strong> PIN 재입력으로 개별 비밀번호를 우회할 수 있으므로, 시크릿 페이지 PIN을 더욱 철저히 보호해야 합니다.
                    </TipText>
                  </TipBox>
                </Subsection>

                <Subsection>
                  <SubsectionTitle>4. 개별 비밀번호 해제</SubsectionTitle>
                  <StepList>
                    <li>문서 수정 화면에서 <strong>"개별 비밀번호 설정"</strong> 토글 비활성화</li>
                    <li>문서 저장 시 개별 비밀번호가 제거되고 일반 문서로 전환됨</li>
                  </StepList>
                </Subsection>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#4facfe" $color2="#00f2fe">
                  <Search size={18} />
                </FeatureIconBadge>
                시크릿 문서 관리
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  작성한 시크릿 문서를 검색, 필터링, 정렬하여 효율적으로 관리할 수 있습니다.
                </FeatureDescription>

                <Subsection>
                  <SubsectionTitle>1. 검색</SubsectionTitle>
                  <BulletList>
                    <li>상단 검색창에 키워드 입력</li>
                    <li>제목, 내용, 태그를 모두 검색</li>
                    <li>실시간 검색 결과 표시</li>
                  </BulletList>
                </Subsection>

                <Subsection>
                  <SubsectionTitle>2. 필터링</SubsectionTitle>
                  <BulletList>
                    <li>상단 카테고리 버튼으로 필터링 (전체, 금융, 개인, 업무, 일기)</li>
                    <li>선택한 카테고리의 문서만 표시</li>
                  </BulletList>
                </Subsection>

                <Subsection>
                  <SubsectionTitle>3. 정렬</SubsectionTitle>
                  <BulletList>
                    <li><strong>등록순:</strong> 문서 등록 날짜 기준 (최신순 ↓ / 오래된 순 ↑)</li>
                    <li><strong>중요도순:</strong> 중요 표시된 문서가 먼저 표시</li>
                    <li>정렬 버튼을 다시 탭하면 오름차순/내림차순 전환</li>
                  </BulletList>
                </Subsection>

                <Subsection>
                  <SubsectionTitle>4. 문서 수정 및 삭제</SubsectionTitle>
                  <BulletList>
                    <li><strong>수정:</strong> 문서 카드 탭 → 읽기 모드 → 우측 상단 편집 버튼</li>
                    <li><strong>삭제:</strong> 문서 카드 우측 상단 ✕ 버튼 탭 → 확인 모달에서 삭제 확인</li>
                    <li><strong>휴지통 이동:</strong> 삭제된 문서는 휴지통으로 이동 (7일간 보관)</li>
                  </BulletList>
                </Subsection>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#43e97b" $color2="#38f9d7">
                  <CheckSquare size={18} />
                </FeatureIconBadge>
                다중 선택 모드
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  여러 문서를 한 번에 선택하여 일괄 작업을 수행할 수 있습니다.
                </FeatureDescription>

                <Subsection>
                  <SubsectionTitle>1. 다중 선택 모드 진입</SubsectionTitle>
                  <StepList>
                    <li>문서 카드를 <strong>길게 누름</strong> (0.5초)</li>
                    <li>다중 선택 모드가 활성화되고 해당 문서가 자동 선택됨</li>
                    <li>각 문서 카드 좌측에 체크박스가 표시됨</li>
                  </StepList>
                  <TipBox>
                    <TipIcon>💡</TipIcon>
                    <TipText>
                      다중 선택 모드에서는 안내 메시지가 표시됩니다: "하단의 카드를 길게 누르면 다중 선택 모드가 활성화됩니다"
                    </TipText>
                  </TipBox>
                </Subsection>

                <Subsection>
                  <SubsectionTitle>2. 문서 선택</SubsectionTitle>
                  <BulletList>
                    <li>원하는 문서 카드를 탭하여 선택/해제</li>
                    <li>상단 <strong>전체선택</strong> 버튼으로 모든 문서 선택</li>
                    <li>선택된 문서 개수가 상단에 표시됨 (예: "3개 선택됨")</li>
                  </BulletList>
                </Subsection>

                <Subsection>
                  <SubsectionTitle>3. 일괄 작업</SubsectionTitle>
                  <BulletList>
                    <li><strong>카테고리 이동:</strong> 하단 "카테고리 이동" 버튼 → 원하는 카테고리 선택</li>
                    <li><strong>중요도 지정/해제:</strong> 하단 "중요도 지정" 또는 "중요도 해제" 버튼 탭</li>
                    <li><strong>일괄 삭제:</strong> 하단 "일괄 삭제" 버튼 → 확인 모달에서 삭제 확인</li>
                  </BulletList>
                </Subsection>

                <Subsection>
                  <SubsectionTitle>4. 다중 선택 모드 종료</SubsectionTitle>
                  <BulletList>
                    <li>상단 <strong>취소</strong> 버튼 탭</li>
                    <li>일괄 작업 완료 시 자동 종료</li>
                  </BulletList>
                </Subsection>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#f093fb" $color2="#f5576c">
                  <Trash2 size={18} />
                </FeatureIconBadge>
                휴지통에서 시크릿 문서 표시
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  삭제된 시크릿 문서는 휴지통에 "secret" 타입으로 표시되며, 내용 확인 시 PIN 재입력이 필요합니다.
                </FeatureDescription>

                <Subsection>
                  <SubsectionTitle>1. 휴지통에서 시크릿 문서 확인</SubsectionTitle>
                  <BulletList>
                    <li><strong>타입 표시:</strong> 휴지통 항목 타입이 "secret"으로 표시됨</li>
                    <li><strong>제목 표시:</strong> 문서 제목이 그대로 표시됨</li>
                    <li><strong>삭제일:</strong> 휴지통 이동 날짜 및 자동 삭제까지 남은 일수 표시 (7일)</li>
                    <li><strong>개별 비밀번호 제거:</strong> 휴지통 이동 시 개별 비밀번호는 자동으로 제거됨 (PIN만으로 확인 가능)</li>
                  </BulletList>
                </Subsection>

                <Subsection>
                  <SubsectionTitle>2. 시크릿 문서 내용 보기</SubsectionTitle>
                  <StepList>
                    <li>휴지통에서 시크릿 문서 항목 탭</li>
                    <li>PIN 입력 모달이 표시됨</li>
                    <li>시크릿 페이지 PIN 6자리 입력</li>
                    <li>PIN 인증 성공 시 문서 내용 상세보기 모달 표시</li>
                  </StepList>
                  <TipBox>
                    <TipIcon>💡</TipIcon>
                    <TipText>
                      <strong>팁:</strong> 휴지통에서 시크릿 문서를 확인할 때마다 PIN을 재입력해야 합니다. 모달을 닫으면 인증 상태가 초기화됩니다.
                    </TipText>
                  </TipBox>
                </Subsection>

                <Subsection>
                  <SubsectionTitle>3. 시크릿 문서 복원</SubsectionTitle>
                  <StepList>
                    <li>휴지통에서 시크릿 문서 선택 (체크박스 선택)</li>
                    <li>하단 <strong>복원</strong> 버튼 탭</li>
                    <li>복원 확인 모달에서 <strong>복원</strong> 버튼 탭</li>
                    <li>시크릿 페이지로 복원됨 (다음 PIN 입력 시 복원된 문서 확인 가능)</li>
                  </StepList>
                  <WarningBox>
                    <WarningIcon>⚠️</WarningIcon>
                    <WarningText>
                      <strong>주의:</strong> 개별 비밀번호는 휴지통 이동 시 자동으로 제거되므로, 복원 후에도 개별 비밀번호가 적용되지 않습니다. 필요시 복원 후 다시 설정해주세요.
                    </WarningText>
                  </WarningBox>
                </Subsection>

                <Subsection>
                  <SubsectionTitle>4. 시크릿 문서 영구 삭제</SubsectionTitle>
                  <StepList>
                    <li>휴지통에서 시크릿 문서 선택</li>
                    <li>하단 <strong>영구 삭제</strong> 버튼 탭</li>
                    <li>확인 모달에서 <strong>영구 삭제</strong> 버튼 탭</li>
                    <li>암호화된 데이터가 완전히 제거됨 (복구 불가)</li>
                  </StepList>
                  <WarningBox>
                    <WarningIcon>🔥</WarningIcon>
                    <WarningText>
                      <strong>중요:</strong> 영구 삭제된 시크릿 문서는 복구할 수 없습니다. 다음 PIN 입력 시 암호화된 데이터가 완전히 삭제됩니다.
                    </WarningText>
                  </WarningBox>
                </Subsection>

                <Subsection>
                  <SubsectionTitle>5. 자동 삭제</SubsectionTitle>
                  <BulletList>
                    <li>휴지통 이동 후 7일이 지나면 자동으로 영구 삭제됨</li>
                    <li>자동 삭제 예정 문서는 "X일 후 자동 삭제" 안내 표시</li>
                  </BulletList>
                </Subsection>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#a8edea" $color2="#fed6e3">
                  <Clock size={18} />
                </FeatureIconBadge>
                자동 잠금 기능
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  보안 강화를 위해 여러 가지 자동 잠금 기능이 제공됩니다.
                </FeatureDescription>

                <Subsection>
                  <SubsectionTitle>1. 백그라운드 자동 잠금</SubsectionTitle>
                  <BulletList>
                    <li><strong>즉시 잠금:</strong> 앱이 백그라운드로 전환되면 즉시 시크릿 페이지가 자동으로 잠김</li>
                    <li><strong>홈 버튼:</strong> 홈 버튼을 눌러 앱을 나가면 즉시 잠김</li>
                    <li><strong>다른 앱 전환:</strong> 다른 앱으로 전환해도 즉시 잠김</li>
                    <li><strong>재진입:</strong> 다시 시크릿 페이지로 돌아오면 PIN 재입력 필요</li>
                  </BulletList>
                </Subsection>

                <Subsection>
                  <SubsectionTitle>2. 비활성 자동 잠금</SubsectionTitle>
                  <BulletList>
                    <li><strong>기본 설정:</strong> 5분간 사용자 활동이 없으면 자동 잠김</li>
                    <li><strong>활동 감지:</strong> 마우스 이동, 키보드 입력, 클릭, 스크롤, 터치 등</li>
                    <li><strong>잠금 알림:</strong> 자동 잠금 시 "자동 잠금되었습니다" 토스트 메시지 표시</li>
                  </BulletList>
                  <TipBox>
                    <TipIcon>💡</TipIcon>
                    <TipText>
                      <strong>팁:</strong> 자동 잠금 시간은 설정에서 변경 가능합니다 (설정 기능은 추후 업데이트 예정).
                    </TipText>
                  </TipBox>
                </Subsection>

                <Subsection>
                  <SubsectionTitle>3. 수동 잠금</SubsectionTitle>
                  <BulletList>
                    <li><strong>다른 탭 이동:</strong> 시크릿 페이지에서 다른 탭(메모, 스케줄 등)으로 이동하면 자동으로 잠김</li>
                    <li><strong>닫기 버튼:</strong> PIN 입력 화면 우측 상단 ✕ 버튼으로 시크릿 페이지 종료</li>
                  </BulletList>
                </Subsection>

                <Subsection>
                  <SubsectionTitle>4. 작성 중인 문서 임시 저장</SubsectionTitle>
                  <BulletList>
                    <li><strong>자동 저장:</strong> 잠금 시 작성 중이던 문서가 로컬에 임시 저장됨 (24시간 유효)</li>
                    <li><strong>자동 복원:</strong> 다음 PIN 입력 시 작성 중이던 문서가 자동으로 복원됨</li>
                    <li><strong>만료 처리:</strong> 24시간이 지나면 임시 저장된 문서가 자동으로 삭제됨</li>
                  </BulletList>
                  <TipBox>
                    <TipIcon>💡</TipIcon>
                    <TipText>
                      실수로 앱을 종료하거나 백그라운드로 전환해도 작성 중이던 내용이 사라지지 않습니다.
                    </TipText>
                  </TipBox>
                </Subsection>

                <WarningBox>
                  <WarningIcon>⚠️</WarningIcon>
                  <WarningText>
                    <strong>보안 권장사항:</strong> 시크릿 페이지 사용 후에는 반드시 다른 탭으로 이동하거나 앱을 종료하여 자동 잠금되도록 해주세요.
                  </WarningText>
                </WarningBox>
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
              앱의 각종 설정과 데이터 관리, 백업 등의 기능을 제공합니다. 화면 상단의 햄버거 메뉴(☰)를 탭하여 사이드 메뉴를 열 수 있습니다.
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
                  사이드 메뉴 상단의 프로필 영역을 탭하여 프로필을 편집할 수 있습니다.
                </FeatureDescription>
                <StepList>
                  <li>사이드 메뉴 상단의 <strong>프로필 사진 영역</strong> 탭</li>
                  <li>프로필 페이지에서 <strong>프로필 편집</strong> 선택</li>
                  <li>닉네임 변경 또는 프로필 사진 선택</li>
                  <li>아바타 또는 갤러리에서 사진 선택 가능</li>
                  <li><strong>저장</strong> 버튼으로 변경 사항 적용</li>
                </StepList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    프로필 페이지에서 ShareNote ID 확인, 문의하기 등의 기능도 이용할 수 있습니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#f093fb" $color2="#f5576c">
                  <Settings size={18} />
                </FeatureIconBadge>
                매크로
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  자주 사용하는 텍스트나 문구를 매크로로 등록하여 빠르게 입력할 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>매크로 추가:</strong> 자주 사용하는 인사말, 주소, 연락처 등을 등록</li>
                  <li><strong>빠른 입력:</strong> 메모나 채팅에서 매크로를 선택하여 즉시 입력</li>
                  <li><strong>매크로 편집:</strong> 등록된 매크로 수정 및 삭제 가능</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    업무용 이메일 서명, 자주 쓰는 안내 문구 등을 매크로로 등록하면 편리합니다.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#4facfe" $color2="#00f2fe">
                  <Download size={18} />
                </FeatureIconBadge>
                휴대폰 백업 및 복원
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  로그인하지 않고 사용하는 경우, 휴대폰에 데이터를 백업하고 복원할 수 있습니다.
                </FeatureDescription>
                <StepList>
                  <li>사이드 메뉴에서 <strong>💾 휴대폰 백업</strong> 선택</li>
                  <li>백업 파일이 휴대폰에 저장됨 (.json 파일)</li>
                  <li>다른 기기에서 <strong>📂 휴대폰 복원</strong> 선택</li>
                  <li>백업 파일을 선택하여 데이터 복원</li>
                </StepList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    <strong>참고:</strong> 로그인한 사용자는 모든 데이터가 자동으로 서버에 저장되므로, 이 기능을 사용할 필요가 없습니다. 새 기기에서 로그인만 하면 데이터가 자동으로 복원됩니다.
                  </TipText>
                </TipBox>
                <WarningBox>
                  <WarningIcon>⚠️</WarningIcon>
                  <WarningText>
                    <strong>주의:</strong> 데이터 복원 시 현재 기기의 로컬 데이터가 백업 데이터로 대체됩니다.
                  </WarningText>
                </WarningBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#43e97b" $color2="#38f9d7">
                  <Trash2 size={18} />
                </FeatureIconBadge>
                기기 데이터 삭제
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  현재 기기에 저장된 모든 로컬 데이터를 완전히 삭제합니다.
                </FeatureDescription>
                <BulletList>
                  <li>로컬에 저장된 메모, 일정, 설정 등 모든 데이터 삭제</li>
                  <li>앱 설정 및 환경설정 초기화</li>
                  <li>로그인 정보 삭제 (자동 로그아웃)</li>
                  <li>서버에 저장된 데이터는 삭제되지 않음</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    기기 양도, 캐시 문제 해결, 앱 완전 초기화가 필요할 때 사용하세요. 로그인 사용자는 다시 로그인하면 서버 데이터를 불러올 수 있습니다.
                  </TipText>
                </TipBox>
                <WarningBox>
                  <WarningIcon>⚠️</WarningIcon>
                  <WarningText>
                    <strong>경고:</strong> 이 작업은 되돌릴 수 없습니다. 비로그인 사용자는 삭제 전 반드시 백업하세요.
                  </WarningText>
                </WarningBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#fa709a" $color2="#fee140">
                  <Trash2 size={18} />
                </FeatureIconBadge>
                휴지통
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  삭제한 메모를 확인하고 복원하거나 영구 삭제할 수 있습니다.
                </FeatureDescription>
                <BulletList>
                  <li>삭제된 메모는 7일간 휴지통에 보관</li>
                  <li>메모 복원 또는 영구 삭제 가능</li>
                  <li><strong>전체 비우기</strong>로 모든 항목 한 번에 삭제</li>
                  <li>7일이 지나면 자동으로 영구 삭제됨</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    실수로 삭제한 메모는 휴지통에서 복원할 수 있으니, 7일 이내에 확인하세요.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#a8edea" $color2="#fed6e3">
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
                <FeatureIconBadge $color1="#667eea" $color2="#764ba2">
                  <Bell size={18} />
                </FeatureIconBadge>
                정보
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  앱 정보 확인 및 개발자에게 문의할 수 있는 페이지입니다.
                </FeatureDescription>
                <BulletList>
                  <li><strong>앱 버전 정보:</strong> 현재 사용 중인 앱 버전 확인</li>
                  <li><strong>문의하기:</strong> 개발자에게 버그 리포트, 기능 제안, 문의 전송</li>
                  <li><strong>답변 확인:</strong> 개발자의 답변을 확인하고 대화 이어가기</li>
                  <li><strong>알림:</strong> 읽지 않은 답변이 있으면 빨간 점으로 표시</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    앱 사용 중 문제가 발생하거나 개선 사항이 있다면 정보 페이지에서 개발자에게 문의하세요.
                  </TipText>
                </TipBox>
              </FeatureContent>
            </FeatureSection>

            <FeatureSection>
              <FeatureTitle>
                <FeatureIconBadge $color1="#f093fb" $color2="#f5576c">
                  <Users size={18} />
                </FeatureIconBadge>
                로그아웃
              </FeatureTitle>
              <FeatureContent>
                <FeatureDescription>
                  현재 계정에서 로그아웃합니다. 로그인한 사용자에게만 표시됩니다.
                </FeatureDescription>
                <BulletList>
                  <li>사이드 메뉴 하단의 <strong>🚪 로그아웃</strong> 버튼 탭</li>
                  <li>로그아웃 후 로그인 화면으로 이동</li>
                  <li>서버 데이터는 안전하게 보존됨</li>
                  <li>다시 로그인하면 모든 데이터 복원</li>
                </BulletList>
                <TipBox>
                  <TipIcon>💡</TipIcon>
                  <TipText>
                    로그아웃해도 서버에 저장된 데이터는 삭제되지 않습니다. 언제든 다시 로그인하여 데이터를 불러올 수 있습니다.
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
                {CATEGORIES.filter(category => category.id !== activeCategory).map((category) => {
                  const Icon = category.icon;

                  return (
                    <CategoryItem
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                    >
                      <Icon size={16} />
                      <CategoryItemName>
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
