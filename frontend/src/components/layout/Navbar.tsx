import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, LogOut, User, Briefcase, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useRef, useEffect, useCallback } from 'react';
import { getNotifications, isNotificationUnread } from '../../services/notifications';

export function Navbar() {
  const { appUser, logOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
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

  const refreshUnread = useCallback(async () => {
    if (!appUser) {
      setUnreadCount(0);
      return;
    }
    try {
      const list = await getNotifications(appUser.uid, appUser.role);
      setUnreadCount(list.filter((n) => isNotificationUnread(n, appUser.uid)).length);
    } catch {
      // Silenciar — la campanita queda en 0 si falla.
    }
  }, [appUser]);

  // Refresca al montar, al cambiar de ruta (por si visitaron /notifications),
  // y cada 60s mientras la pestaña esté abierta.
  useEffect(() => {
    refreshUnread();
    const id = setInterval(refreshUnread, 60_000);
    return () => clearInterval(id);
  }, [refreshUnread, location.pathname]);

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
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        padding: '0 24px',
        height: '60px',
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
          fontSize: '20px',
          fontWeight: 800,
          color: '#C0395B',
          letterSpacing: '-0.8px',
          textDecoration: 'none',
          lineHeight: 1,
        }}
      >
        Parche
      </Link>

      {appUser && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <NavLink to="/marketplace" active={isActive('/marketplace')} icon={<Briefcase size={15} />}>
            {appUser.role === 'owner' ? 'Mis publicaciones' : 'Buscar turnos'}
          </NavLink>
          <NavLink to="/profile" active={isActive('/profile')} icon={<User size={15} />}>
            Mis datos
          </NavLink>
        </div>
      )}

      {appUser ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Link
            to="/notifications"
            aria-label={unreadCount > 0 ? `Notificaciones (${unreadCount} sin leer)` : 'Notificaciones'}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              color: isActive('/notifications') ? '#C0395B' : '#9CA3AF',
              background: isActive('/notifications') ? '#FEF0F4' : 'transparent',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!isActive('/notifications')) {
                e.currentTarget.style.background = '#F8F7F5';
                e.currentTarget.style.color = '#6B7280';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/notifications')) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#9CA3AF';
              }
            }}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  minWidth: '16px',
                  height: '16px',
                  padding: '0 4px',
                  borderRadius: '999px',
                  background: '#C0395B',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #FFFFFF',
                  lineHeight: 1,
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen((m) => !m)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 10px 5px 5px',
                borderRadius: '999px',
                border: '1.5px solid #E8E5E0',
                background: menuOpen ? '#F8F7F5' : '#FFFFFF',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                color: '#111827',
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D1CEC9'; }}
              onMouseLeave={(e) => { if (!menuOpen) e.currentTarget.style.borderColor = '#E8E5E0'; }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: '#C0395B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {appUser.first_name?.[0]?.toUpperCase() ?? appUser.email[0].toUpperCase()}
              </div>
              <span
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  lineHeight: 1.15,
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    maxWidth: '110px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: '#111827',
                  }}
                >
                  {appUser.first_name || appUser.email}
                </span>
                <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500 }}>{roleLabel}</span>
              </span>
              <ChevronDown size={13} color="#9CA3AF" style={{ flexShrink: 0 }} />
            </button>

            {menuOpen && (
              <div
                className="slide-up"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
                  minWidth: '176px',
                  padding: '6px',
                }}
              >
                <button
                  onClick={() => { navigate('/profile'); setMenuOpen(false); }}
                  style={menuItemStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F8F7F5'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <User size={14} /> Mis datos
                </button>
                <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '4px 6px' }} />
                <button
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  style={{ ...menuItemStyle, color: '#DC2626' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF2F2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <LogOut size={14} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/login" style={ghostLinkStyle}>Iniciar sesión</Link>
          <Link to="/register" style={solidLinkStyle}>Crear cuenta</Link>
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
        padding: '7px 14px',
        borderRadius: '10px',
        fontSize: '13.5px',
        fontWeight: active ? 600 : 500,
        color: active ? '#C0395B' : '#6B7280',
        background: active ? '#FEF0F4' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = '#F8F7F5';
          e.currentTarget.style.color = '#374151';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#6B7280';
        }
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
  gap: '9px',
  width: '100%',
  padding: '9px 10px',
  borderRadius: '8px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '13px',
  color: '#374151',
  textAlign: 'left',
  fontWeight: 500,
  transition: 'background 0.12s',
};

const ghostLinkStyle: React.CSSProperties = {
  padding: '7px 16px',
  borderRadius: '10px',
  fontSize: '13.5px',
  fontWeight: 500,
  background: 'transparent',
  color: '#6B7280',
  border: '1.5px solid #E8E5E0',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
};

const solidLinkStyle: React.CSSProperties = {
  padding: '7px 16px',
  borderRadius: '10px',
  fontSize: '13.5px',
  fontWeight: 600,
  background: '#C0395B',
  color: '#FFFFFF',
  border: '1.5px solid transparent',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
};
