import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [mode, setMode]             = useState('login');
  const [form, setForm]             = useState({ name: '', email: '', password: '', role: 'viewer' });
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const { login } = useAuth();
  const navigate  = useNavigate();

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccessMsg(null);
  }

  function switchMode(newMode) {
    setMode(newMode);
    setError(null);
    setSuccessMsg(null);
    setForm({ name: '', email: '', password: '', role: 'viewer' });
  }

  async function handleSubmit() {
    if (!form.email || !form.password) { setError('Email and password are required'); return; }
    if (mode === 'register' && !form.name) { setError('Full name is required'); return; }
    if (mode === 'register' && form.password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'register') {
        // ── REGISTER: create account only, DO NOT login ──
        await authAPI.register({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        });

        // Switch to login tab with success message, pre-fill email
        setSuccessMsg(`Account created for "${form.name}"! Now sign in with your credentials.`);
        setMode('login');
        setForm({ name: '', email: form.email, password: '', role: 'viewer' });

      } else {
        // ── LOGIN: verify credentials then go to dashboard ──
        const res = await authAPI.login(form.email, form.password);
        login(res.access_token, res.user);
        navigate('/dashboard');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) { if (e.key === 'Enter') handleSubmit(); }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ position:'fixed', top:-200, right:-200, width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(59,130,246,0.08) 0%,transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'fixed', bottom:-200, left:-200, width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,0.06) 0%,transparent 70%)', pointerEvents:'none' }} />

      <div className="fade-in" style={{ width:'100%', maxWidth:420 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{
            width:52, height:52, borderRadius:14, background:'var(--accent-blue)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22, fontWeight:800, color:'white', margin:'0 auto 14px',
            boxShadow:'0 8px 24px rgba(59,130,246,0.35)',
          }}>S</div>
          <div style={{ fontSize:20, fontWeight:700, color:'var(--text-primary)' }}>SAP Decision AI</div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>Enterprise Intelligence Platform</div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding:28 }}>

          {/* Tabs */}
          <div style={{ display:'flex', gap:4, background:'var(--bg-elevated)', borderRadius:8, padding:4, marginBottom:24 }}>
            {['login','register'].map((m) => (
              <button key={m} onClick={() => switchMode(m)} style={{
                flex:1, padding:'7px 0', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer',
                background: mode===m ? 'var(--bg-surface)' : 'transparent',
                color: mode===m ? 'var(--text-primary)' : 'var(--text-muted)',
                border: mode===m ? '1px solid var(--border)' : '1px solid transparent',
                transition:'all 0.2s',
              }}>
                {m === 'login' ? ' Sign In' : ' Register'}
              </button>
            ))}
          </div>

          {/* Success banner after register */}
          {successMsg && (
            <div className="alert alert-success" style={{ marginBottom:16 }}>
              {successMsg}
            </div>
          )}

          {/* Fields */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {mode === 'register' && (
              <div>
                <label className="input-label">Full Name</label>
                <input className="input-field" placeholder="e.g. Abby Nayaraj"
                  value={form.name} onChange={(e) => update('name', e.target.value)} onKeyDown={handleKey} />
              </div>
            )}

            <div>
              <label className="input-label">Email Address</label>
              <input className="input-field" type="email" placeholder="you@company.com"
                value={form.email} onChange={(e) => update('email', e.target.value)} onKeyDown={handleKey} />
            </div>

            <div>
              <label className="input-label">Password</label>
              <input className="input-field" type="password"
                placeholder={mode==='register' ? 'Minimum 6 characters' : 'Enter your password'}
                value={form.password} onChange={(e) => update('password', e.target.value)} onKeyDown={handleKey} />
            </div>

            {mode === 'register' && (
              <div>
                <label className="input-label">Role</label>
                <select className="input-field" value={form.role} onChange={(e) => update('role', e.target.value)}>
                  <option value="viewer">Viewer — can view and chat</option>
                  <option value="admin">Admin — full access</option>
                </select>
              </div>
            )}

            {error && (
              <div className="alert alert-danger" style={{ margin:0 }}>⚠️ {error}</div>
            )}

            <button
              className="btn btn-primary btn-lg"
              style={{ width:'100%', justifyContent:'center', marginTop:4 }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <><div className="spinner" style={{ width:15, height:15 }} />{mode==='login' ? 'Signing in…' : 'Creating account…'}</>
                : mode==='login' ? ' Sign In' : ' Create Account'
              }
            </button>
          </div>

          {mode === 'login' && !successMsg && (
            <div style={{ marginTop:16, padding:12, background:'var(--accent-blue-dim)', border:'1px solid var(--accent-blue-border)', borderRadius:'var(--radius-sm)', fontSize:12, color:'var(--accent-blue)' }}>
               <strong>New here?</strong> Switch to Register tab to create your account first.
            </div>
          )}

          {mode === 'register' && (
            <div style={{ marginTop:16, padding:12, background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:12, color:'var(--text-muted)' }}>
               After registering you'll be taken back to Sign In to log in.
            </div>
          )}
        </div>

        <div style={{ textAlign:'center', marginTop:16, fontSize:12, color:'var(--text-muted)' }}>
          SAP Enterprise Decision Support AI · v2.0
        </div>
      </div>
    </div>
  );
}