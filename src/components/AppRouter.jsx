// 라우팅 로직을 담당하는 컴포넌트
import React from 'react';
import { useLocation } from 'react-router-dom';
import AddFriendPage from './AddFriendPage';
import { GlobalStyle } from '../styles';

const AppRouter = ({ children }) => {
  const location = useLocation();
  const isAddFriendRoute = location.pathname.startsWith('/add/');

  // /add/:uniqueId 경로일 때는 AddFriendPage만 렌더링
  if (isAddFriendRoute) {
    return (
      <>
        <GlobalStyle />
        <AddFriendPage />
      </>
    );
  }

  // 기본 경로는 children(메인 앱) 렌더링
  return children;
};

export default AppRouter;
