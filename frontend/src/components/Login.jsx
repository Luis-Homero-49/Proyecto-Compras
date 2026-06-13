import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { API_URL } from '../config';

const Login = ({ onSwitchToRegister, onSwitchToForgot }) => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        login(data.token, data.user);
      } else {
        setError(data.error || 'Error al iniciar sesión');
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
          <div style={{ display: 'inline-flex', padding: '16px', backgroundColor: '#eef2ff', borderRadius: '50%', marginBottom: '16px' }}>
            <Lock size={32} color="var(--accent-primary)" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px' }}>Bienvenido de nuevo</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Ingresa tus credenciales para acceder</p>
        </div>

        {error && <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '8px', marginBottom: '24px', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={20} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input" style={{ paddingLeft: '40px' }} placeholder="tu@correo.com" />
            </div>
          </div>
          <div>
            <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={20} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input" style={{ paddingLeft: '40px' }} placeholder="••••••••" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '14px', justifyContent: 'center', marginTop: '8px' }}>
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)' }}>
          ¿Olvidaste tu contraseña?{' '}
          <button onClick={onSwitchToForgot} type="button" style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: '600', cursor: 'pointer', padding: 0 }}>
            Recupérala aquí
          </button>
        </p>

        <p style={{ textAlign: 'center', marginTop: '8px', color: 'var(--text-secondary)' }}>
          ¿No tienes una cuenta?{' '}
          <button onClick={onSwitchToRegister} type="button" style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: '600', cursor: 'pointer', padding: 0 }}>
            Regístrate
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
