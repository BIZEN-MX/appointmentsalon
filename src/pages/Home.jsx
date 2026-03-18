import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, Star, Sparkles } from 'lucide-react';

const SERVICES = [
  {
    id: 1,
    name: 'Salón de Cabello',
    tagline: 'Estilo & Coloración',
    description: 'Estilismo experto, coloración y tratamientos para tu máximo esplendor.',
    duration: '60–120 min',
    price: 'Desde $45',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=2069&auto=format&fit=crop',
    serviceObj: { id: 1, name: 'Corte de Cabello Premium', duration: 60, price: '$45', category: 'Hair' },
  },
  {
    id: 2,
    name: 'Cuidado Facial',
    tagline: 'Tratamientos Orgánicos',
    description: 'Faciales nutritivos con ingredientes orgánicos de origen ético para piel radiante.',
    duration: '45–90 min',
    price: 'Desde $80',
    image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc2069?q=80&w=2070&auto=format&fit=crop',
    serviceObj: { id: 3, name: 'Tratamiento Facial Orgánico', duration: 45, price: '$80', category: 'Spa' },
  },
  {
    id: 3,
    name: 'Masajes & Spa',
    tagline: 'Relajación Total',
    description: 'Relájate con masajes corporales y tratamientos revitalizantes en un entorno de lujo.',
    duration: '45–90 min',
    price: 'Desde $65',
    image: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=2070&auto=format&fit=crop',
    serviceObj: { id: 5, name: 'Masaje Relajante Express', duration: 45, price: '$65', category: 'Spa' },
  },
];

const TRUST_BADGES = [
  { value: '15+', label: 'Años de Excelencia' },
  { value: '40k+', label: 'Clientes Felices' },
  { value: '5.0', label: 'Valoración Media' },
  { value: '100%', label: 'Satisfacción Garantizada' },
];

const Home = () => {
  const navigate = useNavigate();
  const [activeService, setActiveService] = useState(null);
  const servicesRef = useRef(null);

  const handleServiceSelect = (serviceObj) => {
    navigate('/booking', { state: { selectedService: serviceObj } });
  };

  return (
    <div className="home-page">

      {/* ── HERO ──────────────────────────────────── */}
      <header id="home" className="hero-v2">
        <div className="hero-v2-bg" />
        <div className="hero-v2-overlay" />

        {/* Floating ambient shapes */}
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />

        <div className="container hero-v2-content">
          <div className="hero-v2-eyebrow fade-in">
            <Sparkles size={14} />
            <span>Belleza · Bienestar · Lujo</span>
          </div>

          <h1 className="hero-v2-title fade-in delay-1">
            Una Experiencia<br />
            <em>Diseñada para Ti</em>
          </h1>

          <p className="hero-v2-subtitle fade-in delay-2">
            Entra en un mundo de serenidad donde tu bienestar es nuestra única prioridad.
            Servicios de élite en un espacio pensado para el descanso total.
          </p>

          <div className="hero-v2-btns fade-in delay-3">
            <button onClick={() => navigate('/booking')} className="btn-hero-primary">
              RESERVAR CITA <ArrowRight size={18} />
            </button>
            <a href="#services" className="btn-hero-ghost">
              Ver Servicios
            </a>
          </div>

          {/* Trust badges */}
          <div className="hero-trust-bar fade-in delay-3">
            {TRUST_BADGES.map((b) => (
              <div key={b.label} className="hero-trust-item">
                <span className="hero-trust-num">{b.value}</span>
                <span className="hero-trust-label">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hero-scroll-hint">
          <span>Scroll</span>
          <div className="hero-scroll-line" />
        </div>
      </header>

      {/* ── SERVICES ──────────────────────────────── */}
      <section id="services" className="services-v2" ref={servicesRef}>
        <div className="container">
          <div className="sv2-header">
            <span className="sv2-eyebrow">Lo que hacemos</span>
            <h2 className="sv2-title">Nuestros Servicios</h2>
            <p className="sv2-subtitle">Tratamientos seleccionados diseñados para tu esencia única.</p>
          </div>

          <div className="sv2-grid">
            {SERVICES.map((s, i) => (
              <div
                key={s.id}
                className={`sv2-card ${activeService === s.id ? 'active' : ''}`}
                onMouseEnter={() => setActiveService(s.id)}
                onMouseLeave={() => setActiveService(null)}
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className="sv2-card-img-wrap">
                  <img src={s.image} alt={s.name} className="sv2-card-img" />
                  <div className="sv2-card-overlay" />
                  <span className="sv2-card-tag">{s.tagline}</span>
                </div>

                <div className="sv2-card-body">
                  <h3 className="sv2-card-title">{s.name}</h3>
                  <p className="sv2-card-desc">{s.description}</p>

                  <div className="sv2-meta">
                    <span className="sv2-meta-item">
                      <Clock size={14} /> {s.duration}
                    </span>
                    <span className="sv2-price">{s.price}</span>
                  </div>

                  <button
                    className="sv2-cta"
                    onClick={() => handleServiceSelect(s.serviceObj)}
                  >
                    Reservar ahora <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT / MARQUEE STRIP ─────────────────── */}
      <div className="marquee-strip">
        {['Belleza', 'Bienestar', 'Lujo', 'Armonía', 'Calma', 'Confianza', 'Belleza', 'Bienestar', 'Lujo', 'Armonía', 'Calma', 'Confianza'].map((word, i) => (
          <span key={i}>{word} <span className="marquee-dot">·</span></span>
        ))}
      </div>

      {/* ── ABOUT — Original glassmorphism ────────── */}
      <section id="about" className="about">
        <div className="container glass-container">
          <div className="about-content glass-morphism">
            <h2>Lujo Redefinido</h2>
            <p>En Appointment Salon &amp; Spa, redefinimos el significado de la belleza y la relajación. Nuestros espacios combinados ofrecen la mezcla perfecta de cuidado y confort.</p>
            <p>Desde el peinado de precisión hasta nuestros servicios de spa refinados, brindamos una experiencia integral adaptada a tu estilo de vida.</p>
            <div className="stats">
              <div className="stat-item">
                <span className="stat-number">15+</span>
                <span className="stat-label">Años de Cuidado</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">40k+</span>
                <span className="stat-label">Almas Felices</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
