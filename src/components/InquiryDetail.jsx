// src/components/InquiryDetail.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, ArrowLeft, Send, Clock, CheckCircle, MessageCircle, Trash2, Copy } from 'lucide-react';
import {
  createInquiry,
  getInquiryDetail,
  getInquiryReplies,
  deleteInquiry,
  addInquiryReply,
  markInquiryAsRead,
  getStatusText,
  getStatusColor
} from '../services/inquiryService';
import { showAlert } from '../utils/alertModal';
import ConfirmModal from './ConfirmModal';
import { toast } from '../utils/toast';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  z-index: 10011;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const Container = styled.div`
  background: linear-gradient(180deg, #2a2d35 0%, #1f2229 100%);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #e0e0e0;
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: rgba(231, 76, 60, 0.1);
    color: #ff6b6b;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
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

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 8px;
`;

const Select = styled.select`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 15px;
  color: #e0e0e0;
  outline: none;
  transition: all 0.2s;

  &:focus {
    border-color: #4a90e2;
    background: rgba(255, 255, 255, 0.08);
  }

  option {
    background: #2a2d35;
    color: #e0e0e0;
  }
`;

const Input = styled.input`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 15px;
  color: #e0e0e0;
  outline: none;
  transition: all 0.2s;

  &:focus {
    border-color: #4a90e2;
    background: rgba(255, 255, 255, 0.08);
  }

  &::placeholder {
    color: #666;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 15px;
  color: #e0e0e0;
  outline: none;
  transition: all 0.2s;
  resize: vertical;
  min-height: 150px;
  font-family: inherit;
  line-height: 1.5;

  &:focus {
    border-color: #4a90e2;
    background: rgba(255, 255, 255, 0.08);
  }

  &::placeholder {
    color: #666;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  background: #4a90e2;
  border: none;
  color: #fff;
  padding: 14px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;

  &:hover {
    background: #357abd;
  }

  &:disabled {
    background: #555;
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const DetailHeader = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
`;

const DetailTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #e0e0e0;
  margin: 0 0 12px 0;
`;

const DetailMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  background: ${props => props.$color}22;
  color: ${props => props.$color};
  border: 1px solid ${props => props.$color}44;
`;

const Category = styled.span`
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  background: rgba(74, 144, 226, 0.1);
  color: #4a90e2;
  border: 1px solid rgba(74, 144, 226, 0.3);
`;

const Date = styled.span`
  font-size: 13px;
  color: #888;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const DetailContent = styled.div`
  font-size: 15px;
  color: #e0e0e0;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
`;

const CopyButton = styled.button`
  margin-top: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #888;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: #4a90e2;
    color: #4a90e2;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const RepliesSection = styled.div`
  margin-top: 24px;
`;

const SectionTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #4a90e2;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ReplyItem = styled.div`
  background: ${props => props.$isAdmin ? 'rgba(74, 144, 226, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.$isAdmin ? 'rgba(74, 144, 226, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ReplyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const ReplyAuthor = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.$isAdmin ? '#4a90e2' : '#e0e0e0'};
`;

const ReplyDate = styled.div`
  font-size: 12px;
  color: #888;
`;

const ReplyContent = styled.div`
  font-size: 14px;
  color: #e0e0e0;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
`;

const NoReplies = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #888;
  font-size: 14px;
`;

const AdminReplySection = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const AdminReplyLabel = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #4a90e2;
  margin-bottom: 10px;
`;

const AdminReplyTextarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 14px;
  color: #e0e0e0;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
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

const AdminReplyButton = styled.button`
  margin-top: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
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
      return null;
  }
};

