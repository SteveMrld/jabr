'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

// ═══════════════════════════════════
// JABR — Landing Page
// Jabrilia Éditions · Pipeline éditorial
// ═══════════════════════════════════

const c = {
  or: '#C8952E', oc: '#A07424', mv: '#2D1B4E', vi: '#3E2768',
  bg: '#0F0A1A', cream: '#FAF6F0', warm: '#F5EDE0',
};

// Animated counter
const Counter = ({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    const el = document.getElementById(`counter-${end}`);
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [end]);

  useEffect(() => {
    if (!started) return;
    const steps = 40;
    const inc = end / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += inc;
      if (current >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return <span id={`counter-${end}`}>{count}{suffix}</span>;
};

// Fade-in on scroll
const FadeIn = ({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const [visible, setVisible] = useState(false);
  const [id] = useState(() => `fi-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    const el = document.getElementById(id);
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [id]);

  return (
    <div id={id} className={className}
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)', transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s` }}>
      {children}
    </div>
  );
};

const Logo = ({ size = 50 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <defs><linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#E8B84B" /><stop offset="100%" stopColor="#A07424" /></linearGradient></defs>
    <path d="M65 15c8 0 14 5 14 12s-6 13-14 13h-5c-3 0-5 2-6 4l-8 22c-3 8-10 14-18 14-10 0-16-7-14-16l2-8c1-4 5-7 9-7h6c4 0 7-3 8-6l6-16c3-7 10-12 18-12z" fill="url(#lg)" />
    <circle cx="72" cy="72" r="4" fill="url(#lg)" />
    <path d="M35 10c2-2 5-3 8-3" stroke="url(#lg)" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);

const PIPELINE = [
  { icon: '✍️', title: 'Manuscrit', desc: 'Import .docx, calibrage automatique, calcul pages et dos' },
  { icon: '🎨', title: 'Couverture', desc: 'Diagnostic 7 critères, conformité EAN, ISBN, prix' },
  { icon: '📐', title: 'Calibrage', desc: 'Format, marges, typographie, épaisseur dos calculée' },
  { icon: '✅', title: 'BAT', desc: 'Bon à Tirer haute résolution, validation finale' },
  { icon: '📱', title: 'ePub', desc: 'Conversion ePub 3.0, validation W3C automatique' },
  { icon: '🎧', title: 'Audiobook', desc: 'Production TTS IA, mastering, distribution multi-plateforme' },
  { icon: '📢', title: 'Marketing', desc: 'Fiches produit, visuels réseaux sociaux, communiqués' },
  { icon: '🌍', title: 'Distribution', desc: 'KDP, IngramSpark, Pollen, Apple Books, Kobo, Audible' },
];

const FEATURES = [
  { title: 'Multi-format natif', desc: 'Broché, poche, relié, ePub, PDF, audiobook — chaque format a son ISBN, son prix, son statut.', icon: '📚' },
  { title: 'ISBN automatisé', desc: 'Registre centralisé avec préfixe éditeur 978-2-488647. Attribution, suivi et export CSV en un clic.', icon: '🔢' },
  { title: 'Diagnostic couverture', desc: '7 critères vérifiés : EAN-13, prix TTC, ISBN, typographie, dos, logo, texte 4e de couverture.', icon: '🔍' },
  { title: 'Distribution intelligente', desc: 'Matrice titre × canal. Chaque format connaît ses canaux compatibles. Rien ne passe entre les mailles.', icon: '🎯' },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: '#1A1A1A' }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{ background: scrolled ? 'rgba(15,10,26,0.95)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid rgba(200,149,46,0.15)' : 'none' }}>
        <div className="max-w-6xl mx-auto px-8 flex items-center justify-between" style={{ height: scrolled ? 64 : 80, transition: 'height 0.4s' }}>
          <div className="flex items-center gap-3">
            <Logo size={scrolled ? 28 : 36} />
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: scrolled ? 18 : 22, fontWeight: 700, color: c.or, letterSpacing: 4, transition: 'font-size 0.4s' }}>JABR</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#features" className="hidden md:inline text-sm transition-colors hover:text-[#C8952E]" style={{ color: 'rgba(255,255,255,0.5)' }}>Fonctionnalités</a>
            <a href="#pipeline" className="hidden md:inline text-sm transition-colors hover:text-[#C8952E]" style={{ color: 'rgba(255,255,255,0.5)' }}>Pipeline</a>
            <a href="#stats" className="hidden md:inline text-sm transition-colors hover:text-[#C8952E]" style={{ color: 'rgba(255,255,255,0.5)' }}>Chiffres</a>
            <Link href="/demo"
              className="px-5 py-2.5 rounded-lg font-semibold text-sm text-white transition-all hover:scale-105"
              style={{ background: c.or }}>
              Ouvrir le Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════ */}
      {/* HERO */}
      {/* ═══════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(160deg, ${c.bg} 0%, ${c.mv} 40%, #1A0F2E 100%)`, minHeight: '100vh' }}>
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-[0.04]" style={{ background: c.or, filter: 'blur(80px)' }} />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-[0.06]" style={{ background: c.or, filter: 'blur(100px)' }} />
          <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full opacity-[0.03]" style={{ background: '#E8B84B', filter: 'blur(60px)' }} />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: `linear-gradient(rgba(200,149,46,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(200,149,46,0.3) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-8 flex flex-col items-center justify-center" style={{ minHeight: '100vh', paddingTop: 100, paddingBottom: 80 }}>
          {/* Badge */}
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
              style={{ background: 'rgba(200,149,46,0.1)', border: '1px solid rgba(200,149,46,0.2)' }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: c.or }} />
              <span style={{ color: c.or, fontSize: 13, fontWeight: 500, letterSpacing: 1 }}>JABRILIA ÉDITIONS</span>
            </div>
          </FadeIn>

          {/* Main title */}
          <FadeIn delay={0.15}>
            <h1 className="text-center" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(40px, 7vw, 80px)', fontWeight: 700, lineHeight: 1.05, letterSpacing: -1 }}>
              <span style={{ color: 'rgba(255,255,255,0.95)' }}>De l&apos;idée au livre,</span><br />
              <span style={{ background: `linear-gradient(135deg, ${c.or}, #E8B84B)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                sans friction.
              </span>
            </h1>
          </FadeIn>

          {/* Subtitle */}
          <FadeIn delay={0.3}>
            <p className="text-center max-w-2xl mt-8 mx-auto" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 'clamp(16px, 2vw, 20px)', lineHeight: 1.7 }}>
              JABR orchestre chaque étape de votre pipeline éditorial — du manuscrit brut à la distribution mondiale. 
              Un seul outil pour vos ISBN, vos couvertures, vos formats et vos canaux.
            </p>
          </FadeIn>

          {/* CTA */}
          <FadeIn delay={0.45}>
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-12">
              <Link href="/demo"
                className="group px-8 py-4 rounded-xl font-semibold text-base text-white transition-all hover:scale-105 flex items-center gap-3"
                style={{ background: `linear-gradient(135deg, ${c.or}, ${c.oc})`, boxShadow: '0 8px 32px rgba(200,149,46,0.3)' }}>
                Accéder au Dashboard
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <a href="#pipeline"
                className="px-8 py-4 rounded-xl font-semibold text-base transition-all hover:bg-[rgba(255,255,255,0.06)] flex items-center gap-2"
                style={{ color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Découvrir le pipeline
              </a>
            </div>
          </FadeIn>

          {/* Screenshot preview */}
          <FadeIn delay={0.6} className="w-full mt-20">
            <div className="relative max-w-4xl mx-auto">
              <div className="absolute -inset-4 rounded-2xl opacity-20" style={{ background: `linear-gradient(135deg, ${c.or}, ${c.mv})`, filter: 'blur(40px)' }} />
              <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid rgba(200,149,46,0.2)', boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}>
                {/* Fake browser bar */}
                <div className="flex items-center gap-2 px-4 py-3" style={{ background: 'rgba(15,10,26,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: '#FF5F56' }} />
                    <div className="w-3 h-3 rounded-full" style={{ background: '#FFBD2E' }} />
                    <div className="w-3 h-3 rounded-full" style={{ background: '#27C93F' }} />
                  </div>
                  <div className="flex-1 mx-4 px-4 py-1.5 rounded-md" style={{ background: 'rgba(255,255,255,0.05)', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                    jabr-eta.vercel.app/demo
                  </div>
                </div>
                {/* Dashboard mockup */}
                <div className="flex" style={{ background: c.bg, height: 320 }}>
                  {/* Sidebar */}
                  <div className="w-48 shrink-0 p-4 flex flex-col gap-1" style={{ background: `linear-gradient(180deg, ${c.mv}, #1A0F2E)` }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Logo size={20} />
                      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: c.or, letterSpacing: 2 }}>JABR</span>
                    </div>
                    {['Dashboard', 'Projets', 'Calibrage', 'Couvertures', 'Audiobooks', 'Distribution', 'Analytics', '', 'ISBN', 'Collections', 'Paramètres'].map((item, i) =>
                      item === '' ? <div key={i} className="my-1.5" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} /> :
                      <div key={i} className="px-3 py-1.5 rounded-md text-[11px]"
                        style={{ background: i === 0 ? c.vi : 'transparent', color: i === 0 ? 'white' : 'rgba(255,255,255,0.35)', fontWeight: i === 0 ? 600 : 400 }}>
                        {item}
                      </div>
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 p-5 overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <div className="text-sm font-semibold text-white">Dashboard</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Jabrilia Éditions — Mars 2026</div>
                      </div>
                      <div className="px-3 py-1.5 rounded-md text-[10px] font-semibold text-white" style={{ background: c.or }}>+ Nouveau projet</div>
                    </div>
                    <div className="flex gap-2 mb-4">
                      {[['10', 'Projets'], ['4', 'En cours'], ['0', 'Publiés'], ['28/100', 'ISBN']].map(([v, l]) => (
                        <div key={l} className="px-3 py-2.5 rounded-lg flex-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="font-bold text-sm text-white">{v}</div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{l}</div>
                        </div>
                      ))}
                    </div>
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex items-center gap-2 py-2 px-3 rounded-lg mb-1" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="w-6 h-6 rounded" style={{ background: `rgba(200,149,46,${0.1 + i * 0.05})` }} />
                        <div className="flex-1">
                          <div className="h-2 rounded" style={{ background: 'rgba(255,255,255,0.08)', width: `${60 + i * 10}%` }} />
                        </div>
                        <div className="h-1.5 w-16 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full" style={{ background: c.or, width: `${40 + i * 15}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════ */}
      {/* FEATURES */}
      {/* ═══════════════════════════════════ */}
      <section id="features" className="relative" style={{ background: c.cream }}>
        <div className="max-w-6xl mx-auto px-8 py-28">
          <FadeIn>
            <div className="text-center mb-16">
              <div className="uppercase tracking-[4px] text-sm font-semibold mb-4" style={{ color: c.or }}>Fonctionnalités</div>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: c.mv, lineHeight: 1.2 }}>
                Tout ce dont un éditeur<br />indépendant a besoin
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.1}>
                <div className="group p-8 rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-default"
                  style={{ background: 'white', border: '1px solid rgba(200,149,46,0.1)', boxShadow: '0 2px 20px rgba(0,0,0,0.03)' }}>
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-110"
                      style={{ background: 'rgba(200,149,46,0.08)' }}>
                      {f.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2" style={{ color: c.mv }}>{f.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: '#6B6560' }}>{f.desc}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ */}
      {/* PIPELINE */}
      {/* ═══════════════════════════════════ */}
      <section id="pipeline" style={{ background: 'white' }}>
        <div className="max-w-6xl mx-auto px-8 py-28">
          <FadeIn>
            <div className="text-center mb-16">
              <div className="uppercase tracking-[4px] text-sm font-semibold mb-4" style={{ color: c.or }}>Pipeline</div>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: c.mv, lineHeight: 1.2 }}>
                8 étapes, du manuscrit<br />à la librairie
              </h2>
              <p className="mt-4 text-base max-w-xl mx-auto" style={{ color: '#9E9689' }}>
                Chaque livre passe par un pipeline structuré. JABR suit l&apos;avancement, détecte les blocages, et automatise ce qui peut l&apos;être.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PIPELINE.map((step, i) => (
              <FadeIn key={step.title} delay={i * 0.08}>
                <div className="group relative p-6 rounded-2xl text-center transition-all duration-300 hover:scale-[1.03] cursor-default"
                  style={{ background: c.cream, border: '1px solid rgba(200,149,46,0.08)' }}>
                  {/* Step number */}
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: 'rgba(200,149,46,0.1)', color: c.or }}>
                    {i + 1}
                  </div>
                  <div className="text-3xl mb-3 transition-transform group-hover:scale-125">{step.icon}</div>
                  <h4 className="font-bold text-sm mb-2" style={{ color: c.mv }}>{step.title}</h4>
                  <p style={{ fontSize: 12, color: '#9E9689', lineHeight: 1.5 }}>{step.desc}</p>
                  {/* Connector line */}
                  {i < 7 && i !== 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-px" style={{ background: 'rgba(200,149,46,0.2)' }} />
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ */}
      {/* STATS */}
      {/* ═══════════════════════════════════ */}
      <section id="stats" className="relative overflow-hidden" style={{ background: `linear-gradient(160deg, ${c.mv}, #1A0F2E)` }}>
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: `linear-gradient(rgba(200,149,46,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(200,149,46,0.5) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
        <div className="relative max-w-6xl mx-auto px-8 py-28">
          <FadeIn>
            <div className="text-center mb-16">
              <div className="uppercase tracking-[4px] text-sm font-semibold mb-4" style={{ color: c.or }}>En chiffres</div>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
                Le catalogue Jabrilia
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: 10, suffix: '', label: 'Titres au catalogue', sub: 'Romans, essais, BD, jeunesse' },
              { value: 28, suffix: '', label: 'ISBN attribués', sub: '6 formats par titre max' },
              { value: 6, suffix: '', label: 'Canaux de distribution', sub: 'KDP, Pollen, IngramSpark…' },
              { value: 100, suffix: '', label: 'ISBN en stock', sub: 'Préfixe 978-2-488647' },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.1}>
                <div className="text-center p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(200,149,46,0.1)' }}>
                  <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 48, fontWeight: 700, color: c.or, lineHeight: 1 }}>
                    <Counter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="mt-3 font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{stat.label}</div>
                  <div className="mt-1" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{stat.sub}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ */}
      {/* FORMATS */}
      {/* ═══════════════════════════════════ */}
      <section style={{ background: c.cream }}>
        <div className="max-w-6xl mx-auto px-8 py-28">
          <FadeIn>
            <div className="text-center mb-16">
              <div className="uppercase tracking-[4px] text-sm font-semibold mb-4" style={{ color: c.or }}>Multi-format</div>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: c.mv, lineHeight: 1.2 }}>
                1 titre, 6 formats,<br />6 ISBN
              </h2>
              <p className="mt-4 text-base max-w-xl mx-auto" style={{ color: '#9E9689' }}>
                Chaque version d&apos;un livre reçoit son propre ISBN. JABR gère la matrice complète.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
              {[
                { format: 'Broché', icon: '📕', desc: 'Impression standard', color: '#E8B84B' },
                { format: 'Poche', icon: '📗', desc: 'Format économique', color: '#2EAE6D' },
                { format: 'Relié', icon: '📘', desc: 'Édition premium', color: '#3E2768' },
                { format: 'ePub', icon: '📱', desc: 'Numérique', color: '#E07A2F' },
                { format: 'Audiobook', icon: '🎧', desc: 'Production IA', color: '#5B3E8A' },
                { format: 'PDF', icon: '📄', desc: 'Téléchargement', color: '#9E9689' },
              ].map((f, i) => (
                <div key={f.format} className="group flex items-center gap-3 px-5 py-4 rounded-xl transition-all duration-300 hover:scale-105 cursor-default"
                  style={{ background: 'white', border: '1px solid rgba(200,149,46,0.1)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', animationDelay: `${i * 0.05}s` }}>
                  <span className="text-2xl transition-transform group-hover:scale-125">{f.icon}</span>
                  <div>
                    <div className="font-bold text-sm" style={{ color: c.mv }}>{f.format}</div>
                    <div style={{ fontSize: 11, color: '#9E9689' }}>{f.desc}</div>
                  </div>
                  <div className="w-2 h-2 rounded-full ml-2" style={{ background: f.color }} />
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════ */}
      {/* CTA FINAL */}
      {/* ═══════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(160deg, ${c.bg}, ${c.mv})` }}>
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.06]" style={{ background: c.or, filter: 'blur(120px)' }} />
        </div>
        <div className="relative max-w-4xl mx-auto px-8 py-28 text-center">
          <FadeIn>
            <Logo size={60} />
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="mt-8" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 700, color: 'white', lineHeight: 1.15 }}>
              Prêt à structurer<br />votre pipeline éditorial ?
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-6 text-base max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
              JABR est conçu pour les éditeurs indépendants qui refusent de gérer leurs livres dans des tableurs.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Link href="/demo"
                className="group px-10 py-5 rounded-xl font-semibold text-lg text-white transition-all hover:scale-105 flex items-center gap-3"
                style={{ background: `linear-gradient(135deg, ${c.or}, ${c.oc})`, boxShadow: '0 12px 40px rgba(200,149,46,0.35)' }}>
                Ouvrir le Dashboard
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════ */}
      {/* FOOTER */}
      {/* ═══════════════════════════════════ */}
      <footer style={{ background: c.bg, borderTop: '1px solid rgba(200,149,46,0.08)' }}>
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Logo size={24} />
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 700, color: c.or, letterSpacing: 3 }}>JABR</span>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>par Jabrilia Éditions</span>
            </div>
            <div className="flex items-center gap-6" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
              <span>Pipeline éditorial v1.6</span>
              <span>·</span>
              <span>10 titres · 28 ISBN</span>
              <span>·</span>
              <span>© 2026 Jabrilia Éditions</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
