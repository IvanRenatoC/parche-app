import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getOrCreateChat, sendMessage, subscribeToMessages } from '../../services/chat';
import { ModalOverlay } from './CreateJobPostModal';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Card';
import type { Application, ChatMessage } from '../../types';
import { X, Send } from 'lucide-react';

interface Props {
  application: Pick<Application, 'id' | 'owner_uid' | 'worker_uid' | 'job_post_id'>;
  jobTitle: string;
  otherName: string;
  onClose: () => void;
}

function formatMsgTime(ts: unknown): string {
  if (!ts) return '';
  if (typeof ts === 'object' && ts !== null) {
    const obj = ts as { seconds?: number };
    if (typeof obj.seconds === 'number') {
      return new Date(obj.seconds * 1000).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    }
  }
  const d = new Date(ts as string | number);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

export function ChatModal({ application, jobTitle, otherName, onClose }: Props) {
  const { appUser } = useAuth();
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!appUser) return;
    getOrCreateChat(
      application.owner_uid,
      application.worker_uid,
      application.job_post_id,
      application.id
    )
      .then(setChatId)
      .finally(() => setInitializing(false));
  }, [application, appUser]);

  useEffect(() => {
    if (!chatId) return;
    const unsub = subscribeToMessages(chatId, setMessages);
    return unsub;
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!chatId || !appUser || !input.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(chatId, appUser.uid, input);
      setInput('');
      textareaRef.current?.focus();
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '520px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>
              Chat con {otherName}
            </h3>
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{jobTitle}</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            padding: '4px 2px',
          }}
        >
          {initializing ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Spinner size={24} />
            </div>
          ) : messages.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <p style={{ fontSize: '13px', color: '#9CA3AF', textAlign: 'center' }}>
                Inicia la conversación con {otherName}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_uid === appUser?.uid;
              return (
                <div
                  key={msg.id}
                  style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}
                >
                  <div
                    style={{
                      maxWidth: '72%',
                      padding: '8px 12px',
                      borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: isMe ? '#C0395B' : '#F3F4F6',
                      color: isMe ? '#FFFFFF' : '#111827',
                      fontSize: '14px',
                      lineHeight: 1.45,
                    }}
                  >
                    <span>{msg.content}</span>
                    <div style={{ fontSize: '10px', marginTop: '3px', opacity: 0.7, textAlign: 'right' }}>
                      {formatMsgTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #ECE7DD',
            flexShrink: 0,
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje… (Enter para enviar)"
            rows={2}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '14px',
              borderRadius: '10px',
              border: '1.5px solid #E8E5E0',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.4,
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#C0395B'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#E8E5E0'; }}
          />
          <Button
            size="sm"
            onClick={handleSend}
            loading={sending}
            disabled={!input.trim() || initializing}
            style={{ alignSelf: 'flex-end', height: '38px' }}
          >
            <Send size={14} />
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
}
