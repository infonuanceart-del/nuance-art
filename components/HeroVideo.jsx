'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Vidéo du héros : déballage, œuvre accrochée, logo.
 *
 * Le film est vertical (9:16). Sur mobile il couvre tout le héros, derrière le
 * texte ; sur grand écran il se tient dans un cadre portrait à droite, à sa
 * taille réelle, plutôt que d'être étiré et rogné sur toute la largeur.
 * Muette et en boucle ; un bouton permet de l'arrêter, et une personne qui a
 * demandé moins d'animation ne voit que l'image fixe.
 */
export default function HeroVideo() {
  const ref = useRef(null);
  const [lecture, setLecture] = useState(true);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ref.current?.pause();
      setLecture(false);
    }
  }, []);

  const basculer = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setLecture(true);
    } else {
      v.pause();
      setLecture(false);
    }
  };

  return (
    <div className="hero-video">
      <video
        ref={ref}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/media/video/hero-poster.jpg"
        aria-hidden="true"
        tabIndex={-1}
      >
        <source src="/media/video/hero.webm" type="video/webm" />
        <source src="/media/video/hero.mp4" type="video/mp4" />
      </video>
      <button
        type="button"
        className="hero-video-btn"
        onClick={basculer}
        aria-label={lecture ? 'Mettre la vidéo en pause' : 'Lire la vidéo'}
      >
        {lecture ? (
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <rect x="3" y="2" width="3" height="10" rx="1" fill="currentColor" />
            <rect x="8" y="2" width="3" height="10" rx="1" fill="currentColor" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M4 2.2v9.6a.6.6 0 0 0 .9.5l7.6-4.8a.6.6 0 0 0 0-1L4.9 1.7a.6.6 0 0 0-.9.5z" fill="currentColor" />
          </svg>
        )}
      </button>
    </div>
  );
}
