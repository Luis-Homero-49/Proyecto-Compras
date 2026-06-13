import React, { useState, useEffect, useContext } from 'react';
import { Users, UserPlus, Trash2, Edit2, Check, X, Shield, ShieldAlert, ArrowLeft, User, Plus } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';

const UsersManager = ({ onReturn }) => {
  const { token, user } = useContext(AuthContext);
  const getHeaders = { 'Authorization': `Bearer ${token}` };
  const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [usersList, setUsersList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/users`, { headers: getHeaders });
      if (res.ok) {
        setUsersList(await res.json());
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user, token]);

  const handleUpdateRole = async (id) => {
    try {
      const res = await fetch(`${API_URL}/users/${id}/role`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ role: selectedRole })
      });
      if (res.ok) {
        setEditingId(null);
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al actualizar el rol');
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API_URL}/users/${id}/active`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al cambiar estado');
      }
    } catch (error) {
      console.error('Error toggling active:', error);
    }
  };

  const handleDeleteUser = async (id) => {
    if (id === user.id) {
      alert('No puedes eliminar tu propia cuenta.');
      return;
    }
    if (!window.confirm('¿Está seguro de eliminar este usuario? Esto eliminará todos sus datos.')) return;
    try {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole })
      });
      if (res.ok) {
        setNewEmail('');
        setNewPassword('');
        setNewRole('user');
        setShowAddForm(false);
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al crear usuario');
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--danger-color)' }}>
        <h2>Acceso Denegado</h2>
        <p>No tienes los permisos necesarios para ver esta sección.</p>
      </div>
    );
  }

  return (
    <div>
      {onReturn && (
        <button onClick={onReturn} className="btn btn-outline" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px' }}>
          <ArrowLeft size={20} /> Volver a Principal
        </button>
      )}
      <div className="card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Users size={24} style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Gestión de Usuarios</h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Administra los niveles de acceso de los usuarios registrados.
            </p>
          </div>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {showAddForm ? <X size={16} /> : <Plus size={16} />}
          {showAddForm ? 'Cancelar' : 'Añadir Usuario'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px' }}>
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Correo electrónico" className="input" style={{ flex: 1 }} required />
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Contraseña" className="input" style={{ flex: 1 }} required />
          <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="input">
            <option value="user">Usuario</option>
            <option value="editor">Editor</option>
            <option value="admin">Administrador</option>
          </select>
          <button type="submit" className="btn btn-primary">Guardar</button>
        </form>
      )}

      <div style={{ display: 'grid', gap: '0' }}>
        <ul className="item-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {usersList.map((u) => (
            <li key={u.id} style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: u.is_active === false ? 0.5 : 1 }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                  {u.role === 'admin' ? <Shield size={20} color="var(--accent-primary)" /> : <User size={20} />}
                </div>
                <div>
                  <div style={{ fontWeight: '500', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {u.email}
                    {u.id === user.id && <span style={{ fontSize: '0.7rem', backgroundColor: '#eff6ff', color: '#2563eb', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>TÚ</span>}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Registrado el: {new Date(u.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {editingId === u.id ? (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <select 
                      value={selectedRole} 
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="input"
                      style={{ padding: '6px 12px' }}
                    >
                      <option value="user">Usuario (user)</option>
                      <option value="editor">Editor de Catálogo (editor)</option>
                      <option value="admin">Administrador (admin)</option>
                    </select>
                    <button onClick={() => handleUpdateRole(u.id)} className="btn btn-primary" style={{ padding: '6px' }}><Check size={16} /></button>
                    <button onClick={() => setEditingId(null)} className="btn btn-outline" style={{ padding: '6px' }}><X size={16} /></button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: '600', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      backgroundColor: u.role === 'admin' ? '#f0fdf4' : u.role === 'editor' ? '#fffbeb' : '#f1f5f9',
                      color: u.role === 'admin' ? '#16a34a' : u.role === 'editor' ? '#d97706' : '#475569'
                    }}>
                      {u.role.toUpperCase()}
                    </span>
                    {u.id !== user.id && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => handleToggleActive(u.id, u.is_active !== false)} className="btn btn-outline" style={{ padding: '6px' }} title={u.is_active !== false ? "Desactivar Usuario" : "Activar Usuario"}>
                          {u.is_active !== false ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button onClick={() => { setEditingId(u.id); setSelectedRole(u.role); }} className="btn btn-outline" style={{ padding: '6px' }} title="Cambiar Rol">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteUser(u.id)} className="btn btn-outline" style={{ padding: '6px', color: '#ef4444', borderColor: '#fee2e2' }} title="Eliminar Usuario">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </li>
          ))}
        </ul>
      </div>
      </div>
    </div>
  );
};

export default UsersManager;
