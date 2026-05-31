import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage, IonContent, IonSpinner, IonToast,
  IonModal, IonAlert, IonIcon,
  IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonRefresher, IonRefresherContent,
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  eyeOutline, micOutline, addOutline,
  musicalNotesOutline, trashOutline,
  closeOutline, chevronDownOutline,
} from 'ionicons/icons';
import Navbar from '../components/Navbar';

const API_BASE = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_SongDetails';
const getToken = () => localStorage.getItem('auth_token') ?? '';

interface Category { id: number; name: string; }
interface Song {
  id: number; title: string; author: string; composer: string;
  category_id: number; category_name?: string; lyrics?: string;
  has_sheet?: any;
}
interface Pagination {
  total: number; per_page: number; current_page: number; last_page: number;
}
const emptyForm = { title: '', author: '', composer: '', lyrics: '', category_id: 0 };

const catColor = (name = '') => {
  const map: Record<string, string> = {
    'Marian': '#2563eb', 'Praise & Worship': '#2563eb',
    'Entrance': '#2563eb', 'Communion': '#2563eb',
    'Offertory': '#7c3aed', 'Recessional': '#0891b2',
  };
  return map[name] ?? '#2563eb';
};

const SongDetails: React.FC = () => {
  const history  = useHistory();
  const location = useLocation();

  const [songs,       setSongs]      = useState<Song[]>([]);
  const [categories,  setCategories] = useState<Category[]>([]);
  const [pagination,  setPagination] = useState<Pagination | null>(null);
  const [loading,     setLoading]    = useState(false);
  const [search,      setSearch]     = useState('');
  const [catFilter,   setCatFilter]  = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return Number(params.get('category')) || 0;
  });
  const [catOpen,     setCatOpen]    = useState(false);
  const [toast,       setToast]      = useState({ show: false, msg: '', color: 'success' });
  const [showForm,    setShowForm]   = useState(false);
  const [editSong,    setEditSong]   = useState<Song | null>(null);
  const [form,        setForm]       = useState({ ...emptyForm });
  const [deleteAlert, setDeleteAlert]= useState<{ show: boolean; id: number | null }>({ show: false, id: null });
  const [saving,      setSaving]     = useState(false);

  const fetchSongs = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pg), limit: '20',
        ...(search    ? { search }                      : {}),
        ...(catFilter ? { category: String(catFilter) } : {}),
      });
      const res  = await fetch(`${API_BASE}/songs?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (json.success) {
        setSongs(json.data.songs);
        setCategories(json.data.categories);
        setPagination(json.data.pagination);
      }
    } catch { notify('Failed to load songs.', 'danger'); }
    finally  { setLoading(false); }
  }, [search, catFilter]);

  useEffect(() => { fetchSongs(); }, [fetchSongs]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const catId  = Number(params.get('category')) || 0;
    if (catId !== catFilter) setCatFilter(catId);
  }, [location.search]);

  const notify = (msg: string, color = 'success') =>
    setToast({ show: true, msg, color });

  const openAdd = () => {
    setEditSong(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { notify('Title is required.', 'warning'); return; }
    setSaving(true);
    try {
      const url    = editSong ? `${API_BASE}/update/${editSong.id}` : `${API_BASE}/create_song`;
      const method = editSong ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        notify(editSong ? 'Song updated!' : 'Song added!');
        setShowForm(false);
        fetchSongs();
      } else notify(json.message ?? 'Something went wrong.', 'danger');
    } catch { notify('Network error.', 'danger'); }
    finally  { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      const res  = await fetch(`${API_BASE}/delete/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (json.success) { notify('Song deleted.'); fetchSongs(); }
      else notify(json.message ?? 'Delete failed.', 'danger');
    } catch { notify('Network error.', 'danger'); }
  };

  const selectedCatName = catFilter
    ? (categories.find(c => c.id === catFilter)?.name ?? 'All Categories')
    : 'All Categories';

  return (
    <IonPage>
      <IonContent style={{ '--background': '#f3f4f6' }}>

        <IonRefresher slot="fixed" onIonRefresh={e => { fetchSongs(); e.detail.complete(); }}>
          <IonRefresherContent />
        </IonRefresher>

        <Navbar
          searchPlaceholder="Search songs..."
          onSearch={q => { setSearch(q); }}
        />

        <div style={{ padding: '16px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IonIcon icon={musicalNotesOutline} style={{ fontSize: 22, color: '#111' }} />
              <span style={{ fontSize: 20, fontWeight: 800, color: '#111', fontFamily: 'Georgia, serif' }}>Songs</span>
              <span style={{ background: '#2563eb', color: '#fff', borderRadius: 7, padding: '2px 10px', fontWeight: 700, fontSize: 13 }}>
                {pagination?.total ?? songs.length}
              </span>
            </div>
            <button onClick={openAdd} style={btnPrimaryStyle}>
              <IonIcon icon={addOutline} /> Add
            </button>
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160, position: 'relative' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchSongs()}
                placeholder="Search title, author..."
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setCatOpen(o => !o)} style={{ background: '#fff', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '9px 12px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                {selectedCatName} <IonIcon icon={chevronDownOutline} style={{ fontSize: 13 }} />
              </button>
              {catOpen && (
                <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 200, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 180, overflow: 'hidden' }}>
                  <div onClick={() => { setCatFilter(0); setCatOpen(false); }} style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 13, background: catFilter === 0 ? '#eff6ff' : 'transparent', color: catFilter === 0 ? '#2563eb' : '#111' }}>All Categories</div>
                  {categories.map(c => (
                    <div key={c.id} onClick={() => { setCatFilter(c.id); setCatOpen(false); }} style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 13, background: catFilter === c.id ? '#eff6ff' : 'transparent', color: catFilter === c.id ? '#2563eb' : '#111', fontWeight: catFilter === c.id ? 600 : 400 }}>{c.name}</div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => fetchSongs()} style={btnPrimaryStyle}>Search</button>
            <button onClick={() => { setSearch(''); setCatFilter(0); }} style={btnOutlineStyle}>Clear</button>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: '60px 0' }}><IonSpinner name="crescent" color="primary" /></div>}

          {!loading && songs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
              <IonIcon icon={musicalNotesOutline} style={{ fontSize: 48, marginBottom: 12 }} />
              <h2 style={{ color: '#374151', fontWeight: 700, fontSize: 18 }}>No songs found</h2>
              <p style={{ fontSize: 14 }}>Try adjusting your search or filters.</p>
            </div>
          )}

          {!loading && songs.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {songs.map((song, idx) => (
                <SongCard
                  key={song.id} song={song} index={idx + 1}
                  onView={() => history.push(`/song-view/${song.id}`)}
                  onRecord={() => history.push(`/record/${song.id}`)}
                />
              ))}
            </div>
          )}

          {pagination && pagination.last_page > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
              {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(pg => (
                <button key={pg} onClick={() => fetchSongs(pg)} style={{ background: pg === pagination.current_page ? '#2563eb' : '#fff', color: pg === pagination.current_page ? '#fff' : '#374151', border: '1.5px solid #d1d5db', borderRadius: 6, padding: '6px 14px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>{pg}</button>
              ))}
            </div>
          )}
        </div>

        {/* ADD/EDIT MODAL */}
        <IonModal isOpen={showForm} onDidDismiss={() => setShowForm(false)}>
          <div style={{ background: '#0f1c35', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{editSong ? 'Edit Song' : '+ Add New Song'}</span>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer' }}><IonIcon icon={closeOutline} /></button>
          </div>
          <IonContent style={{ '--background': '#f3f4f6' }} className="ion-padding">
            <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(['title', 'author', 'composer'] as const).map(f => (
                <div key={f}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 5 }}>{f.charAt(0).toUpperCase() + f.slice(1)}{f === 'title' ? ' *' : ''}</label>
                  <IonInput value={String(form[f])} onIonInput={e => setForm(p => ({ ...p, [f]: e.detail.value ?? '' }))} style={{ background: '#fff', borderRadius: 8, border: '1.5px solid #d1d5db', '--padding-start': '12px', '--padding-end': '12px' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 5 }}>Category</label>
                <IonSelect value={form.category_id} onIonChange={e => setForm(p => ({ ...p, category_id: Number(e.detail.value) }))} style={{ background: '#fff', borderRadius: 8, border: '1.5px solid #d1d5db', '--padding-start': '12px', '--padding-end': '12px' }}>
                  <IonSelectOption value={0}>— None —</IonSelectOption>
                  {categories.map(c => <IonSelectOption key={c.id} value={c.id}>{c.name}</IonSelectOption>)}
                </IonSelect>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 5 }}>Lyrics</label>
                <IonTextarea value={form.lyrics} onIonInput={e => setForm(p => ({ ...p, lyrics: e.detail.value ?? '' }))} rows={8} style={{ background: '#fff', borderRadius: 8, border: '1.5px solid #d1d5db', fontFamily: 'monospace', fontSize: 13, '--padding-start': '12px', '--padding-end': '12px' }} />
              </div>
              <button onClick={handleSave} disabled={saving} style={{ ...btnPrimaryStyle, padding: '12px', opacity: saving ? 0.7 : 1, width: '100%', justifyContent: 'center' }}>
                {saving ? 'Saving...' : editSong ? 'Save Changes' : 'Add Song'}
              </button>
            </div>
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={deleteAlert.show}
          onDidDismiss={() => setDeleteAlert({ show: false, id: null })}
          header="Delete Song" message="Are you sure? This cannot be undone."
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Delete', role: 'destructive', handler: () => { if (deleteAlert.id) handleDelete(deleteAlert.id); } }
          ]}
        />

        <IonToast isOpen={toast.show} message={toast.msg} color={toast.color as any} duration={2500} onDidDismiss={() => setToast(t => ({ ...t, show: false }))} position="bottom" />
      </IonContent>
    </IonPage>
  );
};

