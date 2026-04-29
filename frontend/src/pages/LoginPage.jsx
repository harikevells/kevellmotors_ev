import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  { icon: '⚡', title: 'Smart EV Servicing', desc: 'Book, track and manage all your EV service needs in one place.' },
  { icon: '🔋', title: 'Battery Health Monitoring', desc: 'Real-time battery diagnostics and health reports for your vehicle.' },
  { icon: '🛡️', title: 'Warranty & AMC Plans', desc: 'Comprehensive cover plans that keep your EV road-ready always.' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'franchise') navigate('/franchise/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* ── Left hero panel ── */}
      <div style={s.hero}>
        {/* animated glow orbs */}
        <div style={s.orb1} />
        <div style={s.orb2} />

        <div style={s.heroInner}>
          {/* logo */}
          <div style={s.logo}>
            <img src="/logo.png" alt="Kevell Motors Logo" style={s.logoImg} />
            <div style={s.logoBrand}>
              <span style={s.logoBolt}>⚡</span>
              <span style={s.logoText}>Kevell Motors</span>
            </div>
          </div>

          <h1 style={s.heroTitle}>
            Power Your EV<br />
            <span style={s.heroAccent}>Service Experience</span>
          </h1>
          <p style={s.heroSub}>
            India's most trusted platform for electric vehicle servicing,
            maintenance &amp; fleet management.
          </p>

          <div style={s.featureList}>
            {features.map((f) => (
              <div key={f.title} style={s.featureItem}>
                <div style={s.featureIcon}>{f.icon}</div>
                <div>
                  <div style={s.featureTitle}>{f.title}</div>
                  <div style={s.featureDesc}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* stats strip */}
          {/* <div style={s.statsRow}>
            {[['10K+', 'EVs Serviced'], ['50+', 'Service Centres'], ['4.8★', 'Avg Rating']].map(([val, lbl]) => (
              <div key={lbl} style={s.stat}>
                <div style={s.statVal}>{val}</div>
                <div style={s.statLbl}>{lbl}</div>
              </div>
            ))}
          </div> */}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={s.formPanel}>

        {/* ── Lighting: glowing orbs ── */}
        <div className="light-orb-1" />
        <div className="light-orb-2" />
        <div className="light-orb-3" />

        {/* ── Lighting: diagonal beam streaks ── */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:1 }} preserveAspectRatio="none">
          <defs>
            <linearGradient id="beam1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00b4d8" stopOpacity="0"/>
              <stop offset="50%" stopColor="#00b4d8" stopOpacity="0.07"/>
              <stop offset="100%" stopColor="#00b4d8" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="beam2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0"/>
              <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.06"/>
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <rect x="-10%" y="-10%" width="25%" height="200%" fill="url(#beam1)" className="beam-anim-1" style={{ transform:'rotate(-35deg)', transformOrigin:'center' }}/>
          <rect x="65%" y="-10%" width="18%" height="200%" fill="url(#beam2)" className="beam-anim-2" style={{ transform:'rotate(-20deg)', transformOrigin:'center' }}/>
        </svg>

        {/* ── Lighting: hex grid overlay ── */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.04, pointerEvents:'none', zIndex:1 }} preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="hexPat" x="0" y="0" width="56" height="48" patternUnits="userSpaceOnUse">
              <polygon points="14,2 42,2 56,24 42,46 14,46 0,24" fill="none" stroke="#00b4d8" strokeWidth="0.8"/>
              <polygon points="14,2 42,2 56,24 42,46 14,46 0,24" fill="none" stroke="#00b4d8" strokeWidth="0.8" transform="translate(28,24)"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexPat)"/>
        </svg>

        {/* ── Lighting: animated cyan scan line ── */}
        <div className="scan-line" />

        {/* ── Lighting: spinning orbit rings + bolt ── */}
        <svg style={{ position:'absolute', top:0, right:0, pointerEvents:'none', zIndex:1 }} width="160" height="160" viewBox="0 0 200 200" fill="none">
          <circle cx="160" cy="40" r="90" stroke="#00e5ff" strokeWidth="1.2" strokeDasharray="6 5" opacity="0.20" className="spin-slow"/>
          <circle cx="160" cy="40" r="62" stroke="#7c3aed" strokeWidth="1" strokeDasharray="4 7" opacity="0.15" className="spin-slow-rev"/>
          <path d="M158 8 L138 48 L158 48 L132 88" stroke="#00e5ff" strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round" className="bolt-pulse" filter="url(#glow)"/>
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
        </svg>

        {/* ── Lighting: bottom glow strip ── */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,rgba(0,229,255,.4),rgba(124,58,237,.4),transparent)', pointerEvents:'none', zIndex:1 }} />
        <div style={{ position:'absolute', bottom:0, left:'10%', right:'10%', height:80, background:'radial-gradient(ellipse at 50% 100%,rgba(0,229,255,.14) 0%,transparent 70%)', pointerEvents:'none', zIndex:1 }} />

        {/* ── Lighting: floating spark particles ── */}
        {[[8,25],[88,12],[62,68],[22,82],[92,52],[45,10],[75,88]].map(([x,y],i) => (
          <div key={i} className={`spark spark-${i}`} style={{ position:'absolute', left:`${x}%`, top:`${y}%`, width: i%2===0 ? 3 : 4, height: i%2===0 ? 3 : 4, borderRadius:'50%', background:'#00e5ff', boxShadow:`0 0 ${6+i*2}px ${3+i}px rgba(0,229,255,.6)`, pointerEvents:'none', zIndex:1 }} />
        ))}

        <div style={s.formCard}>
          {/* mobile logo */}
          <div style={s.mobileLogo}>
            <img src="/logo.png" alt="Kevell Motors Logo" style={{ ...s.logoImg, width: 48, height: 48 }} />
            <div style={s.logoBrand}>
              {/* <span style={s.logoBolt}>⚡</span> */}
              <span style={{ ...s.logoText, color: '#e2e8f0' }}>Kevell Motors</span>
            </div>
          </div>

          <h2 style={s.formTitle}>Welcome back</h2>
          <p style={s.formSub}>Sign in to your EVserv account</p>

          {error && (
            <div style={s.errorBox}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
            <div style={s.field}>
              <label style={s.label}>Email address</label>
              <div style={s.inputWrap}>
                <span style={s.inputIcon}>✉️</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  style={s.input}
                  onFocus={(e) => (e.target.style.borderColor = '#00b4d8')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,.08)')}
                />
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Password</label>
              <div style={s.inputWrap}>
                <span style={s.inputIcon}>🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  style={{ ...s.input, paddingRight: '3rem' }}
                  onFocus={(e) => (e.target.style.borderColor = '#00b4d8')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,.08)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  style={s.eyeBtn}
                  tabIndex={-1}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ ...s.submitBtn, opacity: loading ? 0.8 : 1 }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = 'linear-gradient(135deg,#0077b6,#00b4d8)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,180,216,.5)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg,#00b4d8,#0077b6)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,180,216,.35)'; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(.98)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
                  <span style={s.btnSpinner} /> Signing in…
                </span>
              ) : (
                '⚡  Sign In'
              )}
            </button>
          </form>

          <div style={s.divider}><span style={s.dividerText}>or</span></div>

          <p style={s.signupRow}>
            New to EVserv?{' '}
            <Link to="/register" style={s.signupLink}>Create a free account →</Link>
          </p>

          <p style={s.legal}>
            By signing in you agree to our{' '}
            <a href="#" style={s.legalLink}>Terms of Service</a> &amp;{' '}
            <a href="#" style={s.legalLink}>Privacy Policy</a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-40px) scale(1.1)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,30px) scale(0.95)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes spinSlow { to{transform:rotate(360deg)} }
        @keyframes spinSlowRev { to{transform:rotate(-360deg)} }
        @keyframes boltPulse { 0%,100%{opacity:.5} 50%{opacity:1;filter:drop-shadow(0 0 7px #00e5ff)} }
        @keyframes scanMove { 0%{top:-4px} 100%{top:100%} }
        @keyframes sparkFloat0 { 0%,100%{transform:translateY(0) scale(1);opacity:.9} 50%{transform:translateY(-12px) scale(1.4);opacity:.2} }
        @keyframes sparkFloat1 { 0%,100%{transform:translateY(0) scale(1);opacity:.7} 50%{transform:translateY(-18px) scale(1.2);opacity:.15} }
        @keyframes sparkFloat2 { 0%,100%{transform:translateY(0) scale(1);opacity:.85} 50%{transform:translateY(-10px) scale(1.5);opacity:.25} }
        @keyframes beamPulse1 { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes beamPulse2 { 0%,100%{opacity:.3} 50%{opacity:.7} }
        @keyframes orbPulse1 { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.1);opacity:.8} }
        @keyframes orbPulse2 { 0%,100%{transform:scale(1);opacity:.45} 50%{transform:scale(1.08);opacity:.65} }
        @keyframes orbPulse3 { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.35} 50%{transform:translate(-50%,-50%) scale(1.2);opacity:.55} }

        .light-orb-1 {
          position:absolute; top:-130px; right:-90px;
          width:440px; height:440px; border-radius:50%; pointer-events:none; z-index:0;
          background:radial-gradient(circle,rgba(0,180,216,.5) 0%,rgba(0,119,182,.2) 40%,transparent 70%);
          animation:orbPulse1 5.5s ease-in-out infinite;
        }
        .light-orb-2 {
          position:absolute; bottom:-110px; left:-70px;
          width:380px; height:380px; border-radius:50%; pointer-events:none; z-index:0;
          background:radial-gradient(circle,rgba(124,58,237,.45) 0%,rgba(109,40,217,.15) 40%,transparent 70%);
          animation:orbPulse2 7s ease-in-out infinite;
        }
        .light-orb-3 {
          position:absolute; top:45%; left:42%;
          width:240px; height:240px; border-radius:50%; pointer-events:none; z-index:0;
          background:radial-gradient(circle,rgba(0,229,255,.18) 0%,transparent 70%);
          animation:orbPulse3 9s ease-in-out infinite;
          transform:translate(-50%,-50%);
        }
        .beam-anim-1 { animation:beamPulse1 4s ease-in-out infinite; }
        .beam-anim-2 { animation:beamPulse2 6s ease-in-out infinite; }
        .scan-line {
          position:absolute; left:0; right:0; height:2px; pointer-events:none; z-index:1;
          background:linear-gradient(90deg,transparent 0%,rgba(0,229,255,.7) 40%,rgba(0,229,255,.7) 60%,transparent 100%);
          box-shadow:0 0 14px 5px rgba(0,229,255,.3);
          animation:scanMove 4.5s linear infinite;
        }
        .spin-slow { animation:spinSlow 22s linear infinite; transform-box:fill-box; transform-origin:center; }
        .spin-slow-rev { animation:spinSlowRev 15s linear infinite; transform-box:fill-box; transform-origin:center; }
        .bolt-pulse { animation:boltPulse 2.2s ease-in-out infinite; }
        .spark-0 { animation:sparkFloat0 3.2s ease-in-out infinite; }
        .spark-1 { animation:sparkFloat1 4.1s ease-in-out infinite 0.6s; }
        .spark-2 { animation:sparkFloat2 3.7s ease-in-out infinite 1.2s; }
        .spark-3 { animation:sparkFloat0 5s ease-in-out infinite 0.3s; }
        .spark-4 { animation:sparkFloat1 3.5s ease-in-out infinite 1.8s; }
        .spark-5 { animation:sparkFloat2 4.3s ease-in-out infinite 0.9s; }
        .spark-6 { animation:sparkFloat0 3.9s ease-in-out infinite 2.1s; }
        @media(max-width:768px){
          .ev-page{flex-direction:column!important}
          .ev-hero{display:none!important}
          .ev-form-panel{width:100%!important;min-height:100vh!important}
          .ev-mobile-logo{display:flex!important}
        }
      `}</style>
    </div>
  );
}

/* ── styles ── */
const s = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
  },

  /* hero */
  hero: {
    flex: '0 0 52%',
    background: 'linear-gradient(145deg,#0a1628 0%,#0d2240 55%,#0a3060 100%)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    padding: '3rem',
  },
  orb1: {
    position: 'absolute', top: '-80px', right: '-80px',
    width: '400px', height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle,rgba(0,180,216,.35) 0%,transparent 70%)',
    animation: 'float1 8s ease-in-out infinite',
  },
  orb2: {
    position: 'absolute', bottom: '-60px', left: '5%',
    width: '320px', height: '320px',
    borderRadius: '50%',
    background: 'radial-gradient(circle,rgba(0,119,182,.3) 0%,transparent 70%)',
    animation: 'float2 10s ease-in-out infinite',
  },
  heroInner: { position: 'relative', zIndex: 1, maxWidth: '520px' },

  logo: { display: 'flex', alignItems: 'center', marginBottom: '2.5rem' },
  logoImg: { width: 100, height: 100, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.4))' },
  logoBrand: { display: 'flex', flexDirection: 'column', gap: '.1rem' },
  logoBolt: { fontSize: '1.4rem', lineHeight: 1 ,display:'none'},
  logoText: { fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '2px', lineHeight: 1.2,textTransform:'uppercase',fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" },

  heroTitle: {
    fontSize: 'clamp(2rem,3.5vw,2.75rem)',
    fontWeight: 800,
    color: '#fff',
    lineHeight: 1.2,
    marginBottom: '1rem',
  },
  heroAccent: {
    background: 'linear-gradient(90deg,#00b4d8,#48cae4)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSub: { color: 'rgba(255,255,255,.65)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2.5rem' },

  featureList: { display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' },
  featureItem: { display: 'flex', alignItems: 'flex-start', gap: '1rem' },
  featureIcon: {
    width: '44px', height: '44px', flexShrink: 0,
    background: 'rgba(0,180,216,.15)',
    border: '1px solid rgba(0,180,216,.3)',
    borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.25rem',
  },
  featureTitle: { color: '#fff', fontWeight: 600, fontSize: '.95rem', marginBottom: '.2rem' },
  featureDesc: { color: 'rgba(255,255,255,.55)', fontSize: '.82rem', lineHeight: 1.5 },

  statsRow: {
    display: 'flex', gap: '2rem',
    paddingTop: '1.75rem',
    borderTop: '1px solid rgba(255,255,255,.1)',
  },
  stat: {},
  statVal: { color: '#00b4d8', fontSize: '1.4rem', fontWeight: 800 },
  statLbl: { color: 'rgba(255,255,255,.5)', fontSize: '.78rem', marginTop: '.1rem' },

  /* form panel */
  formPanel: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1.5rem',
    overflow: 'hidden',
    background: `
      radial-gradient(ellipse at 80% 10%, rgba(0,180,216,.12) 0%, transparent 55%),
      radial-gradient(ellipse at 20% 90%, rgba(0,119,182,.1) 0%, transparent 55%),
      #06071a
    `,
  },
  formCard: {
    background: 'rgba(13,14,43,0.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(0,180,216,.15)',
    borderRadius: '20px',
    padding: '2.5rem 2.25rem',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0,0,0,.5), 0 0 40px rgba(0,180,216,.06)',
    position: 'relative',
    zIndex: 2,
  },

  mobileLogo: { display: 'none', alignItems: 'center', gap: '.5rem', marginBottom: '1.5rem' },

  formTitle: { fontSize: '1.6rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '.3rem' },
  formSub: { color: '#4b5563', fontSize: '.9rem', marginBottom: '.5rem' },

  errorBox: {
    background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)',
    color: '#fca5a5', borderRadius: '10px',
    padding: '.75rem 1rem', fontSize: '.875rem',
    display: 'flex', alignItems: 'center', gap: '.5rem',
    marginTop: '1rem',
  },

  field: { marginBottom: '1.1rem' },
  label: { display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#9ca3af', marginBottom: '.4rem' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '.85rem', fontSize: '.95rem', pointerEvents: 'none' },
  input: {
    width: '100%', padding: '.7rem .75rem .7rem 2.5rem',
    border: '1.5px solid rgba(255,255,255,.08)', borderRadius: '10px',
    fontSize: '.9rem', color: '#e2e8f0',
    outline: 'none', transition: 'border-color .2s',
    background: 'rgba(255,255,255,.05)',
  },
  eyeBtn: {
    position: 'absolute', right: '.75rem',
    background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
    borderRadius: '6px', cursor: 'pointer',
    fontSize: '.9rem', padding: '.25rem .4rem',
    lineHeight: 1, transition: 'all .15s', color: '#9ca3af',
  },

  submitBtn: {
    width: '100%', padding: '.9rem',
    background: 'linear-gradient(135deg,#00b4d8,#0077b6)',
    color: '#fff', border: 'none', borderRadius: '12px',
    fontSize: '1rem', fontWeight: 700,
    cursor: 'pointer', marginTop: '.5rem',
    transition: 'all .2s', letterSpacing: '.3px',
    boxShadow: '0 4px 20px rgba(0,180,216,.35)',
  },
  btnSpinner: {
    width: '16px', height: '16px',
    border: '2px solid rgba(255,255,255,.4)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin .7s linear infinite',
  },

  divider: {
    textAlign: 'center', margin: '1.5rem 0 .75rem',
    position: 'relative',
    borderTop: '1px solid rgba(255,255,255,.08)',
  },
  dividerText: {
    background: 'transparent', padding: '0 .75rem',
    fontSize: '.8rem', color: '#4b5563',
    position: 'relative', top: '-.6rem',
  },

  signupRow: { textAlign: 'center', fontSize: '.875rem', color: '#6b7280' },
  signupLink: {
    color: '#00b4d8', fontWeight: 700, textDecoration: 'none',
    borderBottom: '1.5px solid rgba(0,180,216,.35)',
    paddingBottom: '1px', transition: 'color .15s',
  },

  legal: { textAlign: 'center', fontSize: '.75rem', color: '#4b5563', marginTop: '1.25rem' },
  legalLink: { color: '#6b7280', textDecoration: 'underline' },
};
