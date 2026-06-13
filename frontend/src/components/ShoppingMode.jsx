import React, { useState, useEffect, useContext } from 'react';
import { ShoppingCart, Plus, CheckCircle, Circle, Trash2, Edit2, Check, Camera, PlusCircle, ShoppingBag, ChevronRight, Store as StoreIcon, ArrowLeft, Wallet, Calculator, X, Search, CreditCard, Play, Pause, DollarSign, ChevronDown, ChevronUp, MapPin, Calendar } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { SettingsContext } from '../context/SettingsContext';
import { LanguageContext } from '../context/LanguageContext';
import BarcodeScanner from './BarcodeScanner';

import { API_URL } from '../config';

const ShoppingMode = ({ onReturn }) => {
  const { token } = useContext(AuthContext);
  const { t, formatCurrency, formatQuantity } = useContext(LanguageContext);
  const { settings, extractIVA, toDisplayValue, toBaseValue } = useContext(SettingsContext);
  const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  const getHeaders = { 'Authorization': `Bearer ${token}` };

  const [view, setView] = useState('setup'); // 'setup', 'budgets', 'planning', 'store'
  const [budgets, setBudgets] = useState([]);
  
  // Shopping Session State
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [availableAmount, setAvailableAmount] = useState('');
  const [globalStoreId, setGlobalStoreId] = useState('');

  // Shopping List State
  const [items, setItems] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [comercios, setComercios] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  
  // --- PLANNING STATE ---
  const [selectedProductId, setSelectedProductId] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [estimatedQuantity, setEstimatedQuantity] = useState('1');
  const [planningEditId, setPlanningEditId] = useState(null);
  const [planningEditPrice, setPlanningEditPrice] = useState('');
  const [planningEditQty, setPlanningEditQty] = useState('');

  // --- STORE EXECUTION STATE ---
  const [storeEditId, setStoreEditId] = useState(null); 
  const [storeEditPrice, setStoreEditPrice] = useState(''); // unit price
  const [storeEditQty, setStoreEditQty] = useState(''); // unit quantity
  const [storeEditTotal, setStoreEditTotal] = useState(''); // auto-calc total field
  const [isNewInCart, setIsNewInCart] = useState(false); // flags if it was just moved to cart
  
  // New Product Inline Form State
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdSubcat, setNewProdSubcat] = useState('');
  const [newProdPresentation, setNewProdPresentation] = useState('');
  const [newProdIva, setNewProdIva] = useState(false);

  // Parser helper to handle commas as decimals
  const parseDecimal = (val) => {
    if (!val) return 0;
    const normalized = String(val).replace(',', '.');
    return Number(normalized) || 0;
  };

  // 1. Fetching Budgets
  const fetchBudgets = async () => {
    try {
      const res = await fetch(`${API_URL}/budgets`, { headers: getHeaders });
      if (res.ok) setBudgets(await res.json());
    } catch (err) { console.error('Error fetching budgets:', err); }
  };

  useEffect(() => { fetchBudgets(); }, [token]);

  // 2. Fetching Shopping Data
  const fetchShoppingList = async (budgetId) => {
    try {
      const res = await fetch(`${API_URL}/shopping-list/${budgetId}`, { headers: getHeaders });
      if (res.ok) setItems(await res.json());
    } catch (err) { console.error('Error fetching shopping list:', err); }
  };

  const fetchCatalogAndComercios = async () => {
    try {
      const [resCat, resCom, resCategories, resSub] = await Promise.all([
        fetch(`${API_URL}/products`, { headers: getHeaders }),
        fetch(`${API_URL}/comercios`, { headers: getHeaders }),
        fetch(`${API_URL}/categories`, { headers: getHeaders }),
        fetch(`${API_URL}/subcategories`, { headers: getHeaders })
      ]);
      if (resCat.ok) setCatalog(await resCat.json());
      if (resCom.ok) setComercios(await resCom.json());
      if (resCategories.ok) setCategories(await resCategories.json());
      if (resSub.ok) setSubcategories(await resSub.json());
    } catch (err) { console.error('Error fetching data:', err); }
  };

  useEffect(() => {
    if ((view === 'planning' || view === 'store') && selectedBudget) {
      fetchShoppingList(selectedBudget.id);
      fetchCatalogAndComercios();
    }
  }, [view, selectedBudget]);

  // Actions
  const startEventualList = async () => {
    let eventual = budgets.find(b => b.name.toLowerCase() === 'eventual');
    if (!eventual) {
      try {
        const res = await fetch(`${API_URL}/budgets`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ name: 'Eventual', max_amount: 0 })
        });
        if (res.ok) eventual = await res.json();
      } catch (err) { return; }
    }
    setSelectedBudget(eventual);
    setView('planning');
  };

  const selectBudget = (b) => { setSelectedBudget(b); setView('planning'); };

  const deleteBudget = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar esta lista permanentemente?')) return;
    try {
      const res = await fetch(`${API_URL}/budgets/${id}`, { method: 'DELETE', headers: authHeaders });
      if (res.ok) fetchBudgets();
    } catch (err) { console.error(err); }
  };

  // --- PLANNING ACTIONS ---
  const addItemToList = async (e) => {
    e.preventDefault();
    if (selectedProductId === 'NEW') {
      if (!newProdName || !newProdCategory || !newProdSubcat) {
        alert('Por favor completa todos los campos del nuevo artículo'); return;
      }
      try {
        const res = await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ name: newProdName, category_code: newProdCategory, subcategory_code: newProdSubcat, presentation: newProdPresentation, has_iva: newProdIva, isGlobal: false })
        });
        if (res.ok) {
          const newProduct = await res.json();
          await fetchCatalogAndComercios();
          await fetch(`${API_URL}/shopping-list/${selectedBudget.id}/${newProduct.id}`, {
            method: 'PUT', headers: authHeaders,
            body: JSON.stringify({ is_needed: true, estimated_price: toBaseValue(parseDecimal(estimatedPrice)), estimated_quantity: parseDecimal(estimatedQuantity) || 1 })
          });
          fetchShoppingList(selectedBudget.id);
          setSelectedProductId(''); setEstimatedPrice(''); setEstimatedQuantity('1'); setNewProdName(''); setNewProdPresentation(''); setNewProdCategory(''); setNewProdSubcat(''); setNewProdIva(false);
        }
      } catch (err) { console.error(err); }
      return;
    }

    if (!selectedProductId) return;
    await fetch(`${API_URL}/shopping-list/${selectedBudget.id}/${selectedProductId}`, {
      method: 'PUT', headers: authHeaders,
      body: JSON.stringify({ is_needed: true, estimated_price: toBaseValue(parseDecimal(estimatedPrice)), estimated_quantity: parseDecimal(estimatedQuantity) || 1 })
    });
    fetchShoppingList(selectedBudget.id);
    setSelectedProductId(''); setEstimatedPrice(''); setEstimatedQuantity('1');
  };

  const removeItem = async (item) => {
    try {
      await fetch(`${API_URL}/shopping-list/${selectedBudget.id}/${item.product_id}`, {
        method: 'PUT', headers: authHeaders,
        body: JSON.stringify({ is_needed: false, is_bought: false })
      });
      fetchShoppingList(selectedBudget.id);
    } catch (err) { console.error(err); }
  };

  const savePlanningEdit = async (item) => {
    await fetch(`${API_URL}/shopping-list/${selectedBudget.id}/${item.product_id}`, {
      method: 'PUT', headers: authHeaders,
      body: JSON.stringify({ estimated_price: toBaseValue(parseDecimal(planningEditPrice)), estimated_quantity: parseDecimal(planningEditQty) })
    });
    fetchShoppingList(selectedBudget.id);
    setPlanningEditId(null);
  };

  // --- STORE ACTIONS ---
  const moveToCart = async (item) => {
    await fetch(`${API_URL}/shopping-list/${selectedBudget.id}/${item.product_id}`, {
      method: 'PUT', headers: authHeaders,
      body: JSON.stringify({ is_bought: true, is_needed: false, real_price: item.estimated_price, real_quantity: item.estimated_quantity })
    });
    fetchShoppingList(selectedBudget.id);
    
    // Auto-open edit space
    setStoreEditId(item.id);
    setStoreEditPrice(toDisplayValue(item.estimated_price));
    setStoreEditQty(formatQuantity(item.estimated_quantity));
    setStoreEditTotal('');
    setIsNewInCart(true);
  };

  const removeFromCart = async (item) => {
    await fetch(`${API_URL}/shopping-list/${selectedBudget.id}/${item.product_id}`, {
      method: 'PUT', headers: authHeaders,
      body: JSON.stringify({ is_bought: false, is_needed: true })
    });
    fetchShoppingList(selectedBudget.id);
    setStoreEditId(null);
  };

  const saveStoreEdit = async (item) => {
    await fetch(`${API_URL}/shopping-list/${selectedBudget.id}/${item.product_id}`, {
      method: 'PUT', headers: authHeaders,
      body: JSON.stringify({ real_price: toBaseValue(parseDecimal(storeEditPrice)), real_quantity: parseDecimal(storeEditQty) })
    });
    fetchShoppingList(selectedBudget.id);
    setStoreEditId(null);
    setIsNewInCart(false);
  };

  const handleStoreCancel = (item) => {
    if (isNewInCart) {
      removeFromCart(item); // Returns it to the pending list
    } else {
      setStoreEditId(null); // Just closes the edit box
    }
  };

  const handleAutoCalc = () => {
    const total = parseDecimal(storeEditTotal);
    const unitPrice = parseDecimal(storeEditPrice);
    if (total > 0 && unitPrice > 0) {
      const qty = (total / unitPrice).toFixed(3);
      setStoreEditQty(qty);
    }
  };

  const checkoutCart = async () => {
    if (!globalStoreId) {
      alert("Por favor selecciona el Comercio Actual antes de cerrar la compra.");
      return;
    }
    if (!window.confirm("¿Seguro que deseas cerrar la compra? Esto guardará los precios en el historial y limpiará tu carrito.")) return;
    try {
      const res = await fetch(`${API_URL}/checkout/${selectedBudget.id}`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ comercio_id: globalStoreId })
      });
      if (res.ok) {
        alert("¡Compra finalizada con éxito!");
        fetchShoppingList(selectedBudget.id);
      }
    } catch (err) { console.error(err); }
  };

  // Calculations (Convert to Display Value first, then multiply)
  const availableProducts = catalog.filter(p => p.is_active !== false && !items.find(i => i.product_id === p.id));
  const activeBudgetNum = Number(availableAmount) || 0;
  
  const pendingItems = items.filter(i => !i.is_bought);
  const boughtItems = items.filter(i => i.is_bought);

  const calculateTotal = (itemList, isReal) => {
    return itemList.reduce((sum, item) => {
      const price = isReal ? item.real_price : item.estimated_price;
      const qty = isReal ? item.real_quantity : item.estimated_quantity;
      const lineTotal = Number(price) * Number(qty);
      return sum + toDisplayValue(lineTotal);
    }, 0);
  };

  const totalEstimadoGlobal = calculateTotal(items, false);
  const totalEstimadoPendiente = calculateTotal(pendingItems, false);
  const totalGastadoReal = calculateTotal(boughtItems, true);
  const proyeccionTotal = totalEstimadoPendiente + totalGastadoReal;
  
  // Caja Registradora Calculations
  const cartTotal = boughtItems.reduce((sum, item) => {
    const lineTotal = Number(item.real_price) * Number(item.real_quantity);
    return sum + toDisplayValue(lineTotal);
  }, 0);
  const cartIVA = boughtItems.reduce((sum, item) => {
    const lineTotal = Number(item.real_price) * Number(item.real_quantity);
    return sum + toDisplayValue(extractIVA(lineTotal, item.has_iva));
  }, 0);
  const cartSubtotalNeto = cartTotal - cartIVA;

  const pctProyeccion = activeBudgetNum > 0 ? Math.min((proyeccionTotal / activeBudgetNum) * 100, 100) : 0;
  const pctGastado = activeBudgetNum > 0 ? Math.min((totalGastadoReal / activeBudgetNum) * 100, 100) : 0;


  const ReturnButton = onReturn ? (
    <button onClick={onReturn} className="btn btn-outline" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px' }}>
      <ArrowLeft size={20} /> Volver a Principal
    </button>
  ) : null;

  // --- VIEWS ---
  if (view === 'setup') {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {ReturnButton}
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ background: 'var(--bg-secondary)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
            <Wallet size={32} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '1.5rem' }}>Monto Disponible para esta compra</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Ingresa cuánto planeas gastar. Esto te ayudará a medir tus gastos en tiempo real.</p>
          <input type="text" inputMode="decimal" className="input" style={{ fontSize: '1.5rem', textAlign: 'center', padding: '16px', marginBottom: '24px' }} placeholder="0.00" value={availableAmount} onChange={(e) => setAvailableAmount(e.target.value)} />
          <button className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', justifyContent: 'center' }} onClick={startEventualList}>
            Comenzar compra (Lista Eventual)
          </button>
        </div>
        <div style={{ textAlign: 'center' }}>
          <button className="btn btn-outline" style={{ border: 'none', textDecoration: 'underline', color: 'var(--text-secondary)' }} onClick={() => setView('budgets')}>Ver otras listas guardadas</button>
        </div>
      </div>
    );
  }

  if (view === 'budgets') {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {ReturnButton}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button className="btn btn-outline" style={{ padding: '6px 12px' }} onClick={() => setView('setup')}><ArrowLeft size={16} style={{ marginRight: '6px' }} /> Atrás</button>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Listas Guardadas</h2>
        </div>
        <div style={{ display: 'grid', gap: '16px' }}>
          {budgets.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <ShoppingBag size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
              <p style={{ fontWeight: '600' }}>No tienes listas guardadas.</p>
            </div>
          ) : (
            budgets.map(b => (
              <div key={b.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-2px)' } }} onClick={() => selectBudget(b)}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>{b.name}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={(e) => deleteBudget(e, b.id)} className="btn btn-outline" style={{ padding: '8px', color: '#ef4444', borderColor: '#fee2e2' }} title="Eliminar lista"><Trash2 size={18} /></button>
                  <ChevronRight color="var(--text-secondary)" size={24} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // SHARED HEADER FOR PLANNING/STORE
  const renderHeader = () => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <button className="btn btn-outline" style={{ padding: '6px 12px' }} onClick={() => setView('setup')}><ArrowLeft size={16} style={{ marginRight: '6px' }} /> Cambiar Lista / Monto</button>
        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{selectedBudget?.name}</h2>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <button className={`btn ${view === 'planning' ? '' : 'btn-outline'}`} style={{ flex: 1, borderRadius: '8px 8px 0 0', borderBottom: view === 'planning' ? '3px solid var(--accent-primary)' : 'none', padding: '12px', background: view === 'planning' ? 'transparent' : '', color: view === 'planning' ? 'var(--accent-primary)' : '', fontWeight: view === 'planning' ? 'bold' : 'normal' }} onClick={() => setView('planning')}>
          📝 Modo Planificación (En casa)
        </button>
        <button className={`btn ${view === 'store' ? '' : 'btn-outline'}`} style={{ flex: 1, borderRadius: '8px 8px 0 0', borderBottom: view === 'store' ? '3px solid var(--accent-primary)' : 'none', padding: '12px', background: view === 'store' ? 'transparent' : '', color: view === 'store' ? 'var(--accent-primary)' : '', fontWeight: view === 'store' ? 'bold' : 'normal' }} onClick={() => setView('store')}>
          🛒 Modo Tienda (Ejecución)
        </button>
      </div>
    </div>
  );

  if (view === 'planning') {
    return (
      <div>
        {ReturnButton}
        {renderHeader()}
        
        {/* PLANNING BUDGET PROGRESS */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
            <span style={{ fontWeight: '600' }}>Progreso Planificado</span>
            {activeBudgetNum > 0 ? (
              <span>Estimado: <strong>{formatCurrency(totalEstimadoGlobal)}</strong> / {formatCurrency(activeBudgetNum)}</span>
            ) : (
              <span>Estimado: <strong>{formatCurrency(totalEstimadoGlobal)}</strong></span>
            )}
          </div>
          {activeBudgetNum > 0 && (
            <div style={{ width: '100%', height: '12px', background: 'var(--bg-secondary)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min((totalEstimadoGlobal / activeBudgetNum) * 100, 100)}%`, background: '#cbd5e1', height: '100%', transition: 'width 0.3s' }}></div>
            </div>
          )}
        </div>

        <div className="grid-1-2">
          {/* LEFT: ADD FORM */}
          <div className="card" style={{ padding: '24px', alignSelf: 'start', position: 'sticky', top: '20px' }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={20} /> Añadir Artículo</h3>
            <form onSubmit={addItemToList} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="input" required>
                <option value="">-- Seleccione artículo --</option>
                <option value="NEW" style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>+ Crear Nuevo Artículo...</option>
                {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name} {p.presentation ? `- ${p.presentation}` : ''}</option>)}
              </select>
              
              {selectedProductId === 'NEW' && (
                <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input type="text" placeholder="Nombre" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} className="input" required />
                  <input type="text" placeholder="Presentación (Ej. 1kg)" value={newProdPresentation} onChange={(e) => setNewProdPresentation(e.target.value)} className="input" />
                  <select value={newProdCategory} onChange={(e) => { setNewProdCategory(e.target.value); setNewProdSubcat(''); }} className="input" required>
                    <option value="">-- Categoría --</option>
                    {categories.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                  <select value={newProdSubcat} onChange={(e) => setNewProdSubcat(e.target.value)} className="input" required disabled={!newProdCategory}>
                    <option value="">-- Subcategoría --</option>
                    {subcategories.filter(s => s.category_code === newProdCategory).map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                  </select>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={newProdIva} onChange={(e) => setNewProdIva(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                    Este artículo está sujeto a IVA
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Precio Estimado (c/u)</label>
                  <input type="text" inputMode="decimal" value={estimatedPrice} onChange={(e) => setEstimatedPrice(e.target.value)} placeholder="0.00" className="input" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Unidades (Cant.)</label>
                  <input type="text" inputMode="decimal" value={estimatedQuantity} onChange={(e) => setEstimatedQuantity(e.target.value)} placeholder="1" className="input" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '12px', justifyContent: 'center' }}>Agregar a la Lista</button>
            </form>
          </div>

          {/* RIGHT: LIST */}
          <div style={{ display: 'grid', gap: '12px', alignContent: 'start' }}>
            {items.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Lista vacía.</p> : items.map(item => (
              <div key={item.id} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600' }}>{item.name} {item.presentation ? `(${item.presentation})` : ''}</div>
                </div>
                
                {planningEditId === item.id ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '0.8rem' }}>Precio u. <input type="text" inputMode="decimal" value={planningEditPrice} onChange={e => setPlanningEditPrice(e.target.value)} className="input" style={{ width: '60px', padding: '4px' }} /></div>
                    <div style={{ fontSize: '0.8rem' }}>Cant. <input type="text" inputMode="decimal" value={planningEditQty} onChange={e => setPlanningEditQty(e.target.value)} className="input" style={{ width: '60px', padding: '4px' }} /></div>
                    <button onClick={() => savePlanningEdit(item)} className="btn btn-primary" style={{ padding: '6px' }}><Check size={16}/></button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'right', minWidth: '100px' }}>
                    <div style={{ fontWeight: '600' }}>{formatCurrency(toDisplayValue(Number(item.estimated_price) * Number(item.estimated_quantity)))}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatQuantity(item.estimated_quantity)} x {formatCurrency(toDisplayValue(item.estimated_price))} {item.has_iva && <span style={{fontSize: '0.7rem', color: '#f59e0b'}}>Inc. IVA</span>}</div>
                  </div>
                )}
                
                {planningEditId !== item.id && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => { setPlanningEditId(item.id); setPlanningEditPrice(toDisplayValue(item.estimated_price)); setPlanningEditQty(formatQuantity(item.estimated_quantity)); }} className="btn btn-outline" style={{ padding: '6px' }}><Edit2 size={16} /></button>
                    <button onClick={() => removeItem(item)} className="btn btn-outline" style={{ padding: '6px', color: '#ef4444', borderColor: '#fee2e2' }}><Trash2 size={16} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- STORE EXECUTION VIEW ---
  if (view === 'store') {
    return (
      <div>
        {ReturnButton}
        {renderHeader()}

        {/* STORE SELECTION & PROGRESS */}
        <div className="card" style={{ marginBottom: '24px', position: 'sticky', top: '10px', zIndex: 10 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label className="input-label" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><StoreIcon size={16} /> Comercio Actual</label>
              <select value={globalStoreId} onChange={(e) => setGlobalStoreId(e.target.value)} className="input" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                <option value="">-- Seleccione --</option>
                {comercios.filter(c => c.is_active !== false).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            {/* Caja Registradora Visor */}
            <div style={{ flex: '2 1 300px', background: '#0f172a', color: '#10b981', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '1.1rem', border: '2px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#94a3b8' }}>SUBTOTAL (Neto):</span>
                <span>{formatCurrency(cartSubtotalNeto)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>IVA Extrac. ({settings.iva_percent}%):</span>
                <span>{formatCurrency(cartIVA)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #334155', paddingTop: '8px', fontWeight: 'bold', fontSize: '1.3rem' }}>
                <span style={{ color: '#f8fafc' }}>TOTAL PVP:</span>
                <span style={{ color: '#34d399' }}>{formatCurrency(cartTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid-1-2">
          {/* PENDING LIST */}
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid var(--border-color)', paddingBottom: '8px' }}>
              <Circle size={20} color="var(--text-secondary)" /> Por Comprar ({pendingItems.length})
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {pendingItems.map(item => (
                <div key={item.id} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'transform 0.1s' }} onClick={() => moveToCart(item)}>
                  <Circle size={28} color="var(--text-secondary)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600' }}>{item.name} {item.has_iva && <span style={{fontSize: '0.7rem', color: '#f59e0b', background: '#fef3c7', padding: '2px 4px', borderRadius: '4px'}}>IVA</span>}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Estimado: {formatQuantity(item.estimated_quantity)} x {formatCurrency(toDisplayValue(item.estimated_price))}</div>
                  </div>
                </div>
              ))}
              {pendingItems.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No hay productos pendientes.</p>}
            </div>
          </div>

          {/* IN CART */}
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid var(--accent-primary)', paddingBottom: '8px' }}>
              <ShoppingCart size={20} color="var(--accent-primary)" /> En el Carrito ({boughtItems.length})
            </h3>
            <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
              {boughtItems.map(item => (
                <div key={item.id} className="card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-primary)' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: storeEditId === item.id ? '16px' : '0' }}>
                    <button onClick={() => removeFromCart(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)' }}><CheckCircle size={28} /></button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', textDecoration: 'line-through', opacity: 0.7 }}>{item.name}</div>
                    </div>
                    {storeEditId !== item.id && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>{formatCurrency(toDisplayValue(Number(item.real_price) * Number(item.real_quantity)))}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatQuantity(item.real_quantity)} x {formatCurrency(toDisplayValue(item.real_price))} {item.has_iva && <span style={{fontSize: '0.7rem', color: '#f59e0b'}}>Inc. IVA</span>}</div>
                      </div>
                    )}
                    {storeEditId !== item.id && (
                      <button onClick={() => { setStoreEditId(item.id); setStoreEditPrice(toDisplayValue(item.real_price)); setStoreEditQty(formatQuantity(item.real_quantity)); setStoreEditTotal(''); setIsNewInCart(false); }} className="btn btn-outline" style={{ padding: '6px', marginLeft: '8px' }}><Edit2 size={16} /></button>
                    )}
                  </div>

                  {/* EDIT MODE IN CART */}
                  {storeEditId === item.id && (
                    <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '100px' }}>
                          <label className="input-label" style={{ fontSize: '0.75rem' }}>Precio Real (c/u)</label>
                          <input type="text" inputMode="decimal" value={storeEditPrice} onChange={e => setStoreEditPrice(e.target.value)} className="input" autoFocus />
                        </div>
                        <div style={{ flex: 1, minWidth: '100px' }}>
                          <label className="input-label" style={{ fontSize: '0.75rem' }}>Cant. Comprada</label>
                          <input type="text" inputMode="decimal" value={storeEditQty} onChange={e => setStoreEditQty(e.target.value)} className="input" />
                        </div>
                      </div>
                      
                      <div style={{ marginTop: '12px', padding: '12px', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                        <label className="input-label" style={{ fontSize: '0.75rem', display: 'flex', gap: '4px', alignItems: 'center' }}><Calculator size={14} /> Autocalcular Cantidad</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem' }}>Pagué total:</span>
                          <input type="text" inputMode="decimal" value={storeEditTotal} onChange={e => setStoreEditTotal(e.target.value)} placeholder="Ej. 10.50" className="input" style={{ flex: 1 }} />
                          <button onClick={handleAutoCalc} className="btn btn-outline" style={{ padding: '8px' }}>Calcular</button>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Llena el Precio c/u arriba, y el total pagado aquí, para calcular la cantidad.</div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                        <button onClick={() => handleStoreCancel(item)} className="btn btn-outline" style={{ padding: '8px 16px' }}>Cancelar</button>
                        <button onClick={() => saveStoreEdit(item)} className="btn btn-primary" style={{ padding: '8px 16px' }}><Check size={16} /> Confirmar en Carrito</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {boughtItems.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>El carrito está vacío.</p>}
            </div>

            {boughtItems.length > 0 && (
              <button onClick={checkoutCart} className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', justifyContent: 'center', background: '#10b981', borderColor: '#10b981' }}>
                <CheckCircle size={20} style={{ marginRight: '8px' }} />
                Cerrar Compra ({formatCurrency(cartTotal)})
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ShoppingMode;
