'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import JabrApp from '@/components/jabr/JabrApp';
import { ArrowRight, X } from 'lucide-react';
import type { Author } from '@/lib/authors';
import { hasValidSession } from '@/lib/inviteSystem';
import { useRouter } from 'next/navigation';

const DEMO_AUTHOR: Author = {
  id: 'demo-author',
  firstName: 'Steve',
  lastName: 'Moradel',
  displayName: 'Steve Moradel',
  bio: 'Fondateur de Jabrilia Éditions',
  email: 'contact@jabrilia.com',
  defaultGenres: ['Roman', 'Fantasy', 'Essai', 'Jeunesse'],
  createdAt: '2024-01-01T00:00:00Z',
  color: '#C8952E',
};

export default function DemoPage() {
  const [bannerVisible, setBannerVisible] = useState(true);
  const router = useRouter();

  // Redirect if no valid session
  useEffect(() => {
    if (!hasValidSession()) {
      router.push('/auth');
    }
  }, [router]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Demo banner */}
      {bannerVisible && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: 'linear-gradient(135deg, #2D1B4E, #1A0F2E)',
          borderBottom: '1px solid rgba(200,149,46,0.3)',
          padding: '10px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
              background: 'rgba(200,149,46,0.2)', color: '#E8B84B', letterSpacing: '0.05em',
            }}>
              DÉMO
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif" }}>
              Mode découverte — explorez librement les 22 modules
            </span>
          </div>
          <Link href="/auth" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 16px', borderRadius: 999,
            background: '#C8952E', color: '#fff',
            fontSize: 12, fontWeight: 600, textDecoration: 'none',
            transition: 'background 0.2s',
          }}>
            Créer un compte <ArrowRight size={12} />
          </Link>
          <button
            onClick={() => setBannerVisible(false)}
            aria-label="Fermer la bannière"
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              width: 28, height: 28, borderRadius: 6,
              border: 'none', background: 'rgba(255,255,255,0.08)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={14} color="rgba(255,255,255,0.5)" />
          </button>
        </div>
      )}

      {/* App with offset for banner */}
      <div style={{ paddingTop: bannerVisible ? 48 : 0, transition: 'padding-top 0.3s ease', flex: 1 }}>
        <JabrApp
          author={DEMO_AUTHOR}
          onSwitchAuthor={undefined}
          userId={null}
          onSignOut={undefined}
        />
      </div>
    </div>
  );
}
