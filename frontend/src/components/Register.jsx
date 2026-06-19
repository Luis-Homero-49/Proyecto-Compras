import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { UserPlus, Mail, Lock, ArrowRight, List } from 'lucide-react';
import { API_URL } from '../config';

const Register = ({ onSwitchToLogin, planType, onShowPlans }) => {
  const { login } = useContext(AuthContext);
  const [alias, setAlias] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAwaitingPlan, setIsAwaitingPlan] = useState(false);

  useEffect(() => {
    if (isAwaitingPlan && planType) {
      submitRegistration();
    }
  }, [planType, isAwaitingPlan]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!planType) {
      setIsAwaitingPlan(true);
      if (onShowPlans) onShowPlans();
      return;
    }
    submitRegistration();
  };

  const submitRegistration = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias, email, password, planType })
      });
      const data = await res.json();
      
      if (res.ok) {
        // Log in immediately after register
        const loginRes = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) login(loginData.token, loginData.user);
      } else {
        setError(data.error || 'Error al registrarse');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', backgroundColor: '#ecfdf5', borderRadius: '50%', marginBottom: '16px' }}>
            <UserPlus size={32} color="var(--success-color)" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px' }}>Crear una cuenta</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Únete para organizar tus compras</p>
        </div>

        {error && <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '8px', marginBottom: '24px', textAlign: 'center' }}>{error}</div>}
        {planType && (
          <div style={{ padding: '8px', backgroundColor: '#e0f2fe', color: '#0284c7', borderRadius: '8px', marginBottom: '16px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
            Plan seleccionado: {planType.toUpperCase()}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Nombre o Alias</label>
            <div style={{ position: 'relative' }}>
              <UserPlus size={20} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" value={alias} onChange={(e) => setAlias(e.target.value)} required className="input-field" style={{ paddingLeft: '40px' }} placeholder="Tu nombre" />
            </div>
          </div>
          <div>
            <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={20} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" style={{ paddingLeft: '40px' }} placeholder="tu@correo.com" />
            </div>
          </div>
          <div>
            <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={20} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" style={{ paddingLeft: '40px' }} placeholder="Mínimo 6 caracteres" minLength="6" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn" style={{ padding: '14px', justifyContent: 'center', marginTop: '8px', backgroundColor: planType ? 'var(--success-color)' : 'var(--accent-primary)', color: 'white', border: 'none' }}>
            {loading ? 'Registrando...' : (planType ? 'Registrarme' : 'Siguiente: Elegir Plan')}
            {!loading && (planType ? <ArrowRight size={20} /> : <List size={20} />)}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)' }}>
          ¿Ya tienes una cuenta?{' '}
          <button onClick={onSwitchToLogin} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: '600', cursor: 'pointer', padding: 0 }}>
            Inicia Sesión
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
