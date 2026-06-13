import React, { useState, useEffect, useContext } from 'react';
import { PackageSearch, Plus, Package, Edit2, Trash2, Check, X, Eye, EyeOff, Globe, User, Barcode, Camera, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import BarcodeScanner from './BarcodeScanner';
import { API_URL } from '../config';

const ProductsManager = ({ onReturn }) => {
  const { token, user } = useContext(AuthContext);
  const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  const getHeaders = { 'Authorization': `Bearer ${token}` };

  const canEditGlobal = user && (user.role === 'admin' || user.role === 'editor');

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  
  const [newName, setNewName] = useState('');
  const [newCategorySelect, setNewCategorySelect] = useState('');
  const [newSubcategorySelect, setNewSubcategorySelect] = useState('');
  const [isNewGlobal, setIsNewGlobal] = useState(false);
  const [suggestForGlobal, setSuggestForGlobal] = useState(false);
  const [newUpcCode, setNewUpcCode] = useState('');
  const [newPresentation, setNewPresentation] = useState('');
  const [hasIva, setHasIva] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [activeTab, setActiveTab] = useState('catalog');
  const [suggestions, setSuggestions] = useState([]);

  const [editingProduct, setEditingProduct] = useState(null);
  const [editName, setEditName] = useState('');
  const [editUpcCode, setEditUpcCode] = useState('');
  const [editPresentation, setEditPresentation] = useState('');

  const fetchData = async () => {
    try {
      const prodRes = await fetch(`${API_URL}/products`, { headers: getHeaders });
      const subRes = await fetch(`${API_URL}/subcategories`, { headers: getHeaders });
      const catRes = await fetch(`${API_URL}/categories`, { headers: getHeaders });
      if (prodRes.ok) setProducts(await prodRes.json());
      if (subRes.ok) setSubcategories(await subRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      
      if (canEditGlobal) {
        const sugRes = await fetch(`${API_URL}/products/suggestions`, { headers: getHeaders });
        if (sugRes.ok) setSuggestions(await sugRes.json());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const sortedProducts = React.useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  useEffect(() => {
    if (!newName) return;
    const match = sortedProducts.find(p => p.name.toLowerCase().startsWith(newName.toLowerCase()));
    if (match) {
      const el = document.getElementById(`product-${match.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [newName, sortedProducts]);

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleSearchUPC = async (upc) => {
    if (!upc) return;
    setIsSearching(true);
    try {
      const resLocal = await fetch(`${API_URL}/products/upc/${upc}`, { headers: getHeaders });
      if (resLocal.ok) {
        const prod = await resLocal.json();
        alert(`Este código ya pertenece al producto local: ${prod.name}`);
        setNewName(prod.name);
        setNewCategorySelect(prod.category_code);
        setNewSubcategorySelect(`${prod.category_code}|${prod.subcategory_code}`);
        setIsSearching(false);
        return;
      }
      
      const resExt = await fetch(`${API_URL}/external-upc/${upc}`, { headers: getHeaders });
      if (resExt.ok) {
        const data = await resExt.json();
        setNewName(data.name);
      } else {
        alert("No se encontró el producto en la base de datos pública. Por favor, ingresa el nombre manualmente.");
      }
    } catch (err) {
      console.error("Error buscando UPC:", err);
      alert("Error al conectar con la base de datos pública.");
    }
    setIsSearching(false);
  };

  const handleKeyDownUPC = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchUPC(e.target.value);
    }
  };

  const handleScanSuccess = (decodedText) => {
    setShowScanner(false);
    setNewUpcCode(decodedText);
    handleSearchUPC(decodedText);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newName || !newCategorySelect || !newSubcategorySelect) return;
    
    const [category_code, subcategory_code] = newSubcategorySelect.split('|');

    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ 
          name: newName, 
          category_code,
          subcategory_code,
          isGlobal: isNewGlobal,
          suggestForGlobal: suggestForGlobal,
          upc_code: newUpcCode,
          presentation: newPresentation,
          has_iva: hasIva
        })
      });
      if (res.ok) {
        setNewName('');
        setNewCategorySelect('');
        setNewSubcategorySelect('');
        setIsNewGlobal(false);
        setSuggestForGlobal(false);
        setNewUpcCode('');
        setNewPresentation('');
        setHasIva(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al agregar producto');
      }
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleUpdateProduct = async (id) => {
    if (!editName) return;
    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ name: editName, upc_code: editUpcCode, presentation: editPresentation })
      });
      if (res.ok) {
        setEditingProduct(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al actualizar producto');
      }
    } catch (error) { console.error('Error updating product:', error); }
  };

  const handleDeleteProduct = async (id) => {
    const isGlobal = !id.startsWith('USR-');
    if (!window.confirm(`¿Está seguro de eliminar este producto ${isGlobal ? 'GLOBAL' : 'personalizado'}?`)) return;
    try {
      const res = await fetch(`${API_URL}/products/${id}`, { 
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al eliminar producto');
      }
    } catch (error) { console.error('Error deleting product:', error); }
  };

  const handleToggleProductActive = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al modificar estado del producto');
      }
    } catch (error) { console.error('Error toggling product:', error); }
  };

  const handleApproveSuggestion = async (id) => {
    try {
      const res = await fetch(`${API_URL}/products/suggestions/${id}/approve`, { method: 'PUT', headers: authHeaders });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  const handleRejectSuggestion = async (id) => {
    try {
      const res = await fetch(`${API_URL}/products/suggestions/${id}/reject`, { method: 'PUT', headers: authHeaders });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      {onReturn && (
        <button onClick={onReturn} className="btn btn-outline" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px' }}>
          <ArrowLeft size={20} /> Volver a Principal
        </button>
      )}
      <div className="grid-1-2" style={{ alignItems: 'start' }}>
      {showScanner && <BarcodeScanner onScanSuccess={handleScanSuccess} onClose={() => setShowScanner(false)} />}
      
      {/* LEFT COLUMN: FORM */}
      <div className="card" style={{ padding: '24px', alignSelf: 'start', position: 'sticky', top: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
          <Plus size={24} style={{ color: 'var(--accent-primary)' }} />
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Agregar Producto {canEditGlobal && isNewGlobal ? 'Global' : 'Personalizado'}</h2>
        </div>
        
        <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="input-label" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Código de Barras (UPC)</span>
              {isSearching && <span style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 'bold' }}>Buscando...</span>}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={newUpcCode}
                onChange={(e) => setNewUpcCode(e.target.value)}
                onKeyDown={handleKeyDownUPC}
                placeholder="Escanea o escribe el UPC"
                className="input"
                style={{ flex: 1 }}
              />
              <button type="button" onClick={() => setShowScanner(true)} className="btn btn-outline" style={{ padding: '8px 12px' }} title="Escanear con cámara">
                <Camera size={20} />
              </button>
            </div>
          </div>
          
          <div>
            <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Nombre del producto</label>
            <input 
              type="text" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej. Leche de Almendras Marca X"
              className="input"
              required
            />
          </div>
          <div>
            <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Presentación (opcional)</label>
            <input 
              type="text" 
              value={newPresentation}
              onChange={(e) => setNewPresentation(e.target.value)}
              placeholder="Ej. Bolsa 1kg, Caja, Botella"
              className="input"
            />
          </div>
          <div>
            <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Categoría</label>
            <select 
              value={newCategorySelect}
              onChange={(e) => {
                setNewCategorySelect(e.target.value);
                setNewSubcategorySelect('');
              }}
              className="input"
              required
            >
              <option value="">-- Seleccione Categoría --</option>
              {categories.filter(c => c.is_active !== false).map(c => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Subcategoría</label>
            <select 
              value={newSubcategorySelect}
              onChange={(e) => setNewSubcategorySelect(e.target.value)}
              className="input"
              required
              disabled={!newCategorySelect}
            >
              <option value="">-- Seleccione Subcategoría --</option>
              {subcategories.filter(s => s.is_active !== false && s.category_code === newCategorySelect).map(s => (
                <option key={`${s.category_code}-${s.code}`} value={`${s.category_code}|${s.code}`}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}>
            <input type="checkbox" checked={hasIva} onChange={(e) => setHasIva(e.target.checked)} style={{ width: '18px', height: '18px' }} />
            Este artículo está sujeto a IVA
          </label>
          {canEditGlobal ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <input 
                type="checkbox" 
                id="isGlobal" 
                checked={isNewGlobal} 
                onChange={(e) => setIsNewGlobal(e.target.checked)} 
                style={{ width: '18px', height: '18px' }}
              />
              <label htmlFor="isGlobal" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                Hacer Global (Visible para todos)
              </label>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <input 
                type="checkbox" 
                id="suggestGlobal" 
                checked={suggestForGlobal} 
                onChange={(e) => setSuggestForGlobal(e.target.checked)} 
                style={{ width: '18px', height: '18px' }}
              />
              <label htmlFor="suggestGlobal" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                Sugerir para el catálogo global
              </label>
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', padding: '12px', justifyContent: 'center' }}>
            Añadir Producto
          </button>
        </form>
      </div>

      {/* RIGHT COLUMN: LIST */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <PackageSearch size={24} style={{ color: 'var(--text-primary)' }} />
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Catálogo de Productos</h2>
          </div>
          {canEditGlobal && (
            <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-color)', padding: '4px', borderRadius: '8px' }}>
              <button 
                className={`btn ${activeTab === 'catalog' ? 'btn-primary' : 'btn-outline'}`} 
                onClick={() => setActiveTab('catalog')}
                style={{ padding: '6px 12px', fontSize: '0.9rem', border: 'none' }}
              >
                Catálogo
              </button>
              <button 
                className={`btn ${activeTab === 'suggestions' ? 'btn-primary' : 'btn-outline'}`} 
                onClick={() => setActiveTab('suggestions')}
                style={{ padding: '6px 12px', fontSize: '0.9rem', border: 'none', position: 'relative' }}
              >
                Sugerencias
                {suggestions.length > 0 && (
                  <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger-color)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px' }}>
                    {suggestions.length}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: '0', maxHeight: '70vh', overflowY: 'auto' }}>
          {activeTab === 'catalog' ? (
            sortedProducts.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px', margin: 0 }}>
              No hay productos.
            </p>
          ) : (
            <ul className="item-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {sortedProducts.map((product) => {
                const isGlobal = !product.id.startsWith('USR-');
                return (
                  <li id={`product-${product.id}`} key={product.id} style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: product.is_active === false ? 0.5 : 1 }}>
                    {editingProduct === product.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, marginRight: '16px' }}>
                        <input type="text" value={editUpcCode} onChange={(e)=>setEditUpcCode(e.target.value)} placeholder="UPC" className="input" />
                        <input type="text" value={editName} onChange={(e)=>setEditName(e.target.value)} placeholder="Nombre" className="input" />
                        <input type="text" value={editPresentation} onChange={(e)=>setEditPresentation(e.target.value)} placeholder="Presentación" className="input" />
                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                          <button onClick={() => handleUpdateProduct(product.id)} className="btn btn-primary" style={{ padding: '6px', flex: 1 }}><Check size={16} /> Guardar</button>
                          <button onClick={() => setEditingProduct(null)} className="btn btn-outline" style={{ padding: '6px' }}><X size={16} /></button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div 
                          style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', flex: 1 }}
                          onClick={() => {
                            setNewName(product.name);
                            setNewCategorySelect(product.category_code);
                            setNewSubcategorySelect(`${product.category_code}|${product.subcategory_code}`);
                            setNewUpcCode(product.upc_code || '');
                            setNewPresentation(product.presentation || '');
                            setHasIva(!!product.has_iva);
                          }}
                          title="Click para usar esta información en el formulario"
                        >
                          <div style={{ 
                            padding: '8px', 
                            borderRadius: '8px', 
                            backgroundColor: isGlobal ? '#f0fdf4' : '#eff6ff',
                            color: isGlobal ? '#16a34a' : '#2563eb'
                          }}>
                            {isGlobal ? <Globe size={20} /> : <User size={20} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: '500', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {product.name} {product.presentation && <span style={{ fontWeight: 'normal', color: 'var(--text-secondary)' }}>- {product.presentation}</span>}
                              {isGlobal && <span style={{ fontSize: '0.7rem', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>GLOBAL</span>}
                              {product.has_iva && <span style={{fontSize: '0.7rem', color: '#f59e0b', background: '#fef3c7', padding: '2px 4px', borderRadius: '4px'}}>IVA</span>}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                              <span>Cat: {product.category_name} &gt; {product.subcategory_name}</span>
                              {product.upc_code && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}><Barcode size={12} /> {product.upc_code}</span>}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          {(!isGlobal || canEditGlobal) && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button onClick={() => handleToggleProductActive(product.id, product.is_active !== false)} className="btn btn-outline" style={{ padding: '6px' }} title={product.is_active !== false ? "Desactivar" : "Activar"}>
                                {product.is_active !== false ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                              <button onClick={() => { setEditingProduct(product.id); setEditName(product.name); setEditUpcCode(product.upc_code || ''); setEditPresentation(product.presentation || ''); }} className="btn btn-outline" style={{ padding: '6px' }} title="Editar"><Edit2 size={16} /></button>
                              <button onClick={() => handleDeleteProduct(product.id)} className="btn btn-outline" style={{ padding: '6px', color: '#ef4444', borderColor: '#fee2e2' }} title="Eliminar"><Trash2 size={16} /></button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )) : (
            <ul className="item-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {suggestions.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px', margin: 0 }}>
                  No hay sugerencias pendientes.
                </p>
              ) : (
                suggestions.map(s => (
                  <li key={s.id} style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '1.05rem' }}>{s.name} {s.presentation && `- ${s.presentation}`}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Sugerido por: {s.suggested_by} | Cat: {s.category_name} &gt; {s.subcategory_name}
                      </div>
                      {s.upc_code && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>UPC: {s.upc_code}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleApproveSuggestion(s.id)} className="btn btn-success" style={{ padding: '8px 12px', fontSize: '0.9rem' }}>Aprobar</button>
                      <button onClick={() => handleRejectSuggestion(s.id)} className="btn btn-danger" style={{ padding: '8px 12px', fontSize: '0.9rem' }}>Rechazar</button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default ProductsManager;
