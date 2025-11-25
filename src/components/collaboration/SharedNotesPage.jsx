/*
 * ⚠️ 경고: 이 파일은 현재 사용하지 않는 참고용 파일입니다.
 * ⚠️ WARNING: This file is NOT IN USE - for reference only.
 * ⚠️ 다른 파일과 연동하지 마세요. DO NOT integrate with other files.
 */

// 공유된 메모/스케줄 목록 페이지

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ArrowLeft, Users, Clock, MessageCircle, FileText, Calendar } from 'lucide-react';
import { getSharedNotes } from '../../services/collaborationService';
import { auth } from '../../firebase/config';
import SharedNoteViewer from './SharedNoteViewer';

const SharedNotesPage = ({ onBack }) => {
  const [sharedNotes, setSharedNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'memo' | 'schedule'

  useEffect(() => {
    loadSharedNotes();
  }, []);

  const loadSharedNotes = async () => {
    try {
      setLoading(true);
      const notes = await getSharedNotes();
      setSharedNotes(notes);
    } catch (err) {
      console.error('공유 메모 로딩 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = sharedNotes.filter(note => {
    if (filterType === 'all') return true;
    return note.type === filterType;
  });

  const getUnreadCount = (note) => {
    const myUserId = auth.currentUser?.uid;
    if (!myUserId || !note.readBy) return 0;

    const myLastRead = note.readBy[myUserId] || 0;
    // 실제로는 메시지 개수를 카운트해야 하지만, 간단히 업데이트 시간으로 판단
    return note.updatedAt > myLastRead ? 1 : 0;
  };

  return (
    <Container>
      <Header>
        <BackButton onClick={onBack}>
          <ArrowLeft size={24} />
        </BackButton>
        <Title>공유된 메모</Title>
      </Header>

      <FilterBar>
        <FilterButton active={filterType === 'all'} onClick={() => setFilterType('all')}>
          전체 ({sharedNotes.length})
        </FilterButton>
        <FilterButton
          active={filterType === 'memo'}
          onClick={() => setFilterType('memo')}
        >
          <FileText size={16} />
          메모 ({sharedNotes.filter(n => n.type === 'memo').length})
        </FilterButton>
        <FilterButton
          active={filterType === 'schedule'}
          onClick={() => setFilterType('schedule')}
        >
          <Calendar size={16} />
          스케줄 ({sharedNotes.filter(n => n.type === 'schedule').length})
        </FilterButton>
      </FilterBar>

      <Content>
        {loading ? (
          <LoadingText>로딩 중...</LoadingText>
        ) : filteredNotes.length === 0 ? (
          <EmptyState>
            <EmptyIcon>📭</EmptyIcon>
            <EmptyTitle>공유된 {filterType === 'all' ? '내용' : filterType === 'memo' ? '메모' : '스케줄'}이 없습니다</EmptyTitle>
            <EmptyDescription>
              메모나 스케줄을 친구들과 공유하여<br />
              함께 협업해보세요!
            </EmptyDescription>
          </EmptyState>
        ) : (
          <NotesList>
            {filteredNotes.map(note => {
              const unreadCount = getUnreadCount(note);
              const isOwner = note.ownerId === auth.currentUser?.uid;
              const participantCount = Object.keys(note.participants).length;

              return (
                <NoteCard key={note.id} onClick={() => setSelectedNoteId(note.id)}>
                  <NoteHeader>
                    <NoteType type={note.type}>
                      {note.type === 'memo' ? (
                        <>
                          <FileText size={14} />
                          <span>메모</span>
                        </>
                      ) : (
                        <>
                          <Calendar size={14} />
                          <span>스케줄</span>
                        </>
                      )}
                    </NoteType>
                    {isOwner && <OwnerBadge>내가 공유</OwnerBadge>}
                    {unreadCount > 0 && <UnreadBadge>{unreadCount}</UnreadBadge>}
                  </NoteHeader>

                  <NoteTitle>{note.title}</NoteTitle>

                  <NotePreview>
                    {note.content?.substring(0, 80) || '내용 없음'}
                    {note.content?.length > 80 && '...'}
                  </NotePreview>

                  <NoteFooter>
                    <NoteOwner>
                      <span>작성자:</span>
                      <strong>{note.ownerName}</strong>
                    </NoteOwner>

                    <NoteStats>
                      <StatItem>
                        <Users size={14} />
                        <span>{participantCount}</span>
                      </StatItem>
                      <StatItem>
                        <Clock size={14} />
                        <span>{formatTime(note.updatedAt)}</span>
                      </StatItem>
                    </NoteStats>
                  </NoteFooter>
                </NoteCard>
              );
            })}
          </NotesList>
        )}
      </Content>

      {selectedNoteId && (
        <SharedNoteViewer
          isOpen={!!selectedNoteId}
          onClose={() => {
            setSelectedNoteId(null);
            loadSharedNotes(); // 목록 새로고침
          }}
          noteId={selectedNoteId}
        />
      )}
    </Container>
  );
};

// 시간 포맷 함수
const formatTime = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return '방금 전';
  if (diff < hour) return `${Math.floor(diff / minute)}분 전`;
  if (diff < day) return `${Math.floor(diff / hour)}시간 전`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}일 전`;

  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

// 스타일 정의
const Container = styled.div`
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #1a1d24 0%, #2d3139 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;

  &:hover {
    color: #5ebe26;
  }
`;

const Title = styled.h1`
  color: white;
  font-size: 24px;
  font-weight: 700;
  margin: 0;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: ${props => props.active ? '#5ebe26' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.active ? '#5ebe26' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 20px;
  color: ${props => props.active ? 'white' : 'rgba(255, 255, 255, 0.7)'};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: ${props => props.active ? '#4fa01f' : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const LoadingText = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 60px 20px;
  font-size: 16px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 20px;
`;

const EmptyTitle = styled.h3`
  color: white;
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 12px 0;
`;

const EmptyDescription = styled.p`
  color: rgba(255, 255, 255, 0.5);
  font-size: 15px;
  line-height: 1.6;
  margin: 0;
`;

const NotesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const NoteCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: #5ebe26;
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }
`;

const NoteHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

const NoteType = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: ${props => props.type === 'memo' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(236, 72, 153, 0.2)'};
  border-radius: 12px;
  color: ${props => props.type === 'memo' ? '#6366f1' : '#ec4899'};
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const OwnerBadge = styled.div`
  padding: 4px 8px;
  background: rgba(94, 190, 38, 0.2);
  border-radius: 10px;
  color: #5ebe26;
  font-size: 11px;
  font-weight: 700;
`;

const UnreadBadge = styled.div`
  margin-left: auto;
  padding: 4px 8px;
  background: #ff6b6b;
  border-radius: 10px;
  color: white;
  font-size: 11px;
  font-weight: 700;
`;

const NoteTitle = styled.h3`
  color: white;
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 10px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const NotePreview = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 16px 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const NoteFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const NoteOwner = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;

  strong {
    color: rgba(255, 255, 255, 0.8);
    font-weight: 600;
  }
`;

const NoteStats = styled.div`
  display: flex;
  gap: 12px;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;

  svg {
    opacity: 0.7;
  }
`;

export default SharedNotesPage;
