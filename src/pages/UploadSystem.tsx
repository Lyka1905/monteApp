import React, { useState, useEffect, useCallback } from 'react';
import {
  IonContent, IonPage,
  IonIcon, IonSpinner, IonToast
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  searchOutline, checkmarkOutline, closeOutline,
  pencilOutline, addOutline, musicalNotesOutline,
} from 'ionicons/icons';
import Navbar from '../components/Navbar';

const API_BASE = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_Musicsheet';
const getToken = () => localStorage.getItem('auth_token') ?? '';

interface Category { id: number; name: string; }
interface Song {
  id: number; title: string; author: string;
  category_name: string; has_sheet: boolean;
}

const UploadSystem: React.FC = () => {
  const history = useHistory();
  const [songs,      setSongs]      = useState<Song[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState('');
  const [loading,    setLoading]    = useState(false);
  const [toast,      setToast]      = useState({ show: false, msg: '', color: 'success' });

  const notify = (msg: string, color = 'success') =>
    setToast({ show: true, msg, color });

  const fetchSongs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)   params.append('search', search);
      if (category) params.append('category', category);
      const res  = await fetch(`${API_BASE}/songs?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (json.success) {
        setSongs(json.data.songs);
        setCategories(json.data.categories);
      } else notify('Failed to load songs.', 'danger');
    } catch { notify('Network error.', 'danger'); }
    finally  { setLoading(false); }
  }, [search, category]);

  useEffect(() => { fetchSongs(); }, [fetchSongs]);

  return (
    <IonPage>
      <IonContent style={{ '--background': '#f4f6fb' }}>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" />

        <Navbar searchPlaceholder="Search songs..." onSearch={q => setSearch(q)} />

        <div className="container-fluid py-4 px-3">

          {/* Header */}
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h1 className="h4 fw-bold mb-0">
              <i className="fas fa-file-alt me-2" /> Music Sheet Builder
            </h1>
          </div>
          <p className="text-muted mb-4 small">Select a song to build or edit its music sheet.</p>

          {/* Search & Filter */}
          <div className="card mb-3 border-0 shadow-sm" style={{ borderRadius: 10 }}>
            <div className="card-body py-2">
              <div className="row g-2 align-items-center">
                <div className="col-md-6">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white border-end-0">
                      <IonIcon icon={searchOutline} style={{ color: '#aaa' }} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search songs..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && fetchSongs()}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <select
                    className="form-select form-select-sm"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map(c => (
                      <option key={c.id} value={String(c.id)}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2 d-flex gap-1">
                  <button onClick={fetchSongs} className="btn btn-dark btn-sm w-100">Search</button>
                  <button
                    onClick={() => { setSearch(''); setCategory(''); }}
                    className="btn btn-outline-secondary btn-sm w-100"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div className="text-center py-5">
              <IonSpinner name="crescent" color="dark" />
            </div>
          )}

          {!loading && (
            <div className="card border-0 shadow-sm" style={{ borderRadius: 10, overflow: 'hidden' }}>
              <div className="card-header bg-dark text-white py-3 border-0 d-flex align-items-center gap-2">
                <i className="fas fa-list" />
                <span className="fw-bold small text-uppercase">Songs</span>
                <span className="badge bg-secondary ms-1">{songs.length}</span>
              </div>

              {songs.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <IonIcon icon={musicalNotesOutline} style={{ fontSize: '3rem', display: 'block', margin: '0 auto 12px' }} />
                  No songs found.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.9rem' }}>
                    <thead className="table-light">
                      <tr className="text-muted small">
                        <th className="ps-3">#</th>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Category</th>
                        <th>Sheet Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {songs.map((song, i) => (
                        <tr key={song.id}>
                          <td className="ps-3 text-muted">{i + 1}</td>
                          <td><strong>{song.title}</strong></td>
                          <td className="text-muted small">{song.author || '—'}</td>
                          <td>
                            <span className="badge bg-dark rounded-1 fw-normal">
                              {song.category_name || 'Uncategorized'}
                            </span>
                          </td>
                          <td>
                            {song.has_sheet ? (
                              <span style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <IonIcon icon={checkmarkOutline} /> Has Sheet
                              </span>
                            ) : (
                              <span style={{ background: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <IonIcon icon={closeOutline} /> No Sheet
                              </span>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() => history.push(`/sheet-builder/${song.id}`)}
                              style={{ background: '#212529', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                            >
                              <IonIcon icon={song.has_sheet ? pencilOutline : addOutline} />
                              {song.has_sheet ? 'Edit Sheet' : '+ Create Sheet'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <IonToast
          isOpen={toast.show} message={toast.msg} color={toast.color as any}
          duration={2500} onDidDismiss={() => setToast(t => ({ ...t, show: false }))}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default UploadSystem;