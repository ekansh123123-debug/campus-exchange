import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, MessageSquare, Flag, ArrowLeft } from 'lucide-react';
import { apiRequest } from '../../lib/api-client.js';
import { extractList, formatDateTime } from '../../lib/formatters.js';
import { CodeBadge } from '../../components/CodeBadge.jsx';
import { LoadingState, EmptyState, ErrorState, LoadingSpinner, MessageBubbleSkeleton } from '../../components/FeedbackStates.jsx';
import { ReportModal } from '../../components/ReportModal.jsx';
import { useToast } from '../../components/ToastContext.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { usePageTitle } from '../../lib/usePageTitle.js';

export function MessagesPage() {
  usePageTitle(
    'Conversations',
    'Coordinate campus handovers and item inspections with verified peers.'
  );
  const { conversationCode } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [reportTargetMsg, setReportTargetMsg] = useState(null);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(Boolean(conversationCode));

  useEffect(() => {
    setMobileThreadOpen(Boolean(conversationCode));
  }, [conversationCode]);

  const {
    data: convListRes,
    isLoading: loadingConvs,
    error: convError,
    refetch: refetchConvs,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiRequest('/conversations'),
  });

  const conversations = extractList(convListRes);
  const activeCode = conversationCode || conversations[0]?.conversationCode;

  const { data: activeConvRes } = useQuery({
    queryKey: ['conversation', activeCode],
    queryFn: () => apiRequest(`/conversations/${activeCode}`),
    enabled: Boolean(activeCode),
  });

  const {
    data: messagesRes,
    isLoading: loadingMessages,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['conversation', activeCode, 'messages'],
    queryFn: () => apiRequest(`/conversations/${activeCode}/messages`),
    enabled: Boolean(activeCode),
    refetchInterval: 8_000,
  });

  useEffect(() => {
    if (activeCode) {
      apiRequest(`/conversations/${activeCode}/read`, { method: 'PATCH' }).catch(() => {});
    }
  }, [activeCode]);

  const activeConv =
    activeConvRes?.data?.conversation ||
    conversations.find((c) => c.conversationCode === activeCode);
  const messages = extractList(messagesRes);

  const activePeer =
    activeConv?.otherParticipant ||
    activeConv?.counterpart ||
    activeConv?.peer ||
    (activeConv?.buyer?.userCode === user?.userCode ? activeConv?.seller : activeConv?.buyer);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!activeCode || !body.trim()) return;
    setSending(true);
    try {
      await apiRequest(`/conversations/${activeCode}/messages`, {
        method: 'POST',
        body: { body: body.trim() },
      });
      setBody('');
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (err) {
      showToast({ tone: 'danger', title: 'Could not send message', description: err.message });
    } finally {
      setSending(false);
    }
  };

  if (loadingConvs) return <LoadingState label="Loading campus conversations..." rows={3} variant="rows" />;
  if (convError) return <ErrorState error={convError} onRetry={refetchConvs} />;

  return (
    <div className="ce-stack-lg ce-animate-enter">
      <div>
        <CodeBadge>IN-APP PEER MESSAGING</CodeBadge>
        <h1 className="ce-title-section" style={{ marginTop: '0.35rem' }}>
          Campus Handover Coordination
        </h1>
        <p className="ce-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
          Coordinate gate pickup timings without exposing private phone numbers.
        </p>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          title="No active conversations yet"
          description="Open any marketplace listing and click 'Message Seller' or reserve an item to start coordinating."
          action={
            <Link to="/marketplace" className="ce-btn ce-btn-primary">
              Browse Marketplace
            </Link>
          }
        />
      ) : (
        <div className={`ce-chat-layout ${mobileThreadOpen ? 'mobile-thread-active' : 'mobile-list-active'}`}>
          <div className="ce-card ce-stack" style={{ padding: '0.75rem', gap: '0.45rem' }}>
            {conversations.map((conv, idx) => {
              const isSelected = conv.conversationCode === activeCode;
              const peer =
                conv.otherParticipant ||
                conv.counterpart ||
                (conv.buyer?.userCode === user?.userCode ? conv.seller : conv.buyer);
              return (
                <button
                  key={conv.conversationCode || conv.id || `conv-${idx}`}
                  type="button"
                  onClick={() => {
                    setMobileThreadOpen(true);
                    navigate(`/messages/${conv.conversationCode}`);
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '0.75rem',
                    borderRadius: 'var(--ce-radius-md)',
                    border: isSelected
                      ? '1px solid var(--ce-accent)'
                      : '1px solid var(--ce-border)',
                    background: isSelected ? 'var(--ce-accent-subtle)' : 'var(--ce-bg-primary)',
                    cursor: 'pointer',
                  }}
                >
                  <div className="ce-row-between">
                    <strong style={{ fontSize: '0.9rem', color: 'var(--ce-text-primary)' }}>
                      {peer?.fullName || 'Campus Peer'}
                    </strong>
                    <CodeBadge>{conv.conversationCode}</CodeBadge>
                  </div>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--ce-text-secondary)',
                      marginTop: '0.25rem',
                      fontWeight: 500,
                    }}
                  >
                    {conv.listing?.title || 'Listing Thread'}
                  </div>
                  {conv.lastMessagePreview && (
                    <div
                      className="ce-muted"
                      style={{
                        fontSize: '0.78rem',
                        marginTop: '0.25rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {conv.lastMessagePreview}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div
            className="ce-card ce-stack"
            style={{ minHeight: '460px', justifyContent: 'space-between' }}
          >
            {activeConv ? (
              <>
                <div
                  className="ce-row-between"
                  style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--ce-border)', flexWrap: 'wrap', gap: '0.5rem' }}
                >
                  <div className="ce-row" style={{ gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="ce-btn ce-btn-ghost ce-btn-sm ce-mobile-back-btn"
                      onClick={() => {
                        setMobileThreadOpen(false);
                        navigate('/messages');
                      }}
                      aria-label="Back to conversations list"
                      style={{ padding: '0.35rem 0.5rem' }}
                    >
                      <ArrowLeft size={16} />
                      <span>Chats</span>
                    </button>
                    <div>
                      <div className="ce-row" style={{ gap: '0.45rem' }}>
                        <MessageSquare size={16} color="var(--ce-accent)" />
                        <strong>{activeConv.listing?.title || 'Campus Item'}</strong>
                      </div>
                      <div className="ce-muted" style={{ fontSize: '0.8rem', marginTop: '0.15rem' }}>
                        Conversation Code: {activeConv.conversationCode}
                        {activePeer?.fullName ? ` · Peer: ${activePeer.fullName}` : ''}
                      </div>
                    </div>
                  </div>
                  {activeConv.listing?.listingCode && (
                    <Link
                      to={`/listings/${activeConv.listing.listingCode}`}
                      className="ce-btn ce-btn-secondary ce-btn-sm"
                    >
                      View Listing
                    </Link>
                  )}
                </div>

                <div
                  className="ce-stack"
                  style={{
                    gap: '0.65rem',
                    maxHeight: '360px',
                    overflowY: 'auto',
                    padding: '0.75rem 0',
                  }}
                >
                  {loadingMessages ? (
                    <div className="ce-stack" style={{ gap: '0.75rem', padding: '0.5rem 0' }}>
                      <div className="ce-row" style={{ gap: '0.5rem', justifyContent: 'center' }}>
                        <LoadingSpinner size="xs" color="var(--ce-primary)" showColdStartHint />
                        <span className="ce-muted" style={{ fontSize: '0.8rem' }}>Loading conversation messages...</span>
                      </div>
                      <MessageBubbleSkeleton />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="ce-muted" style={{ textAlign: 'center', padding: '2rem' }}>
                      Send a message to coordinate campus gate pickup.
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMine = msg.isMine || msg.sender?.userCode === user?.userCode;
                      const senderCode = msg.sender?.userCode || activePeer?.userCode;
                      return (
                        <div
                          key={msg.messageCode || msg.id || `msg-${idx}`}
                          className="ce-chat-bubble-enter"
                          style={{
                            alignSelf: isMine ? 'flex-end' : 'flex-start',
                            maxWidth: 'min(85%, 100%)',
                            padding: '0.65rem 0.85rem',
                            borderRadius: 'var(--ce-radius-md)',
                            background: isMine
                              ? 'var(--ce-accent-subtle)'
                              : 'var(--ce-bg-elevated)',
                            border: '1px solid var(--ce-border)',
                            overflowWrap: 'anywhere',
                            wordBreak: 'break-word',
                          }}
                        >
                          <div
                            className="ce-row-between"
                            style={{ gap: '0.75rem', marginBottom: '0.2rem' }}
                          >
                            <strong
                              style={{ fontSize: '0.76rem', color: 'var(--ce-text-secondary)' }}
                            >
                              {isMine ? 'You' : msg.sender?.fullName || activePeer?.fullName || 'Peer'}
                            </strong>
                            <div className="ce-row" style={{ gap: '0.35rem' }}>
                              <span className="ce-muted" style={{ fontSize: '0.72rem' }}>
                                {formatDateTime(msg.createdAt)}
                                {isMine ? (msg.readAt ? ' · Read' : ' · Sent') : ''}
                              </span>
                              {!isMine && senderCode && (
                                <button
                                  type="button"
                                  onClick={() => setReportTargetMsg(msg)}
                                  className="ce-btn ce-btn-ghost ce-btn-sm"
                                  style={{ padding: '0.1rem' }}
                                  title="Report sender"
                                >
                                  <Flag size={11} />
                                </button>
                              )}
                            </div>
                          </div>
                          <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                            {msg.body}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Quick Campus Handover Location Chips */}
                <div className="ce-row" style={{ gap: '0.4rem', flexWrap: 'wrap', padding: '0.2rem 0' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ce-muted)' }}>Meet point:</span>
                  {['Central Library', 'Main Canteen', 'Mechanical Block', 'Campus Gate 1'].map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      className="ce-branch-chip"
                      style={{ padding: '2px 9px', fontSize: '0.75rem' }}
                      onClick={() => setBody((prev) => (prev ? `${prev} (Meet at ${loc})` : `Meet at ${loc}?`))}
                    >
                      {loc}
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className="ce-stack"
                  style={{
                    gap: '0.35rem',
                    paddingTop: '0.45rem',
                    borderTop: '1px solid var(--ce-border)',
                  }}
                >
                  <div className="ce-row" style={{ gap: '0.6rem' }}>
                    <input
                      type="text"
                      maxLength={2000}
                      className="ce-input"
                      style={{ flex: 1, minWidth: 0 }}
                      placeholder="Write a message about pickup timing or campus gate..."
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="ce-btn ce-btn-primary"
                      disabled={sending || !body.trim()}
                    >
                      {sending ? <LoadingSpinner size="xs" color="#ffffff" /> : <Send size={15} />}
                      <span>{sending ? 'Sending...' : 'Send'}</span>
                    </button>
                  </div>
                  <div
                    className="ce-row-between ce-muted"
                    style={{ fontSize: '0.74rem', padding: '0 0.2rem' }}
                  >
                    <span>Plain text only · Private to conversation participants</span>
                    <span>{body.length}/2000</span>
                  </div>
                </form>
              </>
            ) : (
              <div className="ce-muted" style={{ textAlign: 'center', padding: '2rem' }}>
                Select a conversation thread to view messages.
              </div>
            )}
          </div>
        </div>
      )}

      {reportTargetMsg && (
        <ReportModal
          targetType="user"
          targetCode={reportTargetMsg.sender?.userCode || activePeer?.userCode}
          targetTitle={`${reportTargetMsg.sender?.fullName || activePeer?.fullName || 'Peer'} — "${reportTargetMsg.body}"`}
          onClose={() => setReportTargetMsg(null)}
        />
      )}
    </div>
  );
}
