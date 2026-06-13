import React, { useState, useEffect, useContext } from 'react';
import { Layers, Plus, Edit2, Trash2, Check, X, Eye, EyeOff, ListTree, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';

const CategoriesManager = ({ onReturn }) => {
  const { token, user } = useContext(AuthContext);
  const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  const getHeaders = { 'Authorization': `Bearer ${token}` };

  const canEdit = user && (user.role === 'admin' || user.role === 'editor');

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  
  const [newCatCode, setNewCatCode] = useState('');
  const [newCatName, setNewCatName] = useState('');
  
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [selectedCatCode, setSelectedCatCode] = useState('');
  const [filterCategoryCode, setFilterCategoryCode] = useState(null);

  useEffect(() => {
    if (filterCategoryCode) {
      setSelectedCatCode(filterCategoryCode);
    }
  }, [filterCategoryCode]);

  const [editingCategory, setEditingCategory] = useState(null);
  const [editCatName, setEditCatName] = useState('');

  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [editSubName, setEditSubName] = useState('');

  const fetchData = async () => {
    try {
      const catRes = await fetch(`${API_URL}/categories`, { headers: getHeaders });
      const subRes = await fetch(`${API_URL}/subcategories`, { headers: getHeaders });
      if (catRes.ok) setCategories(await catRes.json());
      if (subRes.ok) setSubcategories(await subRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatCode || !newCatName) return;
    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ code: newCatCode.toUpperCase(), name: newCatName })
      });
      if (res.ok) {
        setNewCatCode('');
        setNewCatName('');
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al agregar categoría.');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Error de conexión al servidor.');
    }
  };

  const handleAddSubcategory = async (e) => {
    e.preventDefault();
    const targetCatCode = filterCategoryCode || selectedCatCode;
    if (!newSubCode || !newSubName || !targetCatCode) return;
    try {
      const res = await fetch(`${API_URL}/subcategories`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ code: newSubCode.toUpperCase(), name: newSubName, category_code: targetCatCode })
      });
      if (res.ok) {
        setNewSubCode('');
        setNewSubName('');
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al agregar subcategoría.');
      }
    } catch (error) {
      console.error('Error adding subcategory:', error);
      alert('Error de conexión al servidor.');
    }
  };

  const handleUpdateCategory = async (code) => {
    if (!editCatName) return;
    try {
      const res = await fetch(`${API_URL}/categories/${code}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ name: editCatName })
      });
      if (res.ok) {
        setEditingCategory(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = async (code) => {
    const hasActiveSubcategories = subcategories.some(s => s.category_code === code && s.is_active !== false);
    if (hasActiveSubcategories) {
      alert('No se puede eliminar la categoría porque tiene subcategorías activas.');
      return;
    }

    if (!window.confirm('¿Está seguro de eliminar esta categoría y todas sus subcategorías inactivas?')) return;
    
    try {
      const res = await fetch(`${API_URL}/categories/${code}`, { 
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al eliminar la categoría.');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleToggleCategoryActive = async (code, currentStatus) => {
    try {
      const res = await fetch(`${API_URL}/categories/${code}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (res.ok) fetchData();
    } catch (error) { console.error('Error toggling category:', error); }
  };

  const handleToggleSubcategoryActive = async (code, category_code, currentStatus) => {
    try {
      const res = await fetch(`${API_URL}/subcategories/${category_code}/${code}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (res.ok) fetchData();
    } catch (error) { console.error('Error toggling subcategory:', error); }
  };

  const handleUpdateSubcategory = async (code, old_category_code) => {
    if (!editSubName) return;
    try {
      const res = await fetch(`${API_URL}/subcategories/${old_category_code}/${code}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ name: editSubName })
      });
      if (res.ok) {
        setEditingSubcategory(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating subcategory:', error);
    }
  };

  const handleDeleteSubcategory = async (code, category_code) => {
    if (!window.confirm('¿Está seguro de eliminar esta subcategoría?')) return;
    try {
      const res = await fetch(`${API_URL}/subcategories/${category_code}/${code}`, { 
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Error deleting subcategory:', error);
    }
  };

  return (
    <div>
      {onReturn && (
        <button onClick={onReturn} className="btn btn-outline" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px' }}>
          <ArrowLeft size={20} /> Volver a Principal
        </button>
      )}
      <div className="grid-1-2">
        {/* Categorías */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
            <Layers size={24} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Catálogo Global de Categorías</h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {canEdit ? 'Tienes permisos para administrar las categorías.' : 'Estas categorías son administradas por el sistema.'}
              </p>
            </div>
          </div>
        </div>
        
        {canEdit && (
          <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <input type="text" value={newCatCode} onChange={(e)=>setNewCatCode(e.target.value)} placeholder="Cód (ej. LAC)" className="input" style={{ width: '100px' }} maxLength="5" />
            <input type="text" value={newCatName} onChange={(e)=>setNewCatName(e.target.value)} placeholder="Nombre Categoría" className="input" style={{ flex: 1 }} />
            <button type="submit" className="btn btn-primary"><Plus size={18} /></button>
          </form>
        )}

        <div style={{ display: 'grid', gap: '8px' }}>
          {categories.map(c => (
            <div key={c.code} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: c.is_active === false ? 0.5 : 1 }}>
              {editingCategory === c.code && canEdit ? (
                <>
                  <input type="text" value={editCatName} onChange={(e)=>setEditCatName(e.target.value)} className="input" style={{ flex: 1, marginRight: '8px' }} />
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => handleUpdateCategory(c.code)} className="btn btn-primary" style={{ padding: '6px' }}><Check size={16} /></button>
                    <button onClick={() => setEditingCategory(null)} className="btn btn-outline" style={{ padding: '6px' }}><X size={16} /></button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span style={{ fontWeight: '500' }}>{c.name}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: '8px' }}>({c.code})</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => setFilterCategoryCode(filterCategoryCode === c.code ? null : c.code)} className={`btn ${filterCategoryCode === c.code ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '6px' }} title={filterCategoryCode === c.code ? "Ocultar subcategorías" : "Ver subcategorías"}>
                      <ListTree size={16} />
                    </button>
                    {canEdit && (
                      <>
                        <button onClick={() => handleToggleCategoryActive(c.code, c.is_active !== false)} className="btn btn-outline" style={{ padding: '6px' }} title={c.is_active !== false ? "Desactivar" : "Activar"}>
                          {c.is_active !== false ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button onClick={() => { setEditingCategory(c.code); setEditCatName(c.name); }} className="btn btn-outline" style={{ padding: '6px' }} title="Editar"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteCategory(c.code)} className="btn btn-outline" style={{ padding: '6px', color: '#ef4444', borderColor: '#fee2e2' }} title="Eliminar"><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Subcategorías */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
          <Layers size={24} style={{ color: 'var(--accent-secondary)' }} />
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
            {filterCategoryCode 
              ? `Subcategorías de ${categories.find(c => c.code === filterCategoryCode)?.name || filterCategoryCode}`
              : 'Subcategorías'}
          </h2>
          {filterCategoryCode && (
            <button onClick={() => setFilterCategoryCode(null)} className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
              <ArrowLeft size={14} /> Volver
            </button>
          )}
        </div>
        
        {!filterCategoryCode ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
            <Layers size={48} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block' }} />
            <p style={{ margin: 0 }}>Selecciona una categoría de la lista para ver sus subcategorías globales.</p>
          </div>
        ) : (
          <>
            {canEdit && (
              <form onSubmit={handleAddSubcategory} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                <select value={filterCategoryCode || selectedCatCode} onChange={(e)=>setSelectedCatCode(e.target.value)} className="input" disabled={!!filterCategoryCode}>
                  <option value="">Seleccione Categoría</option>
                  {categories.filter(c => c.is_active !== false).map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" value={newSubCode} onChange={(e)=>setNewSubCode(e.target.value)} placeholder="Cód (ej. QUE)" className="input" style={{ width: '100px' }} maxLength="5" />
                  <input type="text" value={newSubName} onChange={(e)=>setNewSubName(e.target.value)} placeholder="Nombre Subcategoría" className="input" style={{ flex: 1 }} />
                  <button type="submit" className="btn btn-primary"><Plus size={18} /></button>
                </div>
              </form>
            )}

            <div style={{ display: 'grid', gap: '8px' }}>
              {subcategories.filter(s => s.category_code === filterCategoryCode).map(s => {
                const cat = categories.find(c => c.code === s.category_code);
                return (
                  <div key={`${s.category_code}-${s.code}`} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: s.is_active === false ? 0.5 : 1 }}>
                    {editingSubcategory === s.code && canEdit ? (
                      <>
                        <div style={{ display: 'flex', gap: '8px', flex: 1, marginRight: '8px' }}>
                          <input type="text" value={editSubName} onChange={(e)=>setEditSubName(e.target.value)} className="input" style={{ flex: 1 }} />
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => handleUpdateSubcategory(s.code, s.category_code)} className="btn btn-primary" style={{ padding: '6px' }}><Check size={16} /></button>
                          <button onClick={() => setEditingSubcategory(null)} className="btn btn-outline" style={{ padding: '6px' }}><X size={16} /></button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <div style={{ fontWeight: '500' }}>{s.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Categoría: {cat?.name || s.category_code} ({s.code})</div>
                        </div>
                        {canEdit && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => handleToggleSubcategoryActive(s.code, s.category_code, s.is_active !== false)} className="btn btn-outline" style={{ padding: '6px' }} title={s.is_active !== false ? "Desactivar" : "Activar"}>
                              {s.is_active !== false ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button onClick={() => { setEditingSubcategory(s.code); setEditSubName(s.name); }} className="btn btn-outline" style={{ padding: '6px' }} title="Editar"><Edit2 size={16} /></button>
                            <button onClick={() => handleDeleteSubcategory(s.code, s.category_code)} className="btn btn-outline" style={{ padding: '6px', color: '#ef4444', borderColor: '#fee2e2' }} title="Eliminar"><Trash2 size={16} /></button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
              {subcategories.filter(s => s.category_code === filterCategoryCode).length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>No hay subcategorías.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
    </div>
  );
};

export default CategoriesManager;
