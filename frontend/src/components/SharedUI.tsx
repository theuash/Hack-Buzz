import React, { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';

export const GlobalWebStyles = () => {
  if (Platform.OS !== 'web') return null;
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,500;1,400&family=Space+Grotesk:wght@400;500&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

      :root {
        --bg: #f7f6f2;
        --fg: #1c1c1c;
        --primary: #3d7068;
        --border: #e5e4de;
        --bezier: cubic-bezier(0.16, 1, 0.3, 1);
      }

      * { box-sizing: border-box; }

      /* Force standard web scrolling over React Native Web constraints */
      html, body, #root, #root > div {
        height: auto !important;
        min-height: 100vh;
        overflow: auto !important;
        background: var(--bg);
      }

      /* Base layout for the entire app */
      .app-container {
        font-family: 'Space Grotesk', sans-serif;
        color: var(--fg);
        background: var(--bg);
        min-height: 100vh;
      }

      /* Global Header */
      .global-header {
        position: fixed;
        top: 0; left: 0; right: 0;
        height: 80px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 40px;
        border-bottom: 1px solid var(--border);
        background: rgba(247, 246, 242, 0.9);
        backdrop-filter: blur(10px);
        z-index: 100;
      }

      /* Reusable Grid Structures */
      .grid-layout {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        max-width: 80rem;
        margin: 0 auto;
        border-left: 1px solid var(--border);
        border-right: 1px solid var(--border);
        min-height: calc(100vh - 80px);
        padding-top: 80px;
      }
      .grid-col {
        padding: 40px;
        border-right: 1px solid var(--border);
      }
      .grid-col:last-child {
        border-right: none;
      }
      .grid-row {
        border-bottom: 1px solid var(--border);
        padding: 40px;
      }

      /* Form Elements */
      .editorial-input {
        width: 100%;
        background: transparent;
        border: none;
        border-bottom: 1px solid var(--border);
        padding: 16px 0;
        font-family: 'Space Mono', monospace;
        font-size: 14px;
        margin-bottom: 32px;
        outline: none;
        color: var(--fg);
        transition: border-color 0.3s;
      }
      .editorial-input:focus {
        border-bottom-color: var(--primary);
      }
      .editorial-textarea {
        width: 100%;
        background: transparent;
        border: 1px solid var(--border);
        padding: 16px;
        font-family: 'Space Mono', monospace;
        font-size: 14px;
        margin-bottom: 32px;
        outline: none;
        color: var(--fg);
        min-height: 120px;
        resize: vertical;
        transition: border-color 0.3s;
      }
      .editorial-textarea:focus {
        border-color: var(--primary);
      }

      /* Buttons */
      .editorial-btn {
        width: 100%;
        background-color: var(--primary);
        color: white;
        padding: 20px;
        font-family: 'Space Mono', monospace;
        font-size: 12px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        border: none;
        cursor: pointer;
        box-shadow: 4px 4px 0px rgba(61, 112, 104, 0.3);
        transition: transform 0.3s var(--bezier), box-shadow 0.3s var(--bezier);
        text-align: center;
      }
      .editorial-btn:hover {
        transform: translate(-2px, -2px);
        box-shadow: 6px 6px 0px rgba(61, 112, 104, 0.3);
      }
      .editorial-btn.outline {
        background-color: transparent;
        color: var(--primary);
        border: 1px solid var(--primary);
        box-shadow: none;
      }
      .editorial-btn.outline:hover {
        background-color: var(--primary);
        color: white;
      }

      /* Animation utilities */
      .fade-in {
        animation: fadeIn 1s ease-out forwards;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .reveal-on-scroll {
        /* Handled by IntersectionObserver */
      }
      .reveal-block {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        will-change: opacity, transform;
      }
      .is-revealed .reveal-block,
      .reveal-block.is-revealed,
      .reveal-block.active {
        opacity: 1;
        transform: translateY(0);
      }

      .drawn-circle-path {
        opacity: 0;
      }
      .is-revealed .drawn-circle-path,
      .drawn-circle-path.active {
        stroke-dashoffset: 0;
        opacity: 1;
        transition: stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s;
      }
      
      @media (max-width: 768px) {
        .grid-layout { grid-template-columns: 1fr; border-left: none; border-right: none; }
        .grid-col { border-right: none; border-bottom: 1px solid var(--border); }
      }
    `}</style>
  );
};

export const useRevealOnScroll = () => {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    
    setTimeout(() => {
      document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
    }, 100);

    return () => observer.disconnect();
  }, []);
};

export const RandomFadeText = ({ text, baseDelay = 0.2, maxDelayAdd = 0.8, className = '' }: { text: string, baseDelay?: number, maxDelayAdd?: number, className?: string }) => {
  const words = text.split(' ');
  const delays = words.map((_, i) => baseDelay + ((Math.sin(i * 12.9898) * 43758.5453) - Math.floor(Math.sin(i * 12.9898) * 43758.5453)) * maxDelayAdd);

  return (
    <span className={className}>
      <style>{`
        .random-fade-word {
          opacity: 0;
          display: inline-block;
        }
        .is-revealed .random-fade-word,
        .random-fade-active .random-fade-word,
        .reveal-block.active .random-fade-word {
          animation: fadeWord 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeWord {
          0% { opacity: 0; filter: blur(10px); transform: translateY(10px); }
          100% { opacity: 1; filter: blur(0px); transform: translateY(0); }
        }
      `}</style>
      {words.map((word, i) => (
        <React.Fragment key={i}>
          <span
            className="random-fade-word"
            style={{ animationDelay: `${delays[i]}s` }}
          >
            {word}
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </React.Fragment>
      ))}
    </span>
  );
};

export const HandDrawnCircle = ({ children, delay = 1.0, active = false }: { children: React.ReactNode, delay?: number, active?: boolean }) => {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      if (rect.width > 0 && rect.height > 0) {
        setSize({ w: rect.width, h: rect.height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const rxPx = size.w * 1.1 * 0.48;
  const ryPx = size.h * 1.3 * 0.45;
  const circumference = Math.PI * Math.sqrt(2 * (rxPx * rxPx + ryPx * ryPx));

  return (
    <span ref={containerRef} className="drawn-circle-wrapper" style={{ position: 'relative', display: 'inline-block', whiteSpace: 'nowrap' }}>
      <span style={{ position: 'relative', zIndex: 2, fontWeight: 500 }}>{children}</span>
      {size.w > 0 && (
        <svg 
          style={{
            position: 'absolute',
            top: '-15%',
            left: '-5%',
            width: '110%',
            height: '130%',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        >
          <ellipse 
            cx="50%" cy="50%" rx="48%" ry="45%"
            fill="transparent" 
            stroke="#3d7068" 
            strokeWidth="3" 
            className={`drawn-circle-path ${active ? 'active' : ''}`}
            style={{ 
              transitionDelay: `${delay}s`,
              strokeDasharray: circumference,
              strokeDashoffset: active ? 0 : circumference,
              opacity: active ? 1 : 0,
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease-in-out'
            }}
          />
        </svg>
      )}
    </span>
  );
};
