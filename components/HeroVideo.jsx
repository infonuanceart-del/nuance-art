'use client';

import { useEffect, useRef } from 'react';

/**
 * Vidéo du héros : déballage, œuvre accrochée, logo.
 *
 * Le film couvre tout le héros, derrière le texte centré, à toutes les tailles
 * d'écran. Il est vertical (9:16) : sur grand écran on n'en voit que la bande
 * centrale, agrandie.
 * Muette et en boucle, sans commande (demande de la cliente) ; une personne
 * qui a demandé moins d'animation ne voit que l'image fixe.
 */
export default function HeroVideo() {
  const ref = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ref.current?.pause();
    }
  }, []);

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
    </div>
  );
}
