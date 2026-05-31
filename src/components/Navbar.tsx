import React, { useRef, useState, useEffect } from 'react';
import { IonIcon, IonMenuButton } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  searchOutline, chevronDownOutline,
  personOutline, logOutOutline,
} from 'ionicons/icons';

const AVATAR_URL = 'https://itservicesph.com/IT383/MONTE/monte/uploads/avatars';

interface NavbarProps {
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  searchPlaceholder = 'Search songs...',
  onSearch,
}) => {
  const history  = useHistory();
  const dropRef  = useRef<HTMLDivElement>(null);

  const stored   = JSON.parse(localStorage.getItem('user') ?? '{}');
  const userName = stored?.name   ?? 'User';
  const userRole = stored?.role   ?? '';
  const userAvt  = stored?.avatar ?? '';

  const [dropOpen,    setDropOpen]    = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setDropOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    } else if (searchQuery.trim()) {
      history.push(`/songs?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div style={{
      background: '#111827',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 200,
    }}>

      {/* Left: hamburger */}
      <IonMenuButton style={{ color: '#fff', fontSize: 24 }} />

      {/* Right: search + avatar pushed to the right */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Search */}
        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                if (onSearch) onSearch(e.target.value);
              }}
              style={{ border: 'none', outline: 'none', padding: '7px 14px', fontSize: 14, width: 200, color: '#212529' }}
            />
            <button
              type="submit"
              style={{ background: '#2563eb', border: 'none', color: '#fff', padding: '0 13px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <IonIcon icon={searchOutline} style={{ fontSize: 15 }} />
            </button>
          </div>
        </form>

        {/* Avatar + Dropdown */}
        <div ref={dropRef} style={{ position: 'relative' }}>
          <div
            onClick={() => setDropOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          >
            {userAvt ? (
              <img
                src={`${AVATAR_URL}/${userAvt}`}
                alt="avatar"
                style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.3)' }}
              />
            ) : (
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff' }}>
                {userName[0].toUpperCase()}
              </div>
            )}
            <span style={{ color: '#fff', fontSize: 14 }}>{userName}</span>
            <IonIcon
              icon={chevronDownOutline}
              style={{ color: '#9ca3af', fontSize: 14, transform: dropOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
            />
          </div>

          {/* Dropdown */}
          <div style={{
            position: 'absolute', top: 'calc(100% + 10px)', right: 0,
            width: 190, zIndex: 500,
            background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', overflow: 'hidden',
            opacity: dropOpen ? 1 : 0,
            transform: dropOpen ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(0.97)',
            pointerEvents: dropOpen ? 'auto' : 'none',
            transition: 'opacity 0.18s, transform 0.18s',
          }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
              {userAvt ? (
                <img src={`${AVATAR_URL}/${userAvt}`} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 16 }}>
                  {userName[0].toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 13 }}>{userName}</div>
                {userRole && <div style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase' }}>{userRole}</div>}
              </div>
            </div>
            <div
              onClick={() => { setDropOpen(false); history.push('/my-profile'); }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', cursor: 'pointer', color: '#cbd5e1', fontSize: 13 }}
            >
              <IonIcon icon={personOutline} style={{ color: '#60a5fa', fontSize: 16 }} /> View Profile
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <div
              onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', cursor: 'pointer', color: '#f87171', fontSize: 13 }}
            >
              <IonIcon icon={logOutOutline} style={{ color: '#f87171', fontSize: 16 }} /> Logout
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;