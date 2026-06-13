import React, { useContext, useState, useEffect } from 'react';
import { SettingsContext } from '../context/SettingsContext';
import { LanguageContext } from '../context/LanguageContext';
import { Settings as SettingsIcon, Save, DollarSign, Percent } from 'lucide-react';

const Settings = ({ onSaved }) => {
  const { settings, updateSettings } = useContext(SettingsContext);
  const { t } = useContext(LanguageContext);
  
  const [iva, setIva] = useState(settings.iva_percent);
  const [rate, setRate] = useState(settings.exchange_rate);
  const [base, setBase] = useState(settings.base_currency);
  const [local, setLocal] = useState(settings.local_currency);
  const [saved, setSaved] = useState(false);
  const [isFetchingBCV, setIsFetchingBCV] = useState(false);

  useEffect(() => {
    setIva(settings.iva_percent);
    setRate(settings.exchange_rate);
    setBase(settings.base_currency);
    setLocal(settings.local_currency);
  }, [settings]);

  const performSave = async (newIva, newRate, newBase, newLocal) => {
    await updateSettings({
      iva_percent: Number(newIva),
      exchange_rate: Number(newRate),
      base_currency: newBase,
      local_currency: newLocal
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await performSave(iva, rate, base, local);
    if (onSaved) {
      setTimeout(() => onSaved(), 1500);
    }
  };

  const fetchBCVRate = async () => {
    setIsFetchingBCV(true);
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
      if (res.ok) {
        const data = await res.json();
        if (data && data.promedio) {
          setRate(data.promedio);
          // Auto-save the new rate so the user doesn't forget
          await performSave(iva, data.promedio, base, local);
        }
      }
    } catch (err) {
      console.error('Error fetching BCV:', err);
      alert('Hubo un error obteniendo la tasa del BCV.');
    } finally {
      setIsFetchingBCV(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <SettingsIcon size={28} style={{ color: 'var(--accent-primary)' }} />
        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Configuración</h2>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', margin: '0 0 16px 0' }}>
              <Percent size={20} /> Impuestos (IVA)
            </h3>
            <label className="input-label">Porcentaje de IVA por defecto (%)</label>
            <input 
              type="text" 
              inputMode="decimal"
              className="input" 
              value={iva} 
              onChange={e => setIva(e.target.value.replace(',', '.'))} 
              required
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Este porcentaje se aplicará a los artículos que marques como "Sujeto a IVA".</p>
          </div>

          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', margin: '24px 0 16px 0' }}>
              <DollarSign size={20} /> Multimoneda y Tasa de Cambio
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label className="input-label">Moneda Principal (Base de Datos)</label>
                <input type="text" className="input" value={base} onChange={e => setBase(e.target.value)} placeholder="Ej. VES, USD" required />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Moneda en la que sueles registrar los precios.</p>
              </div>
              <div>
                <label className="input-label">Moneda Secundaria</label>
                <input type="text" className="input" value={local} onChange={e => setLocal(e.target.value)} placeholder="Ej. USD, VES" required />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Moneda alterna de visualización.</p>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-label">Tasa de Cambio Actual (1 {local} = X {base})</label>
                <button type="button" onClick={fetchBCVRate} disabled={isFetchingBCV} className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                  {isFetchingBCV ? 'Cargando...' : 'Obtener del BCV'}
                </button>
              </div>
              <input 
                type="text" 
                inputMode="decimal"
                className="input" 
                value={rate} 
                onChange={e => setRate(e.target.value.replace(',', '.'))} 
                required
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Actualiza esta tasa según el mercado. Al presionar "Obtener del BCV", la tasa se guarda automáticamente.</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '1.1rem' }}>
              <Save size={20} style={{ marginRight: '8px' }} />
              Guardar Configuración
            </button>
          </div>
          
          {saved && (
            <div style={{ background: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '8px', textAlign: 'center', marginTop: '8px', fontWeight: 'bold' }}>
              ¡Configuración guardada exitosamente!
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Settings;
