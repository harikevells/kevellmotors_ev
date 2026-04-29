import { useState, useRef, useEffect } from 'react';
import UserSidebar from '../../components/user/UserSidebar';
import UserPageHeader from '../../components/user/UserPageHeader';
import { agentAPI } from '../../api';

/* ── Suggestion chips shown before first message ── */
const SUGGESTIONS = [
  'Book a general service for my bike',
  'I need a battery checkup',
  'Schedule motor inspection next week',
  'Book service near Chennai',
  'I need an AMC service',
  'Software update for my EV',
];

/* ── Parse booking confirmation block from assistant reply ── */
function parseBooking(text) {
  if (!text) return null;
  // Backend sends last-8-chars of ObjectId uppercased, e.g. "**Booking ID:** A1B2C3D4"
  const match = text.match(/booking(?:\s+id)?[:\s*#]+([a-f0-9]{8,24})\b/i);
  return match ? match[1] : null;
}

/* ── Render text with basic markdown (bold, newlines, numbered lists) ── */
function RichText({ text }) {
  const lines = text.split('\n');
  return (
    <div>
      {lines.map((line, i) => {
        // Bold **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((seg, j) =>
          seg.startsWith('**') && seg.endsWith('**')
            ? <strong key={j}>{seg.slice(2, -2)}</strong>
            : seg
        );
        return (
          <p key={i} style={{ margin: i === 0 ? 0 : '.35rem 0 0', lineHeight: 1.6 }}>{parts}</p>
        );
      })}
    </div>
  );
}

/* ── Typing indicator dots ── */
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '.2rem 0' }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#00e5ff',
          animation: `evaBounce .9s ease-in-out ${i * 0.18}s infinite`,
        }} />
      ))}
    </div>
  );
}

