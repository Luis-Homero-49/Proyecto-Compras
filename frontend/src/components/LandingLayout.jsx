import React, { useState } from 'react';
import { ShoppingCart, Check, X } from 'lucide-react';

const LandingLayout = ({ children, onPlanSelected, showPlans: externalShowPlans, setShowPlans: externalSetShowPlans }) => {
  const [localShowPlans, setLocalShowPlans] = useState(false);
  
  const showPlans = externalShowPlans !== undefined ? externalShowPlans : localShowPlans;
  const setShowPlans = externalSetShowPlans !== undefined ? externalSetShowPlans : setLocalShowPlans;

  return (
    <div className="landing-container">
      {/* Left Side: Background & Description */}
      <div className="landing-left">
        {/* Dark Overlay */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.2)', // Much lighter overlay to show image clearly
          zIndex: 1
        }}></div>

        {/* Content */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '600px',
          textAlign: 'center',
          padding: '40px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{ padding: '20px', backgroundColor: 'var(--accent-primary)', borderRadius: '50%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
               <ShoppingCart size={48} color="white" />
            </div>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '16px', color: '#ffffff', textShadow: '0 4px 15px rgba(0,0,0,0.7)' }}>Tu Ayudante de Compras Inteligente</h1>
          <p style={{ fontSize: '1.25rem', lineHeight: '1.6', marginBottom: '32px', color: 'rgba(255,255,255,0.9)' }}>
            Organiza tus presupuestos, gestiona tus listas de compras y encuentra los mejores precios en tus comercios favoritos. Todo en un solo lugar.
          </p>
          <button 
            onClick={() => setShowPlans(true)}
            className="btn btn-primary"
            style={{ padding: '16px 32px', fontSize: '1.1rem', backgroundColor: 'white', color: 'var(--accent-primary)', border: 'none', borderRadius: '30px', fontWeight: 'bold' }}
          >
            Ver Planes de Uso
          </button>
        </div>
      </div>

      {/* Right Side: Auth Forms */}
      <div className="landing-right">
        {children}
      </div>

      {/* Plans Modal */}
      {showPlans && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '1100px',
            maxHeight: '95vh',
            padding: '30px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <button 
              onClick={() => setShowPlans(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', cursor: 'pointer', borderRadius: '50%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', zIndex: 10 }}
              onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
              onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
            >
              <X size={24} color="var(--text-primary)" />
            </button>
            <h2 style={{ textAlign: 'center', fontSize: '2.2rem', marginBottom: '20px', color: 'var(--text-primary)', flexShrink: 0 }}>Nuestros Planes</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', overflowY: 'auto', padding: '10px' }}>
              {/* Basic */}
              <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', borderTop: '6px solid #94a3b8' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '4px' }}>Básico</h3>
                <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '4px', color: 'var(--accent-primary)' }}>Gratis</div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontWeight: '600', fontSize: '0.9rem' }}>¡Gratis los primeros 2 meses!</p>
                <ul style={{ listStyle: 'none', padding: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.95rem' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} color="#10b981" /> <span>Listas de compras limitadas</span></li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} color="#10b981" /> <span>Acceso a productos globales</span></li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} color="#10b981" /> <span>Gestión de presupuestos básica</span></li>
                </ul>
                <button 
                  onClick={() => { setShowPlans(false); if(onPlanSelected) onPlanSelected('basic'); }}
                  className="btn btn-outline" 
                  style={{ width: '100%', marginTop: '16px' }}
                >
                  Seleccionar Básico
                </button>
              </div>

              {/* Pro */}
              <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', borderTop: '6px solid var(--accent-primary)', transform: 'scale(1.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                <div style={{ backgroundColor: 'var(--accent-primary)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: '12px' }}>MÁS POPULAR</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '4px' }}>Pro</h3>
                <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '4px', color: 'var(--accent-primary)' }}>$4.99<span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>/mes</span></div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>Para compradores frecuentes</p>
                <ul style={{ listStyle: 'none', padding: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.95rem' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} color="#10b981" /> <span>Listas y presupuestos ilimitados</span></li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} color="#10b981" /> <span>Historial de precios avanzado</span></li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} color="#10b981" /> <span>Sin anuncios</span></li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} color="#10b981" /> <span>Exportación a PDF/Excel</span></li>
                </ul>
                <button 
                  onClick={() => { setShowPlans(false); if(onPlanSelected) onPlanSelected('pro'); }}
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '16px' }}
                >
                  Seleccionar Pro
                </button>
              </div>

              {/* Familiar */}
              <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', borderTop: '6px solid #f59e0b' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '4px' }}>Familiar</h3>
                <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '4px', color: 'var(--accent-primary)' }}>$8.99<span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>/mes</span></div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>Ideal para el hogar</p>
                <ul style={{ listStyle: 'none', padding: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.95rem' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} color="#10b981" /> <span>Todo lo del plan Pro</span></li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} color="#10b981" /> <span>Hasta 5 usuarios sincronizados</span></li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} color="#10b981" /> <span>Listas compartidas en tiempo real</span></li>
                </ul>
                <button 
                  onClick={() => { setShowPlans(false); if(onPlanSelected) onPlanSelected('familiar'); }}
                  className="btn btn-outline" 
                  style={{ width: '100%', marginTop: '16px', borderColor: '#f59e0b', color: '#d97706' }}
                >
                  Seleccionar Familiar
                </button>
              </div>
            </div>

            {/* Return Button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', flexShrink: 0 }}>
              <button 
                onClick={() => setShowPlans(false)}
                className="btn"
                style={{ padding: '12px 32px', fontSize: '1.1rem', borderRadius: '30px', fontWeight: 'bold', backgroundColor: '#1e293b', color: 'white', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}
              >
                Regresar a la página principal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingLayout;
