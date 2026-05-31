import React, { useRef, useState } from 'react';
import { IonIcon, IonMenuButton } from '@ionic/react';
import { searchOutline, chevronDownOutline, personOutline, logOutOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

const AVATAR_URL = 'https://itservicesph.com/IT383/MONTE/monte/uploads/avatars';

interface NavbarProps {
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  rightContent?: React.ReactNode;
  showSearch?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({
  onSearch,
  searchPlaceholder = 'Search songs...',
  rightContent,
  showSearch = true,
}) => {
  const history    = useHistory();
  const triggerRef = useRef<HTMLDivElement>(null);

  const [query,       setQuery]       = useState('');
  const [open,        setOpen]        = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

  const stored     = JSON.parse(localStorage.getItem('user') ?? '{}');
  const userName   = stored?.name   ?? 'User';
  const userAvatar = stored?.avatar ?? '';
  const isAdmin    = stored?.role   === 'admin';

  const handleSearch = () => {
    const q = query.trim();
    if (onSearch) onSearch(q);
    else history.push(q ? `/songs?search=${encodeURIComponent(q)}` : '/songs');
  };

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setOpen(o => !o);
  };

  return (
    <>
      <div style={navStyle}>
        {/* LEFT: Hamburger */}
        <IonMenuButton style={{ color: '#fff', '--color': '#fff' }} />

        {/* RIGHT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          {showSearch && (
            <div style={searchBoxStyle}>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder={searchPlaceholder}
                style={searchInputStyle}
              />
              <button onClick={handleSearch} style={searchBtnStyle}>
                <IonIcon icon={searchOutline} style={{ fontSize: 15 }} />
              </button>
            </div>
          )}

          {rightContent}

          {/* Profile trigger */}
          <div ref={triggerRef} onClick={handleToggle} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            {userAvatar ? (
              <img src={`${AVATAR_URL}/${userAvatar}`} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.3)' }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff' }}>
                {userName[0]?.toUpperCase()}
              </div>
            )}
            <span style={{ color: '#fff', fontSize: 13, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</span>
            <IonIcon icon={chevronDownOutline} style={{ color: '#9ca3af', fontSize: 13 }} />
          </div>
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{ position: 'fixed', top: dropdownPos.top, right: dropdownPos.right, background: '#fff', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', minWidth: 190, zIndex: 99999, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 10 }}>
            {userAvatar ? (
              <img src={`${AVATAR_URL}/${userAvatar}`} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 16 }}>
                {userName[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>{userName}</div>
              <div style={{ color: '#9ca3af', fontSize: '0.72rem' }}>{isAdmin ? 'Administrator' : 'Member'}</div>
            </div>
          </div>
          <div
            onMouseDown={() => { setOpen(false); history.push('/my-profile'); }}
            style={itemStyle}
            onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <IonIcon icon={personOutline} style={{ fontSize: '1rem', color: '#374151' }} />
            <span>My Profile</span>
          </div>
          <div style={{ height: 1, background: '#e5e7eb', margin: '0 12px' }} />
          <div
            onMouseDown={() => { localStorage.clear(); window.location.href = '/login'; }}
            style={{ ...itemStyle, color: '#dc2626' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <IonIcon icon={logOutOutline} style={{ fontSize: '1rem', color: '#dc2626' }} />
            <span>Logout</span>
          </div>
        </div>
      )}
    </>
  );
};

const navStyle: React.CSSProperties = {
  background: '#111827',
  minHeight: 56,
  display: 'flex',
  alignItems: 'center',
  paddingTop: 'max(env(safe-area-inset-top), 24px)',
  paddingBottom: 8,
  paddingLeft: 4,
  paddingRight: 12,
  position: 'sticky',
  top: 0,
  zIndex: 200,
};

const searchBoxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  background: '#fff',
  borderRadius: 8,
  overflow: 'hidden',
};

const searchInputStyle: React.CSSProperties = {
  border: 'none',
  outline: 'none',
  padding: '7px 12px',
  fontSize: 13,
  width: 140,
  color: '#212529',
};

const searchBtnStyle: React.CSSProperties = {
  background: '#2563eb',
  border: 'none',
  color: '#fff',
  padding: '0 12px',
  height: 36,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
};

const itemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '10px',
  padding: '10px 16px', cursor: 'pointer', fontSize: '0.85rem',
  color: '#374151', fontWeight: 500, background: 'transparent',
};

export default Navbar;