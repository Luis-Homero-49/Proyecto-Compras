import { useState, useContext } from 'react';
import ShoppingMode from './components/ShoppingMode';
import CategoriesManager from './components/CategoriesManager';
import ProductsManager from './components/ProductsManager';
import ComerciosManager from './components/ComerciosManager';
import UsersManager from './components/UsersManager';
import Settings from './components/Settings';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import FamilyManager from './components/FamilyManager';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { LanguageProvider, LanguageContext } from './context/LanguageContext';
import { SettingsProvider, SettingsContext } from './context/SettingsContext';
import LandingLayout from './components/LandingLayout';
import { ShoppingCart, Package, Layers, Store, LogOut, Users, Globe, Settings as SettingsIcon } from 'lucide-react';
import './index.css';

function MainApp() {
  const [mainTab, setMainTab] = useState(null);
  const { user, logout } = useContext(AuthContext);
  const { lang, setLang, t } = useContext(LanguageContext);
  const { displayCurrency, setDisplayCurrency, settings } = useContext(SettingsContext);

  const toggleLang = () => setLang(lang === 'es' ? 'en' : 'es');

  return (
    <>
      <header className="header">
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
              <span style={{ color: 'var(--accent-primary)' }}>{lang === 'es' ? 'Ayudante' : 'Shopping'}</span> {lang === 'es' ? 'de Compras' : 'Assistant'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              
              {/* Currency Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-primary)', borderRadius: '20px', padding: '4px', border: '1px solid var(--border-color)' }}>
                <button 
                  onClick={() => setDisplayCurrency(settings.base_currency)} 
                  style={{ background: displayCurrency === settings.base_currency ? 'var(--accent-primary)' : 'transparent', color: displayCurrency === settings.base_currency ? 'white' : 'var(--text-primary)', border: 'none', borderRadius: '16px', padding: '4px 12px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  {settings.base_currency}
                </button>
                <button 
                  onClick={() => setDisplayCurrency(settings.local_currency)} 
                  style={{ background: displayCurrency === settings.local_currency ? 'var(--accent-primary)' : 'transparent', color: displayCurrency === settings.local_currency ? 'white' : 'var(--text-primary)', border: 'none', borderRadius: '16px', padding: '4px 12px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  {settings.local_currency}
                </button>
              </div>

              <button onClick={toggleLang} className="btn btn-outline" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={16} /> {lang.toUpperCase()}
              </button>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{user?.alias || user?.email}</span>
              <button onClick={logout} className="btn btn-outline" style={{ padding: '6px 12px', borderColor: '#fee2e2', color: '#ef4444' }}>
                <LogOut size={16} style={{ marginRight: '6px' }} /> {t('app.logout')}
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            <button 
              onClick={() => setMainTab('compras')} 
              className={`btn ${mainTab === 'compras' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ShoppingCart size={18} style={{ marginRight: '8px' }} />
              {t('app.menu.shopping')}
            </button>
            <button 
              onClick={() => setMainTab('products')} 
              className={`btn ${mainTab === 'products' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Package size={18} style={{ marginRight: '8px' }} />
              {t('app.menu.items')}
            </button>
            <button 
              onClick={() => setMainTab('categories')} 
              className={`btn ${mainTab === 'categories' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Layers size={18} style={{ marginRight: '8px' }} />
              {t('app.menu.categories')}
            </button>
            <button 
              onClick={() => setMainTab('comercios')} 
              className={`btn ${mainTab === 'comercios' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Store size={18} style={{ marginRight: '8px' }} />
              {t('app.menu.stores')}
            </button>
            {user?.plan_type === 'family' && (
              <button 
                onClick={() => setMainTab('family')} 
                className={`btn ${mainTab === 'family' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Users size={18} style={{ marginRight: '8px' }} />
                Mi Familia
              </button>
            )}
            {user?.role === 'admin' && (
              <button 
                onClick={() => setMainTab('users')} 
                className={`btn ${mainTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Users size={18} style={{ marginRight: '8px' }} />
                {t('app.menu.users')}
              </button>
            )}
            <button 
              onClick={() => setMainTab('settings')} 
              className={`btn ${mainTab === 'settings' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <SettingsIcon size={18} style={{ marginRight: '8px' }} />
              Config.
            </button>
          </div>
        </div>
      </header>
      
      <main className="container">
        {mainTab === null && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
            <ShoppingCart size={64} color="var(--accent-primary)" style={{ opacity: 0.2, marginBottom: '24px' }} />
            <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>¡Hola, {user?.alias || user?.email}!</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Selecciona una opción del menú superior para comenzar.</p>
          </div>
        )}
        {mainTab === 'compras' && <ShoppingMode onReturn={() => setMainTab(null)} />}
        {mainTab === 'products' && <ProductsManager onReturn={() => setMainTab(null)} />}
        {mainTab === 'categories' && <CategoriesManager onReturn={() => setMainTab(null)} />}
        {mainTab === 'comercios' && <ComerciosManager onReturn={() => setMainTab(null)} />}
        {mainTab === 'family' && user?.plan_type === 'family' && <FamilyManager onReturn={() => setMainTab(null)} />}
        {mainTab === 'users' && user?.role === 'admin' && <UsersManager onReturn={() => setMainTab(null)} />}
        {mainTab === 'settings' && <Settings onSaved={() => setMainTab(null)} />}
      </main>
    </>
  );
}

function AppContent() {
  const { token, user } = useContext(AuthContext);
  const [view, setView] = useState('login'); // 'login', 'register', 'forgot', 'reset'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPlans, setShowPlans] = useState(false);

  if (!token) {
    if (view === 'register') return <LandingLayout showPlans={showPlans} setShowPlans={setShowPlans} onPlanSelected={(p) => { setSelectedPlan(p); setView('register'); setShowPlans(false); }}><Register planType={selectedPlan} onShowPlans={() => setShowPlans(true)} onSwitchToLogin={() => setView('login')} /></LandingLayout>;
    if (view === 'forgot') return <LandingLayout><ForgotPassword onSwitchToLogin={() => setView('login')} /></LandingLayout>;
    if (view === 'reset') return <LandingLayout><ResetPassword onSwitchToLogin={() => setView('login')} /></LandingLayout>;
    
    return (
      <LandingLayout showPlans={showPlans} setShowPlans={setShowPlans} onPlanSelected={(p) => { setSelectedPlan(p); setView('register'); setShowPlans(false); }}>
        <Login 
          onSwitchToRegister={() => setView('register')} 
          onSwitchToForgot={() => setView('forgot')} 
        />
        {/* Helper button for testing ResetPassword since there is no actual email */}
        <div style={{ position: 'fixed', bottom: 10, right: 10 }}>
          <button onClick={() => setView('reset')} className="btn btn-outline" style={{ fontSize: '0.7rem', padding: '4px' }}>Test: Ir a Ingresar Token</button>
        </div>
      </LandingLayout>
    );
  }

  return <MainApp />;
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
