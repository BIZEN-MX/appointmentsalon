import React, { useState } from 'react';
import { Send, Users, Mail, Bell, Settings, TrendingUp, Calendar, ShoppingBag } from 'lucide-react';
import './Auth.css'; // Reusing some premium styles

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('marketing');
    const [emailData, setEmailData] = useState({
        subject: '',
        message: '',
        target: 'all'
    });
    const [status, setStatus] = useState('idle');

    const handleSendEmail = (e) => {
        e.preventDefault();
        setStatus('sending');
        
        // Simulating email sending logic
        setTimeout(() => {
            setStatus('success');
            setTimeout(() => {
                setStatus('idle');
                setEmailData({ subject: '', message: '', target: 'all' });
            }, 3000);
        }, 1500);
    };

    return (
        <div className="admin-page fade-in" style={{ padding: '2rem', minHeight: '100vh', background: 'var(--gris-perla)' }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', color: 'var(--negro-espresso)' }}>Panel de Control</h1>
                        <p style={{ color: 'var(--greige)' }}>Gestión administrativa y marketing de Salón Obar.</p>
                    </div>
                </header>

                <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '3rem' }}>
                    {/* Sidebar */}
                    <aside className="admin-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button 
                            className={`admin-nav-btn ${activeTab === 'marketing' ? 'active' : ''}`}
                            onClick={() => setActiveTab('marketing')}
                            style={tabStyle(activeTab === 'marketing')}
                        >
                            <Mail size={18} /> Marketing por Email
                        </button>
                        <button 
                            className={`admin-nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                            onClick={() => setActiveTab('analytics')}
                            style={tabStyle(activeTab === 'analytics')}
                        >
                            <TrendingUp size={18} /> Estadísticas
                        </button>
                        <button 
                            className={`admin-nav-btn ${activeTab === 'appointments' ? 'active' : ''}`}
                            onClick={() => setActiveTab('appointments')}
                            style={tabStyle(activeTab === 'appointments')}
                        >
                            <Calendar size={18} /> Citas Proximas
                        </button>
                    </aside>

                    {/* Main Content */}
                    <main className="admin-content card glass-morphism" style={{ padding: '2.5rem', borderRadius: '16px' }}>
                        {activeTab === 'marketing' && (
                            <section className="marketing-section fade-in">
                                <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <Bell className="gradient-text" /> Campaña de Promoción
                                </h2>
                                <p style={{ color: 'var(--greige)', marginBottom: '2rem' }}>
                                    Envía promociones personalizadas a tus clientes de forma automática.
                                </p>

                                <form onSubmit={handleSendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                            Asunto del Correo
                                        </label>
                                        <input 
                                            required
                                            type="text"
                                            value={emailData.subject}
                                            onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                                            placeholder="Ej: 20% de Descuento en tu próximo corte ✂️"
                                            style={inputStyle}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                            Para:
                                        </label>
                                        <select 
                                            value={emailData.target}
                                            onChange={(e) => setEmailData({...emailData, target: e.target.value})}
                                            style={inputStyle}
                                        >
                                            <option value="all">Todos los clientes (120)</option>
                                            <option value="frequent">Clientes frecuentes (45)</option>
                                            <option value="new">Nuevos clientes (15)</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                            Mensaje de la Promoción
                                        </label>
                                        <textarea 
                                            required
                                            value={emailData.message}
                                            onChange={(e) => setEmailData({...emailData, message: e.target.value})}
                                            placeholder="Escribe aquí los detalles de la oferta..."
                                            style={{ ...inputStyle, minHeight: '200px', resize: 'vertical' }}
                                        />
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="btn-primary"
                                        disabled={status === 'sending'}
                                        style={{ width: '100%', padding: '1.2rem', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.8rem' }}
                                    >
                                        {status === 'sending' ? (
                                            <>Enviando...</>
                                        ) : status === 'success' ? (
                                            <><Send size={18} /> ¡Campaña Enviada con Éxito!</>
                                        ) : (
                                            <><Send size={18} /> Enviar Campaña Ahora</>
                                        )}
                                    </button>
                                </form>
                            </section>
                        )}

                        {activeTab !== 'marketing' && (
                            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                                <Settings size={48} color="var(--beige-suave)" style={{ marginBottom: '1rem' }} />
                                <h3>Módulo en desarrollo</h3>
                                <p style={{ color: 'var(--greige)' }}>Esta funcionalidad estará disponible pronto siguiendo el cronograma de la cotización.</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

// Internal styles
const tabStyle = (active) => ({
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
    transition: 'all 0.3s ease',
    background: active ? 'var(--cafe-miel)' : 'white',
    color: active ? 'white' : 'var(--negro-espresso)',
    boxShadow: active ? '0 4px 12px rgba(160, 101, 45, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
});

const inputStyle = {
    width: '100%',
    padding: '0.8rem 1rem',
    borderRadius: '4px',
    border: '1px solid var(--beige-suave)',
    fontSize: '1rem',
    fontFamily: 'inherit',
    outline: 'none',
};

export default AdminDashboard;
