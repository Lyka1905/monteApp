import React, { useState, useEffect, useCallback } from 'react';
import {
  IonContent, IonPage, IonIcon, IonSpinner, IonToast
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  pricetagsOutline, addOutline, trashOutline, musicalNotesOutline,
} from 'ionicons/icons';
import Navbar from '../components/Navbar';

const BASE_URL = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_Categories';

interface Category {
  id: number;
  name: string;
  description: string;
}

const Categories: React.FC = () => {
  const history = useHistory();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [toast,      setToast]      = useState({ show: false, message: '', color: 'success' });
  const [showModal,  setShowModal]  = useState(false);
  const [form,       setForm]       = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [search,     setSearch]     = useState('');

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

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <IonPage>
      <IonContent style={{ '--background': '#f4f6fb' } as any}>

        <Navbar
          searchPlaceholder="Search categories..."
          onSearch={q => setSearch(q)}
        />

        <div style={{ padding: '16px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <IonIcon icon={pricetagsOutline} style={{ fontSize: 22 }} />
              Categories
            </h2>
            {isAdmin && (
              <button
                onClick={() => setShowModal(true)}
                style={{ background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <IonIcon icon={addOutline} /> Add Category
              </button>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#2d3436', color: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <IonIcon icon={pricetagsOutline} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>All Categories</span>
              <span style={{ background: '#636e72', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>
                {filtered.length}
              </span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><IonSpinner name="crescent" /></div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: 400, borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#212529' }}>
                    <tr>
                      <th style={thStyle}>#</th>
                      <th style={thStyle}>Name</th>
                      <th style={thStyle}>Description</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length > 0 ? filtered.map((cat, i) => (
                      <tr key={cat.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={tdStyle}>{i + 1}</td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#1a1a1a' }}>{cat.name}</td>
                        <td style={{ ...tdStyle, color: '#777', fontSize: 13 }}>{cat.description || '—'}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button
                              onClick={() => history.push(`/songs?category=${cat.id}`)}
                              style={{ background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}
>
  <IonIcon icon={musicalNotesOutline} /> View Songs
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(cat.id)}
                                style={{ background: 'transparent', border: '1px solid #ff7675', borderRadius: 4, padding: '6px 8px', color: '#ff7675', cursor: 'pointer' }}
                              >
                                <IonIcon icon={trashOutline} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#999' }}>No categories found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 32, color: '#999', fontSize: 12 }}>
            © 2026 <strong>Ad Jesum Song List System</strong>
          </div>
        </div>

        {/* ADD MODAL */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '0 16px' }}>
            <div style={{ background: '#fff', borderRadius: 10, width: '100%', maxWidth: 400, overflow: 'hidden' }}>
              <div style={{ background: '#1a1a2e', color: '#fff', padding: '14px 16px', fontWeight: 700 }}>Add Category</div>
              <div style={{ padding: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #ddd', marginBottom: 12, boxSizing: 'border-box' }}
                />
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #ddd', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ padding: '12px 16px', textAlign: 'right', background: '#f9f9f9', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                <button
                  onClick={handleStore}
                  disabled={submitting}
                  style={{ background: '#1a1a2e', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
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

const thStyle: React.CSSProperties = { color: '#fff', padding: '12px 16px', fontWeight: 600, fontSize: 13, textAlign: 'left' };
const tdStyle: React.CSSProperties = { padding: '12px 16px', color: '#555', fontSize: 14 };

export default Categories;