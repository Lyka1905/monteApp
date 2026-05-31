import React, { useState, useEffect } from 'react';
import {
  IonContent, IonPage, IonIcon, IonSpinner
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  megaphoneOutline, trashOutline, addOutline,
  personOutline, timeOutline,
} from 'ionicons/icons';
import Navbar from '../components/Navbar';

const API_BASE_URL = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_Announcements';

interface Announcement {
  id: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
}

const Announcements: React.FC = () => {
  const history = useHistory();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [search,        setSearch]        = useState('');
  const [showModal,     setShowModal]     = useState(false);
  const [form,          setForm]          = useState({ title: '', content: '' });
  const [formError,     setFormError]     = useState('');
  const [submitting,    setSubmitting]    = useState(false);

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
      const res  = await fetch(`${API_BASE_URL}/store`, { method: 'POST', body: formData });
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

        <Navbar
          searchPlaceholder="Search announcements..."
          onSearch={q => setSearch(q)}
        />

        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <IonIcon icon={megaphoneOutline} style={{ fontSize: 22 }} />
              Announcements
            </h1>
            {isAdmin && (
              <button onClick={() => setShowModal(true)} style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <IonIcon icon={addOutline} style={{ fontSize: 16 }} /> Post
              </button>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ background: '#111', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <IonIcon icon={megaphoneOutline} style={{ color: '#fff', fontSize: 16 }} />
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>All Announcements</span>
              <span style={{ background: '#555', color: '#fff', borderRadius: 12, padding: '1px 9px', fontSize: 12, fontWeight: 700 }}>{filtered.length}</span>
              <button onClick={fetchAnnouncements} style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid #555', color: '#ccc', borderRadius: 5, padding: '3px 10px', fontSize: 12, cursor: 'pointer' }}>↺</button>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <IonSpinner name="crescent" />
              </div>
            ) : error ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#e53e3e' }}>
                <p style={{ marginBottom: 12 }}>⚠️ {error}</p>
                <button onClick={fetchAnnouncements} style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 13, cursor: 'pointer' }}>Try Again</button>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>
                <IonIcon icon={megaphoneOutline} style={{ fontSize: 40, marginBottom: 10 }} />
                <p>No announcements yet.</p>
              </div>
            ) : (
              filtered.map((a, i) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px', borderBottom: i < filtered.length - 1 ? '1px solid #f0f0f0' : 'none', gap: 12 }}>
                  <div style={{ width: 28, height: 28, minWidth: 28, borderRadius: '50%', background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, marginTop: 2 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{a.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#888', marginBottom: 6 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IonIcon icon={personOutline} style={{ fontSize: 12 }} /> {a.author}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IonIcon icon={timeOutline} style={{ fontSize: 12 }} /> {a.created_at}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#444', whiteSpace: 'pre-line' }}>{a.content}</div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => deleteAnnouncement(a.id, a.title)}
                      style={{ background: '#fff', border: '2px solid #e53e3e', borderRadius: 5, width: 32, height: 32, minWidth: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <IonIcon icon={trashOutline} style={{ color: '#e53e3e', fontSize: 15 }} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* POST MODAL */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
            <div style={{ background: '#fff', borderRadius: 10, width: '100%', maxWidth: 500, overflow: 'hidden' }}>
              <div style={{ background: '#111', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IonIcon icon={megaphoneOutline} /> Post Announcement
                </span>
                <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ padding: 16 }}>
                {formError && (
                  <div style={{ background: '#fff0f0', color: '#e53e3e', borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: 13 }}>
                    {formError}
                  </div>
                )}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Title *</label>
                  <input
                    placeholder="e.g. Practice this Sunday!"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Content *</label>
                  <textarea
                    rows={4}
                    placeholder="Write your announcement here..."
                    value={form.content}
                    onChange={e => setForm({ ...form, content: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
              </div>
              <div style={{ padding: '10px 16px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={closeModal} style={{ background: '#eee', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button onClick={submitPost} disabled={submitting} style={{ background: submitting ? '#555' : '#111', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        )}

      </IonContent>
    </IonPage>
  );
};

export default Announcements;