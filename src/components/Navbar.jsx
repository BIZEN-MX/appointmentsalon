import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ShoppingBag, User, LogOut, Calendar, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Cart from './Cart';

const Navbar = ({ isAdmin, setIsAdmin }) => {
  const { cartCount, setIsCartOpen } = useCart();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container nav-content">
        <Link to="/" className="logo-container">
          <img src="/logo.png" alt="Appointment Salon & Spa" className="brand-logo" />
        </Link>
        <ul className="nav-links">
          <li><Link to="/">Inicio</Link></li>
          <li><a href="/#services">Servicios</a></li>
          <li><Link to="/marketplace" className="nav-icon-link"><ShoppingBag size={20} /> Marketplace</Link></li>
          <li>
            <button className="cart-trigger" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          </li>
          <li><Link to="/booking" className="btn-nav">Reservar Ahora</Link></li>
          
          {user ? (
            <li className="user-menu">
              <span className="user-email">{user.email.split('@')[0]}</span>
              <button onClick={handleLogout} className="icon-btn" title="Cerrar Sesión">
                <LogOut size={18} />
              </button>
            </li>
          ) : (
            <li>
              <Link to="/auth" className="icon-btn" title="Iniciar Sesión">
                <User size={20} />
              </Link>
            </li>
          )}

          <li>
            <button 
              className={`admin-toggle ${isAdmin ? 'active' : ''}`}
              onClick={() => setIsAdmin(!isAdmin)}
              title="Modo Dueño"
            >
              <Calendar size={16} /> {isAdmin ? 'DUEÑO' : ''}
            </button>
          </li>
        </ul>
      </div>
      <Cart />
    </nav>
  );
};

export default Navbar;
