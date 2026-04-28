import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, LogOut, User, Briefcase } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

export function Navbar() {
  const { appUser, logOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logOut();
    navigate('/login');
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      style={{
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* Logo */}
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

      {/* Nav links */}
      {appUser && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <NavLink to="/marketplace" active={isActive('/marketplace')} icon={<Briefcase size={16} />}>
            {appUser.role === 'owner' ? 'Mis publicaciones' : 'Publicaciones'}
          </NavLink>
          <NavLink to="/profile" active={isActive('/profile')} icon={<User size={16} />}>
            Mi perfil
          </NavLink>
        </div>
      )}

      {/* Right side */}
      {appUser ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            to="/notifications"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              color: '#6b7280',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f2f3f5')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Bell size={18} />
          </Link>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f2f3f5')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
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
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                {appUser.first_name?.[0] ?? appUser.email[0].toUpperCase()}
              </div>
              <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {appUser.first_name || appUser.email}
              </span>
            </button>

            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '44px',
                  right: 0,
                  background: '#fff',
                  borderRadius: '10px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  minWidth: '160px',
                  padding: '6px',
                  border: '1px solid #f0f0f0',
                }}
              >
                <button
                  onClick={() => { navigate('/profile'); setMenuOpen(false); }}
                  style={menuItemStyle}
                >
                  <User size={15} /> Perfil
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
          <Link to="/login" style={linkButtonStyle('#fff', '#000')}>Iniciar sesión</Link>
          <Link to="/register" style={linkButtonStyle('#000', '#fff')}>Registrarse</Link>
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
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: active ? 600 : 400,
        color: active ? '#ad4b7e' : '#374151',
        background: active ? '#fce7f3' : 'transparent',
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
  gap: '8px',
  width: '100%',
  padding: '8px 10px',
  borderRadius: '6px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '13px',
  color: '#374151',
  textAlign: 'left',
};

function linkButtonStyle(bg: string, color: string): React.CSSProperties {
  return {
    padding: '6px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    background: bg,
    color,
    border: '1.5px solid #000',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  };
}
