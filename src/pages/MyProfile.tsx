import React, { useEffect, useState, useRef } from 'react';
import {
  IonContent, IonPage,
  IonSpinner, IonToast, IonIcon, IonMenuButton,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  personOutline, cameraOutline, saveOutline,
  pencilOutline, searchOutline, logOutOutline, chevronDownOutline,
} from 'ionicons/icons';

const API_BASE   = '/monteApp/Api_Profile';
const AVATAR_URL = 'https://itservicesph.com/IT383/MONTE/monte/uploads/avatars';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  created_at?: string;
}

const MyProfile: React.FC = () => {
  const stored  = JSON.parse(localStorage.getItem('user') ?? '{}');
  const USER_ID = stored?.id ?? 3;
  const history = useHistory();

  const [user,         setUser]        = useState<User | null>(null);
  const [loading,      setLoading]     = useState(false);
  const [form,         setForm]        = useState({ name: '', email: '', new_password: '' });
  const [saving,       setSaving]      = useState(false);
  const [toast,        setToast]       = useState({ show: false, msg: '', color: 'success' });
  const [searchQuery,  setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const notify = (msg: string, color = 'success') =>
    setToast({ show: true, msg, color });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/profile/${USER_ID}`);
      const json = await res.json();
      if (json.success) {
        setUser(json.data.me);
        setForm({ name: json.data.me.name, email: json.data.me.email, new_password: '' });
      } else {
        notify('Failed to load profile.', 'danger');
      }
    } catch {
      notify('Network error.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      history.push(`/songs?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      notify('Name and email are required.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/updateProfile/${USER_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        notify('Profile updated!');
        fetchProfile();
      } else {
        notify(json.message ?? 'Update failed.', 'danger');
      }
    } catch {
      notify('Network error.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res  = await fetch(`${API_BASE}/updateAvatar/${USER_ID}`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        notify('Avatar updated!');
        const s = JSON.parse(localStorage.getItem('user') ?? '{}');
        s.avatar = json.avatar;
        localStorage.setItem('user', JSON.stringify(s));
        fetchProfile();
      } else {
        notify(json.message ?? 'Upload failed.', 'danger');
      }
    } catch {
      notify('Network error.', 'danger');
    }
  };

  // ── Styles ──────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    borderRadius: 12,
    background: '#fff',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  };

  const darkHeaderStyle: React.CSSProperties = {
    background: '#212529',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 16px',
  };

  const solidBtnStyle: React.CSSProperties = {
    background: '#212529',
    color: '#fff',
    borderRadius: 10,
    border: 'none',
    padding: '13px',
    fontWeight: 600,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    fontSize: 15,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontWeight: 600,
    fontSize: 14,
    marginBottom: 6,
  };

  return (
    <IonPage>
      <IonContent style={{ '--background': '#f4f6fb' }}>

        {/* ── NAVBAR ── */}
        <div style={{ background:'#111827', height:56, display:'flex', alignItems:'center', padding:'0 20px', position:'sticky', top:0, zIndex:200 }}>

          {/* Left: hamburger */}
          <IonMenuButton style={{ color: '#fff', fontSize: 24 }} />

          {/* Right: search + profile */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginLeft:'auto' }}>

            {/* Search Bar */}
            <form onSubmit={handleSearch} style={{ display:'flex', alignItems:'center' }}>
              <div style={{ display:'flex', background:'#fff', borderRadius:8, overflow:'hidden' }}>
                <input
                  type="text"
                  placeholder="Search songs..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ border:'none', outline:'none', padding:'7px 14px', fontSize:14, width:200, color:'#212529' }}
                />
                <button
                  type="submit"
                  style={{ background:'#2563eb', border:'none', color:'#fff', padding:'0 13px', cursor:'pointer', display:'flex', alignItems:'center' }}
                >
                  <IonIcon icon={searchOutline} style={{ fontSize:15 }} />
                </button>
              </div>
            </form>

            {/* Profile Dropdown */}
            <div ref={dropdownRef} style={{ position:'relative' }}>
              <div
                onClick={() => setShowDropdown(o => !o)}
                style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}
              >
                {user?.avatar ? (
                  <img
                    src={`${AVATAR_URL}/${user.avatar}`}
                    alt="avatar"
                    style={{ width:34, height:34, borderRadius:'50%', objectFit:'cover', border:'2px solid rgba(255,255,255,0.3)' }}
                  />
                ) : (
                  <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, color:'#fff' }}>
                    {(user?.name ?? stored?.name ?? 'U')[0].toUpperCase()}
                  </div>
                )}
                <span style={{ color:'#fff', fontSize:14 }}>{user?.name ?? stored?.name ?? 'User'}</span>
                <IonIcon icon={chevronDownOutline} style={{ color:'#9ca3af', fontSize:14, transform:showDropdown?'rotate(180deg)':'rotate(0)', transition:'transform 0.2s' }} />
              </div>

              {/* Dropdown panel */}
              <div style={{ position:'absolute', top:'calc(100% + 10px)', right:0, width:190, zIndex:500, background:'#1e293b', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, boxShadow:'0 8px 32px rgba(0,0,0,0.4)', overflow:'hidden', opacity:showDropdown?1:0, transform:showDropdown?'translateY(0) scale(1)':'translateY(-6px) scale(0.97)', pointerEvents:showDropdown?'auto':'none', transition:'opacity 0.18s, transform 0.18s' }}>
                <div style={{ padding:'12px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:10 }}>
                  {user?.avatar ? (
                    <img src={`${AVATAR_URL}/${user.avatar}`} alt="avatar" style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover' }} />
                  ) : (
                    <div style={{ width:36, height:36, borderRadius:'50%', background:'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#fff', fontSize:16 }}>
                      {(user?.name ?? 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ color:'#e2e8f0', fontWeight:600, fontSize:13 }}>{user?.name}</div>
                    {user?.role && <div style={{ color:'#94a3b8', fontSize:11, textTransform:'uppercase' }}>{user.role}</div>}
                  </div>
                </div>
                <div
                  onClick={() => { setShowDropdown(false); history.push('/my-profile'); }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', cursor:'pointer', color:'#cbd5e1', fontSize:13 }}
                >
                  <IonIcon icon={personOutline} style={{ color:'#60a5fa', fontSize:16 }} /> View Profile
                </div>
                <div style={{ height:1, background:'rgba(255,255,255,0.06)' }} />
                <div
                  onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', cursor:'pointer', color:'#f87171', fontSize:13 }}
                >
                  <IonIcon icon={logOutOutline} style={{ color:'#f87171', fontSize:16 }} /> Logout
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── PAGE CONTENT ── */}
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>

          {loading && (
            <div style={{ textAlign: 'center', paddingTop: 60 }}>
              <IonSpinner name="crescent" color="dark" />
            </div>
          )}

          {!loading && user && (
            <div style={cardStyle}>

              {/* Dark header */}
              <div style={darkHeaderStyle}>
                <IonIcon icon={pencilOutline} style={{ fontSize: 18 }} />
                <span style={{ fontWeight: 600, fontSize: 15 }}>Edit Profile</span>
              </div>

              {/* Card body */}
              <div style={{ padding: '24px 24px 20px' }}>

                {/* Avatar */}
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    {user.avatar ? (
                      <img
                        src={`${AVATAR_URL}/${user.avatar}`}
                        alt="avatar"
                        style={{ width:110, height:110, objectFit:'cover', borderRadius:'50%', border:'1px solid #dee2e6' }}
                      />
                    ) : (
                      <div style={{ width:110, height:110, borderRadius:'50%', background:'#6c757d', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, color:'white', fontWeight:'bold' }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <label style={{ position:'absolute', bottom:4, right:4, background:'#212529', borderRadius:'50%', width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'2px solid #fff' }}>
                      <IonIcon icon={cameraOutline} style={{ color:'#fff', fontSize:15 }} />
                      <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display:'none' }} />
                    </label>
                  </div>
                  <p style={{ color:'#6c757d', fontSize:14, marginTop:8, marginBottom:0 }}>{user.role}</p>
                </div>

                {/* Edit Form */}
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Profile Photo</label>
                    <input type="file" className="form-control" accept="image/*" onChange={handleAvatarChange} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Full Name <span style={{ color:'#dc3545' }}>*</span></label>
                    <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Email <span style={{ color:'#dc3545' }}>*</span></label>
                    <input className="form-control" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label style={labelStyle}>
                      New Password{' '}
                      <span style={{ color:'#6c757d', fontWeight:400, fontSize:13 }}>(leave blank to keep current)</span>
                    </label>
                    <input className="form-control" type="password" placeholder="••••••••" value={form.new_password} onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))} />
                  </div>
                </div>

                {/* Save Button */}
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <button onClick={handleSave} disabled={saving} style={solidBtnStyle}>
                    <IonIcon icon={saveOutline} />
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>

        <IonToast
          isOpen={toast.show}
          message={toast.msg}
          color={toast.color as any}
          duration={2500}
          onDidDismiss={() => setToast(t => ({ ...t, show: false }))}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default MyProfile;