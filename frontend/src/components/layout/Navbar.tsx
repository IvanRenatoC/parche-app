import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, LogOut, User, Briefcase, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';

export function Navbar() {
  const { appUser, logOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  async function handleLogout() {
    await logOut();
    navigate('/login');
  }

  const isActive = (path: string) => location.pathname === path;
  const roleLabel = appUser?.role === 'owner' ? 'Negocio' : 'Trabajador';

  return (
    <nav
      style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #ECE7DD',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <Link
        to="/"
        style={{
          fontSize: '22px',
          fontWeight: 800,
          color: '#ad4b7e',
          letterSpacing: '-0.5px',
          textDecoration: 'none',
        }}
      >
        Parche
      </Link>

      {appUser && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <NavLink to="/marketplace" active={isActive('/marketplace')} icon={<Briefcase size={16} />}>
            {appUser.role === 'owner' ? 'Mis publicaciones' : 'Buscar turnos'}
          </NavLink>
          <NavLink to="/profile" active={isActive('/profile')} icon={<User size={16} />}>
            Mis datos
          </NavLink>
        </div>
      )}

      {appUser ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            to="/notifications"
            aria-label="Notificaciones"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              color: '#6B7280',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F7F4EF')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Bell size={18} />
          </Link>

          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen((m) => !m)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px 6px 6px',
                borderRadius: '999px',
                border: '1px solid #ECE7DD',
                background: '#FFFFFF',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                color: '#1F1F1F',
                transition: 'background 0.15s',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#ad4b7e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                {appUser.first_name?.[0]?.toUpperCase() ?? appUser.email[0].toUpperCase()}
              </div>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                <span style={{ fontSize: '13px', fontWeight: 600, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {appUser.first_name || appUser.email}
                </span>
                <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500 }}>{roleLabel}</span>
              </span>
              <ChevronDown size={14} color="#9CA3AF" />
            </button>

            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '52px',
                  right: 0,
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.10)',
                  minWidth: '180px',
                  padding: '6px',
                  border: '1px solid #ECE7DD',
                }}
              >
                <button
                  onClick={() => { navigate('/profile'); setMenuOpen(false); }}
                  style={menuItemStyle}
                >
                  <User size={15} /> Mis datos
                </button>
                <button
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  style={{ ...menuItemStyle, color: '#ef4444' }}
                >
                  <LogOut size={15} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/login" style={linkButtonStyle('#FFFFFF', '#1F1F1F')}>Iniciar sesión</Link>
          <Link to="/register" style={linkButtonStyle('#1F1F1F', '#FFFFFF')}>Crear cuenta</Link>
        </div>
      )}
    </nav>
  );
}

function NavLink({
  to,
  active,
  icon,
  children,
}: {
  to: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: active ? 600 : 500,
        color: active ? '#1F1F1F' : '#6B7280',
        background: active ? '#F7F4EF' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.15s',
      }}
    >
      {icon}
      {children}
    </Link>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '13px',
  color: '#1F1F1F',
  textAlign: 'left',
  fontWeight: 500,
};

function linkButtonStyle(bg: string, color: string): React.CSSProperties {
  return {
    padding: '8px 18px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    background: bg,
    color,
    border: '1.5px solid #1F1F1F',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  };
}
