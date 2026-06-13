import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Users, UserPlus, Trash2, Mail, ArrowLeft } from 'lucide-react';
import { API_URL } from '../config';

const FamilyManager = ({ onReturn }) => {
  const { token, user } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const maxMembers = 5;

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch(`${API_URL}/family`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (members.length >= maxMembers) {
      setError('Has alcanzado el límite de familiares permitidos (5).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/family`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setEmail('');
        setPassword('');
        fetchMembers();
      } else {
        setError(data.error || 'Error al agregar familiar');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas remover a este familiar?')) return;
    try {
      const res = await fetch(`${API_URL}/family/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchMembers();
      } else {
        alert('Error al remover familiar');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {onReturn && (
        <button onClick={onReturn} className="btn btn-outline" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px' }}>
          <ArrowLeft size={20} /> Volver a Principal
        </button>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Users size={28} style={{ color: 'var(--accent-primary)' }} />
        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Mi Grupo Familiar</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
          {/* Panel Izquierdo: Agregar Familiar */}
          <div className="card" style={{ height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={20} /> Agregar Familiar
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Cupos utilizados: {members.length} / {maxMembers}
            </p>
            
            <form onSubmit={handleAddMember}>
              <div className="input-group">
                <label className="input-label">Correo del Familiar</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  placeholder="familiar@ejemplo.com"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Contraseña Temporal</label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  placeholder="******"
                />
              </div>
              {error && <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</p>}
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%' }} 
                disabled={loading || members.length >= maxMembers}
              >
                {loading ? 'Creando...' : 'Crear Cuenta Familiar'}
              </button>
            </form>
          </div>

          {/* Panel Derecho: Lista de Familiares */}
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Cuentas Activas</h3>
            {members.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No has agregado a ningún familiar todavía.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {members.map(member => (
                  <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ backgroundColor: '#e2e8f0', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Mail size={20} color="var(--text-secondary)" />
                      </div>
                      <div>
                        <div style={{ fontWeight: '600' }}>{member.email}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Agregado el {new Date(member.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(member.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)', padding: '8px' }}
                      title="Remover Familiar"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyManager;
