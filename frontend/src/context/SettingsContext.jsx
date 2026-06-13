import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { API_URL } from '../config';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [settings, setSettings] = useState({
    iva_percent: 16.00,
    exchange_rate: 1.0,
    base_currency: 'VES',
    local_currency: 'USD'
  });
  const [displayCurrency, setDisplayCurrency] = useState('VES');

  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.iva_percent !== undefined) {
          setSettings({
            iva_percent: Number(data.iva_percent),
            exchange_rate: Number(data.exchange_rate),
            base_currency: data.base_currency || 'VES',
            local_currency: data.local_currency || 'USD'
          });
          // Default display currency is the main one (base)
          setDisplayCurrency(data.base_currency || 'VES');
        }
      })
      .catch(console.error);
    }
  }, [token]);

  const updateSettings = async (newSettings) => {
    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings({
          iva_percent: Number(updated.iva_percent),
          exchange_rate: Number(updated.exchange_rate),
          base_currency: updated.base_currency,
          local_currency: updated.local_currency
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Convert visually depending on what currency is selected
  // Internally DB uses Base Currency (Main Currency, e.g. VES).
  // If displayCurrency == local_currency (Secondary, e.g. USD), divide by exchange_rate.
  const toDisplayValue = (baseAmount) => {
    const num = Number(baseAmount) || 0;
    if (displayCurrency === settings.local_currency && settings.exchange_rate > 0) {
      return num / settings.exchange_rate; // VES to USD
    }
    return num; // VES to VES
  };

  // When user types in an input, convert back to Base before saving to DB
  const toBaseValue = (displayAmount) => {
    const num = Number(displayAmount) || 0;
    if (displayCurrency === settings.local_currency) {
      return num * settings.exchange_rate; // USD to VES
    }
    return num; // VES to VES
  };

  const extractIVA = (totalAmountWithIva, hasIva) => {
    if (!hasIva) return 0;
    const total = Number(totalAmountWithIva) || 0;
    const rate = settings.iva_percent / 100;
    const base = total / (1 + rate);
    return total - base;
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      displayCurrency, 
      setDisplayCurrency, 
      toDisplayValue, 
      toBaseValue,
      extractIVA
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
