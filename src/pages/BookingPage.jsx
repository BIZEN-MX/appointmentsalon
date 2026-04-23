import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Scissors, Palette, Smile, Hand, Wind, Clock, CheckCircle, ChevronRight, ChevronLeft, CalendarDays, User, Lock, Sparkles, ArrowRight, MapPin, Phone, Mail } from 'lucide-react';
import { SERVICES } from '../data/services';

// Helper to calculate Explanada capacity at a specific minute of the day
const getExplanadaCapacity = (service, dateStr, timeMins) => {
  if (!service || !service.explanada_schedule) return 1;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return 1;
  
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  const dow = dateObj.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sabado

  const isWeekend = (dow === 0 || dow === 6);
  // Weekday shifts: 9-17, 10-18, 11:30-21
  // Weekend shifts: 9-17, 10-18, 11-20
  const shifts = isWeekend 
    ? [ {s: 9*60, e: 17*60}, {s: 10*60, e: 18*60}, {s: 11*60, e: 20*60} ]
    : [ {s: 9*60, e: 17*60}, {s: 10*60, e: 18*60}, {s: 11*60 + 30, e: 21*60} ];
  
  const caps = service.explanada_schedule[dow];
  if (!caps) return 1;

  let totalCap = 0;
  for (let i = 0; i < 3; i++) {
    if (timeMins >= shifts[i].s && timeMins < shifts[i].e) {
      totalCap += caps[i];
    }
  }
  return Math.min(totalCap, service.explanada_specialists || 5);
};

const BRANCHES = [
  { 
    id: 1, 
    name: 'Lomas de Angelópolis', 
    address: 'Paseo Sinfonía, Lomas de Angelópolis',
    info: 'Nuestra sucursal insignia con vista a la ciudad.',
    categories: [
      { name: 'Cortes', image: '/cat-cut.png' },
      { name: 'Diseños de color', image: '/cat-color.png' },
      { name: 'RETOQUE TINTE', image: '/cat-retouch.png' },
      { name: 'TRATAMIENTOS', image: '/cat-treatments.png' },
      { name: 'PEINADO', image: '/cat-style.png' },
      { name: 'WAX (cera)', image: '/cat-wax.png' },
      { name: 'NAILS (uñas)', image: '/cat-nails.png' },
      { name: 'Glam', image: '/cat-glam.png' }
    ],
    images: [
      '/lomas-1.jpg',
      '/lomas-2.jpg',
      '/lomas-3.jpg',
      '/lomas-4.jpg',
      '/lomas-5.jpg',
      '/lomas-6.jpg'
    ]
  },
  { 
    id: 2, 
    name: 'Centro Comercial Explanada', 
    address: 'Anillo Periférico Ecológico 210',
    info: 'Ubicación conveniente con amplio estacionamiento.',
    categories: [
      { name: 'Corte de Cabello / Color', image: '/cat-color.png' },
      { name: 'Depilaciones', image: '/cat-wax.png' },
      { name: 'Tratamientos y Peinado', image: '/cat-style.png' },
      { name: 'Uñas', image: '/cat-nails.png' }
    ],
    images: [
      '/explanada-1.jpg',
      '/explanada-2.jpg',
      '/explanada-3.jpg',
      '/explanada-4.jpg',
      '/explanada-5.jpg',
      '/explanada-6.jpg'
    ]
  },
];

// Generate a calendar grid for the current month
const getCalendarDays = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
};

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_ES   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

