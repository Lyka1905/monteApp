import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  IonContent, IonPage, IonSpinner, IonToast, IonIcon
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { 
  pricetagsOutline, addOutline, trashOutline, 
  musicalNotesOutline, chevronDownOutline,
  searchOutline, personOutline, logOutOutline,
} from 'ionicons/icons';

const BASE_URL = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_Categories';

interface Category {
  id: number;
  name: string;
  description: string;
}

const stored      = JSON.parse(localStorage.getItem('user') ?? '{}');
const USER_NAME   = stored?.name   ?? 'User';
const USER_AVATAR = stored?.avatar ?? '';
const AVATAR_URL  = 'https://itservicesph.com/IT383/MONTE/monte/uploads/avatars';

const Categories: React.FC = () => {
  const history    = useHistory();
  const triggerRef = useRef<HTMLDivElement>(null);

  const [categories,   setCategories]  = useState<Category[]>([]);
  const [loading,      setLoading]     = useState(true);
  const [toast,        setToast]       = useState({ show: false, message: '', color: 'success' });
  const [showModal,    setShowModal]   = useState(false);
  const [form,         setForm]        = useState({ name: '', description: '' });
  const [submitting,   setSubmitting]  = useState(false);
  const [search,       setSearch]       = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos,  setDropdownPos]  = useState({ top: 0, right: 0 });

  const user    = JSON.parse(localStorage.getItem('user') ?? '{}');
  const isAdmin = user.role === 'admin';

  const showToast = (message: string, color = 'success') =>
    setToast({ show: true, message, color });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/index`);
      const json = await res.json();
      if (json.status) setCategories(json.data || []);
      else showToast(json.message || 'Failed to load.', 'danger');
    } catch {
      showToast('Network error.', 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

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

  const handleStore = async () => {
    if (!form.name.trim()) { showToast('Name is required.', 'danger'); return; }
    setSubmitting(true);
    try {
      const body = new FormData();
      body.append('name', form.name.trim());
      body.append('description', form.description.trim());
      const res  = await fetch(`${BASE_URL}/store`, { method: 'POST', body });
      const json = await res.json();
      if (json.status) {
        showToast('Category added!');
        setForm({ name: '', description: '' });
        setShowModal(false);
        fetchCategories();
      } else showToast(json.message || 'Failed to add.', 'danger');
    } catch {
      showToast('Network error.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      const res  = await fetch(`${BASE_URL}/delete/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.status) { showToast('Category deleted.'); fetchCategories(); }
      else showToast(json.message || 'Failed to delete.', 'danger');
    } catch {
      showToast('Network error.', 'danger');
    }
  };

  return (
    <IonPage>
      <IonContent style={{ '--background': '#f4f6fb' } as any}>

        {/* ── NAVBAR — same style as SongDetails, no duplicate header ── */}
        <div style={navStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Search bar */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
              <input
                placeholder="Search categories..."
                style={{ border: 'none', outline: 'none', padding: '8px 14px', fontSize: 14, width: 220 }}
                onChange={e => {
                  const val = e.target.value.toLowerCase();
                  setSearch(val);
                }}
              />
              <button style={{ background: '#2563eb', border: 'none', color: '#fff', padding: '9px 14px', cursor: 'pointer', fontSize: 15 }}>
                <IonIcon icon={searchOutline} />
              </button>
            </div>

            {/* Profile avatar + dropdown */}
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
        <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <IonIcon icon={pricetagsOutline} style={{ fontSize: '2rem', color: '#333' }} />
              <h2 style={{ margin: 0, fontWeight: 700, color: '#333' }}>Categories</h2>
            </div>

            {isAdmin && (
              <button
                onClick={() => setShowModal(true)}
                style={{ background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 18px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <IonIcon icon={addOutline} /> Add Category
              </button>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#2d3436', color: '#fff', padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <IonIcon icon={pricetagsOutline} aria-hidden="true" />
              <span style={{ fontWeight: 600 }}>All Categories</span>
              <span style={{ background: '#636e72', padding: '2px 10px', borderRadius: '20px', fontSize: '12px' }}>
                {categories.length}
              </span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}><IonSpinner name="crescent" /></div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#212529' }}>
                    <tr>
                      <th style={{ color: '#fff', padding: '15px 20px', fontWeight: 600, fontSize: '14px', textAlign: 'left' }}>#</th>
                      <th style={{ color: '#fff', padding: '15px 20px', fontWeight: 600, fontSize: '14px', textAlign: 'left' }}>Name</th>
                      <th style={{ color: '#fff', padding: '15px 20px', fontWeight: 600, fontSize: '14px', textAlign: 'left' }}>Description</th>
                      <th style={{ color: '#fff', padding: '15px 20px', fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.filter(c => c.name.toLowerCase().includes(search)).length > 0 ? (
                      categories.filter(c => c.name.toLowerCase().includes(search)).map((cat, i) => (
                        <tr key={cat.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '15px', color: '#666' }}>{i + 1}</td>
                          <td style={{ padding: '15px', fontWeight: 700, color: '#1a1a1a' }}>{cat.name}</td>
                          <td style={{ padding: '15px', color: '#777', fontSize: '14px' }}>{cat.description || '—'}</td>
                          <td style={{ padding: '15px' }}>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                              <button
                                onClick={() => history.push(`/songs?category=${cat.id}`)}
                                style={{ background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                              >
                                <IonIcon icon={musicalNotesOutline} /> View Songs
                              </button>

                              {isAdmin && (
                                <button
                                  onClick={() => handleDelete(cat.id)}
                                  style={{ background: 'transparent', border: '1px solid #ff7675', borderRadius: '4px', padding: '6px 10px', color: '#ff7675', cursor: 'pointer' }}
                                  aria-label="Delete category"
                                >
                                  <IonIcon icon={trashOutline} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: '#999' }}>No categories found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '40px', color: '#999', fontSize: '12px' }}>
            © 2026 <strong>Ad Jesum Song List System</strong>
          </div>
        </div>

        {/* ── ADD CATEGORY MODAL ── */}
        {showModal && (
          <div
            role="dialog"
            aria-modal="true"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          >
            <div style={{ background: '#fff', borderRadius: '10px', width: '400px', overflow: 'hidden' }}>
              <div style={{ background: '#1a1a2e', color: '#fff', padding: '15px', fontWeight: 700 }}>Add Category</div>
              <div style={{ padding: '20px' }}>
                <label htmlFor="cat-name" style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 600 }}>Name</label>
                <input
                  id="cat-name"
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '15px' }}
                />
                <label htmlFor="cat-desc" style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 600 }}>Description</label>
                <textarea
                  id="cat-desc"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ padding: '15px', textAlign: 'right', background: '#f9f9f9' }}>
                <button onClick={() => setShowModal(false)} style={{ marginRight: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button
                  onClick={handleStore}
                  disabled={submitting}
                  style={{ background: '#1a1a2e', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

      </IonContent>

      <IonToast
        isOpen={toast.show}
        message={toast.message}
        color={toast.color}
        duration={2000}
        onDidDismiss={() => setToast({ ...toast, show: false })}
      />
    </IonPage>
  );
};

/* ── Styles ─────────────────────────────────────────────────────────────── */
const navStyle: React.CSSProperties             = { background: '#111827', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 };
const avatarContainerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 14, cursor: 'pointer' };
const avatarCircleStyle: React.CSSProperties    = { width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff' };
const dropdownItemStyle: React.CSSProperties    = { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', cursor: 'pointer', fontSize: '0.85rem', color: '#374151', fontWeight: 500, background: 'transparent' };

export default Categories;