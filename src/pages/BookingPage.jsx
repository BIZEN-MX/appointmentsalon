import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Scissors, Palette, Smile, Hand, Wind, Clock, CheckCircle, ChevronRight, ChevronLeft, CalendarDays, User, Lock } from 'lucide-react';

const SERVICES = [
  {
    id: 1, name: 'Corte de Cabello Premium', duration: 60, price: '$45', category: 'Hair',
    icon: Scissors, desc: 'Corte de precisión adaptado a tu estilo y tipo de cabello.',
    color: '#A0652D',
  },
  {
    id: 2, name: 'Coloración Completa', duration: 120, price: '$120', category: 'Hair',
    icon: Palette, desc: 'Técnicas de coloración de vanguardia con productos premium.',
    color: '#8B7359',
  },
  {
    id: 3, name: 'Tratamiento Facial Orgánico', duration: 45, price: '$80', category: 'Spa',
    icon: Smile, desc: 'Revitaliza tu piel con ingredientes 100% orgánicos y naturales.',
    color: '#9D8F7B',
  },
  {
    id: 4, name: 'Manicura Spa', duration: 60, price: '$50', category: 'Beauty',
    icon: Hand, desc: 'Cuidado completo de manos con esmaltado duradero de alta gama.',
    color: '#615C56',
  },
  {
    id: 5, name: 'Masaje Relajante Express', duration: 45, price: '$65', category: 'Spa',
    icon: Wind, desc: 'Libera tensiones con nuestro masaje de relajación profunda.',
    color: '#9E9F9D',
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
  const [step, setStep] = useState(1);
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

  const selectedDate = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    checkUser();
    fetchAppointments();
    if (location.state?.selectedService) {
      setSelectedService(location.state.selectedService);
      setStep(2);
    }
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchAppointments)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session && !isAdmin) navigate('/auth');
    else setUser(session?.user ?? null);
  };

  const fetchAppointments = async () => {
    const { data, error } = await supabase.from('appointments').select('*');
    if (!error) setBookedSlots(data || []);
  };

  const timeToMinutes = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

  const checkAvailability = (time, duration) => {
    const start = timeToMinutes(time);
    const end   = start + duration;
    if (end > 20 * 60) return false;
    return !bookedSlots.some(s => {
      if (s.date !== selectedDate) return false;
      const ss = timeToMinutes(s.time), se = ss + s.duration;
      return start < se && end > ss;
    });
  };

  const getTimeSlots = () => {
    if (!selectedService && !isAdmin) return [];
    const slots = [];
    for (let h = 9; h < 20; h++) {
      for (let m = 0; m < 60; m += 30) {
        const t = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
        const dur = isAdmin ? 30 : selectedService.duration;
        slots.push({ time: t, available: checkAvailability(t, dur) });
      }
    }
    return slots;
  };

  const handleBooking = async (e) => {
    e?.preventDefault();
    if (!selectedTime) return;
    setIsSubmitting(true);
    const bookingData = {
      date: selectedDate, time: selectedTime,
      duration: isAdmin ? 30 : selectedService.duration,
      service_name: isAdmin ? 'BLOQUEADO POR DUEÑO' : selectedService.name,
      user_id: user?.id || null,
      user_name: user?.user_metadata?.full_name || user?.email || 'ADMIN',
      user_email: user?.email || 'admin@salon.com',
      is_admin_blocked: isAdmin,
    };
    const { error } = await supabase.from('appointments').insert([bookingData]);
    setIsSubmitting(false);
    if (!error) { if (!isAdmin) setStep(4); setSelectedTime(null); }
    else alert('Error: ' + error.message);
  };

  const resetBooking = () => { setStep(1); setSelectedService(null); setSelectedTime(null); };

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
        {!isAdmin && step < 4 && (
          <div className="bk-progress">
            {['Servicio', 'Fecha & Hora', 'Confirmar'].map((label, i) => (
              <div key={i} className={`bk-progress-step ${step > i+1 ? 'done' : ''} ${step === i+1 ? 'active' : ''}`}>
                <div className="bk-progress-circle">
                  {step > i+1 ? <CheckCircle size={16} /> : i+1}
                </div>
                <span>{label}</span>
                {i < 2 && <div className="bk-progress-line" />}
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

        {/* ── CLIENT STEP 1: Service selection ── */}
        {!isAdmin && step === 1 && (
          <div className="fade-in">
            <div className="bk-section-label">¿Qué servicio deseas hoy?</div>
            <div className="bk-services-grid">
              {SERVICES.map(s => {
                const Icon = s.icon;
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
                        <span className="bk-svc-price">{s.price}</span>
                      </div>
                    </div>
                    {active && <div className="bk-svc-check"><CheckCircle size={20} /></div>}
                  </button>
                );
              })}
            </div>
            <div className="bk-footer-row">
              <button
                className="bk-cta-btn"
                disabled={!selectedService}
                onClick={() => setStep(2)}
              >
                Continuar <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ── CLIENT STEP 2: Date & Time ── */}
        {!isAdmin && step === 2 && (
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
              <div className="bk-selected-service-tag">
                ✂️ {selectedService?.name} · {selectedService?.duration} min
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
              <button className="bk-back-btn" onClick={() => setStep(1)}><ChevronLeft size={18} /> Volver</button>
              <button className="bk-cta-btn" disabled={!selectedTime} onClick={() => setStep(3)}>
                Ver resumen <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ── CLIENT STEP 3: Confirm ── */}
        {!isAdmin && step === 3 && (
          <div className="bk-confirm-wrap fade-in">
            <div className="bk-confirm-card">
              <div className="bk-confirm-header">
                <CheckCircle size={40} color="var(--cafe-miel)" />
                <h2>Confirma tu cita</h2>
                <p>Revisa los detalles antes de reservar</p>
              </div>

              <div className="bk-confirm-details">
                <div className="bk-confirm-row">
                  <span className="bk-confirm-label">Servicio</span>
                  <span className="bk-confirm-value">{selectedService?.name}</span>
                </div>
                <div className="bk-confirm-row">
                  <span className="bk-confirm-label">Duración</span>
                  <span className="bk-confirm-value">{selectedService?.duration} minutos</span>
                </div>
                <div className="bk-confirm-row">
                  <span className="bk-confirm-label">Precio</span>
                  <span className="bk-confirm-value bk-price">{selectedService?.price} MXN</span>
                </div>
                <div className="bk-confirm-row">
                  <span className="bk-confirm-label">Fecha</span>
                  <span className="bk-confirm-value">{DAYS_ES[new Date(selectedDate+'T12:00').getDay()]} {selectedDay} de {MONTHS_ES[calMonth]}, {calYear}</span>
                </div>
                <div className="bk-confirm-row">
                  <span className="bk-confirm-label">Hora</span>
                  <span className="bk-confirm-value bk-time">{selectedTime} hrs</span>
                </div>
                <div className="bk-confirm-row">
                  <span className="bk-confirm-label">Cliente</span>
                  <span className="bk-confirm-value">
                    <User size={14} style={{ display:'inline', marginRight:'4px' }} />
                    {user?.user_metadata?.full_name || user?.email}
                  </span>
                </div>
              </div>

              <div className="bk-confirm-btns">
                <button className="bk-cta-btn" onClick={handleBooking} disabled={isSubmitting}>
                  {isSubmitting ? <span className="auth-loading-ring" /> : <>Confirmar Reserva <CheckCircle size={18} /></>}
                </button>
                <button className="bk-back-btn" onClick={() => setStep(2)}><ChevronLeft size={16} /> Editar</button>
              </div>
            </div>
          </div>
        )}

        {/* ── CLIENT STEP 4: Success ── */}
        {!isAdmin && step === 4 && (
          <div className="bk-success fade-in">
            <div className="bk-success-glow" />
            <div className="bk-success-icon">✨</div>
            <h2>¡Cita Confirmada!</h2>
            <p>Te esperamos el <strong>{selectedDay} de {MONTHS_ES[calMonth]}</strong> a las <strong>{selectedTime} hrs</strong>.</p>
            <p className="bk-success-sub">Recibirás un recordatorio por correo electrónico a {user?.email}.</p>
            <button className="bk-cta-btn" onClick={resetBooking}>Hacer otra reserva</button>
          </div>
        )}

      </div>
    </div>
  );
};

export default BookingPage;
