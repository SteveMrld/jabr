'use client';
import Link from 'next/link';

export default function Confidentialite() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: "'Inter', sans-serif", color: '#2D2A26' }}>
      <Link href="/" style={{ color: '#C8952E', fontSize: 14, textDecoration: 'none' }}>&larr; Retour</Link>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, marginTop: 20, color: '#2D1B4E' }}>Politique de confidentialit&eacute;</h1>
      
      <h2 style={{ fontSize: 18, marginTop: 32, color: '#2D1B4E' }}>Responsable du traitement</h2>
      <p style={{ lineHeight: 1.7, color: '#6B645B' }}>
        Jabrilia &Eacute;ditions &mdash; contact@jabrilia.com
      </p>
      
      <h2 style={{ fontSize: 18, marginTop: 24, color: '#2D1B4E' }}>Donn&eacute;es collect&eacute;es</h2>
      <p style={{ lineHeight: 1.7, color: '#6B645B' }}>
        Lors de la cr&eacute;ation de compte : adresse email, mot de passe (chiffr&eacute;).<br />
        Lors de l&apos;utilisation : donn&eacute;es de projets &eacute;ditoriaux stock&eacute;es dans votre espace personnel.<br />
        Clés API (OpenAI, Anthropic, ElevenLabs, Runway) : stock&eacute;es localement dans votre navigateur (localStorage). Jamais transmises &agrave; nos serveurs.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 24, color: '#2D1B4E' }}>Finalit&eacute;s</h2>
      <p style={{ lineHeight: 1.7, color: '#6B645B' }}>
        Fournir le service JABR (gestion &eacute;ditoriale, production, marketing).<br />
        Am&eacute;liorer le produit.<br />
        Assurer le support technique.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 24, color: '#2D1B4E' }}>H&eacute;bergement et sous-traitants</h2>
      <p style={{ lineHeight: 1.7, color: '#6B645B' }}>
        H&eacute;bergement : Vercel (USA) &mdash; certifi&eacute; SOC 2.<br />
        Base de donn&eacute;es : Supabase (AWS eu-west) &mdash; chiffrement au repos.<br />
        Paiement : Stripe &mdash; certifi&eacute; PCI DSS Level 1.<br />
        Aucune donn&eacute;e n&apos;est vendue ou c&eacute;d&eacute;e &agrave; des tiers.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 24, color: '#2D1B4E' }}>Dur&eacute;e de conservation</h2>
      <p style={{ lineHeight: 1.7, color: '#6B645B' }}>
        Donn&eacute;es de compte : dur&eacute;e de l&apos;abonnement + 1 an.<br />
        Donn&eacute;es de projets : supprim&eacute;es &agrave; la demande ou &agrave; la cl&ocirc;ture du compte.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 24, color: '#2D1B4E' }}>Vos droits (RGPD)</h2>
      <p style={{ lineHeight: 1.7, color: '#6B645B' }}>
        Acc&egrave;s, rectification, suppression, portabilit&eacute;, opposition.<br />
        Contact : contact@jabrilia.com<br />
        D&eacute;lai de r&eacute;ponse : 30 jours maximum.
      </p>
      
      <h2 style={{ fontSize: 18, marginTop: 24, color: '#2D1B4E' }}>Cookies</h2>
      <p style={{ lineHeight: 1.7, color: '#6B645B' }}>
        JABR utilise uniquement des cookies techniques n&eacute;cessaires au fonctionnement (session, pr&eacute;f&eacute;rences).
        Aucun cookie publicitaire ou de tracking.
      </p>

      <p style={{ marginTop: 40, fontSize: 13, color: '#9E9689' }}>Derni&egrave;re mise &agrave; jour : mars 2026</p>
    </div>
  );
}
