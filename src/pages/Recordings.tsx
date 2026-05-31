import React, { useEffect, useState, useRef } from 'react';
import {
  IonContent, IonPage, IonBadge, IonIcon, IonSpinner, IonToast
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  micOutline, musicalNotesOutline, eyeOutline,
  downloadOutline, trashOutline, timeOutline,
  searchOutline, chevronDownOutline, personOutline, logOutOutline,
} from 'ionicons/icons';

const API_BASE = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_Recordings';
const FILES_BASE = 'https://itservicesph.com/IT383/MONTE/monte/uploads/recordings';
const AVATAR_URL = 'https://itservicesph.com/IT383/MONTE/monte/uploads/avatars';

const stored      = JSON.parse(localStorage.getItem('user') ?? '{}');
const USER_ID     = stored?.id     ?? 3;
const USER_NAME   = stored?.name   ?? 'User';
const USER_AVATAR = stored?.avatar ?? '';

interface Recording {
  id: number;
  song_id?: number;
  song: string;
  date: string;
  file: string;
}

const Recordings: React.FC = () => {
  const history    = useHistory();
  const triggerRef = useRef<HTMLDivElement>(null);

  const [recordings,   setRecordings]   = useState<Recording[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState('');
  const [toast,        setToast]        = useState({ show: false, msg: '', color: 'success' });
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos,  setDropdownPos]  = useState({ top: 0, right: 0 });

  const user    = JSON.parse(localStorage.getItem('user') ?? '{}');
  const isAdmin = user.role === 'admin';

  const notify = (msg: string, color = 'success') =>
    setToast({ show: true, msg, color });

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/recordings/${USER_ID}`);
      const json = await res.json();
      if (json.success) setRecordings(json.data.recordings);
      else notify('Failed to load recordings.', 'danger');
    } catch {
      notify('Network error.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecordings(); }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleDropdown = () => {
    if (!showDropdown && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setShowDropdown(o => !o);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this recording?')) return;
    try {
      const res  = await fetch(`${API_BASE}/delete/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { notify('Recording deleted!'); fetchRecordings(); }
      else notify(json.message ?? 'Delete failed.', 'danger');
    } catch {
      notify('Network error.', 'danger');
    }
  };

 const handleDownload = async (file: string) => {
  try {
    const response = await fetch(`${FILES_BASE}/${file}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch {
    notify('Download failed.', 'danger');
  }
};

  const handleViewSong = (rec: Recording) => {
    if (rec.song_id) history.push(`/song-view/${rec.song_id}`);
    else history.push('/songs');
  };

  const filtered = recordings.filter(r =>
    r.song.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <IonPage>
      <IonContent style={{ '--background': '#f8f9fa' } as any}>

        {/* ── NAVBAR — katulad ng Categories ── */}
        <div style={navStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Search bar */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
              <input
                placeholder="Search recordings..."
                style={{ border: 'none', outline: 'none', padding: '8px 14px', fontSize: 14, width: 220 }}
                onChange={e => setSearch(e.target.value)}
              />
              <button style={{ background: '#2563eb', border: 'none', color: '#fff', padding: '9px 14px', cursor: 'pointer', fontSize: 15 }}>
                <IonIcon icon={searchOutline} />
              </button>
            </div>

            {/* Profile avatar + dropdown trigger */}
            <div ref={triggerRef} onClick={handleToggleDropdown} style={avatarContainerStyle}>
              {USER_AVATAR ? (
                <img
                  src={`${AVATAR_URL}/${USER_AVATAR}`}
                  alt="avatar"
                  style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }}
                />
              ) : (
                <div style={avatarCircleStyle}>{USER_NAME[0].toUpperCase()}</div>
              )}
              <span style={{ color: '#fff', fontSize: 14 }}>{USER_NAME}</span>
              <IonIcon icon={chevronDownOutline} style={{ fontSize: 14, color: '#aaa' }} />
            </div>
          </div>
        </div>

        {/* ── PROFILE DROPDOWN ── */}
        {showDropdown && (
          <div style={{ position: 'fixed', top: dropdownPos.top, right: dropdownPos.right, background: '#fff', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', minWidth: 190, zIndex: 99999, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 10 }}>
              {USER_AVATAR ? (
                <img src={`${AVATAR_URL}/${USER_AVATAR}`} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 16 }}>
                  {USER_NAME[0].toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>{USER_NAME}</div>
                <div style={{ color: '#9ca3af', fontSize: '0.72rem' }}>{isAdmin ? 'Administrator' : 'Member'}</div>
              </div>
            </div>

            <div
              onMouseDown={() => { setShowDropdown(false); history.push('/my-profile'); }}
              style={dropdownItemStyle}
              onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <IonIcon icon={personOutline} style={{ fontSize: '1rem', color: '#374151' }} />
              <span>My Profile</span>
            </div>

            <div style={{ height: 1, background: '#e5e7eb', margin: '0 12px' }} />

            <div
              onMouseDown={() => { localStorage.clear(); window.location.href = '/login'; }}
              style={{ ...dropdownItemStyle, color: '#dc2626' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <IonIcon icon={logOutOutline} style={{ fontSize: '1rem', color: '#dc2626' }} />
              <span>Logout</span>
            </div>
          </div>
        )}

        {/* ── PAGE CONTENT ── */}
        <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>

          {/* Page Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontWeight: 700, margin: 0, fontSize: 22, color: '#212529', display: 'flex', alignItems: 'center', gap: 8 }}>
                <IonIcon icon={micOutline} /> My Recordings
              </h2>
              <IonBadge color="dark" mode="ios" style={{ fontSize: '1rem', padding: '4px 10px' }}>
                {filtered.length}
              </IonBadge>
            </div>
            <button
              onClick={() => history.push('/songs')}
              style={{ background: '#212529', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <IonIcon icon={musicalNotesOutline} /> Go to Songs
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <IonSpinner name="crescent" color="dark" />
            </div>
          )}

          {/* Table Card */}
          {!loading && (
            <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ background: '#212529', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <IonIcon icon={micOutline} style={{ color: '#fff', fontSize: 18 }} />
                <span style={{ color: '#fff', fontWeight: 600, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>All Recordings</span>
              </div>

              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 0', color: '#aaa' }}>
                  <IonIcon icon={micOutline} style={{ fontSize: 48, display: 'block', margin: '0 auto 12px' }} />
                  No recordings found.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: '#212529' }}>
                        {['#', 'Song', 'Date Recorded', 'Audio', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#fff', fontWeight: 600, fontSize: 13 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((rec, index) => (
                        <tr key={rec.id}
                          style={{ borderBottom: '1px solid #f0f0f0', background: '#fff' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f8f9fa')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                        >
                          <td style={{ padding: '14px 16px', color: '#aaa' }}>{index + 1}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: '#212529' }}>{rec.song}</td>
                          <td style={{ padding: '14px 16px', color: '#6c757d', fontSize: 13 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <IonIcon icon={timeOutline} /> {rec.date}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <audio controls style={{ height: 35, maxWidth: 250 }}>
                              <source src={`${FILES_BASE}/${rec.file}`} type="audio/webm" />
                            </audio>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => handleViewSong(rec)}
                                style={{ background: '#212529', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                              >
                                <IonIcon icon={eyeOutline} /> View Song
                              </button>
                              <button
                                onClick={() => handleDownload(rec.file)}
                                title="Download"
                                style={{ background: '#fff', border: '1px solid #dee2e6', borderRadius: 4, padding: '6px 8px', color: '#495057', cursor: 'pointer' }}
                              >
                                <IonIcon icon={downloadOutline} />
                              </button>
                              <button
                                onClick={() => handleDelete(rec.id)}
                                title="Delete"
                                style={{ background: '#fff', border: '1px solid #ffc9c9', borderRadius: 4, padding: '6px 8px', color: '#fa5252', cursor: 'pointer' }}
                              >
                                <IonIcon icon={trashOutline} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: 40, textAlign: 'center', color: '#adb5bd', fontSize: 13 }}>
            © 2026 Ad Jesum Song List System
          </div>
        </div>

      </IonContent>

      <IonToast
        isOpen={toast.show}
        message={toast.msg}
        color={toast.color as any}
        duration={2500}
        onDidDismiss={() => setToast(t => ({ ...t, show: false }))}
        position="bottom"
      />
    </IonPage>
  );
};

/* ── Styles ── */
const navStyle: React.CSSProperties             = { background: '#111827', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 };
const avatarContainerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 14, cursor: 'pointer' };
const avatarCircleStyle: React.CSSProperties    = { width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff' };
const dropdownItemStyle: React.CSSProperties    = { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', cursor: 'pointer', fontSize: '0.85rem', color: '#374151', fontWeight: 500, background: 'transparent' };

export default Recordings;