/* Sub-components */
const SongCard: React.FC<{ song: Song; index: number; onView: () => void; onRecord: () => void }> = ({ song, index, onView, onRecord }) => (
  <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 5px rgba(0,0,0,0.09)', display: 'flex', flexDirection: 'column' }}>
    <div style={{ background: '#0f1c35', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ background: '#2563eb', color: '#fff', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{index}</span>
      <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{song.title}</span>
    </div>
    <div style={{ padding: '14px 14px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9ca3af', fontSize: 12, marginBottom: 4 }}><span>👤</span> Author</div>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>{song.author || '—'}</div>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9ca3af', fontSize: 12, marginBottom: 4 }}><span>🎵</span> Composer</div>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>{song.composer || '—'}</div>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9ca3af', fontSize: 12, marginBottom: 4 }}><span>🏷️</span> Category</div>
        {song.category_name
          ? <span style={{ background: catColor(song.category_name), color: '#fff', borderRadius: 5, padding: '3px 10px', fontSize: 12, fontWeight: 700, display: 'inline-block' }}>{song.category_name}</span>
          : <span style={{ color: '#9ca3af', fontSize: 13 }}>—</span>}
      </div>
    </div>
    <div style={{ padding: '0 12px 12px', display: 'flex', gap: 8 }}>
      <button onClick={onView} style={{ ...btnPrimaryStyle, flex: 1, fontSize: 13, justifyContent: 'center' }}><IonIcon icon={eyeOutline} /> View</button>
      <button onClick={onRecord} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7, width: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}><IonIcon icon={micOutline} /></button>
    </div>
  </div>
);

const btnPrimaryStyle: React.CSSProperties = { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 };
const btnOutlineStyle: React.CSSProperties = { background: '#fff', color: '#111', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '9px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 };

export default SongDetails;