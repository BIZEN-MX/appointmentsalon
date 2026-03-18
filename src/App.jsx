import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Instagram, Facebook } from 'lucide-react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import BookingPage from './pages/BookingPage';
import Marketplace from './pages/Marketplace';
import Auth from './pages/Auth';
import './App.css';

const App = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  // Hide chrome on the auth page for a full-screen immersive experience
  const isAuthPage = location.pathname === '/auth';

  return (
    <div className="app">
      {!isAuthPage && <Navbar isAdmin={isAdmin} setIsAdmin={setIsAdmin} />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/booking" element={<BookingPage isAdmin={isAdmin} />} />
        <Route path="/marketplace" element={<Marketplace isAdmin={isAdmin} />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>

      {/* Footer — hidden on auth page */}
      {!isAuthPage && (
        <footer className="footer">
          <div className="container footer-grid">
            <div className="footer-brand">
              <img src="/logo.png" alt="Appointment Salon & Spa" className="footer-logo-img" />
              <p className="footer-tagline">Lujo y bienestar en cada detalle.</p>
            </div>
            <div className="footer-contact">
              <h4>Contacto</h4>
              <p>📍 Calle Premium 123, Polanco, CDMX</p>
              <p>📍 Av. Libertad 456, Roma Norte, CDMX</p>
              <p>📞 +52 55 1234 5678</p>
              <p>✉️ info@appointment-salon.com</p>
            </div>
            <div className="footer-social">
              <h4>Síguenos</h4>
              <div className="social-links">
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <Instagram size={20} /> Instagram
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <Facebook size={20} /> Facebook
                </a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="copyright">&copy; 2026 Appointment Salon & Spa. Todos los derechos reservados.</p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
