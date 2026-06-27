import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Footer = () => {
  const location = useLocation();
  const isProtectedRoute =
    location.pathname === '/perfil' ||
    location.pathname === '/ranking' ||
    location.pathname === '/assistente';

  return (
    <footer className="border-t border-[var(--score-line)] bg-[rgba(255,255,255,0.72)]">
      <div className="mx-auto flex w-[min(760px,calc(100vw-1.25rem))] flex-col gap-4 py-6 text-sm text-[var(--score-ink-soft)] sm:w-[min(820px,92vw)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium text-[var(--score-ink)]">Score Energy</p>
          <p className="mt-1 max-w-2xl leading-6">
            Score mede evolucao. Diagnostico entende consumo. Memoria lembra quem voce e. Mascote ensina.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <Link to={isProtectedRoute ? '/perfil' : '/'} className="transition hover:text-[var(--score-green-deep)]">
            {isProtectedRoute ? 'Nucleo' : 'Inicio'}
          </Link>
          <Link to="/ranking" className="transition hover:text-[var(--score-green-deep)]">
            Ranking
          </Link>
          <Link to="/assistente" className="transition hover:text-[var(--score-green-deep)]">
            Assistente
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
