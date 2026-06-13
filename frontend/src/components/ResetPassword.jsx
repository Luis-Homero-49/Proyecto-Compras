import React, { useState } from 'react';
import { Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { API_URL } from '../config';

const ResetPassword = ({ onSwitchToLogin }) => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage('¡Contraseña actualizada exitosamente! Ahora puedes iniciar sesión.');
      } else {
        setError(data.error || 'Error al actualizar contraseña');
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
        <button onClick={onSwitchToLogin} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '24px', padding: 0 }}>
          <ArrowLeft size={16} /> Volver al Login
        </button>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px' }}>Nueva Contraseña</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Ingresa el código que recibiste y tu nueva contraseña.</p>
        </div>

        {error && <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '8px', marginBottom: '24px', textAlign: 'center' }}>{error}</div>}
        {message && <div style={{ padding: '12px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '24px', textAlign: 'center' }}>{message}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Código de Recuperación</label>
            <input 
              type="text" 
              value={token} 
              onChange={(e) => setToken(e.target.value)} 
              required 
              className="input" 
              placeholder="Ej. abc123def456..." 
            />
          </div>
          <div>
            <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Nueva Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={20} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
                className="input" 
                style={{ paddingLeft: '40px' }} 
                placeholder="••••••••" 
              />
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '14px', justifyContent: 'center', marginTop: '8px' }}>
            {loading ? 'Actualizando...' : 'Cambiar contraseña'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
