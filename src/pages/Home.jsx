import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowRight, Clock, Star, Sparkles, Quote, Shield, Leaf, Award, CalendarCheck, Users, Zap, Phone } from 'lucide-react';

const BRANCHES = [
  {
    id: 1,
    name: 'Lomas de Angelópolis',
    tagline: 'Paseo Sinfonía',
    description: 'Nuestra sucursal insignia con vista a la ciudad y un diseño premium. Experimenta el lujo en cada detalle.',
    image: '/lomas-6.jpg',
    branchObj: { id: 1, name: 'Lomas de Angelópolis', address: 'Paseo Sinfonía, Lomas de Angelópolis' }
  },
  {
    id: 2,
    name: 'Explanada',
    tagline: 'Centro Comercial Explanada',
    description: 'Ubicación conveniente con amplio estacionamiento. Un oasis de relajación perfecto para tu rutina de cuidado.',
    image: '/explanada-1.jpg',
    branchObj: { id: 2, name: 'Centro Comercial Explanada', address: 'Anillo Periférico Ecológico 210' }
  }
];

const TRUST_BADGES = [
  { value: '15+', label: 'Años de Excelencia' },
  { value: '40k+', label: 'Clientes Felices' },
  { value: '5.0', label: 'Valoración Media' },
  { value: '100%', label: 'Satisfacción Garantizada' },
];

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Valentina Ríos',
    location: 'Polanco, CDMX',
    service: 'Coloración Completa',
    rating: 5,
    text: 'Absolutamente increíble. Llegué con el cabello opaco y salí sintiéndome una celebridad. El ambiente es de otro nivel y las estilistas saben exactamente qué hacen. Ya hice mi cita para el próximo mes.',
  },
  {
    id: 2,
    name: 'Sofía Mendoza',
    location: 'Roma Norte, CDMX',
    service: 'Tratamiento Facial Orgánico',
    rating: 5,
    text: 'Mi piel nunca había lucido tan bien. El facial con ingredientes orgánicos fue una experiencia completamente transformadora. Las especialistas son altamente profesionales y el espacio es precioso.',
  },
  {
    id: 3,
    name: 'Camila Herrera',
    location: 'Condesa, CDMX',
    service: 'Corte de Cabello Premium',
    rating: 5,
    text: 'Llevaba años buscando un salón que realmente entendiera mi tipo de cabello. Aquí lo encontré. El corte es perfecto, el trato fue excepcional y el resultado superó todas mis expectativas.',
  },
  {
    id: 4,
    name: 'Isabella Torres',
    location: 'Lomas, CDMX',
    service: 'Masaje Relajante Express',
    rating: 5,
    text: 'Después del masaje sentí que dormí tres días seguidos, en el buen sentido. Un espacio de paz total. El personal es muy atento y el ambiente te pone en modo relax desde que cruzas la puerta.',
  },
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
            <button 
              onClick={async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) navigate('/auth', { state: { from: '/booking' } });
                else navigate('/booking');
              }} 
              className="btn-hero-primary"
            >
              RESERVAR CITA <ArrowRight size={18} />
            </button>
            <a href="#services" className="btn-hero-ghost">Ver Servicios</a>
          </div>

          <div className="hero-trust-bar fade-in delay-3">
            {TRUST_BADGES.map((b) => (
              <div key={b.label} className="hero-trust-item">
                <span className="hero-trust-num">{b.value}</span>
                <span className="hero-trust-label">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-scroll-hint">
          <span>Scroll</span>
          <div className="hero-scroll-line" />
        </div>
      </header>

      {/* ── BRANCHES ──────────────────────────────── */}
      <section id="services" className="services-v2" ref={servicesRef}>
        <div className="container">
          <div className="sv2-header">
            <span className="sv2-eyebrow">Dónde Encontrarnos</span>
            <h2 className="sv2-title">Nuestras Sucursales</h2>
            <p className="sv2-subtitle">Dos ubicaciones exclusivas diseñadas para brindarte la mejor experiencia de lujo y bienestar.</p>
          </div>

          <div className="sv2-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '3rem', maxWidth: '1000px', margin: '0 auto' }}>
            {BRANCHES.map((b, i) => (
              <div
                key={b.id}
                className={`sv2-card ${activeService === b.id ? 'active' : ''}`}
                onMouseEnter={() => setActiveService(b.id)}
                onMouseLeave={() => setActiveService(null)}
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className="sv2-card-img-wrap">
                  <img src={b.image} alt={b.name} className="sv2-card-img" />
                  <div className="sv2-card-overlay" />
                  <span className="sv2-card-tag">{b.tagline}</span>
                </div>
                <div className="sv2-card-body">
                  <h3 className="sv2-card-title">{b.name}</h3>
                  <p className="sv2-card-desc">{b.description}</p>
                  <div style={{ flexGrow: 1 }} />
                  <button 
                    className="sv2-cta" 
                    onClick={async () => {
                      const { data: { session } } = await supabase.auth.getSession();
                      if (!session) navigate('/auth', { state: { from: '/booking', selectedBranch: b.branchObj } });
                      else navigate('/booking', { state: { selectedBranch: b.branchObj } });
                    }}
                  >
                    Agendar en esta sucursal <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES SHOWCASE ───────────────────── */}
      <section className="home-services-showcase">
        <div className="container">
          <div className="sv2-header">
            <span className="sv2-eyebrow">Lo que ofrecemos</span>
            <h2 className="sv2-title">Algunos de nuestros servicios</h2>
            <p className="sv2-subtitle">Conoce algunas de nuestras especialidades diseñadas para realzar tu belleza natural.</p>
          </div>

          <div className="home-services-grid">
            {[
              { name: 'Corte y Estilismo', image: '/explanada-1.jpg', desc: 'Cortes vanguardistas, clásicos y diseños de fleco.' },
              { name: 'Diseños de Color', image: '/lomas-1.jpg', desc: 'Balayage, Airtouch y técnicas premium de iluminación.' },
              { name: 'Tratamientos Capilares', image: '/lomas-4.jpg', desc: 'Reparación profunda, Olaplex y rituales de spa capilar.' },
              { name: 'Nails & Spa', image: '/cat-nails.png', desc: 'Manicura, pedicura de lujo y diseños con Polygel/Acrílico.' },
              { name: 'Depilación (Wax)', image: '/cat-wax.png', desc: 'Diseño de cejas, facial y depilación corporal con cera.' },
              { name: 'Glam & Makeup', image: '/cat-glam.png', desc: 'Maquillaje social, laminado de cejas y lash lifting.' }
            ].map((s, i) => (
              <div key={s.name} className="home-service-card fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="hsvc-img-wrap">
                  <img src={s.image} alt={s.name} />
                  <div className="hsvc-overlay" />
                </div>
                <div className="hsvc-content">
                  <h3>{s.name}</h3>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '4rem' }}>
            <button 
              className="btn-hero-primary"
              onClick={() => navigate('/booking')}
            >
              Ver menú completo <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ────────────────────────────────── */}
      <div className="marquee-strip">
        {['Belleza', 'Bienestar', 'Lujo', 'Armonía', 'Calma', 'Confianza', 'Belleza', 'Bienestar', 'Lujo', 'Armonía', 'Calma', 'Confianza'].map((word, i) => (
          <span key={i}>{word} <span className="marquee-dot">·</span></span>
        ))}
      </div>

      {/* ── TESTIMONIALS ───────────────────────────── */}
      <section id="testimonials" className="testimonials-section">
        <div className="container">
          <div className="tst-header">
            <span className="tst-eyebrow">Lo que dicen nuestras clientas</span>
            <h2 className="tst-title">Historias Reales</h2>
            <p className="tst-subtitle">
              Más de 40,000 clientes confían en nosotros. Aquí están algunas de sus experiencias.
            </p>
          </div>

          <div className="tst-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.id} className="tst-card" style={{ animationDelay: `${i * 0.1}s` }}>
                {/* Review body */}
                <div className="tst-body" style={{ paddingTop: '1.5rem' }}>
                  <Quote size={22} className="tst-quote-icon" />
                  <p className="tst-text">"{t.text}"</p>
                  <div className="tst-stars">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} size={14} fill="var(--cafe-miel)" color="var(--cafe-miel)" />
                    ))}
                  </div>
                  <div className="tst-service-tag">{t.service}</div>
                </div>

                {/* Client info */}
                <div className="tst-client">
                  <div className="tst-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cafe-miel)', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {t.name.charAt(0)}
                  </div>
                  <div className="tst-client-info">
                    <strong>{t.name}</strong>
                    <span>{t.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ─────────────────────────────────── */}
      <section className="why-us-section">
        <div className="container">
          <div className="tst-header">
            <span className="tst-eyebrow">¿Por qué elegirnos?</span>
            <h2 className="tst-title">La Diferencia Appointment</h2>
            <p className="tst-subtitle">Nos obsesiona cada detalle para que tu experiencia sea perfecta desde el primer momento.</p>
          </div>
          <div className="why-grid">
            <div className="why-card">
              <div className="why-icon"><Award size={28} /></div>
              <h3>15 Años de Excelencia</h3>
              <p>Más de una década y media perfeccionando nuestro arte. Cada corte, cada tratamiento, es el resultado de años de experiencia y pasión.</p>
            </div>
            <div className="why-card">
              <div className="why-icon"><Leaf size={28} /></div>
              <h3>Productos Orgánicos</h3>
              <p>Usamos exclusivamente productos libres de tóxicos y de origen ético. Tu piel y cabello merecen lo mejor, sin comprometer el planeta.</p>
            </div>
            <div className="why-card">
              <div className="why-icon"><CalendarCheck size={28} /></div>
              <h3>Reserva en 2 Minutos</h3>
              <p>Agenda tu cita en línea en menos de 2 minutos. Sin llamadas, sin esperas. Tu tiempo es tan valioso como el nuestro.</p>
            </div>
            <div className="why-card">
              <div className="why-icon"><Users size={28} /></div>
              <h3>Especialistas Certificadas</h3>
              <p>Todo nuestro equipo está certificado internacionalmente y se actualiza constantemente con las últimas técnicas del mundo de la belleza.</p>
            </div>
            <div className="why-card">
              <div className="why-icon"><Shield size={28} /></div>
              <h3>Higiene Garantizada</h3>
              <p>Protocolos de limpieza y esterilización de nivel clínico en todas nuestras herramientas y espacios. Tu seguridad es la prioridad.</p>
            </div>
            <div className="why-card">
              <div className="why-icon"><Zap size={28} /></div>
              <h3>Resultados Inmediatos</h3>
              <p>Nuestras técnicas y productos están diseñados para mostrarte resultados visibles desde la primera sesión. Sin esperas, sin decepciones.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────── */}
      <section className="cta-banner">
        <div className="cta-banner-bg" />
        <div className="cta-banner-overlay" />
        <div className="cta-banner-content container">
          <span className="cta-eyebrow">Tu cita te espera</span>
          <h2>La Mejor Versión de Ti,<br /><em>A Un Clic de Distancia</em></h2>
          <p>Regálate una experiencia que te hará sentir única. Agenda hoy y recibe una consulta personalizada sin cargo.</p>
          <div className="cta-banner-btns">
            <button 
              className="btn-hero-primary" 
              onClick={async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) navigate('/auth', { state: { from: '/booking' } });
                else navigate('/booking');
              }}
            >
              RESERVAR AHORA <ArrowRight size={18} />
            </button>
            <a href="tel:+525512345678" className="btn-hero-ghost"><Phone size={18} /> Llamar al salón</a>
          </div>
        </div>
      </section>

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
