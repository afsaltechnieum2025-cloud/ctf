import { useState, useEffect, useId, type ReactNode } from 'react';
import technieumLogo from '@/assets/technieum-logo.png';

const ACCENT_TEXT: React.CSSProperties = {
  background: 'var(--gradient-technieum)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

type LaunchMode = 'redirect' | 'iframe';

type Props = {
  productTitle: ReactNode;
  scanLines: string[];
  phases: string[];
  targetUrl: string;
  iframeTitle: string;
  launchMode: LaunchMode;
};

const TOTAL_MS = 3200;
const STEPS = 80;

export default function SuiteLaunchOverlay({
  productTitle,
  scanLines,
  phases,
  targetUrl,
  iframeTitle,
  launchMode,
}: Props) {
  const iframeInstanceId = useId();
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [scanDots, setScanDots] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setScanDots((d) => (d.length >= 3 ? '' : `${d}.`));
    }, 400);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let current = 0;
    const stepMs = TOTAL_MS / STEPS;

    const interval = setInterval(() => {
      current += 1;
      const eased = Math.round(100 * (1 - (1 - current / STEPS) ** 2.2));
      setProgress(Math.min(eased, 100));
      setLineIndex(
        Math.min(Math.floor((current / STEPS) * scanLines.length), scanLines.length - 1)
      );

      if (current >= STEPS) {
        clearInterval(interval);
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => {
            if (launchMode === 'redirect') {
              window.location.href = targetUrl;
            } else {
              setLoading(false);
            }
          }, 600);
        }, 500);
      }
    }, stepMs);

    return () => clearInterval(interval);
  }, [launchMode, scanLines.length, targetUrl]);

  return (
    <>
      {loading && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            boxSizing: 'border-box',
            background: 'hsl(var(--background))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 'max(20px, env(safe-area-inset-top))',
            paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
            paddingLeft: 'max(16px, env(safe-area-inset-left))',
            paddingRight: 'max(16px, env(safe-area-inset-right))',
            opacity: fadeOut ? 0 : visible ? 1 : 0,
            transition: 'opacity 0.6s ease',
            fontFamily: 'var(--font-sans)',
            overflow: 'auto',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                linear-gradient(hsl(var(--primary) / 0.04) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--primary) / 0.04) 1px, transparent 1px)
              `,
              backgroundSize: '48px 48px',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(600px, 100vw)',
              height: 'min(600px, 100vh)',
              background:
                'radial-gradient(ellipse at center, hsl(var(--primary) / 0.09) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              maxWidth: 440,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            {/* Logo ? single visual anchor */}
            <img
              src={technieumLogo}
              alt="Technieum"
              style={{
                width: 'min(148px, 42vw)',
                height: 'auto',
                maxHeight: 48,
                objectFit: 'contain',
                display: 'block',
                filter: 'drop-shadow(0 0 14px hsl(var(--primary) / 0.45))',
              }}
            />

            <div
              style={{
                marginTop: 14,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'hsl(var(--primary) / 0.8)',
              }}
            >
              Technieum{' '}
              <span style={ACCENT_TEXT}>OffSec Portal</span>
            </div>

            <div
              style={{
                marginTop: 22,
                marginBottom: 4,
                fontSize: 'clamp(20px, 4.5vw, 26px)',
                fontWeight: 700,
                color: 'var(--color-heading)',
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                maxWidth: '100%',
                padding: '0 4px',
              }}
            >
              {productTitle}
            </div>

            <div style={{ width: '100%', marginTop: 18, marginBottom: 8 }}>
              <div
                style={{
                  height: 3,
                  background: 'hsl(var(--primary) / 0.12)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: 'var(--gradient-technieum)',
                    borderRadius: 2,
                    transition: 'width 0.12s linear',
                    boxShadow: '0 0 10px hsl(var(--primary) / 0.45)',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                marginBottom: 16,
                gap: 12,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'hsl(var(--primary) / 0.75)',
                  letterSpacing: '0.05em',
                  fontVariantNumeric: 'tabular-nums',
                  flexShrink: 0,
                }}
              >
                {progress}%
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'hsl(var(--muted-foreground) / 0.5)',
                  letterSpacing: '0.03em',
                  textAlign: 'right',
                }}
              >
                {progress < 100 ? `SCANNING${scanDots}` : 'COMPLETE'}
              </div>
            </div>

            <div
              style={{
                width: '100%',
                background: 'hsl(var(--card) / 0.85)',
                border: '1px solid hsl(var(--border))',
                borderRadius: 10,
                padding: '14px 16px',
                height: 176,
                boxSizing: 'border-box',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.2em',
                  color: 'hsl(var(--primary) / 0.5)',
                  marginBottom: 10,
                  textTransform: 'uppercase',
                  flexShrink: 0,
                }}
              >
                System log
              </div>
              <div style={{ minHeight: 0, overflow: 'hidden' }}>
                {scanLines.slice(0, lineIndex + 1).map((line, i) => {
                  const isCurrent = i === lineIndex;
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        marginBottom: 6,
                        opacity: isCurrent ? 1 : 0.35,
                        transition: 'opacity 0.3s ease',
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          marginTop: 4,
                          borderRadius: '50%',
                          background: isCurrent ? 'var(--color-brand)' : 'hsl(var(--primary) / 0.35)',
                          flexShrink: 0,
                          boxShadow: isCurrent ? '0 0 6px hsl(var(--primary) / 0.65)' : 'none',
                          transition: 'all 0.3s ease',
                        }}
                      />
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          lineHeight: 1.45,
                          color: isCurrent ? 'var(--color-heading)' : 'hsl(var(--muted-foreground) / 0.55)',
                          letterSpacing: '0.02em',
                          wordBreak: 'break-word',
                        }}
                      >
                        {line}
                        {isCurrent && progress < 100 && (
                          <span
                            style={{
                              display: 'inline-block',
                              width: 6,
                              height: 11,
                              background: 'var(--color-brand)',
                              marginLeft: 3,
                              verticalAlign: 'middle',
                              animation: 'suiteBlink 0.9s step-end infinite',
                            }}
                          />
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Phases in document flow ? stays aligned with column, wraps on narrow screens */}
            <div
              role="presentation"
              style={{
                marginTop: 20,
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px 18px',
                width: '100%',
                maxWidth: 400,
              }}
            >
              {phases.map((phase, i) => (
                <div
                  key={phase}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity: progress > i * 25 ? 1 : 0.22,
                    transition: 'opacity 0.4s ease',
                  }}
                >
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: progress > i * 25 ? 'var(--color-brand)' : 'hsl(var(--muted-foreground) / 0.25)',
                      boxShadow: progress > i * 25 ? '0 0 5px hsl(var(--primary) / 0.55)' : 'none',
                      transition: 'all 0.4s ease',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      color:
                        progress > i * 25 ? 'hsl(var(--primary) / 0.85)' : 'hsl(var(--muted-foreground) / 0.35)',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      transition: 'color 0.4s ease',
                    }}
                  >
                    {phase}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <style>{`
            @keyframes suiteBlink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* Redirect mode: no iframe (avoids background load + cache weirdness). */}
      {/* Iframe mode: mount only after animation so a cached iframe never shows under the overlay. */}
      {launchMode === 'iframe' && !loading && (
        <iframe
          key={iframeInstanceId}
          src={targetUrl}
          title={iframeTitle}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            border: 'none',
            display: 'block',
            zIndex: 9998,
          }}
          allow="same-origin"
        />
      )}
    </>
  );
}

export { ACCENT_TEXT };
