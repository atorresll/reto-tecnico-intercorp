import { useEffect, useState } from 'react';
import { KeyRound, LogIn, LogOut, ShieldCheck, Zap } from 'lucide-react';
import { EndorsementForm } from './components/EndorsementForm';
import type { EndorsementService } from './services/endorsementService';
import './App.css';

const mockToken = "eyJraWQiOiJaZnpEM25vRTZUMk4wcTZFdkt3QndGaVpZSHJYdW9PMm5qMlBXREZydUpBPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJiNGI4YjQxOC1hMGQxLTcwNGYtOGVlNy04NzA5MGJkYmNhNzUiLCJpc3MiOiJodHRwczovL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tL3VzLWVhc3QtMV92aWlDMk0zNlYiLCJjb2duaXRvOnVzZXJuYW1lIjoiYjRiOGI0MTgtYTBkMS03MDRmLThlZTctODcwOTBiZGJjYTc1IiwidG9rZW5fdXNlIjoiaWQiLCJpYXQiOjE3OTAyMzk3OTUsImV4cCI6MjU5MDIzOTc5NSwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSJ9.dummySignature".replace(/\s+/g, '').trim();

interface AppProps {
  service: EndorsementService;
}

export function App({ service }: AppProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('idToken') ?? localStorage.getItem('token');
    setIsAuthenticated(Boolean(storedToken?.trim()));
  }, []);

  const handleQuickLogin = () => {
    localStorage.setItem('idToken', mockToken);
    localStorage.setItem('token', mockToken);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('idToken');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <main className="app-shell">
      <section className={`auth-section ${isAuthenticated ? 'auth-section--active' : ''}`} aria-label="Estado de autenticación">
        {isAuthenticated ? (
          <div className="session-bar">
            <div className="session-details">
              <span className="session-badge">
                <span className="status-dot" aria-hidden="true" />
                Estado: Sesión Activa
              </span>
              <span className="session-user">
                <ShieldCheck size={16} aria-hidden="true" />
                admin@test.com <span className="token-type">Token de prueba</span>
              </span>
            </div>
            <button className="logout-button" type="button" onClick={handleLogout}>
              <LogOut size={15} aria-hidden="true" />
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <div className="login-card">
            <div className="login-icon" aria-hidden="true"><KeyRound size={28} /></div>
            <p className="login-eyebrow">Acceso de desarrollo</p>
            <h1>Servicio de Traducción de Endosos</h1>
            <p className="login-subtitle">Entorno local / pruebas de integración</p>
            <button className="quick-login-button" type="button" onClick={handleQuickLogin}>
              <LogIn size={19} aria-hidden="true" />
              <span>Iniciar Sesión (Modo Prueba)</span>
              <Zap className="button-zap" size={16} aria-hidden="true" />
            </button>
            <p className="login-note">
              <ShieldCheck size={14} aria-hidden="true" />
              Genera automáticamente un token JWT válido para desarrollo
            </p>
          </div>
        )}
      </section>
      {isAuthenticated && (
        <div className="endorsement-content">
          <EndorsementForm service={service} />
        </div>
      )}
    </main>
  );
}

export { mockToken };
