import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import './Auth.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const getFriendlyErrorMessage = (err) => {
    const msg = err.message.toLowerCase();
    if (msg.includes('invalid login credentials')) return 'Email o contraseña incorrectos. Por favor, verifica tus datos.';
    if (msg.includes('user not found')) return 'No existe ninguna cuenta con este correo electrónico.';
    if (msg.includes('email not confirmed')) return 'Por favor, confirma tu correo electrónico para poder iniciar sesión.';
    if (msg.includes('password is too short')) return 'La contraseña es demasiado corta. Debe tener al menos 6 caracteres.';
    if (msg.includes('already registered') || msg.includes('user already exists')) return 'Este correo ya está registrado. Intenta iniciar sesión.';
    return err.message; // Fallback
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const { from, ...restOfState } = location.state || {};
        const destination = from || '/';
        navigate(destination, { state: restOfState });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });
        if (error) throw error;
        setSuccessMessage('¡Cuenta creada! Por favor, revisa tu correo para confirmarla.');
      }
    } catch (error) {
      if (error.status === 429) {
        setErrorMessage("Demasiados intentos. Por favor, espera unos minutos antes de volver a intentar.");
      } else {
        setErrorMessage(getFriendlyErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <div className="auth-page">
      {/* Left Panel — Brand */}
      <div className="auth-brand-panel">
        <div className="auth-brand-overlay" />
        <div className="auth-brand-content">
          <div className="auth-brand-top">
            <img src="/logo.png" alt="Appointment Salon & Spa" className="auth-logo" />
            <Link to="/" className="auth-back-btn">← Inicio</Link>
          </div>
          <div className="auth-brand-bottom">
            <span className="auth-brand-tag">Belleza · Bienestar · Lujo</span>
            <h2>Una experiencia diseñada para ti</h2>
            <p>Reserva tus servicios exclusivos, accede al marketplace y gestiona tu historial — todo en un solo lugar.</p>
            <div className="auth-brand-stats">
              <div className="auth-stat">
                <span className="auth-stat-num">15+</span>
                <span className="auth-stat-label">Años</span>
              </div>
              <div className="auth-stat-divider" />
              <div className="auth-stat">
                <span className="auth-stat-num">40k</span>
                <span className="auth-stat-label">Clientes</span>
              </div>
              <div className="auth-stat-divider" />
              <div className="auth-stat">
                <span className="auth-stat-num">5★</span>
                <span className="auth-stat-label">Valoración</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">

          {/* Tab Switcher */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(true); setErrorMessage(''); setSuccessMessage(''); }}
            >
              Iniciar Sesión
            </button>
            <button
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(false); setErrorMessage(''); setSuccessMessage(''); }}
            >
              Registrarse
            </button>
          </div>

          {/* Heading */}
          <div className="auth-form-header">
            <h1>{isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</h1>
            <p>{isLogin ? 'Accede y empieza a reservar.' : 'Únete a nuestra comunidad exclusiva.'}</p>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="auth-error-box fade-in">
              <span className="error-dot" />
              <p>{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="auth-success-box fade-in">
              <span className="success-dot" />
              <p>{successMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} className="auth-form-body">
            {!isLogin && (
              <div className={`auth-field ${focusedField === 'name' ? 'focused' : ''} ${fullName ? 'has-value' : ''}`}>
                <label>Nombre Completo</label>
                <div className="auth-input-wrap">
                  <User size={18} className="auth-field-icon" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    required
                    placeholder="Tu nombre completo"
                  />
                </div>
              </div>
            )}

            <div className={`auth-field ${focusedField === 'email' ? 'focused' : ''} ${email ? 'has-value' : ''}`}>
              <label>Correo Electrónico</label>
              <div className="auth-input-wrap">
                <Mail size={18} className="auth-field-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>

            <div className={`auth-field ${focusedField === 'pass' ? 'focused' : ''} ${password ? 'has-value' : ''}`}>
              <label>Contraseña</label>
              <div className="auth-input-wrap">
                <Lock size={18} className="auth-field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('pass')}
                  onBlur={() => setFocusedField(null)}
                  required
                  placeholder="•••••••••"
                />
                <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="auth-forgot">
                <a href="#">¿Olvidaste tu contraseña?</a>
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span className="auth-loading-ring" />
              ) : (
                <>
                  {isLogin ? 'ACCEDER' : 'CREAR CUENTA'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-switch">
            {isLogin ? '¿No tienes cuenta?' : '¿Ya eres miembro?'}
            <button className="auth-switch-btn" onClick={toggleMode}>
              {isLogin ? 'Regístrate gratis' : 'Inicia sesión'}
            </button>
          </div>

          <div className="auth-perks">
            <Sparkles size={14} />
            <span>Acceso a reservas, historial y marketplace exclusivo</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Auth;
