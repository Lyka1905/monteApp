import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent, IonPage, IonIcon, IonSpinner
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  megaphoneOutline, trashOutline, addOutline,
  personOutline, timeOutline, searchOutline,
  chevronDownOutline, logOutOutline,
} from 'ionicons/icons';

const API_BASE_URL = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_Announcements';
const AVATAR_URL   = 'https://itservicesph.com/IT383/MONTE/monte/uploads/avatars';

const stored      = JSON.parse(localStorage.getItem('user') ?? '{}');
const USER_NAME   = stored?.name   ?? 'User';
const USER_AVATAR = stored?.avatar ?? '';

interface Announcement {
  id: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
}

const Announcements: React.FC = () => {
  const history    = useHistory();
  const triggerRef = useRef<HTMLDivElement>(null);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [search,        setSearch]        = useState('');
  const [showModal,     setShowModal]     = useState(false);
  const [form,          setForm]          = useState({ title: '', content: '' });
  const [formError,     setFormError]     = useState('');
  const [submitting,    setSubmitting]    = useState(false);
  const [showDropdown,  setShowDropdown]  = useState(false);
  const [dropdownPos,   setDropdownPos]   = useState({ top: 0, right: 0 });

  const user    = JSON.parse(localStorage.getItem('user') ?? '{}');
  const isAdmin = user.role === 'admin';

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API_BASE_URL}/index`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setAnnouncements(json.data ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

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

  // ✅ FIXED: JSON instead of FormData, user.id instead of hardcoded '1'
 const submitPost = async () => {
    setFormError('');
    if (!form.title.trim() || !form.content.trim()) {
      setFormError('Title and content are required.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title',   form.title.trim());
      formData.append('content', form.content.trim());
      formData.append('user_id', String(user.id));

      const res  = await fetch(`${API_BASE_URL}/store`, {
        method: 'POST',
        body: formData, // ✅ NO Content-Type header — browser mag-se-set automatically
      });
      const json = await res.json();
      if (!res.ok || json.status !== 'success') throw new Error(json.message || 'Failed to post.');
      fetchAnnouncements();
      closeModal();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAnnouncement = async (id: number, title: string) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      const res  = await fetch(`${API_BASE_URL}/delete/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || json.status !== 'success') throw new Error(json.message || 'Failed to delete.');
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError('');
    setForm({ title: '', content: '' });
  };

  const filtered = announcements.filter(a =>
    (a.title?.toLowerCase().includes(search.toLowerCase())) ||
    (a.content?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <IonPage>
      <IonContent style={{ '--background': '#f4f5f8' } as any}>

        {/* ── NAVBAR ── */}
        <div style={navStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
              <input
                type="text"
                placeholder="Search announcements..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', padding: '8px 14px', fontSize: 14, width: 220 }}
              />
              <button style={{ background: '#2563eb', border: 'none', color: '#fff', padding: '9px 14px', cursor: 'pointer', fontSize: 15 }}>
                <IonIcon icon={searchOutline} />
              </button>
            </div>

            <div ref={triggerRef} onClick={handleToggleDropdown} style={avatarContainerStyle}>
              {USER_AVATAR ? (
                <img src={`${AVATAR_URL}/${USER_AVATAR}`} alt="avatar" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} />
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
        <div style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <IonIcon icon={megaphoneOutline} style={{ fontSize: 26 }} />
              Announcements
            </h1>
            {isAdmin && (
              <button onClick={() => setShowModal(true)} style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <IonIcon icon={addOutline} style={{ fontSize: 16 }} /> Post Announcement
              </button>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ background: '#111', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <IonIcon icon={megaphoneOutline} style={{ color: '#fff', fontSize: 18 }} />
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>All Announcements</span>
              <span style={{ background: '#555', color: '#fff', borderRadius: 12, padding: '1px 9px', fontSize: 12, fontWeight: 700 }}>{filtered.length}</span>
              {/* ✅ FIXED: style all on one line — no line breaks inside style={{}} */}
              <button onClick={fetchAnnouncements} style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid #555', color: '#ccc', borderRadius: 5, padding: '3px 10px', fontSize: 12, cursor: 'pointer' }}>↺ Refresh</button>
            </div>

            {loading ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <IonSpinner name="crescent" />
                <p style={{ marginTop: 12, color: '#888', fontSize: 14 }}>Loading announcements...</p>
              </div>
            ) : error ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#e53e3e' }}>
                <p style={{ marginBottom: 12 }}>⚠️ {error}</p>
                <button onClick={fetchAnnouncements} style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 13, cursor: 'pointer' }}>Try Again</button>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#aaa' }}>
                <IonIcon icon={megaphoneOutline} style={{ fontSize: 48, marginBottom: 12 }} />
                <p>No announcements yet.</p>
              </div>
            ) : (
              filtered.map((a, i) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px', borderBottom: i < filtered.length - 1 ? '1px solid #f0f0f0' : 'none', gap: 16 }}>
                  <div style={{ width: 32, height: 32, minWidth: 32, borderRadius: '50%', background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, marginTop: 2 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{a.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#888', marginBottom: 8 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IonIcon icon={personOutline} style={{ fontSize: 13 }} /> {a.author || USER_NAME}
                      </span>
                      <span>|</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IonIcon icon={timeOutline} style={{ fontSize: 13 }} /> {a.created_at}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, color: '#444', whiteSpace: 'pre-line' }}>{a.content}</div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => deleteAnnouncement(a.id, a.title)}
                      style={{ background: '#fff', border: '2px solid #e53e3e', borderRadius: 5, width: 34, height: 34, minWidth: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fff0f0')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                    >
                      <IonIcon icon={trashOutline} style={{ color: '#e53e3e', fontSize: 16 }} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── POST ANNOUNCEMENT MODAL ── */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 10, width: '90%', maxWidth: 500, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
              <div style={{ background: '#111', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IonIcon icon={megaphoneOutline} /> Post Announcement
                </span>
                <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ padding: 20 }}>
                {formError && (
                  <div style={{ background: '#fff0f0', color: '#e53e3e', borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: 13 }}>
                    {formError}
                  </div>
                )}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 5 }}>Title *</label>
                  <input
                    placeholder="e.g. Practice this Sunday!"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 5 }}>Content *</label>
                  <textarea
                    rows={5}
                    placeholder="Write your announcement here..."
                    value={form.content}
                    onChange={e => setForm({ ...form, content: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
              </div>
              <div style={{ padding: '12px 20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={closeModal} style={{ background: '#eee', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button onClick={submitPost} disabled={submitting} style={{ background: submitting ? '#555' : '#111', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {submitting ? <><IonSpinner name="crescent" style={{ width: 14, height: 14 }} /> Posting...</> : 'Post Announcement'}
                </button>
              </div>
            </div>
          </div>
        )}

      </IonContent>
    </IonPage>
  );
};

/* ── Styles ── */
const navStyle: React.CSSProperties             = { background: '#111827', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 };
const avatarContainerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 14, cursor: 'pointer' };
const avatarCircleStyle: React.CSSProperties    = { width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff' };
const dropdownItemStyle: React.CSSProperties    = { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', cursor: 'pointer', fontSize: '0.85rem', color: '#374151', fontWeight: 500, background: 'transparent' };

export default Announcements;