export default function AIAgentPage() {
  const [messages, setMessages] = useState([]); // {role:'user'|'assistant', content:''}
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]); // Contextual buttons from backend
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const send = async (text) => {
    const query = (text || input).trim();
    if (!query || busy) return;
    setInput('');
    setError('');

    const userMsg = { role: 'user', content: query };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setBusy(true);

    try {
      // Send full history to the backend so the agent has context
      const { data } = await agentAPI.chat(nextMessages);
      setMessages([...nextMessages, { role: 'assistant', content: data.reply }]);
      setSuggestions(data.suggestions || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(msg);
      // Remove optimistic user message on hard failure
      setMessages(messages);
    } finally {
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const bg = { background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' };
  const card = { background: '#0d0e2b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 };

  return (
    <div className="layout user-dark" style={bg}>
      <style>{`
        @keyframes evaBounce {
          0%,80%,100% { transform: translateY(0); opacity:.4; }
          40% { transform: translateY(-6px); opacity:1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .eva-input::placeholder { color: #4b5563; }
        .eva-input:focus { border-color: rgba(0,229,255,0.4) !important; box-shadow: 0 0 0 3px rgba(0,229,255,0.08); }
        .eva-chip:hover { background: rgba(0,229,255,0.12) !important; border-color: rgba(0,229,255,0.35) !important; color: #00e5ff !important; }
        .eva-send:hover { background: #0d5fdd !important; }
        .eva-send:disabled { opacity: .5; cursor: not-allowed; }
      `}</style>

      <UserSidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem 2rem', overflow: 'hidden', maxHeight: '100vh' }}>

        <UserPageHeader
          title="EVA - Your EV Booking Assistant"
          subtitle="Powered by AI - Just describe what you need and I will handle the booking"
          actions={(
            <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.72rem', color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 20, padding: '.25rem .75rem' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'evaBounce 1.5s ease-in-out infinite' }} />
              Online
            </div>
          )}
        />

        {/* Chat window */}
        <div style={{ ...card, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Messages area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

            {/* Welcome message */}
            {messages.length === 0 && !busy && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', gap: '1.25rem', padding: '2rem 1rem' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(26,110,247,.2),rgba(0,229,255,.15))', border: '2px solid rgba(0,229,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>⚡</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#e2e8f0' }}>Hi! I'm EVA</h2>
                  <p style={{ margin: '.5rem 0 0', color: '#6b7280', fontSize: '.85rem', maxWidth: 380 }}>
                    Tell me what service your EV needs and I'll find the nearest available service center and book your appointment — instantly.
                  </p>
                </div>
                {/* Suggestion chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem', justifyContent: 'center', maxWidth: 520 }}>
                  {SUGGESTIONS.map((s) => (
                    <button key={s} className="eva-chip" onClick={() => send(s)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '.4rem .9rem', color: '#9ca3af', fontSize: '.78rem', cursor: 'pointer', transition: 'all .15s' }}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Message bubbles */}
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              const bookingId = !isUser ? parseBooking(msg.content) : null;
              return (
                <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '.6rem' }}>
                  {!isUser && (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#1a6ef7,#00e5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem', flexShrink: 0 }}>⚡</div>
                  )}
                  <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', gap: '.4rem', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      padding: '.75rem 1rem',
                      borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isUser
                        ? 'linear-gradient(135deg,#1a4ef7,#0d3fc7)'
                        : 'rgba(255,255,255,0.05)',
                      border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      color: '#e2e8f0',
                      fontSize: '.88rem',
                      lineHeight: 1.6,
                      boxShadow: isUser ? '0 4px 20px rgba(26,78,247,0.3)' : 'none',
                    }}>
                      {isUser ? msg.content : <RichText text={msg.content} />}
                    </div>
                    {/* Booking confirmation badge */}
                    {bookingId && (
                      <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '.6rem 1rem', fontSize: '.78rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                        <span>✅</span>
                        <span>Booking confirmed · ID: <strong style={{ fontFamily: 'monospace' }}>{bookingId.slice(-8).toUpperCase()}</strong></span>
                      </div>
                    )}
                    <span style={{ fontSize: '.68rem', color: '#374151' }}>
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {isUser && (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem', flexShrink: 0 }}>👤</div>
                  )}
                </div>
              );
            })}

            {/* Typing indicator */}
            {busy && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '.6rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#1a6ef7,#00e5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem' }}>⚡</div>
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px 18px 18px 4px', padding: '.75rem 1rem' }}>
                  <TypingDots />
                </div>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '.75rem 1rem', color: '#ef4444', fontSize: '.83rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggestions Layer (Contextual buttons) */}
          {suggestions.length > 0 && !busy && (
            <div style={{ padding: '0 1.5rem .75rem', display: 'flex', flexWrap: 'wrap', gap: '.6rem', justifyContent: 'center' }}>
              {suggestions.map((s) => (
                <button
                  key={s}
                  className="eva-chip"
                  onClick={() => send(s)}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 20,
                    padding: '.4rem .9rem',
                    color: '#9ca3af',
                    fontSize: '.78rem',
                    cursor: 'pointer',
                    transition: 'all .15s'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

          {/* Input row */}
          <div style={{ padding: '1rem 1.25rem', display: 'flex', gap: '.75rem', alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              className="eva-input"
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-grow
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKey}
              placeholder="Describe the service you need… (Enter to send)"
              disabled={busy}
              style={{
                flex: 1,
                resize: 'none',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: '.7rem 1rem',
                color: '#e2e8f0',
                fontSize: '.9rem',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                minHeight: 44,
                maxHeight: 120,
                overflowY: 'auto',
                transition: 'border-color .15s, box-shadow .15s',
              }}
            />
            <button
              className="eva-send"
              onClick={() => send()}
              disabled={busy || !input.trim()}
              style={{
                background: '#1a6ef7',
                border: 'none',
                borderRadius: 12,
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.1rem',
                flexShrink: 0,
                transition: 'background .15s',
                boxShadow: '0 4px 15px rgba(26,110,247,0.35)',
              }}
            >
              {busy
                ? <div style={{ width: 18, height: 18, border: '3px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                : '➤'}
            </button>
          </div>

          {/* Footer hint */}
          <p style={{ textAlign: 'center', fontSize: '.7rem', color: '#374151', margin: '0 0 .75rem', flexShrink: 0 }}>
            EVA may occasionally make mistakes · Always review before confirming a booking
          </p>
        </div>
      </div>
    </div>
  );
}
