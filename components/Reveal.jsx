'use client';

import { useEffect, useRef, useState } from 'react';

/** Apparition douce à l'entrée dans le viewport (désactivée si l'utilisateur
 *  a demandé moins d'animations — la classe .fade-up gère déjà ce cas). */
export default function Reveal({ children, delai = 0, tag: Tag = 'div', className = '', ...rest }) {
  const ref = useRef(null);
  const [vu, setVu] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { setVu(true); io.disconnect(); }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`fade-up${vu ? ' in' : ''} ${className}`.trim()}
      style={delai ? { transitionDelay: `${delai}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
