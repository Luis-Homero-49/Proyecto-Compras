import React, { useState, useEffect, useContext } from 'react';
import { Store, Plus, Edit2, Trash2, Check, X, Eye, EyeOff, MapPin, Phone, Mail, AtSign, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';

const DynamicArrayInput = ({ items, setItems, placeholder, icon: Icon }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    {items.map((item, index) => (
      <div key={index} style={{ display: 'flex', gap: '8px' }}>
        {Icon && <Icon size={18} style={{ alignSelf: 'center', color: 'var(--text-secondary)' }} />}
        <input 
          type="text" 
          value={item} 
          onChange={(e) => {
            const newItems = [...items];
            newItems[index] = e.target.value;
            setItems(newItems);
          }} 
          placeholder={placeholder} 
          className="input" 
          style={{ flex: 1 }}
          autoFocus={item === '' && index === items.length - 1}
        />
        <button type="button" onClick={() => setItems(items.filter((_, i) => i !== index))} className="btn btn-outline" style={{ padding: '6px', color: '#ef4444', borderColor: '#fee2e2' }} title="Eliminar">
          <Trash2 size={16} />
        </button>
      </div>
    ))}
    <button type="button" onClick={() => setItems([...items, ''])} className="btn btn-outline" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
      <Plus size={14} /> Añadir {placeholder}
    </button>
  </div>
);

const ComerciosManager = ({ onReturn }) => {
  const { token } = useContext(AuthContext);
  const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  const getHeaders = { 'Authorization': `Bearer ${token}` };

  const [comercios, setComercios] = useState([]);
  const [expandedComercio, setExpandedComercio] = useState(null);
  
  // New Comercio State
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [newComercioName, setNewComercioName] = useState('');
  const [newComercioAddress, setNewComercioAddress] = useState('');
  const [newComercioPhones, setNewComercioPhones] = useState([]);
  const [newComercioEmails, setNewComercioEmails] = useState([]);
  const [newComercioSocial, setNewComercioSocial] = useState([]);

  // Editing Comercio State
  const [editingComercio, setEditingComercio] = useState(null);
  const [editComercioName, setEditComercioName] = useState('');
  const [editComercioAddress, setEditComercioAddress] = useState('');
  const [editComercioPhones, setEditComercioPhones] = useState([]);
  const [editComercioEmails, setEditComercioEmails] = useState([]);
  const [editComercioSocial, setEditComercioSocial] = useState([]);

  const fetchComercios = async () => {
    try {
      const res = await fetch(`${API_URL}/comercios`, { headers: getHeaders });
      if (res.ok) {
        const data = await res.json();
        // Parse JSON fields from DB
        setComercios(data.map(c => ({
          ...c,
          phones: typeof c.phones === 'string' ? JSON.parse(c.phones) : (c.phones || []),
          emails: typeof c.emails === 'string' ? JSON.parse(c.emails) : (c.emails || []),
          social_media: typeof c.social_media === 'string' ? JSON.parse(c.social_media) : (c.social_media || [])
        })));
      }
    } catch (error) {
      console.error('Error fetching comercios:', error);
    }
  };

  useEffect(() => {
    fetchComercios();
  }, [token]);

  const handleAddComercio = async (e) => {
    e.preventDefault();
    if (!newComercioName.trim()) return;

    try {
      const res = await fetch(`${API_URL}/comercios`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ 
          name: newComercioName.trim(),
          address: newComercioAddress.trim() || undefined,
          phones: newComercioPhones.filter(p => p.trim()),
          emails: newComercioEmails.filter(em => em.trim()),
          social_media: newComercioSocial.filter(sm => sm.trim())
        })
      });
      if (res.ok) {
        setNewComercioName('');
        setNewComercioAddress('');
        setNewComercioPhones([]);
        setNewComercioEmails([]);
        setNewComercioSocial([]);
        setIsAddingMode(false);
        fetchComercios();
      }
    } catch (error) {
      console.error('Error adding comercio:', error);
    }
  };

  const handleUpdateComercio = async (id) => {
    if (!editComercioName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/comercios/${id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ 
          name: editComercioName.trim(),
          address: editComercioAddress.trim() || null,
          phones: editComercioPhones.filter(p => p.trim()),
          emails: editComercioEmails.filter(em => em.trim()),
          social_media: editComercioSocial.filter(sm => sm.trim())
        })
      });
      if (res.ok) {
        setEditingComercio(null);
        fetchComercios();
      }
    } catch (error) {
      console.error('Error updating comercio:', error);
    }
  };

  const handleDeleteComercio = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este comercio?')) return;
    try {
      const res = await fetch(`${API_URL}/comercios/${id}`, { 
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) fetchComercios();
    } catch (error) {
      console.error('Error deleting comercio:', error);
    }
  };

  const handleToggleComercioActive = async (comercio) => {
    try {
      const res = await fetch(`${API_URL}/comercios/${comercio.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ is_active: comercio.is_active === false ? true : false })
      });
      if (res.ok) fetchComercios();
    } catch (error) { console.error('Error toggling comercio:', error); }
  };

  const startEditing = (comercio) => {
    setEditingComercio(comercio.id);
    setEditComercioName(comercio.name);
    setEditComercioAddress(comercio.address || '');
    setEditComercioPhones(comercio.phones || []);
    setEditComercioEmails(comercio.emails || []);
    setEditComercioSocial(comercio.social_media || []);
  };

  return (
    <div>
      {onReturn && (
        <button onClick={onReturn} className="btn btn-outline" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px' }}>
          <ArrowLeft size={20} /> Volver a Principal
        </button>
      )}
      <div className="card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Store size={32} style={{ color: 'var(--accent-primary)' }} />
          <h2 style={{ margin: 0 }}>Gestión de Comercios</h2>
        </div>
        {!isAddingMode && (
          <button onClick={() => setIsAddingMode(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            Añadir Comercio
          </button>
        )}
      </div>

      {isAddingMode && (
        <form onSubmit={handleAddComercio} style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px', marginBottom: '32px', display: 'grid', gap: '16px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>Nuevo Comercio</h3>
          
          <div>
            <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Nombre del Comercio *</label>
            <input 
              type="text" 
              value={newComercioName}
              onChange={(e) => setNewComercioName(e.target.value)}
              placeholder="Ej. Supermercado Central"
              className="input"
              required
            />
          </div>

          <div>
            <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Dirección (Opcional)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <MapPin size={18} style={{ alignSelf: 'center', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                value={newComercioAddress}
                onChange={(e) => setNewComercioAddress(e.target.value)}
                placeholder="Ubicación física"
                className="input"
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div>
              <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Teléfonos</label>
              <DynamicArrayInput items={newComercioPhones} setItems={setNewComercioPhones} placeholder="Teléfono" icon={Phone} />
            </div>
            <div>
              <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Correos</label>
              <DynamicArrayInput items={newComercioEmails} setItems={setNewComercioEmails} placeholder="Correo" icon={Mail} />
            </div>
            <div>
              <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Redes Sociales</label>
              <DynamicArrayInput items={newComercioSocial} setItems={setNewComercioSocial} placeholder="Usuario / Enlace" icon={AtSign} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setIsAddingMode(false)} className="btn btn-outline">Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Comercio</button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gap: '16px' }}>
        {comercios.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
            No hay comercios registrados aún.
          </p>
        ) : (
          comercios.map((comercio) => (
            <div key={comercio.id} style={{ background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden', opacity: comercio.is_active === false ? 0.6 : 1 }}>
              {editingComercio === comercio.id ? (
                <div style={{ padding: '20px', display: 'grid', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Editar Comercio</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleUpdateComercio(comercio.id)} className="btn btn-primary" style={{ padding: '6px 12px', display: 'flex', gap: '4px', alignItems: 'center' }}><Check size={16} /> Guardar</button>
                      <button onClick={() => setEditingComercio(null)} className="btn btn-outline" style={{ padding: '6px 12px', display: 'flex', gap: '4px', alignItems: 'center' }}><X size={16} /> Cancelar</button>
                    </div>
                  </div>

                  <div>
                    <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Nombre</label>
                    <input type="text" value={editComercioName} onChange={(e)=>setEditComercioName(e.target.value)} className="input" />
                  </div>

                  <div>
                    <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Dirección</label>
                    <input type="text" value={editComercioAddress} onChange={(e)=>setEditComercioAddress(e.target.value)} className="input" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                    <div>
                      <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Teléfonos</label>
                      <DynamicArrayInput items={editComercioPhones} setItems={setEditComercioPhones} placeholder="Teléfono" icon={Phone} />
                    </div>
                    <div>
                      <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Correos</label>
                      <DynamicArrayInput items={editComercioEmails} setItems={setEditComercioEmails} placeholder="Correo" icon={Mail} />
                    </div>
                    <div>
                      <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Redes Sociales</label>
                      <DynamicArrayInput items={editComercioSocial} setItems={setEditComercioSocial} placeholder="Usuario / Enlace" icon={AtSign} />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header Row */}
                  <div 
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', cursor: 'pointer' }}
                    onClick={() => setExpandedComercio(expandedComercio === comercio.id ? null : comercio.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Store size={20} style={{ color: 'var(--text-secondary)' }} />
                      <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{comercio.name}</span>
                      {(!comercio.address && (!comercio.phones || comercio.phones.length === 0) && (!comercio.emails || comercio.emails.length === 0) && (!comercio.social_media || comercio.social_media.length === 0)) ? null : (
                        <span style={{ fontSize: '0.8rem', background: 'var(--accent-primary)', color: 'white', padding: '2px 6px', borderRadius: '12px' }}>Info extra</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleToggleComercioActive(comercio)} className="btn btn-outline" style={{ padding: '6px' }} title={comercio.is_active !== false ? "Desactivar" : "Activar"}>
                        {comercio.is_active !== false ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button onClick={() => startEditing(comercio)} className="btn btn-outline" style={{ padding: '6px' }} title="Editar"><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteComercio(comercio.id)} className="btn btn-outline" style={{ padding: '6px', color: '#ef4444', borderColor: '#fee2e2' }} title="Eliminar"><Trash2 size={16} /></button>
                      <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 4px' }} />
                      <button onClick={() => setExpandedComercio(expandedComercio === comercio.id ? null : comercio.id)} className="btn btn-outline" style={{ padding: '6px', border: 'none', background: 'transparent' }}>
                        {expandedComercio === comercio.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedComercio === comercio.id && (
                    <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid var(--border-color)', marginTop: '4px', paddingTop: '16px', display: 'grid', gap: '12px' }}>
                      {comercio.address && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <MapPin size={18} style={{ color: 'var(--text-secondary)', marginTop: '2px' }} />
                          <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Dirección</div>
                            <div>{comercio.address}</div>
                          </div>
                        </div>
                      )}

                      {comercio.phones && comercio.phones.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <Phone size={18} style={{ color: 'var(--text-secondary)', marginTop: '2px' }} />
                          <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Teléfonos</div>
                            {comercio.phones.map((p, i) => <div key={i}>{p}</div>)}
                          </div>
                        </div>
                      )}

                      {comercio.emails && comercio.emails.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <Mail size={18} style={{ color: 'var(--text-secondary)', marginTop: '2px' }} />
                          <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Correos</div>
                            {comercio.emails.map((e, i) => <div key={i}><a href={`mailto:${e}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>{e}</a></div>)}
                          </div>
                        </div>
                      )}

                      {comercio.social_media && comercio.social_media.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <AtSign size={18} style={{ color: 'var(--text-secondary)', marginTop: '2px' }} />
                          <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Redes Sociales</div>
                            {comercio.social_media.map((s, i) => <div key={i}>{s}</div>)}
                          </div>
                        </div>
                      )}

                      {(!comercio.address && (!comercio.phones || comercio.phones.length === 0) && (!comercio.emails || comercio.emails.length === 0) && (!comercio.social_media || comercio.social_media.length === 0)) && (
                        <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                          No hay información de contacto adicional para este comercio.
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
      </div>
    </div>
  );
};

export default ComerciosManager;
