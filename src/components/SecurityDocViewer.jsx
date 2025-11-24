// 보안 문서 뷰어 (개인정보 처리방침, 보안 정책 등)
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, ChevronLeft, ChevronRight, Shield, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10003;
  padding: 20px;
  backdrop-filter: blur(5px);
`;

const Modal = styled.div`
  background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Header = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

const IconWrapper = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a90e2, #357abd);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const TitleGroup = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Subtitle = styled.div`
  font-size: 12px;
  color: #888;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px;
  color: #e0e0e0;
  line-height: 1.8;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  h1 {
    font-size: 32px;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 24px 0;
    padding-bottom: 16px;
    border-bottom: 2px solid rgba(74, 144, 226, 0.3);
  }

  h2 {
    font-size: 24px;
    font-weight: 700;
    color: #ffffff;
    margin: 40px 0 16px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #4a90e2;
    margin: 24px 0 12px 0;
  }

  h4 {
    font-size: 16px;
    font-weight: 600;
    color: #b0b0b0;
    margin: 16px 0 8px 0;
  }

  p {
    margin: 12px 0;
    color: #b0b0b0;
  }

  ul, ol {
    margin: 12px 0;
    padding-left: 24px;
  }

  li {
    margin: 8px 0;
    color: #b0b0b0;
  }

  code {
    background: rgba(74, 144, 226, 0.1);
    color: #4a90e2;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 0.9em;
  }

  pre {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;
    margin: 16px 0;

    code {
      background: none;
      padding: 0;
      color: #2ed573;
    }
  }

  blockquote {
    border-left: 4px solid #4a90e2;
    padding-left: 16px;
    margin: 16px 0;
    color: #888;
    font-style: italic;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
  }

  th, td {
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 12px;
    text-align: left;
  }

  th {
    background: rgba(74, 144, 226, 0.1);
    font-weight: 600;
    color: #ffffff;
  }

  td {
    color: #b0b0b0;
  }

  hr {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin: 32px 0;
  }

  strong {
    color: #ffffff;
    font-weight: 600;
  }

  a {
    color: #4a90e2;
    text-decoration: none;
    border-bottom: 1px solid rgba(74, 144, 226, 0.3);
    transition: all 0.2s;

    &:hover {
      border-bottom-color: #4a90e2;
    }
  }

  @media (max-width: 768px) {
    padding: 24px 20px;

    h1 {
      font-size: 24px;
    }

    h2 {
      font-size: 20px;
    }
  }
`;

const Footer = styled.div`
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.3);
`;

const PageIndicator = styled.div`
  font-size: 14px;
  color: #888;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PageDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$active ? '#4a90e2' : 'rgba(255, 255, 255, 0.2)'};
  transition: all 0.2s;
`;

const NavButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const NavButton = styled.button`
  background: ${props => props.disabled
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(74, 144, 226, 0.2)'};
  border: 1px solid ${props => props.disabled
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(74, 144, 226, 0.4)'};
  color: ${props => props.disabled ? '#666' : '#4a90e2'};
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover:not(:disabled) {
    background: rgba(74, 144, 226, 0.3);
    border-color: rgba(74, 144, 226, 0.6);
  }
`;

const documents = [
  {
    id: 'overview',
    title: '보안 개요',
    subtitle: 'Security Overview',
    icon: Shield,
    file: '/SECURITY_OVERVIEW.md'
  },
  {
    id: 'terms',
    title: '서비스 이용약관',
    subtitle: 'Terms of Service',
    icon: FileText,
    file: '/TERMS_OF_SERVICE.md'
  },
  {
    id: 'privacy',
    title: '개인정보 처리방침',
    subtitle: 'Privacy Policy',
    icon: Shield,
    file: '/PRIVACY_POLICY.md'
  },
  {
    id: 'security',
    title: '보안 정책',
    subtitle: 'Security Policy',
    icon: Shield,
    file: '/SECURITY.md'
  }
];

const SecurityDocViewer = ({ onClose, initialDocId = 'overview' }) => {
  const [currentIndex, setCurrentIndex] = useState(
    documents.findIndex(doc => doc.id === initialDocId) || 0
  );
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  const currentDoc = documents[currentIndex];

  useEffect(() => {
    loadDocument(currentDoc.file);
  }, [currentIndex]);

  const loadDocument = async (file) => {
    setLoading(true);
    try {
      const response = await fetch(file);
      const text = await response.text();
      setContent(text);
    } catch (error) {
      console.error('문서 로드 오류:', error);
      setContent('# 문서를 불러올 수 없습니다\n\n죄송합니다. 문서를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < documents.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const Icon = currentDoc.icon;

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Modal>
        <Header>
          <HeaderLeft>
            <IconWrapper>
              <Icon size={20} />
            </IconWrapper>
            <TitleGroup>
              <Title>{currentDoc.title}</Title>
              <Subtitle>{currentDoc.subtitle}</Subtitle>
            </TitleGroup>
          </HeaderLeft>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </Header>

        <Content>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
              <Shield size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <div>문서를 불러오는 중...</div>
            </div>
          ) : (
            <ReactMarkdown>{content}</ReactMarkdown>
          )}
        </Content>

        <Footer>
          <PageIndicator>
            {documents.map((_, index) => (
              <PageDot key={index} $active={index === currentIndex} />
            ))}
          </PageIndicator>

          <NavButtons>
            <NavButton
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={16} />
              이전
            </NavButton>
            {currentIndex < documents.length - 1 ? (
              <NavButton onClick={handleNext}>
                다음
                <ChevronRight size={16} />
              </NavButton>
            ) : (
              <NavButton onClick={onClose}>
                닫기
                <X size={16} />
              </NavButton>
            )}
          </NavButtons>
        </Footer>
      </Modal>
    </Overlay>
  );
};

export default SecurityDocViewer;
