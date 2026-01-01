import React from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
  color: #e0e0e0;
  padding: 40px 20px;
  text-align: center;
`;

const ErrorIcon = styled.div`
  font-size: 64px;
  margin-bottom: 24px;
`;

const ErrorTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #ff5757;
`;

const ErrorMessage = styled.p`
  font-size: 16px;
  color: #b0b0b0;
  margin-bottom: 32px;
  max-width: 600px;
  line-height: 1.6;
`;

const ErrorDetails = styled.details`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  max-width: 800px;
  width: 100%;
  text-align: left;
  cursor: pointer;

  summary {
    font-weight: 600;
    margin-bottom: 8px;
    color: #4a90e2;
  }

  pre {
    background: rgba(0, 0, 0, 0.3);
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 12px;
    line-height: 1.5;
    color: #ff8787;
  }
`;

const ReloadButton = styled.button`
  background: linear-gradient(135deg, #4a90e2, #357abd);
  color: #ffffff;
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(74, 144, 226, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // 에러 발생 시 폴백 UI를 표시하도록 상태 업데이트
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 에러 로깅 (콘솔 또는 외부 서비스)
    console.error('🔴 Error Boundary가 에러를 포착했습니다:', error, errorInfo);

    // 에러 정보를 상태에 저장
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // 선택사항: 에러 리포팅 서비스로 전송 (예: Sentry)
    // if (import.meta.env.PROD) {
    //   // Sentry.captureException(error);
    // }
  }

  handleReload = () => {
    // 페이지 새로고침
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorIcon>😵</ErrorIcon>
          <ErrorTitle>앗! 문제가 발생했습니다</ErrorTitle>
          <ErrorMessage>
            예상치 못한 오류가 발생했습니다.<br />
            페이지를 새로고침하면 문제가 해결될 수 있습니다.
          </ErrorMessage>

          {/* 개발 환경에서만 에러 상세 정보 표시 */}
          {import.meta.env.DEV && this.state.error && (
            <ErrorDetails>
              <summary>에러 상세 정보 (개발 모드)</summary>
              <pre>
                <strong>Error:</strong> {this.state.error.toString()}
                {'\n\n'}
                <strong>Stack Trace:</strong>
                {'\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </ErrorDetails>
          )}

          <ReloadButton onClick={this.handleReload}>
            페이지 새로고침
          </ReloadButton>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
