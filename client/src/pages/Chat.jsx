import { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';

const WELCOME_MSG = {
  id: 'welcome',
  role: 'assistant',
  content:
    "👋 **Welcome to SAP Enterprise Decision Support AI**\n\nI have access to your live SAP data across Finance, Supply Chain, Sales, and HR modules.\n\nAsk me anything — like *\"Why did our Q3 margins drop?\"* or *\"Which suppliers are at risk?\"*",
  sources: [],
  ts: new Date(),
};

function parseMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, `<code style="background:var(--bg-elevated);padding:1px 5px;border-radius:3px;font-family:var(--font-mono);font-size:12px">$1</code>`)
    .replace(/^### (.+)$/gm, '<div style="font-weight:700;color:var(--text-primary);margin:10px 0 4px">$1</div>')
    .replace(/^## (.+)$/gm, '<div style="font-size:15px;font-weight:700;color:var(--text-primary);margin:12px 0 6px">$1</div>')
    .replace(/^- (.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0"><span style="color:var(--accent-blue);margin-top:2px">▸</span><span>$1</span></div>')
    .replace(/\n/g, '<br/>');
}

function Message({ msg, isLast }) {
  const isUser = msg.role === 'user';
  return (
    <div
      className="fade-in"
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: 10,
        alignItems: 'flex-start',
        marginBottom: 18,
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: isUser
          ? 'linear-gradient(135deg,var(--accent-blue),var(--accent-violet))'
          : 'linear-gradient(135deg,var(--accent-cyan),var(--accent-blue))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: 'white',
      }}>
        {isUser ? 'U' : '🤖'}
      </div>

      <div style={{ maxWidth: '75%', minWidth: 0 }}>
        {/* Bubble */}
        <div style={{
          background: isUser ? 'var(--accent-blue)' : 'var(--bg-elevated)',
          border: isUser ? 'none' : '1px solid var(--border)',
          borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          padding: '11px 15px',
          color: isUser ? 'white' : 'var(--text-secondary)',
          fontSize: 13.5,
          lineHeight: 1.65,
        }}>
          {msg.loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="spinner" style={{ width: 14, height: 14 }} />
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Analyzing SAP data…</span>
            </div>
          ) : isUser ? (
            <span>{msg.content}</span>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
          )}
        </div>

        {/* Sources */}
        {!isUser && msg.sources?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {msg.sources.map((s, i) => (
              <span key={i} className="badge badge-muted" style={{ fontSize: 10 }}>
                📊 {s}
              </span>
            ))}
          </div>
        )}

        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>
          {msg.ts?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatAPI.getSuggestedQuestions().then((r) => setSuggestions(r.questions || [])).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text) {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');

    const userEntry = { id: Date.now(), role: 'user', content: userMsg, ts: new Date() };
    const loadingEntry = { id: Date.now() + 1, role: 'assistant', content: '', loading: true, ts: new Date() };

    setMessages((prev) => [...prev, userEntry, loadingEntry]);
    setLoading(true);

    // Build history (exclude welcome and loading)
    const history = messages
      .filter((m) => m.id !== 'welcome' && !m.loading)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await chatAPI.sendMessage(userMsg, history);
      setMessages((prev) =>
        prev.map((m) =>
          m.loading
            ? { ...m, loading: false, content: res.response, sources: res.data_sources_used }
            : m
        )
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.loading
            ? {
                ...m,
                loading: false,
                content: `❌ **Connection error** — ${err.message}\n\nMake sure your backend is running:\n\`uvicorn app.main:app --reload --port 8000\``,
                sources: [],
              }
            : m
        )
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([WELCOME_MSG]);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">AI Assistant</div>
          <div className="page-subtitle">Powered by SAP BTP · Connected to live data</div>
        </div>
        <div className="header-actions">
          <span className="badge badge-green">
            <span className="pulse" style={{ display: 'inline-block', width: 6, height: 6, background: 'var(--accent-green)', borderRadius: '50%' }} />
            Online
          </span>
          <button className="btn btn-secondary btn-sm" onClick={clearChat}>Clear chat</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
          {messages.map((msg, i) => (
            <Message key={msg.id} msg={msg} isLast={i === messages.length - 1} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Suggested questions */}
        {messages.length <= 1 && suggestions.length > 0 && (
          <div style={{ padding: '0 28px 12px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {suggestions.slice(0, 4).map((q, i) => (
              <button
                key={i}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 12 }}
                onClick={() => sendMessage(q)}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div style={{
          padding: '14px 28px 20px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-surface)',
        }}>
          <div style={{
            display: 'flex',
            gap: 10,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '8px 8px 8px 14px',
            transition: 'border-color 0.2s',
          }}>
            <textarea
              ref={inputRef}
              className="input-field"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                resize: 'none',
                minHeight: 36,
                maxHeight: 120,
                padding: 0,
                fontSize: 14,
                lineHeight: 1.5,
              }}
              placeholder="Ask about revenue, supply chain, HR, decisions…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              disabled={loading}
            />
            <button
              className="btn btn-primary"
              style={{ borderRadius: 8, padding: '8px 16px', alignSelf: 'flex-end', flexShrink: 0 }}
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
            >
              {loading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : '↑ Send'}
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
            Press <kbd style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '0 4px', borderRadius: 3, fontSize: 10 }}>Enter</kbd> to send · <kbd style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '0 4px', borderRadius: 3, fontSize: 10 }}>Shift+Enter</kbd> for new line
          </div>
        </div>
      </div>
    </>
  );
}
