import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Platform, SafeAreaView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { storage } from '../src/services/storage';
import { DEFAULT_GP_ID, DEFAULT_TOKEN } from '../src/constants/config';

const WebStyles = () => {
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
        overflow-y: visible !important;
        overflow-x: hidden !important;
        display: block !important;
      }

      body {
        background-color: var(--bg);
        color: var(--fg);
        font-family: 'Space Grotesk', sans-serif;
        margin: 0;
      }

      .fade-bg {
        opacity: 0;
        animation: fadeBg 3s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
      }
      .fade-nav {
        opacity: 0;
        animation: smoothReveal 3s cubic-bezier(0.16, 1, 0.3, 1) 3s forwards;
      }
      .fade-content {
        opacity: 0;
        animation: smoothReveal 3s cubic-bezier(0.16, 1, 0.3, 1) 2.5s forwards;
      }
      .random-fade-word {
        opacity: 0;
        display: inline-block;
      }
      .hero-section .random-fade-word,
      .is-revealed .random-fade-word {
        animation: smoothReveal 3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      
      .reveal-on-scroll {
        /* Marker for IntersectionObserver */
      }
      .reveal-block {
        opacity: 0;
        transform: translateY(20px);
        filter: blur(4px);
        transition: all 2s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .is-revealed .reveal-block,
      .reveal-block.is-revealed {
        opacity: 1;
        transform: translateY(0);
        filter: blur(0px);
      }
      
      .drawn-underline {
        position: relative;
        display: inline-block;
        white-space: nowrap;
        font-weight: 500;
      }
      .drawn-underline::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 0;
        height: 10px;
        background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M 0 5 Q 25 8, 50 4 T 100 5" stroke="%233d7068" stroke-width="6" fill="transparent" stroke-linecap="round"/></svg>') no-repeat;
        background-size: 100% 100%;
        transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1) 1.8s;
      }
      .text-reveal-section .drawn-underline::after {
        transition-delay: 0.6s;
      }
      .is-revealed .drawn-underline::after,
      .drawn-underline.active::after {
        width: 100%;
      }
      
      .drawn-circle-path {
        opacity: 0;
      }
      .is-revealed .drawn-circle-path {
        stroke-dashoffset: 0 !important;
        opacity: 1 !important;
        transition: stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.1s !important;
      }
      
      @keyframes fadeBg {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
      
      @keyframes smoothReveal {
        0% { 
          opacity: 0; 
          transform: translateY(20px);
          filter: blur(4px);
        }
        100% { 
          opacity: 1; 
          transform: translateY(0);
          filter: blur(0px);
        }
      }

      .font-serif { font-family: 'Playfair Display', serif; }
      .font-mono { font-family: 'Space Mono', monospace; }
      .font-sans { font-family: 'Space Grotesk', sans-serif; }

      .editorial-grid-bg {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: -1;
        background-size: 40px 40px;
        background-image:
          linear-gradient(to right, var(--border) 1px, transparent 1px),
          linear-gradient(to bottom, var(--border) 1px, transparent 1px);
        mask-image: radial-gradient(circle at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 80%);
        -webkit-mask-image: radial-gradient(circle at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 80%);
      }

      .structural-cols {
        position: fixed;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 80rem;
        height: 100vh;
        z-index: -1;
        display: flex;
        justify-content: space-between;
        pointer-events: none;
      }
      .col-line { width: 1px; height: 100%; background-color: var(--border); }

      .nav-bar {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        padding: 32px 40px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 50;
        transition: all 0.8s var(--bezier);
      }
      .nav-bar.scrolled {
        padding: 16px 40px;
        background: rgba(247, 246, 242, 0.8);
        backdrop-filter: blur(8px);
        border-bottom: 1px solid var(--border);
      }

      .nav-logo {
        font-family: 'Playfair Display', serif;
        font-size: 32px;
        font-weight: 800;
        display: flex;
        align-items: center;
        letter-spacing: -0.02em;
      }
      .nav-bar-line { height: 1px; background: var(--fg); }
      .nav-link {
        font-family: 'Space Mono', monospace;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.3em;
        cursor: pointer;
        color: var(--fg);
        text-decoration: none;
      }

      .hero-section {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 0 20px;
        position: relative;
        border-bottom: 1px solid var(--border);
      }
      
      .hero-h1 {
        font-size: 9vw;
        font-family: 'Playfair Display', serif;
        font-weight: 300;
        text-transform: uppercase;
        line-height: 1;
        letter-spacing: -0.02em;
        margin: 20px 0 40px;
        color: var(--fg);
      }
      .italic-span .random-fade-word {
        color: #B4B4B4;
        font-style: italic;
      }

      .pulse-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: 1px solid var(--border);
        padding: 6px 12px;
        border-radius: 2px;
        font-family: 'Space Mono', monospace;
        font-size: 10px;
        text-transform: uppercase;
      }
      .pulse-dot {
        width: 6px;
        height: 6px;
        background-color: var(--primary);
        border-radius: 50%;
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(61, 112, 104, 0.4); }
        70% { box-shadow: 0 0 0 6px rgba(61, 112, 104, 0); }
        100% { box-shadow: 0 0 0 0 rgba(61, 112, 104, 0); }
      }

      .btn-primary {
        background-color: var(--primary);
        color: white;
        padding: 16px 32px;
        font-family: 'Space Mono', monospace;
        font-size: 10px;
        letter-spacing: 0.25em;
        text-transform: uppercase;
        border: none;
        border-radius: 2px;
        cursor: pointer;
        transition: letter-spacing 0.8s var(--bezier), transform 0.8s var(--bezier);
        position: relative;
        overflow: hidden;
        display: inline-block;
        text-decoration: none;
      }
      .btn-primary:hover {
        letter-spacing: 0.4em;
      }
      .btn-primary::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255,255,255,0.2);
        transform: translateY(100%);
        transition: transform 0.8s var(--bezier);
      }
      .btn-primary:hover::after {
        transform: translateY(0);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        border-bottom: 1px solid var(--border);
        max-width: 80rem;
        margin: 0 auto;
      }
      .stat-cell {
        padding: 40px;
        border-right: 1px solid var(--border);
        transition: background-color 0.8s var(--bezier);
      }
      .stat-cell:last-child { border-right: none; }
      .stat-cell:hover { background-color: #ffffff; }
      
      .stat-icon-box {
        width: 48px;
        height: 48px;
        border: 1px solid var(--border);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 30px;
        border-radius: 2px;
      }
      .stat-number {
        font-family: 'Playfair Display', serif;
        font-size: 48px;
        margin: 0 0 10px;
        line-height: 1;
      }
      .stat-label {
        font-family: 'Space Mono', monospace;
        font-size: 10px;
        text-transform: uppercase;
        color: #666;
        letter-spacing: 0.2em;
      }

      .text-reveal-section {
        padding: 120px 40px;
        max-width: 80rem;
        margin: 0 auto;
        border-bottom: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .reveal-text-container {
        max-width: 1000px;
        margin: 0;
      }
      .reveal-label {
        font-family: 'Space Mono', monospace;
        font-size: 10px;
        text-transform: uppercase;
        color: var(--primary);
        letter-spacing: 0.2em;
        margin-bottom: 32px;
        display: block;
      }
      .reveal-text {
        font-family: 'Playfair Display', serif;
        font-size: clamp(3rem, 6vw, 7rem);
        line-height: 1.1;
        text-align: left;
        color: var(--fg);
        max-width: 1000px;
        margin-top: 0;
      }
      .reveal-word {
        opacity: 0.15;
        transition: opacity 0.8s var(--bezier);
      }
      .reveal-word.active {
        opacity: 1;
      }

      .workflow-section {
        max-width: 80rem;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1fr 1fr;
        border-bottom: 1px solid var(--border);
      }
      .workflow-left {
        padding: 80px 40px;
        border-right: 1px solid var(--border);
      }
      .workflow-right {
        padding: 80px 40px;
        position: relative;
      }
      .step-item {
        margin-bottom: 40px;
        opacity: 0.4;
        transition: opacity 0.8s var(--bezier);
        cursor: pointer;
      }
      .step-item.active { opacity: 1; }
      .step-num {
        font-family: 'Space Mono', monospace;
        font-size: 14px;
        margin-bottom: 10px;
      }
      .step-desc {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 18px;
        line-height: 1.6;
      }

      .scan-line-container {
        height: 2px;
        background-color: var(--border);
        width: 100%;
        overflow: hidden;
        position: relative;
        margin-top: 20px;
      }
      .scan-line {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        background-color: #3b82f6;
        animation: scan 2s cubic-bezier(0.8, 0, 0.2, 1) infinite;
      }
      @keyframes scan {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      .zk-card {
        background: var(--bg);
        border: 1px solid var(--border);
        padding: 40px;
        position: sticky;
        top: 100px;
      }
      .zk-img-placeholder {
        width: 100%;
        height: 200px;
        background: url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80') center/cover;
        margin-bottom: 20px;
        opacity: 0.6;
        mix-blend-mode: multiply;
        filter: grayscale(100%);
      }

      .use-case-section {
        padding: 80px 40px;
        max-width: 80rem;
        margin: 0 auto;
        border-bottom: 1px solid var(--border);
      }
      .tab-switcher {
        display: flex;
        justify-content: center;
        gap: 16px;
        margin-bottom: 40px;
      }
      .tab-btn {
        font-family: 'Space Mono', monospace;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        padding: 12px 24px;
        border: 1px solid var(--border);
        background: transparent;
        color: var(--fg);
        border-radius: 9999px;
        cursor: pointer;
        transition: all 0.8s var(--bezier);
      }
      .tab-btn.active {
        background: var(--fg);
        color: var(--bg);
      }
      .tab-content-card {
        border: 1px solid var(--border);
        background: var(--bg);
        position: relative;
        overflow: hidden;
        padding-top: 80px;
      }
      .ghost-icon {
        position: absolute;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 240px;
        opacity: 0.05;
        pointer-events: none;
        font-family: 'Playfair Display', serif;
      }
      .tab-content-inner {
        position: relative;
        z-index: 10;
        text-align: center;
        padding: 0 40px 60px;
      }
      .benefit-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        border-top: 1px solid var(--border);
      }
      .benefit-cell {
        padding: 32px;
        border-right: 1px solid var(--border);
        text-align: center;
      }
      .benefit-cell:last-child { border-right: none; }

      .guarantee-section {
        max-width: 80rem;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1fr 1fr;
        border-bottom: 1px solid var(--border);
      }
      .guarantee-cell {
        padding: 80px 40px;
        border-right: 1px solid var(--border);
        border-bottom: 1px solid var(--border);
      }
      .guarantee-cell:nth-child(2n) {
        border-right: none;
      }
      .guarantee-cell:nth-child(3),
      .guarantee-cell:nth-child(4) {
        border-bottom: none;
      }

      .site-footer {
        max-width: 80rem;
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        border-top: 1px solid var(--border);
      }
      .footer-col {
        padding: 40px;
        border-right: 1px solid var(--border);
        font-family: 'Space Mono', monospace;
        font-size: 10px;
        color: #666;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        line-height: 1.6;
      }
      .footer-col:last-child {
        border-right: none;
      }

      /* Mobile responsiveness */
      @media (max-width: 768px) {
        .hero-h1 { font-size: 14vw; }
        .stats-grid { grid-template-columns: 1fr; }
        .stat-cell { border-right: none; border-bottom: 1px solid var(--border); }
        .workflow-section { grid-template-columns: 1fr; }
        .workflow-left { border-right: none; border-bottom: 1px solid var(--border); }
        .benefit-grid { grid-template-columns: 1fr; }
        .benefit-cell { border-right: none; border-bottom: 1px solid var(--border); }
        .guarantee-section { grid-template-columns: 1fr; }
        .guarantee-cell { border-right: none; border-bottom: 1px solid var(--border); }
        .guarantee-cell:last-child { border-bottom: none; }
        .site-footer { grid-template-columns: 1fr; }
        .footer-col { border-right: none; border-bottom: 1px solid var(--border); }
        .footer-col:last-child { border-bottom: none; }
        .reveal-text { font-size: 2.5rem; }
      }
    `}</style>
  );
};

const RandomFadeText = ({ text, baseDelay = 1, maxDelayAdd = 2, className = '' }: { text: string, baseDelay?: number, maxDelayAdd?: number, className?: string }) => {
  const words = text.split(' ');
  // Deterministic random delay based on index
  const delays = words.map((_, i) => baseDelay + ((Math.sin(i * 12.9898) * 43758.5453) - Math.floor(Math.sin(i * 12.9898) * 43758.5453)) * maxDelayAdd);

  return (
    <span className={className}>
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

const HandDrawnCircle = ({ children, delay = 1.8 }: { children: React.ReactNode, delay?: number }) => {
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
            className="drawn-circle-path"
            style={{ 
              transitionDelay: `${delay}s`,
              strokeDasharray: circumference,
              strokeDashoffset: circumference,
              transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />
        </svg>
      )}
    </span>
  );
};

const TextReveal = () => {
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleScroll = () => {
      const section = document.getElementById('reveal-section');
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const start = windowHeight * 0.9;
      const end = windowHeight * 0.5;
      const progress = Math.max(0, Math.min(1, (start - rect.top) / (start - end)));

      setActiveIndex(Math.floor(progress * 8));
    };

    // Bind scroll to the scroll-container instead of window
    const container = document.getElementById('scroll-container');
    if (container) container.addEventListener('scroll', handleScroll);
    return () => {
      if (container) container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const renderWord = (word: string, index: number) => (
    <span className={`reveal-word ${index <= activeIndex ? 'active' : ''}`}>{word} </span>
  );

  return (
    <div id="reveal-section" className="text-reveal-section fade-content">
      <div className="reveal-text-container">
        <span className="reveal-label">02. Architectural Guarantee</span>
        <h2 className="reveal-text">
          {renderWord("We", 0)}
          {renderWord("store", 1)}
          <span className={`drawn-underline ${2 <= activeIndex ? 'active' : ''}`}>
            <span className={`reveal-word ${2 <= activeIndex ? 'active' : ''}`}>Zer0 </span>
            <span className={`reveal-word ${3 <= activeIndex ? 'active' : ''}`}>bytes</span>
          </span>
          {' '}
          {renderWord("of", 4)}
          {renderWord("patient", 5)}
          {renderWord("data.", 6)}
          {renderWord("Ever.", 7)}
        </h2>
        <p className="font-sans" style={{ maxWidth: '800px', fontSize: '24px', color: '#666', marginTop: '40px', lineHeight: '1.5' }}>
          Our server holds only encrypted garbage that even we cannot read. HIPAA & GDPR compliance is built natively into the architecture.
        </p>
      </div>
    </div>
  );
};

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [activeTab, setActiveTab] = useState(1);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Text Reveal map logic
      const handleScroll = (e: any) => {
        setScrolled(e.target.scrollTop > 50);
      };

      // Intersection Observer for random fade elements
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      }, { threshold: 0.1 });

      setTimeout(() => {
        const container = document.getElementById('scroll-container');
        if (container) container.addEventListener('scroll', handleScroll);

        document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
      }, 100);

      return () => {
        const container = document.getElementById('scroll-container');
        if (container) container.removeEventListener('scroll', handleScroll);
        observer.disconnect();
      };
    }
  }, []);

  const handleStart = async () => {
    const token = await storage.getToken();
    if (!token && DEFAULT_GP_ID) {
      await storage.saveToken(DEFAULT_TOKEN || 'temp_token');
      await storage.saveUser({ id: DEFAULT_GP_ID, name: 'Auto Login GP' });
    }
    router.replace('/dashboard');
  };

  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f6f2' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>MediRef</Text>
        <TouchableOpacity onPress={handleStart} style={{ marginTop: 20, padding: 15, backgroundColor: '#3d7068' }}>
          <Text style={{ color: '#fff' }}>Get Started</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <WebStyles />
      <div className="editorial-grid-bg fade-bg" />
      <div className="structural-cols fade-bg">
        <div className="col-line" />
        <div className="col-line" />
        <div className="col-line" />
        <div className="col-line" />
      </div>

      <nav className={`nav-bar fade-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-logo">
          <span>MediRef</span>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <a href="#architecture" className="nav-link">Architecture</a>
          <a onClick={handleStart} className="nav-link">Login</a>
        </div>
      </nav>

      <div
        id="scroll-container"
        style={{ height: '100vh', width: '100vw', overflowY: 'auto', overflowX: 'hidden', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
      >
        <section className="hero-section">
          <div className="pulse-badge fade-content" style={{ animationDelay: '3s' }}>
            <div className="pulse-dot" />
            Zero-Knowledge Protocol
          </div>
          <h1 className="hero-h1">
            <RandomFadeText text="Solve the referral" baseDelay={1.5} maxDelayAdd={2.0} />
            <br />
            <RandomFadeText text="cold shoulder" baseDelay={1.5} maxDelayAdd={2.0} className="italic-span" />
          </h1>
          <p className="font-sans" style={{ maxWidth: '600px', fontSize: '18px', color: '#666', marginBottom: '40px', lineHeight: '1.6' }}>
            <RandomFadeText text="GPs and specialists today exchange referrals via fax, email, or phone — slow, insecure, and error-prone. Patients fall through the cracks. We fix that in 2 minutes with a QR code." baseDelay={2.5} maxDelayAdd={1.5} />
          </p>
          <button className="btn-primary fade-content" style={{ animationDelay: '3.5s' }} onClick={handleStart}>
            Initialize Protocol
          </button>
        </section>

        <section className="stats-grid reveal-on-scroll">
          <div className="stat-cell reveal-block" style={{ transitionDelay: '0s' }}>
            <div className="stat-icon-box">
              <span className="font-mono">01</span>
            </div>
            <h3 className="stat-number">0 KB</h3>
            <p className="stat-label">Zero Storage Promise</p>
          </div>
          <div className="stat-cell reveal-block" style={{ transitionDelay: '0.2s' }}>
            <div className="stat-icon-box">
              <span className="font-mono">02</span>
            </div>
            <h3 className="stat-number">AES</h3>
            <p className="stat-label">Military-Grade Encryption</p>
          </div>
          <div className="stat-cell reveal-block" style={{ transitionDelay: '0.4s' }}>
            <div className="stat-icon-box">
              <span className="font-mono">03</span>
            </div>
            <h3 className="stat-number">24 H</h3>
            <p className="stat-label">Auto-Destruct in 24 Hours</p>
          </div>
        </section>

        <TextReveal />

        <section id="architecture" className="workflow-section reveal-on-scroll">
          <div className="workflow-left">
            <h2 className="font-serif" style={{ fontSize: '36px', marginBottom: '40px' }}>
              <RandomFadeText text="How It Works — 3 Steps" baseDelay={0} maxDelayAdd={1.5} />
            </h2>

            <div
              className={`step-item reveal-block ${activeStep === 1 ? 'active' : ''}`}
              onClick={() => setActiveStep(1)}
              style={{ transitionDelay: '0s' }}
            >
              <div className="step-num">01. GP FILLS FORM</div>
              <div className="step-desc">
                GP fills referral form. The app converts patient data into an encrypted string using a randomly generated 16-character Unlock Key.
              </div>
            </div>

            <div
              className={`step-item reveal-block ${activeStep === 2 ? 'active' : ''}`}
              onClick={() => setActiveStep(2)}
              style={{ transitionDelay: '0.2s' }}
            >
              <div className="step-num">02. SYSTEM GENERATES QR</div>
              <div className="step-desc">
                The encryption key lives only inside the QR code URL fragment (#). Browsers never send fragments to servers — it's a web standard.
              </div>
            </div>

            <div
              className={`step-item reveal-block ${activeStep === 3 ? 'active' : ''}`}
              onClick={() => setActiveStep(3)}
              style={{ transitionDelay: '0.4s' }}
            >
              <div className="step-num">03. SPECIALIST SCANS</div>
              <div className="step-desc">
                Specialist scans QR, data decrypts locally on their device. No login. No app install. A phone camera is all it takes.
              </div>
            </div>
          </div>

          <div className="workflow-right reveal-block" style={{ transitionDelay: '0.6s' }}>
            <div className="zk-card">
              <div className="font-mono" style={{ fontSize: '10px', color: '#666', marginBottom: '20px', letterSpacing: '0.2em' }}>
                SYSTEM STATUS: SECURE
              </div>
              <div className="zk-img-placeholder" />
              <h4 className="font-serif" style={{ fontSize: '24px', margin: '0 0 10px' }}>
                {activeStep === 1 ? 'Client-Side Encryption' : activeStep === 2 ? 'Key Never Leaves QR' : 'RAM-Only Processing'}
              </h4>
              <p className="font-sans" style={{ color: '#666', fontSize: '14px' }}>
                Even if our server is hacked, attackers get meaningless gibberish. The QR code is the login.
              </p>

              <div className="scan-line-container">
                <div className="scan-line" />
              </div>
            </div>
          </div>
        </section>

        <section className="use-case-section reveal-on-scroll">
          <div className="tab-switcher reveal-block">
            <button className={`tab-btn ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>No Friction</button>
            <button className={`tab-btn ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>Offline Mode</button>
            <button className={`tab-btn ${activeTab === 3 ? 'active' : ''}`} onClick={() => setActiveTab(3)}>Global & PDF</button>
          </div>

          <div className="tab-content-card reveal-block" style={{ transitionDelay: '0.2s' }}>
            <div className="ghost-icon">
              {activeTab === 1 ? '✦' : activeTab === 2 ? '⚡' : '⏣'}
            </div>
            <div className="tab-content-inner">
              <h3 className="font-serif" style={{ fontSize: '32px', marginBottom: '16px' }}>
                <span className="drawn-underline">
                  <RandomFadeText text={activeTab === 1 ? 'No Login. No App. No Friction.' : activeTab === 2 ? 'Works Anywhere, Even Offline' : 'Works on Any Device, Globally'} baseDelay={0} maxDelayAdd={1} />
                </span>
              </h3>
              <p className="font-sans" style={{ color: '#666', maxWidth: '600px', margin: '0 auto', fontSize: '16px' }}>
                {activeTab === 1 ? 'Specialists need nothing — no account, no app install, no password. A phone camera is all it takes.' :
                  activeTab === 2 ? 'Built with a Service Worker so the app loads and functions even on spotty hospital Wi-Fi. No dropped referrals mid-shift.' :
                    'No proprietary software. No OS restrictions. Once viewed, save as an Instant PDF for Specialist Records with one tap.'}
              </p>
            </div>

            <div className="benefit-grid">
              <div className="benefit-cell">
                <span className="font-mono" style={{ fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.1em' }}>BENEFIT 01</span>
                <p className="font-sans" style={{ fontSize: '14px', marginTop: '10px' }}>Instant Access</p>
              </div>
              <div className="benefit-cell">
                <span className="font-mono" style={{ fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.1em' }}>BENEFIT 02</span>
                <p className="font-sans" style={{ fontSize: '14px', marginTop: '10px' }}>Zero Dependency</p>
              </div>
              <div className="benefit-cell">
                <span className="font-mono" style={{ fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.1em' }}>BENEFIT 03</span>
                <p className="font-sans" style={{ fontSize: '14px', marginTop: '10px' }}>Universal Support</p>
              </div>
            </div>
          </div>
        </section>

        <section className="guarantee-section reveal-on-scroll">
          <div className="guarantee-cell reveal-block" style={{ transitionDelay: '0s' }}>
            <span className="font-mono" style={{ fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.2em' }}>13. TRANSPARENCY</span>
            <h3 className="font-serif" style={{ fontSize: '28px', marginTop: '20px', marginBottom: '16px' }}>
              <HandDrawnCircle>
                <RandomFadeText text="Open to Inspection" baseDelay={0} maxDelayAdd={1} />
              </HandDrawnCircle>
            </h3>
            <p className="font-sans" style={{ color: '#666', fontSize: '16px', lineHeight: '1.6' }}>
              Every encrypted blob stored on our server is visible via a public stats endpoint. Anyone can query it live and confirm: no names, no diagnoses, no medications — just meaningless encrypted strings. We hide nothing about how we handle data, because there's nothing to hide.
            </p>
          </div>
          <div className="guarantee-cell reveal-block" style={{ transitionDelay: '0.2s' }}>
            <span className="font-mono" style={{ fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.2em' }}>14. ARCHITECTURE</span>
            <h3 className="font-serif" style={{ fontSize: '28px', marginTop: '20px', marginBottom: '16px' }}>
              <HandDrawnCircle>
                <RandomFadeText text="Privacy by Design, Not Policy" baseDelay={0} maxDelayAdd={1} />
              </HandDrawnCircle>
            </h3>
            <p className="font-sans" style={{ color: '#666', fontSize: '16px', lineHeight: '1.6' }}>
              Most platforms promise privacy in a terms-of-service document nobody reads. We make privacy mathematically guaranteed. It is architecturally impossible for us to read your patient's data — not against policy, not against the law, but against the laws of cryptography.
            </p>
          </div>
          <div className="guarantee-cell reveal-block" style={{ transitionDelay: '0.4s' }}>
            <span className="font-mono" style={{ fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.2em' }}>15. VERIFICATION</span>
            <h3 className="font-serif" style={{ fontSize: '28px', marginTop: '20px', marginBottom: '16px' }}>
              <HandDrawnCircle>
                <RandomFadeText text="Audit Without Trusting Us" baseDelay={0} maxDelayAdd={1} />
              </HandDrawnCircle>
            </h3>
            <p className="font-sans" style={{ color: '#666', fontSize: '16px', lineHeight: '1.6' }}>
              Open the browser DevTools. Watch the network tab while a referral is sent. You will never see a patient name, a medication, or a diagnosis cross the wire. The encryption happens before the data leaves your device. See it for yourself in 30 seconds.
            </p>
          </div>
          <div className="guarantee-cell reveal-block" style={{ transitionDelay: '0.6s' }}>
            <span className="font-mono" style={{ fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.2em' }}>16. FREEDOM</span>
            <h3 className="font-serif" style={{ fontSize: '28px', marginTop: '20px', marginBottom: '16px' }}>
              <HandDrawnCircle>
                <RandomFadeText text="Zero Vendor Lock-In" baseDelay={0} maxDelayAdd={1} />
              </HandDrawnCircle>
            </h3>
            <p className="font-sans" style={{ color: '#666', fontSize: '16px', lineHeight: '1.6' }}>
              Your data never lives on our infrastructure in a readable form. If you stop using our service tomorrow, there is nothing to export, nothing to delete, and nothing we could hand over — even under legal compulsion. You own your data completely, because we never had it.
            </p>
          </div>
        </section>

        <footer className="site-footer reveal-on-scroll">
          <div className="footer-col reveal-block" style={{ transitionDelay: '0s' }}>
            <div style={{ color: 'var(--fg)', fontWeight: 'bold', marginBottom: '8px' }}>MEDIREF PROTOCOL</div>
            <div>© 2026 ALL RIGHTS RESERVED</div>
          </div>
          <div className="footer-col reveal-block" style={{ transitionDelay: '0.1s' }}>
            <div style={{ color: 'var(--fg)', fontWeight: 'bold', marginBottom: '8px' }}>SYSTEM ARCHITECTURE</div>
            <div>ZERO-KNOWLEDGE ENCRYPTION<br/>CLIENT-SIDE AES-256-GCM</div>
          </div>
          <div className="footer-col reveal-block" style={{ transitionDelay: '0.2s' }}>
            <div style={{ color: 'var(--fg)', fontWeight: 'bold', marginBottom: '8px' }}>COMPLIANCE STANDARDS</div>
            <div>MATHEMATICALLY GUARANTEED<br/>HIPAA & GDPR NATIVE</div>
          </div>
          <div className="footer-col reveal-block" style={{ transitionDelay: '0.3s' }}>
            <div style={{ color: 'var(--fg)', fontWeight: 'bold', marginBottom: '8px' }}>PRODUCTION STATUS</div>
            <div>SYSTEM STABLE<br/>BUILD V1.0.4</div>
          </div>
        </footer>
      </div>
    </>
  );
}
