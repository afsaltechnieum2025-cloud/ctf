import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Mail, Eye, EyeOff } from 'lucide-react';
import logo from '@/assets/technieum-logo.png';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ─── Matrix rain (canvas) — cyber field ─────────────────────────────────── */
const MATRIX_CHARSET =
  'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅ0123456789ABCDEFﾊﾋﾌﾍﾎ<>[]{}0x#$_';

function MatrixRainCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let cancelled = false;
    let columns = 0;
    const drops: number[] = [];
    let fontSize = 13;
    let w = 0;
    let h = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      w = Math.max(parent.clientWidth, window.innerWidth);
      h = Math.max(parent.clientHeight, window.innerHeight);
      canvas.width = w;
      canvas.height = h;
      fontSize = w < 480 ? 11 : 13;
      columns = Math.ceil(w / fontSize) + 1;
      drops.length = 0;
      for (let i = 0; i < columns; i++) {
        drops.push(Math.random() * -80);
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    window.addEventListener('resize', resize);

    const draw = () => {
      if (cancelled) return;
      if (w < 16 || h < 16) {
        raf = requestAnimationFrame(draw);
        return;
      }
      /* Light trail wipe so columns stay readable top-to-bottom (was 0.2 → looked “blurred away”) */
      ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${fontSize}px ui-monospace, "Cascadia Code", "Consolas", monospace`;

      for (let i = 0; i < columns; i++) {
        const row = drops[i] ?? 0;
        const char = MATRIX_CHARSET[(i * 31 + Math.floor(row * 2)) % MATRIX_CHARSET.length];
        const x = i * fontSize;
        const y = row * fontSize;
        const head = row < 10;
        if (head) {
          ctx.fillStyle = '#fed7aa';
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 0.95;
        } else {
          const depth = Math.min(1, (row % 28) / 28);
          ctx.fillStyle =
            depth < 0.35 ? '#fb923c' : depth < 0.7 ? '#ea580c' : '#c2410c';
          ctx.globalAlpha = 0.42 + depth * 0.38;
        }
        ctx.fillText(char, x, y);
        ctx.globalAlpha = 1;

        if (y > h + fontSize * 10 || Math.random() > 0.988) {
          drops[i] = Math.random() * -25;
        } else {
          drops[i] = row + (0.65 + Math.random() * 0.35);
        }
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 z-[1] h-full w-full pointer-events-none"
      aria-hidden
    />
  );
}

/* ─── Animated cyber grid + depth field ──────────────────────────────────── */
function CyberGridField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(249,115,22,0.35) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249,115,22,0.35) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(251,191,36,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(251,191,36,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '16px 16px',
        }}
      />
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordHint, setPasswordHint] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (val && !EMAIL_REGEX.test(val)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (val && val.length < 8) {
      setPasswordHint('Password must be at least 8 characters');
    } else {
      setPasswordHint('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_REGEX.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    if (password.length < 8) {
      setPasswordHint('Password must be at least 8 characters');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const { error } = await login(email, password);
      if (error) {
        setError(error);
      } else {
        navigate('/dashboard');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes btnGlow {
          0%, 100% { box-shadow: 0 0 10px #f9731460, 0 4px 20px #ef444430; }
          50%       { box-shadow: 0 0 22px #f9731480, 0 4px 30px #ef444450, 0 0 50px #f9731425; }
        }
        @keyframes btnShimmer {
          0%   { left: -100%; }
          60%  { left: 120%; }
          100% { left: 120%; }
        }

        .login-btn {
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
          animation: btnGlow 3s ease-in-out infinite;
        }
        .login-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 55%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.20),
            transparent
          );
          transform: skewX(-18deg);
          animation: btnShimmer 3s ease-in-out infinite;
        }
        .login-btn:hover {
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 8px 30px #f9731460, 0 0 50px #ef444435 !important;
          filter: brightness(1.1);
          animation: none;
        }
        .login-btn:active {
          transform: translateY(0) scale(0.99);
          filter: brightness(0.95);
        }
        .login-btn:disabled {
          animation: none;
        }
        .validation-msg {
          animation: fadeUp 0.25s ease both;
        }
      `}</style>

      <div className="relative min-h-screen flex flex-col">
        {/* Full-viewport matrix + grid behind entire login (both columns + footer) */}
        <div
          className="pointer-events-none fixed inset-0 z-0 min-h-[100dvh] w-full bg-black"
          aria-hidden
        >
          <div className="absolute inset-0 min-h-[100dvh] w-full">
            <CyberGridField />
            <MatrixRainCanvas />
          </div>
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col bg-transparent">
          <div className="relative flex min-h-0 flex-1 w-full items-center justify-center bg-transparent p-8">
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-destructive/10"
              aria-hidden
            />

            <div className="relative z-10 w-full max-w-md">
              {/* Logo */}
              <div className="text-center mb-6 animate-fade-in">
                <div className="flex justify-center mb-3">
                  <img
                    src={logo}
                    alt="Technieum"
                    className="h-14 w-auto max-w-[min(220px,85vw)] object-contain"
                  />
                </div>
                <h1 className="text-xl font-semibold text-gradient">Technieum Upskill portal</h1>
              </div>

              {/* Card */}
              <Card className="border-border/50 bg-card/80 backdrop-blur-xl animate-slide-up">
                <CardHeader className="space-y-1 pb-4 text-center">
                  <CardTitle className="text-2xl text-gradient">LOGIN</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">

                    {error && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </div>
                    )}

                    {/* Email field */}
                    <div className="space-y-1">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => handleEmailChange(e.target.value)}
                          className={`pr-10 bg-secondary/50 border-border focus:border-primary ${
                            emailError ? 'border-destructive/70' : ''
                          }`}
                          required
                        />
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      </div>
                      {emailError && (
                        <p className="validation-msg flex items-center gap-1 text-xs text-destructive mt-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {emailError}
                        </p>
                      )}
                    </div>

                    {/* Password field */}
                    <div className="space-y-1">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => handlePasswordChange(e.target.value)}
                          className={`pr-10 bg-secondary/50 border-border focus:border-primary ${
                            passwordHint ? 'border-yellow-500/50' : ''
                          }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordHint ? (
                        <p className="validation-msg flex items-center gap-1 text-xs text-yellow-500 mt-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {passwordHint}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground/40 mt-1">
                          Minimum 8 characters required
                        </p>
                      )}
                    </div>

                    {/* Login button — uses your existing gradient-technieum class + effects */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="login-btn gradient-technieum w-full py-3 px-6 rounded-md font-semibold text-white text-sm tracking-wider uppercase disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Signing in...
                        </span>
                      ) : (
                        'LOGIN'
                      )}
                    </button>

                    <p className="text-center text-xs text-muted-foreground mt-4">
                      Contact your administrator for account access
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}