import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const SERVICES = [
  { id: 1, name: 'Corte de Cabello Premium', duration: 60, price: '$45', category: 'Hair' },
  { id: 2, name: 'Coloración Completa', duration: 120, price: '$120', category: 'Hair' },
  { id: 3, name: 'Tratamiento Facial Orgánico', duration: 45, price: '$80', category: 'Spa' },
  { id: 4, name: 'Manicura Spa', duration: 60, price: '$50', category: 'Spa' },
  { id: 5, name: 'Masaje Relajante Express', duration: 45, price: '$65', category: 'Spa' },
];

const BookingPage = ({ isAdmin }) => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkUser();
    fetchAppointments();

    if (location.state?.selectedService) {
      setSelectedService(location.state.selectedService);
      setStep(2);
    }

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchAppointments();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session && !isAdmin) {
      navigate('/auth');
    } else {
      setUser(session?.user ?? null);
    }
  };

  const fetchAppointments = async () => {
    const { data, error } = await supabase.from('appointments').select('*');
    if (!error) setBookedSlots(data || []);
  };

  const getTimeSlots = () => {
    if (!selectedService && !isAdmin) return [];
    const slots = [];
    const startTime = 9;
    const endTime = 20;
    for (let h = startTime; h < endTime; h++) {
      for (let m = 0; m < 60; m += 30) {
        const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        const durationNeeded = isAdmin ? 30 : selectedService.duration;
        slots.push({ time: timeString, available: checkAvailability(timeString, durationNeeded) });
      }
    }
    return slots;
  };

  const checkAvailability = (time, duration) => {
    const startMinutes = timeToMinutes(time);
    const endMinutes = startMinutes + duration;
    if (endMinutes > 20 * 60) return false;
    return !bookedSlots.some(slot => {
      if (slot.date !== selectedDate) return false;
      const slotStart = timeToMinutes(slot.time);
      const slotEnd = slotStart + slot.duration;
      return (startMinutes < slotEnd) && (endMinutes > slotStart);
    });
  };

  const timeToMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedTime) return;

    const bookingData = {
      date: selectedDate,
      time: selectedTime,
      duration: isAdmin ? 30 : selectedService.duration,
      service_name: isAdmin ? 'BLOQUEADO POR DUEÑO' : selectedService.name,
      user_id: user?.id || null,
      user_name: user?.user_metadata?.full_name || user?.email || 'ADMIN',
      user_email: user?.email || 'admin@salon.com',
      is_admin_blocked: isAdmin
    };

    const { error } = await supabase.from('appointments').insert([bookingData]);
    if (!error) {
      if (!isAdmin) setStep(4);
      setSelectedTime(null);
    } else {
      alert('Error: ' + error.message);
    }
  };

  const resetBooking = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedTime(null);
  };

  return (
    <div className="booking-page container fade-in" style={{ paddingTop: '60px', paddingBottom: '100px' }}>
      <div className="section-header">
        <h2>{isAdmin ? 'Gestión de Calendario' : 'Reserva tu Experiencia'}</h2>
        <div className="divider"></div>
        <p>{isAdmin ? 'Administra las citas y bloquea horarios.' : 'Selecciona tu servicio y elige el mejor momento.'}</p>
      </div>

      <div className="booking-container glass-morphism">
        {!isAdmin && step < 4 && (
          <div className="booking-steps">
            <div className={`step-item ${step >= 1 ? 'active' : ''}`}>1. Servicio</div>
            <div className={`step-item ${step >= 2 ? 'active' : ''}`}>2. Fecha y Hora</div>
            <div className={`step-item ${step >= 3 ? 'active' : ''}`}>3. Confirmar</div>
          </div>
        )}

        <div className="booking-content">
          {isAdmin ? (
            <div className="admin-grid">
              <div className="date-picker-area">
                <h3>Seleccionar Fecha</h3>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="date-input" />
              </div>
              <div className="time-picker-area">
                <h3>Bloquear / Gestionar Horarios</h3>
                <div className="time-slots-grid">
                  {getTimeSlots().map(slot => (
                    <button key={slot.time} className={`slot-btn ${slot.available ? 'available' : 'booked'}`}
                      onClick={() => slot.available && setSelectedTime(slot.time)}
                      disabled={!slot.available && !bookedSlots.some(b => b.date === selectedDate && b.time === slot.time)}>
                      {slot.time} {slot.available ? '' : '(Ocupado)'}
                    </button>
                  ))}
                </div>
                {selectedTime && (
                  <div className="admin-actions fade-in">
                    <p>¿Bloquear horario de las {selectedTime}?</p>
                    <button className="btn-primary" onClick={handleBooking}>BLOQUEAR</button>
                    <button className="btn-secondary" onClick={() => setSelectedTime(null)}>CANCELAR</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="services-selection fade-in">
                  <h3>¿Qué servicio deseas hoy?</h3>
                  <div className="service-list">
                    {SERVICES.map(s => (
                      <div key={s.id} className={`service-option ${selectedService?.id === s.id ? 'selected' : ''}`} onClick={() => setSelectedService(s)}>
                        <div className="service-name">{s.name}</div>
                        <div className="service-meta">{s.duration} min | {s.price}</div>
                      </div>
                    ))}
                  </div>
                  <button className="btn-primary" disabled={!selectedService} onClick={() => setStep(2)}>CONTINUAR</button>
                </div>
              )}

              {step === 2 && (
                <div className="datetime-selection fade-in">
                  <div className="booking-grid">
                    <div className="date-picker">
                      <h3>1. Elige la fecha</h3>
                      <input type="date" min={new Date().toISOString().split('T')[0]} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="date-input" />
                    </div>
                    <div className="time-picker">
                      <h3>2. Horarios disponibles</h3>
                      <div className="time-slots-grid">
                        {getTimeSlots().map(slot => (
                          <button key={slot.time} className={`slot-btn ${slot.available ? 'available' : 'disabled'}`}
                            disabled={!slot.available} onClick={() => setSelectedTime(slot.time)}>{slot.time}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="action-row">
                    <button className="btn-secondary" onClick={() => setStep(1)}>VOLVER</button>
                    <button className="btn-primary" disabled={!selectedTime} onClick={() => setStep(3)}>RESUMEN</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="confirmation-area fade-in">
                  <h3>Confirmar tu Cita</h3>
                  <div className="summary-card glass-morphism">
                    <p><strong>Servicio:</strong> {selectedService.name}</p>
                    <p><strong>Fecha:</strong> {selectedDate} | <strong>Hora:</strong> {selectedTime}</p>
                    <p><strong>Cliente:</strong> {user?.user_metadata?.full_name || user?.email}</p>
                  </div>
                  <button onClick={handleBooking} className="btn-primary full-width">CONFIRMAR RESERVA</button>
                  <button onClick={() => setStep(2)} className="btn-secondary full-width">EDITAR</button>
                </div>
              )}

              {step === 4 && (
                <div className="success-area fade-in text-center">
                  <div className="success-icon">✨</div>
                  <h3>¡Cita Reservada!</h3>
                  <p>Hemos vinculado la cita a tu cuenta exitosamente.</p>
                  <button className="btn-primary" onClick={resetBooking}>HACER OTRA RESERVA</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