const InquiryDetail = ({ isOpen, onClose, userId, inquiry, onBack, onSubmitSuccess, isAdmin = false, isSuperAdmin = false, currentUserId = null, currentUserNickname = null }) => {
  const [formData, setFormData] = useState({
    category: '기능 문의',
    title: '',
    content: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const isNewInquiry = !inquiry;

  useEffect(() => {
    if (isOpen && inquiry) {
      loadInquiryDetail();
    }
  }, [isOpen, inquiry]);

  const loadInquiryDetail = async () => {
    try {
      setLoading(true);
      const [detail, replyList] = await Promise.all([
        getInquiryDetail(userId, inquiry.id),
        getInquiryReplies(userId, inquiry.id)
      ]);
      setDetailData(detail);
      setReplies(replyList);

      // 관리자가 아니고 읽지 않은 답변이 있으면 읽음 처리
      if (!isAdmin && detail.hasUnreadReplies && replyList.length > 0) {
        await markInquiryAsRead(userId, inquiry.id);

        // 부모 컴포넌트에 알려서 카운트 업데이트
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
      }
    } catch (error) {
      console.error('문의 상세 로드 실패:', error);

      // 문의가 삭제된 경우
      if (error.message === '문의를 찾을 수 없습니다.') {
        showAlert('이 문의는 삭제되었습니다.', '알림', () => {
          if (onSubmitSuccess) {
            onSubmitSuccess();
          }
          onClose();
        });
      } else {
        showAlert('문의를 불러오는데 실패했습니다.', '오류');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      showAlert('제목과 내용을 모두 입력해주세요.', '입력 오류');
      return;
    }

    try {
      setSubmitting(true);
      await createInquiry(userId, formData);
      setFormData({ category: '기능 문의', title: '', content: '' });
      onClose();
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      toast('문의를 등록했습니다');
    } catch (error) {
      console.error('문의 등록 실패:', error);
      showAlert('문의 등록에 실패했습니다. 다시 시도해주세요.', '오류');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!detailData) return;

    try {
      await deleteInquiry(userId, detailData.id);
      setShowDeleteConfirm(false);

      // 먼저 모달을 닫고
      onClose();

      // 목록 새로고침
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }

      // 성공 메시지 표시
      toast('문의 내용을 삭제하였습니다');
    } catch (error) {
      console.error('문의 삭제 실패:', error);
      setShowDeleteConfirm(false);
      showAlert(error.message || '문의 삭제에 실패했습니다.', '오류');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleSendReply = async () => {
    if (!replyContent.trim()) {
      showAlert('답변 내용을 입력해주세요.', '입력 오류');
      return;
    }

    try {
      setSendingReply(true);
      await addInquiryReply(userId, inquiry.id, {
        content: replyContent,
        adminUserId: currentUserId,
        adminNickname: currentUserNickname
      });
      setReplyContent('');
      toast('답변을 등록했습니다');

      // 답변 목록 다시 로드
      await loadInquiryDetail();
    } catch (error) {
      console.error('답변 등록 실패:', error);
      showAlert('답변 등록에 실패했습니다. 다시 시도해주세요.', '오류');
    } finally {
      setSendingReply(false);
    }
  };

  const handleCopyContent = () => {
    if (!detailData?.content) return;

    navigator.clipboard.writeText(detailData.content)
      .then(() => {
        toast('문의 내용을 복사했습니다');
      })
      .catch((error) => {
        console.error('복사 실패:', error);
        showAlert('복사에 실패했습니다.', '오류');
      });
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Overlay onClick={handleOverlayClick}>
      <Container>
        <Header>
          <HeaderLeft>
            {onBack && (
              <BackButton onClick={onBack}>
                <ArrowLeft size={20} />
              </BackButton>
            )}
            <Title>{isNewInquiry ? '새 문의 작성' : '문의 상세'}</Title>
          </HeaderLeft>
          <HeaderButtons>
            {!isNewInquiry && detailData && detailData.status === 'pending' && (
              <DeleteButton onClick={handleDeleteClick} title="문의 삭제">
                <Trash2 size={20} />
              </DeleteButton>
            )}
            <CloseButton onClick={onClose}>
              <X size={20} />
            </CloseButton>
          </HeaderButtons>
        </Header>

        <Content>
          {isNewInquiry ? (
            <form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>카테고리</Label>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="기능 문의">기능 문의</option>
                  <option value="버그 신고">버그 신고</option>
                  <option value="개선 제안">개선 제안</option>
                  <option value="계정 문제">계정 문제</option>
                  <option value="기타">기타</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>제목</Label>
                <Input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="문의 제목을 입력하세요"
                  maxLength={100}
                />
              </FormGroup>

              <FormGroup>
                <Label>내용</Label>
                <Textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="문의 내용을 자세히 작성해주세요"
                />
              </FormGroup>

              <SubmitButton type="submit" disabled={submitting}>
                <Send size={18} />
                {submitting ? '등록 중...' : '문의 등록'}
              </SubmitButton>
            </form>
          ) : loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              로딩 중...
            </div>
          ) : detailData ? (
            <>
              <DetailHeader>
                <DetailTitle>{detailData.title}</DetailTitle>
                <DetailMeta>
                  <StatusBadge $color={getStatusColor(detailData.status)}>
                    {getStatusIcon(detailData.status)}
                    {getStatusText(detailData.status)}
                  </StatusBadge>
                  <Category>{detailData.category}</Category>
                  <Date>
                    <Clock size={12} />
                    {formatDate(detailData.createdAt)}
                  </Date>
                </DetailMeta>
                <DetailContent>{detailData.content}</DetailContent>
                {isAdmin && (
                  <CopyButton onClick={handleCopyContent}>
                    <Copy size={14} />
                    내용 복사
                  </CopyButton>
                )}
              </DetailHeader>

              <RepliesSection>
                <SectionTitle>
                  <MessageCircle size={16} />
                  답변 ({replies.length})
                </SectionTitle>
                {replies.length === 0 ? (
                  <NoReplies>
                    아직 답변이 없습니다.<br />
                    답변이 등록되면 알림을 보내드립니다.
                  </NoReplies>
                ) : (
                  replies.map((reply) => (
                    <ReplyItem key={reply.id} $isAdmin={reply.isAdmin}>
                      <ReplyHeader>
                        <ReplyAuthor $isAdmin={reply.isAdmin}>
                          {reply.isAdmin
                            ? (isSuperAdmin && reply.adminNickname
                                ? `셰어노트 지원팀 (${reply.adminNickname})`
                                : '셰어노트 지원팀')
                            : '나'}
                        </ReplyAuthor>
                        <ReplyDate>{formatDate(reply.createdAt)}</ReplyDate>
                      </ReplyHeader>
                      <ReplyContent>{reply.content}</ReplyContent>
                    </ReplyItem>
                  ))
                )}

                {isAdmin && (
                  <AdminReplySection>
                    <AdminReplyLabel>관리자 답변 작성</AdminReplyLabel>
                    <AdminReplyTextarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="답변 내용을 입력하세요..."
                      disabled={sendingReply}
                    />
                    <AdminReplyButton
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyContent.trim()}
                    >
                      <Send size={16} />
                      {sendingReply ? '전송 중...' : '답변 등록'}
                    </AdminReplyButton>
                  </AdminReplySection>
                )}
              </RepliesSection>
            </>
          ) : null}
        </Content>
      </Container>

      {showDeleteConfirm && (
        <ConfirmModal
          title="문의 삭제"
          message="문의를 삭제하시겠습니까?&#10;삭제된 문의는 복구할 수 없습니다."
          icon="🗑️"
          confirmText="삭제"
          cancelText="취소"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </Overlay>
  );
};

export default InquiryDetail;
