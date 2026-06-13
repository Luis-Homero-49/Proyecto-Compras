import React, { createContext, useState, useEffect, useContext } from 'react';
import { SettingsContext } from './SettingsContext';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'es');
  const { displayCurrency } = useContext(SettingsContext);

  useEffect(() => {
    localStorage.setItem('app_lang', lang);
  }, [lang]);

  const t = (key) => {
    const translations = {
      es: {
        "app.title": "Ayudante de Compras",
        "app.menu.shopping": "Compras",
        "app.menu.items": "Artículos",
        "app.menu.categories": "Categorías",
        "app.menu.stores": "Comercios",
        "app.menu.users": "Usuarios",
        "app.logout": "Salir",

        "shopping.lists.title": "Tus Listas",
        "shopping.lists.new": "Nueva Lista",
        "shopping.lists.empty": "No tienes listas creadas todavía.",
        "shopping.lists.empty_sub": "Crea una nueva lista para empezar a planificar.",
        "shopping.lists.create_title": "Crear Presupuesto",
        "shopping.lists.name_label": "Nombre de la lista",
        "shopping.lists.name_placeholder": "Ej. Compra Quincenal",
        "shopping.lists.budget_label": "Monto Disponible - Opcional",
        "shopping.lists.btn_save": "Guardar",
        "shopping.lists.btn_cancel": "Cancelar",
        "shopping.lists.status_planning": "Planificando",
        "shopping.lists.status_shopping": "Comprando",
        "shopping.lists.status_finished": "Finalizado",
        "shopping.lists.budget_text": "Presupuesto",

        "shopping.mode.back": "Volver a Mis Listas",
        "shopping.mode.store_label": "Comercio Actual:",
        "shopping.mode.store_select": "-- Seleccione un comercio --",
        "shopping.mode.add_title": "Añadir a la Lista",
        "shopping.mode.scan": "Escanear",
        "shopping.mode.item_label": "Artículo del Catálogo",
        "shopping.mode.item_select": "-- Seleccione un artículo --",
        "shopping.mode.price_estimated_label": "Precio Estimado (Opcional)",
        "shopping.mode.btn_add": "Agregar a la Compra",
        "shopping.mode.progress_title": "Progreso del Presupuesto",
        "shopping.mode.available": "Monto Disponible",
        "shopping.mode.estimated": "Costo Estimado",
        "shopping.mode.spent": "Gasto Real",
        "shopping.mode.remaining": "Restante",
        "shopping.mode.empty_list": "La lista está vacía. Añade artículos para comenzar.",
        "shopping.mode.item_price": "Precio",
        "shopping.mode.item_estimated": "Estimado",
        "shopping.mode.mark_bought": "Marcar Comprado",
        "shopping.mode.unmark_bought": "Desmarcar",
        
        "global.error": "Ocurrió un error",
        "global.success": "Operación exitosa"
      },
      en: {
        "app.title": "Shopping Assistant",
        "app.menu.shopping": "Shopping",
        "app.menu.items": "Items",
        "app.menu.categories": "Categories",
        "app.menu.stores": "Stores",
        "app.menu.users": "Users",
        "app.logout": "Logout",

        "shopping.lists.title": "Your Lists",
        "shopping.lists.new": "New List",
        "shopping.lists.empty": "You have no lists created yet.",
        "shopping.lists.empty_sub": "Create a new list to start planning.",
        "shopping.lists.create_title": "Create Budget",
        "shopping.lists.name_label": "List Name",
        "shopping.lists.name_placeholder": "e.g. Biweekly Groceries",
        "shopping.lists.budget_label": "Available Amount - Optional",
        "shopping.lists.btn_save": "Save",
        "shopping.lists.btn_cancel": "Cancel",
        "shopping.lists.status_planning": "Planning",
        "shopping.lists.status_shopping": "Shopping",
        "shopping.lists.status_finished": "Finished",
        "shopping.lists.budget_text": "Budget",

        "shopping.mode.back": "Back to My Lists",
        "shopping.mode.store_label": "Current Store:",
        "shopping.mode.store_select": "-- Select a store --",
        "shopping.mode.add_title": "Add to List",
        "shopping.mode.scan": "Scan",
        "shopping.mode.item_label": "Catalog Item",
        "shopping.mode.item_select": "-- Select an item --",
        "shopping.mode.price_estimated_label": "Estimated Price (Optional)",
        "shopping.mode.btn_add": "Add to List",
        "shopping.mode.progress_title": "Budget Progress",
        "shopping.mode.available": "Available Amount",
        "shopping.mode.estimated": "Estimated Cost",
        "shopping.mode.spent": "Actual Spend",
        "shopping.mode.remaining": "Remaining",
        "shopping.mode.empty_list": "List is empty. Add items to start.",
        "shopping.mode.item_price": "Price",
        "shopping.mode.item_estimated": "Estimated",
        "shopping.mode.mark_bought": "Mark Bought",
        "shopping.mode.unmark_bought": "Unmark",
        
        "global.error": "An error occurred",
        "global.success": "Success"
      }
    };
    return translations[lang]?.[key] || key;
  };

  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    const symbol = displayCurrency === 'VES' ? 'Bs' : '$';
    if (lang === 'es') {
      return symbol + ' ' + new Intl.NumberFormat('es-VE', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    } else {
      return symbol + ' ' + new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    }
  };

  const formatQuantity = (qty) => {
    const num = Number(qty) || 0;
    if (lang === 'es') {
      return new Intl.NumberFormat('es-VE', { maximumFractionDigits: 3 }).format(num);
    } else {
      return new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(num);
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, formatCurrency, formatQuantity }}>
      {children}
    </LanguageContext.Provider>
  );
};
