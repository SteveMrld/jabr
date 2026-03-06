'use client';
import Link from 'next/link';

export default function MentionsLegales() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: "'Inter', sans-serif", color: '#2D2A26' }}>
      <Link href="/" style={{ color: '#C8952E', fontSize: 14, textDecoration: 'none' }}>&larr; Retour</Link>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, marginTop: 20, color: '#2D1B4E' }}>Mentions l&eacute;gales</h1>
      
      <h2 style={{ fontSize: 18, marginTop: 32, color: '#2D1B4E' }}>&Eacute;diteur</h2>
      <p style={{ lineHeight: 1.7, color: '#6B645B' }}>
        JABR est un produit de Jabrilia &Eacute;ditions.<br />
        Adresse : Paris, France<br />
        Contact : contact@jabrilia.com<br />
        Site : jabrilia.com
      </p>
      
      <h2 style={{ fontSize: 18, marginTop: 24, color: '#2D1B4E' }}>H&eacute;bergement</h2>
      <p style={{ lineHeight: 1.7, color: '#6B645B' }}>
        Vercel Inc. &mdash; 440 N Barranca Ave #4133, Covina, CA 91723, USA.
      </p>
      
      <h2 style={{ fontSize: 18, marginTop: 24, color: '#2D1B4E' }}>Propri&eacute;t&eacute; intellectuelle</h2>
      <p style={{ lineHeight: 1.7, color: '#6B645B' }}>
        L&apos;ensemble du contenu de ce site (textes, images, logos, code source) est prot&eacute;g&eacute; par le droit d&apos;auteur. 
        Toute reproduction, m&ecirc;me partielle, est soumise &agrave; autorisation pr&eacute;alable.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 24, color: '#2D1B4E' }}>Donn&eacute;es personnelles</h2>
      <p style={{ lineHeight: 1.7, color: '#6B645B' }}>
        Les donn&eacute;es collect&eacute;es via le formulaire d&apos;inscription sont n&eacute;cessaires &agrave; la cr&eacute;ation de votre compte.
        Elles ne sont ni c&eacute;d&eacute;es ni vendues &agrave; des tiers.
        Conform&eacute;ment au RGPD, vous disposez d&apos;un droit d&apos;acc&egrave;s, de rectification et de suppression de vos donn&eacute;es.
        Contact : contact@jabrilia.com
      </p>
    </div>
  );
}