const BookingPage = ({ isAdmin }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [step, setStep] = useState(1);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear]   = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [oxxoRef, setOxxoRef] = useState('');
  const [speiRef, setSpeiRef] = useState('');

  // ── Restore selection from Auth redirect ────────────────────────
  useEffect(() => {
    if (location.state?.selectedService && location.state?.selectedTime) {
      console.log('Recuperando estado de reserva tras login...');
      setSelectedService(location.state.selectedService);
      setSelectedTime(location.state.selectedTime);
      if (location.state.selectedBranch) {
        const fullBranch = BRANCHES.find(b => b.id === location.state.selectedBranch.id);
        if (fullBranch) setSelectedBranch(fullBranch);
      }
      if (location.state.step) setStep(location.state.step);
    } else if (location.state?.selectedBranch) {
       const fullBranch = BRANCHES.find(b => b.id === location.state.selectedBranch.id);
       if (fullBranch) setSelectedBranch(fullBranch);
    }
  }, [location.state]);

  const selectedDate = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;


  useEffect(() => {
    checkUser();
    fetchAppointments();
    if (location.state?.selectedService) {
      setSelectedService(location.state.selectedService);
      setStep(2);
    } else if (location.state?.selectedBranch) {
      const fullBranch = BRANCHES.find(b => b.id === location.state.selectedBranch.id);
      if (fullBranch) {
        setSelectedBranch(fullBranch);
        setStep(2);
      }
    }
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchAppointments)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  };

  const fetchAppointments = async () => {
    const { data, error } = await supabase.from('appointments').select('*');
    if (!error) setBookedSlots(data || []);
  };

  const timeToMinutes = (t) => { 
    if (!t) return 0;
    const parts = t.split(':').map(Number); 
    return (parts[0] || 0) * 60 + (parts[1] || 0); 
  };

  const checkAvailability = (time, duration) => {
    const start = timeToMinutes(time);
    const end   = start + duration;
    const targetResource = selectedService?.resource_group || 'salon';
    const isExplanada = selectedBranch?.name.includes('Explanada');
    
    // Bounds check
    if (isExplanada) {
      if (start < 9 * 60 || end > 21 * 60) return false;
    } else {
      if (start < 10 * 60 || end > 19 * 60) return false;
    }

    // Pre-filter bookings for the selected day and branch
    const dayBookings = bookedSlots.filter(s => {
      const slotDate = String(s.date).split('T')[0];
      if (slotDate !== selectedDate) return false;
      if (s.branch_name && selectedBranch && s.branch_name !== selectedBranch.name) return false;
      return true;
    });

    // Check capacity in 30-minute intervals throughout the duration of the service
    for (let t = start; t < end; t += 30) {
      let specificBooked = 0;
      let totalResourceBooked = 0;

      // Count overlapping bookings exactly at time 't'
      dayBookings.forEach(b => {
        const bs = timeToMinutes(b.time);
        const bdur = Number(b.duration) || 30;
        const be = bs + bdur;
        
        if (t >= bs && t < be) {
          if (b.resource_group === targetResource) {
            totalResourceBooked++;
            if (b.service_name === selectedService?.name) {
              specificBooked++;
            }
          }
        }
      });

      let currentCap = 1;
      let globalCap = 1;

      if (isExplanada && selectedService) {
        currentCap = getExplanadaCapacity(selectedService, selectedDate, t);
        globalCap = selectedService.explanada_specialists || 5;
        
        if (currentCap === 0) return false; // No shift active
        if (specificBooked >= currentCap) return false; // All specific specialists busy
        if (totalResourceBooked >= globalCap) return false; // All global specialists busy
      } else {
        // Lomas static logic
        currentCap = selectedService?.lomas_capacity || 1;
        globalCap = currentCap;
        if (totalResourceBooked >= globalCap) return false;
      }
    }

    return true;
  };

  const getTimeSlots = () => {
    if (!selectedService && !isAdmin) return [];
    const slots = [];
    const isExplanada = selectedBranch?.name?.includes('Explanada');
    const startHour = isExplanada ? 9 : 10;
    const endHour = isExplanada ? 21 : 19;

    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += 30) {
        const t = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
        const dur = isAdmin ? 30 : selectedService.duration;
        slots.push({ time: t, available: checkAvailability(t, dur) });
      }
    }
    return slots;
  };

  const handleBooking = async (method) => {
    setIsSubmitting(true);
    
    // Process payment simulation first
    if (method === 'card') {
      setStep(5); // Process loading
      await new Promise(r => setTimeout(r, 3000));
    } else if (method === 'oxxo') {
      const ref = Math.random().toString().slice(2, 16);
      setOxxoRef(ref);
    } else if (method === 'spei') {
      const ref = Math.random().toString().slice(2, 20).toUpperCase();
      setSpeiRef(ref);
    }

    const bookingData = {
      date: selectedDate,
      time: selectedTime,
      duration: isAdmin ? 30 : selectedService.duration,
      service_name: isAdmin ? 'BLOQUEADO POR DUEÑO' : selectedService.name,
      user_id: user?.id || null,
      user_name: user?.user_metadata?.full_name || user?.email || 'ADMIN',
      user_email: user?.email || 'admin@salon.com',
      status: method === 'card' ? 'confirmado' : 'pendiente_pago',
      payment_method: method,
      deposit_amount: isAdmin ? 0 : (selectedService.price * 0.4),
      is_admin_blocked: isAdmin,
      branch_name: selectedBranch?.name || 'Lomas de Angelópolis',
      resource_group: isAdmin ? 'salon' : selectedService.resource_group,
    };

    const { error } = await supabase.from('appointments').insert([bookingData]);
    setIsSubmitting(false);
    
    if (!error) {
      if (!isAdmin) {
        if (method === 'card') setStep(6); // Success
        else if (method === 'oxxo') setStep(5.1); // Reference
        else if (method === 'spei') setStep(5.2); // SPEI Reference
      }
    } else {
      alert('Error: ' + error.message);
      setStep(4);
    }
  };

  const handleStepChange = async (nextStep) => {
    console.log('Solicitando cambio a paso:', nextStep);
    // If going to payment (Step 4), must be logged in
    if (nextStep === 4 && !user && !isAdmin) {
      console.log('Usuario no autenticado, redirigiendo con estado...');
      navigate('/auth', { 
        state: { 
          from: location.pathname, 
          selectedBranch,
          selectedService, 
          selectedTime, 
          step: 4 
        } 
      });
      return;
    }
    setStep(nextStep);
  };

  const resetBooking = () => { 
    setStep(1); 
    setSelectedBranch(null); 
    setSelectedCategory(null);
    setSelectedService(null); 
    setSelectedTime(null); 
  };

  const isPastDay = (day) => {
    const d = new Date(calYear, calMonth, day);
    d.setHours(0,0,0,0);
    const t = new Date(); t.setHours(0,0,0,0);
    return d < t;
  };

  const prevMonth = () => { if (calMonth === 0) { setCalYear(y => y-1); setCalMonth(11); } else setCalMonth(m => m-1); };
  const nextMonth = () => { if (calMonth === 11) { setCalYear(y => y+1); setCalMonth(0); } else setCalMonth(m => m+1); };

  const calDays = getCalendarDays(calYear, calMonth);

  // ── RENDER ──────────────────────────────────────────────────────────
  return (
    <div className="bk-page">
      {/* ── Hero banner ── */}
      <div className="bk-hero">
        <div className="bk-hero-overlay" />
        <div className="bk-hero-content">
          <span className="bk-hero-tag">Agenda en línea</span>
          <h1>{isAdmin ? 'Gestión de Calendario' : 'Reserva tu Cita'}</h1>
          <p>{isAdmin ? 'Administra citas y bloquea horarios en tiempo real.' : 'Elige tu servicio, fecha y horario favorito en menos de 2 minutos.'}</p>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="bk-main container">

        {/* ── Progress bar (client only) ── */}
        {!isAdmin && step < 6 && (
          <div className="bk-progress">
            {['Sucursal', 'Servicio', 'Fecha & Hora', 'Anticipo', 'Finalizar'].map((label, i) => (
              <div key={i} className={`bk-progress-step ${step > i+1 ? 'done' : ''} ${step === i+1 ? 'active' : ''}`}>
                <div className="bk-progress-circle">
                  {step > i+1 ? <CheckCircle size={16} /> : i+1}
                </div>
                <span>{label}</span>
                {i < 4 && <div className="bk-progress-line" />}
              </div>
            ))}
          </div>
        )}

        {/* ── ADMIN VIEW ── */}
        {isAdmin && (
          <div className="bk-card-grid">
            <div className="bk-card">
              <div className="bk-card-head"><CalendarDays size={20} /> Seleccionar Fecha</div>
              <div className="bk-calendar">
                <div className="bk-cal-nav">
                  <button onClick={prevMonth}><ChevronLeft size={18} /></button>
                  <span>{MONTHS_ES[calMonth]} {calYear}</span>
                  <button onClick={nextMonth}><ChevronRight size={18} /></button>
                </div>
                <div className="bk-cal-days-header">
                  {DAYS_ES.map(d => <span key={d}>{d}</span>)}
                </div>
                <div className="bk-cal-grid">
                  {calDays.map((day, i) => (
                    <button
                      key={i}
                      className={`bk-cal-day ${!day ? 'empty' : ''} ${day && isPastDay(day) ? 'past' : ''} ${day === selectedDay && calMonth === today.getMonth() ? 'selected' : ''}`}
                      disabled={!day || isPastDay(day)}
                      onClick={() => day && setSelectedDay(day)}
                    >{day}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bk-card">
              <div className="bk-card-head"><Clock size={20} /> Bloquear / Gestionar Horarios</div>
              
              <div className="bk-branch-selector-admin" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                {BRANCHES.map(b => (
                  <button 
                    key={b.id}
                    className={`btn-small ${selectedBranch?.id === b.id ? 'active' : ''}`}
                    style={{ 
                      padding: '0.5rem 1rem', 
                      borderRadius: '8px', 
                      border: '1px solid #ddd',
                      background: selectedBranch?.id === b.id ? 'var(--cafe-miel)' : 'white',
                      color: selectedBranch?.id === b.id ? 'white' : 'inherit',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedBranch(b)}
                  >
                    {b.name}
                  </button>
                ))}
              </div>

              {!selectedBranch ? (
                <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
                  <MapPin size={32} style={{ margin: '0 auto 1rem' }} />
                  <p>Selecciona una sucursal para ver horarios</p>
                </div>
              ) : (
                <div className="bk-slots-grid">
                  {getTimeSlots().map(slot => (
                    <button
                      key={slot.time}
                      className={`bk-slot ${slot.available ? 'available' : 'booked'} ${selectedTime === slot.time ? 'selected' : ''}`}
                      onClick={() => slot.available && setSelectedTime(slot.time)}
                    >
                      {slot.time}
                      {!slot.available && <span className="slot-badge">Ocup.</span>}
                    </button>
                  ))}
                </div>
              )}
              {selectedTime && (
                <div className="bk-admin-confirm fade-in">
                  <p>¿Bloquear <strong>{selectedTime}</strong> del <strong>{selectedDate}</strong>?</p>
                  <div className="bk-admin-btns">
                    <button className="btn-primary" onClick={handleBooking}><Lock size={14}/> Bloquear</button>
                    <button className="btn-secondary" onClick={() => setSelectedTime(null)}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CLIENT STEP 1: Branch Selection ── */}
        {!isAdmin && step === 1 && (
          <div className="fade-in">
            <div className="bk-section-label">Selecciona tu sucursal preferida</div>
            <div className="bk-services-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              {BRANCHES.map(b => {
                const active = selectedBranch?.id === b.id;
                return (
                  <button
                    key={b.id}
                    className={`bk-service-card ${active ? 'active' : ''}`}
                    onClick={() => setSelectedBranch(b)}
                    style={{ '--accent': '#A0652D', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                  >
                    {b.images && b.images.length > 0 && (
                      <div className="bk-branch-gallery">
                        {b.images.map((img, idx) => (
                          <img key={idx} src={img} alt={`${b.name} vista ${idx+1}`} loading="lazy" />
                        ))}
                      </div>
                    )}
                    <div className="bk-branch-card-content">
                      <div className="bk-svc-icon"><MapPin size={32} /></div>
                      <div className="bk-svc-info">
                        <div className="bk-svc-name" style={{ fontSize: '1.4rem' }}>{b.name}</div>
                        <div className="bk-svc-desc" style={{ fontSize: '1rem', marginTop: '0.5rem' }}>{b.address}</div>
                        <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.5rem' }}>{b.info}</p>
                        {b.images && b.images.length > 0 && (
                          <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.5rem', fontStyle: 'italic' }}>
                            Desliza para ver fotos reales de la sucursal
                          </p>
                        )}
                      </div>
                      {active && <div className="bk-svc-check" style={{ marginLeft: 'auto' }}><CheckCircle size={24} /></div>}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="bk-footer-row">
              <button
                className="bk-cta-btn"
                disabled={!selectedBranch}
                onClick={() => handleStepChange(2)}
              >
                Siguiente: Elegir Servicio <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ── CLIENT STEP 2: Service selection ── */}
        {!isAdmin && step === 2 && (
          <div className="fade-in">
            {!selectedCategory ? (
              <>
                <div className="bk-section-label">Selecciona una categoría</div>
                <div className="bk-services-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                  {selectedBranch?.categories.map(cat => (
                    <button
                      key={cat.name}
                      className="bk-service-card"
                      onClick={() => setSelectedCategory(cat.name)}
                      style={{ padding: '0', flexDirection: 'column', overflow: 'hidden' }}
                    >
                      <div className="bk-cat-img-wrap" style={{ width: '100%', height: '150px', position: 'relative' }}>
                        <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div className="bk-card-overlay" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
                      </div>
                      <div className="bk-svc-info" style={{ padding: '1.2rem', textAlign: 'center', width: '100%' }}>
                        <div className="bk-svc-name" style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{cat.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="bk-footer-row">
                  <button className="bk-back-btn" onClick={() => setStep(1)}><ChevronLeft size={18} /> Volver</button>
                </div>
              </>
            ) : (
              <>
                <div className="bk-section-label">
                  Servicios en {selectedCategory}
                </div>
                <div className="bk-services-grid">
                  {SERVICES
                    .filter(s => {
                      const isLomas = selectedBranch?.id === 1;
                      if (isLomas) return s.branch === 'lomas' && s.category === selectedCategory;
                      else return s.branch === 'explanada' && s.category === selectedCategory;
                    })
                    .map(s => {
                      const Icon = s.icon || Scissors;
                      const active = selectedService?.id === s.id;
                      return (
                        <button
                          key={s.id}
                          className={`bk-service-card ${active ? 'active' : ''}`}
                          onClick={() => setSelectedService(s)}
                          style={{ '--accent': s.color }}
                        >
                          <div className="bk-svc-icon"><Icon size={26} /></div>
                          <div className="bk-svc-info">
                            <div className="bk-svc-name">{s.name}</div>
                            <div className="bk-svc-desc">{s.desc}</div>
                            <div className="bk-svc-meta">
                              <span><Clock size={12} /> {s.duration} min</span>
                              <span className="bk-svc-price">${s.price} MXN</span>
                            </div>
                          </div>
                          {active && <div className="bk-svc-check"><CheckCircle size={20} /></div>}
                        </button>
                      );
                    })}
                </div>
                <div className="bk-footer-row">
                  <button className="bk-back-btn" onClick={() => setSelectedCategory(null)}>
                    <ChevronLeft size={18} /> Volver
                  </button>
                  <button
                    className="bk-cta-btn"
                    disabled={!selectedService}
                    onClick={() => handleStepChange(3)}
                  >
                    Continuar <ChevronRight size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── CLIENT STEP 3: Date & Time ── */}
        {!isAdmin && step === 3 && (
          <div className="bk-card-grid fade-in">
            {/* Calendar */}
            <div className="bk-card">
              <div className="bk-card-head"><CalendarDays size={20} /> Elige una fecha</div>
              <div className="bk-calendar">
                <div className="bk-cal-nav">
                  <button onClick={prevMonth}><ChevronLeft size={18} /></button>
                  <span>{MONTHS_ES[calMonth]} {calYear}</span>
                  <button onClick={nextMonth}><ChevronRight size={18} /></button>
                </div>
                <div className="bk-cal-days-header">
                  {DAYS_ES.map(d => <span key={d}>{d}</span>)}
                </div>
                <div className="bk-cal-grid">
                  {calDays.map((day, i) => (
                    <button
                      key={i}
                      className={`bk-cal-day ${!day ? 'empty' : ''} ${day && isPastDay(day) ? 'past' : ''} ${day === selectedDay ? 'selected' : ''}`}
                      disabled={!day || isPastDay(day)}
                      onClick={() => { if (day) { setSelectedDay(day); setSelectedTime(null); } }}
                    >{day}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Time slots */}
            <div className="bk-card">
              <div className="bk-card-head"><Clock size={20} /> Horarios disponibles</div>
              <div className="bk-selected-service-tag" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={14} /> <strong>{selectedBranch?.name}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.8 }}>
                  <Scissors size={14} /> {selectedService?.name} · {selectedService?.duration} min
                </div>
              </div>
              <div className="bk-slots-grid">
                {getTimeSlots().map(slot => (
                  <button
                    key={slot.time}
                    className={`bk-slot ${slot.available ? 'available' : 'booked'} ${selectedTime === slot.time ? 'selected' : ''}`}
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.time)}
                  >{slot.time}</button>
                ))}
              </div>

              <div className="bk-slot-legend">
                <span className="legend-item available-dot">Disponible</span>
                <span className="legend-item booked-dot">Ocupado</span>
                <span className="legend-item selected-dot">Seleccionado</span>
              </div>
            </div>

            <div className="bk-footer-row col-span-2">
              <button className="bk-back-btn" onClick={() => setStep(2)}><ChevronLeft size={18} /> Volver</button>
              <button className="bk-cta-btn" disabled={!selectedTime} onClick={() => handleStepChange(4)}>
                Ver resumen <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ── CLIENT STEP 4: Payment ── */}
        {!isAdmin && step === 4 && (
          <div className="bk-confirm-wrap fade-in">
            <div className="bk-confirm-card">
              <div className="bk-confirm-header">
                <Sparkles size={40} color="var(--cafe-miel)" />
                <h2>Pagar Anticipo (40%)</h2>
                <p>Para confirmar tu cita, requerimos un anticipo del 40%.</p>
              </div>

              <div className="bk-confirm-details" style={{ background: '#f8f5f1', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
                <div className="bk-confirm-row">
                  <span className="bk-confirm-label">Sucursal</span>
                  <span className="bk-confirm-value">{selectedBranch?.name}</span>
                </div>
                <div className="bk-confirm-row">
                  <span className="bk-confirm-label">Servicio</span>
                  <span className="bk-confirm-value">{selectedService?.name}</span>
                </div>
                <div className="bk-confirm-row">
                  <span className="bk-confirm-label">Fecha y Hora</span>
                  <span className="bk-confirm-value">{selectedDate} @ {selectedTime}</span>
                </div>
                <div className="bk-confirm-row">
                  <span className="bk-confirm-label">Total del servicio</span>
                  <span className="bk-confirm-value">${selectedService?.price} MXN</span>
                </div>
                <div className="bk-confirm-row highlight">
                  <span className="bk-confirm-label">Anticipo a pagar hoy</span>
                  <span className="bk-confirm-value bk-price">${(selectedService?.price * 0.4).toFixed(2)} MXN</span>
                </div>
              </div>

              <div className="bk-payment-options">
                <p style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gris-calido)', marginBottom: '1rem', letterSpacing: '1px' }}>Selecciona método de pago:</p>
                <div className="shipping-options" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
                  <button className="shipping-option-btn" onClick={() => handleBooking('card')}>
                    <img src="/visaandmastercard.png" alt="Card" className="pm-img" />
                    <div className="shipping-option-info">
                      <span className="option-name">Tarjeta Débito/Crédito</span>
                      <span className="option-desc">Confirmación instantánea</span>
                    </div>
                    <ChevronRight size={18} />
                  </button>
                  <button className="shipping-option-btn" onClick={() => handleBooking('oxxo')}>
                    <img src="/oxxo.png" alt="OXXO" className="pm-img" />
                    <div className="shipping-option-info">
                      <span className="option-name">Efectivo en OXXO</span>
                      <span className="option-desc">Paga en cualquier sucursal</span>
                    </div>
                    <ChevronRight size={18} />
                  </button>
                  <button className="shipping-option-btn" onClick={() => handleBooking('spei')}>
                    <img src="/spei.png" alt="SPEI" className="pm-img" />
                    <div className="shipping-option-info">
                      <span className="option-name">Transferencia SPEI</span>
                      <span className="option-desc">Banca móvil las 24 hrs</span>
                    </div>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="bk-confirm-btns" style={{ marginTop: '2rem' }}>
                <button className="bk-back-btn" onClick={() => setStep(3)}><ChevronLeft size={16} /> Volver</button>
              </div>
            </div>
          </div>
        )}

        {/* ── CLIENT STEP 5: Processing (Card only) ── */}
        {!isAdmin && step === 5 && (
          <div className="bk-confirm-wrap fade-in">
            <div className="bk-confirm-card" style={{ textAlign: 'center' }}>
              <div className="auth-loading-ring" style={{ width: '60px', height: '60px', margin: '0 auto 2rem' }} />
              <h3>Procesando pago seguro...</h3>
              <p>Estamos validando tu transacción con Mercado Pago. No cierres esta ventana.</p>
            </div>
          </div>
        )}

        {/* ── CLIENT STEP 5.1: OXXO Reference ── */}
        {!isAdmin && step === 5.1 && (
          <div className="bk-confirm-wrap fade-in">
            <div className="bk-confirm-card">
              <div className="bk-confirm-header">
                <img src="/oxxo.png" alt="OXXO" style={{ height: '40px', marginBottom: '1rem' }} />
                <h2>Ficha de Pago OXXO</h2>
                <p>Presenta este número en caja para completar tu anticipo.</p>
              </div>
              <div className="oxxo-ref-box" style={{ background: '#f5f5f5', border: '2px dashed #999', borderRadius: '12px', padding: '2rem', textAlign: 'center', margin: '1.5rem 0' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#666' }}>Número de Referencia</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '2px', color: '#b91c1c', margin: '0.5rem 0' }}>{oxxoRef}</div>
                <p style={{ fontSize: '0.8rem', margin: '0' }}>Vence en 24 horas</p>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '2rem' }}>
                ⚠️ Tu cita quedará **pre-reservada** y se confirmará automáticamente en cuanto realices el pago en OXXO.
              </p>
              <button className="bk-cta-btn" onClick={() => setStep(6)}>He guardado mi ficha <ArrowRight size={18} /></button>
            </div>
          </div>
        )}

        {/* ── CLIENT STEP 5.2: SPEI Reference ── */}
        {!isAdmin && step === 5.2 && (
          <div className="bk-confirm-wrap fade-in">
            <div className="bk-confirm-card">
              <div className="bk-confirm-header">
                <img src="/spei.png" alt="SPEI" style={{ height: '40px', marginBottom: '1rem' }} />
                <h2>Transferencia SPEI</h2>
                <p>Realiza la transferencia por ${(selectedService?.price * 0.4).toFixed(2)} MXN.</p>
              </div>
              <div className="spei-details" style={{ background: '#f0f4ff', borderRadius: '16px', padding: '1.5rem', margin: '1.5rem 0' }}>
                <div className="bk-confirm-row"><span className="bk-confirm-label">Banco</span> <span className="bk-confirm-value">STP</span></div>
                <div className="bk-confirm-row"><span className="bk-confirm-label">CLABE</span> <span className="bk-confirm-value">6461 8011 0400 {speiRef.slice(0,6)}</span></div>
                <div className="bk-confirm-row"><span className="bk-confirm-label">Concepto</span> <span className="bk-confirm-value">{speiRef.slice(0,8)}</span></div>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '2rem' }}>
                Tu cita se confirmará en cuanto el sistema reciba la transferencia (aprox. 5 min).
              </p>
              <button className="bk-cta-btn" onClick={() => setStep(6)}>Ya realicé el pago <ArrowRight size={18} /></button>
            </div>
          </div>
        )}

        {/* ── CLIENT STEP 6: Success ── */}
        {!isAdmin && step === 6 && (
          <div className="bk-success fade-in">
            <div className="bk-success-glow" />
            <div className="bk-success-icon"><Sparkles size={48} /></div>
            <h2>¡Cita Programada!</h2>
            <p>Te esperamos en <strong>{selectedBranch?.name}</strong> el <strong>{selectedDay} de {MONTHS_ES[calMonth]}</strong> a las <strong>{selectedTime} hrs</strong>.</p>
            <div className="bk-success-details" style={{ background: 'rgba(255,255,255,0.2)', padding: '1.5rem', borderRadius: '16px', margin: '1.5rem 0', backdropFilter: 'blur(10px)' }}>
              <p style={{ margin: 0 }}>Anticipo del 40%: <strong>${(selectedService?.price * 0.4).toFixed(2)} MXN</strong></p>
              <p style={{ margin: 0, opacity: 0.8 }}>Restante a pagar en sucursal: <strong>${(selectedService?.price * 0.6).toFixed(2)} MXN</strong></p>
            </div>
            <p className="bk-success-sub">Recibirás un recordatorio por correo electrónico a {user?.email}.</p>
            <button className="bk-cta-btn" onClick={resetBooking}>Hacer otra reserva</button>
          </div>
        )}

      </div>
    </div>
  );
};

export default BookingPage;
