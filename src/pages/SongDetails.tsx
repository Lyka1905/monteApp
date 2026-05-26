import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  closeOutline, searchOutline, chevronDownOutline,
  personOutline, logOutOutline,
} from 'ionicons/icons';

const API_BASE  = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_SongDetails';
const getToken  = () => localStorage.getItem('auth_token') ?? '';

const stored      = JSON.parse(localStorage.getItem('user') ?? '{}');
const USER_NAME   = stored?.name   ?? 'User';
const USER_AVATAR = stored?.avatar ?? '';
const AVATAR_URL  = 'https://itservicesph.com/IT383/MONTE/monte/uploads/avatars';

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
  const history    = useHistory();
  const location   = useLocation();
  const triggerRef = useRef<HTMLDivElement>(null);

  const [songs,        setSongs]       = useState<Song[]>([]);
  const [categories,   setCategories]  = useState<Category[]>([]);
  const [pagination,   setPagination]  = useState<Pagination | null>(null);
  const [loading,      setLoading]     = useState(false);
  const [search,       setSearch]      = useState('');
  const [catFilter,    setCatFilter]   = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return Number(params.get('category')) || 0;
  });
  const [catOpen,      setCatOpen]     = useState(false);
  const [toast,        setToast]       = useState({ show: false, msg: '', color: 'success' });
  const [showForm,     setShowForm]    = useState(false);
  const [editSong,     setEditSong]    = useState<Song | null>(null);
  const [form,         setForm]        = useState({ ...emptyForm });
  const [deleteAlert,  setDeleteAlert] = useState<{ show: boolean; id: number | null }>({ show: false, id: null });
  const [saving,       setSaving]      = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos,  setDropdownPos]  = useState({ top: 0, right: 0 });

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notify = (msg: string, color = 'success') =>
    setToast({ show: true, msg, color });

  const openAdd = () => {
    setEditSong(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const openEdit = (s: Song) => {
    setEditSong(s);
    setForm({
      title: s.title, author: s.author ?? '',
      composer: s.composer ?? '', lyrics: s.lyrics ?? '',
      category_id: s.category_id ?? 0,
    });
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

  const handleToggleDropdown = () => {
    if (!showDropdown && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setShowDropdown(o => !o);
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

        {/* NAVBAR */}
        <div style={navStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={searchContainerStyle}>
              <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchSongs()} placeholder="Search songs..." style={navInputStyle} />
              <button onClick={() => fetchSongs()} style={navSearchBtnStyle}><IonIcon icon={searchOutline} /></button>
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

        {/* PROFILE DROPDOWN */}
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
                <div style={{ color: '#9ca3af', fontSize: '0.72rem' }}>Administrator</div>
              </div>
            </div>
            <div onMouseDown={() => { setShowDropdown(false); history.push('/my-profile'); }} style={dropdownItemStyle} onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <IonIcon icon={personOutline} style={{ fontSize: '1rem', color: '#374151' }} /><span>My Profile</span>
            </div>
            <div style={{ height: 1, background: '#e5e7eb', margin: '0 12px' }} />
            <div onMouseDown={() => { localStorage.clear(); window.location.href = '/login'; }} style={{ ...dropdownItemStyle, color: '#dc2626' }} onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <IonIcon icon={logOutOutline} style={{ fontSize: '1rem', color: '#dc2626' }} /><span>Logout</span>
            </div>
          </div>
        )}

        <div style={{ padding: '28px 28px 80px', maxWidth: 1400, margin: '0 auto' }}>
          <div style={headerRowStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <IonIcon icon={musicalNotesOutline} style={{ fontSize: 26, color: '#111' }} />
              <span style={titleStyle}>Songs</span>
              <span style={badgeStyle}>{pagination?.total ?? songs.length}</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={openAdd} style={btnPrimaryStyle}><IonIcon icon={addOutline} /> Add Song</button>
            </div>
          </div>

          <div style={filterBarStyle}>
            <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
              <IonIcon icon={searchOutline} style={searchIconStyle} />
              <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchSongs()} placeholder="Search title, author, composer..." style={filterInputStyle} />
            </div>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setCatOpen(o => !o)} style={dropdownButtonStyle}>
                {selectedCatName}<IonIcon icon={chevronDownOutline} style={{ fontSize: 14, color: '#6b7280' }} />
              </button>
              {catOpen && (
                <div style={dropdownMenuStyle}>
                  <div onClick={() => { setCatFilter(0); setCatOpen(false); }} style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 14, background: catFilter === 0 ? '#eff6ff' : 'transparent', color: catFilter === 0 ? '#2563eb' : '#111' }}>All Categories</div>
                  {categories.map(c => (
                    <div key={c.id} onClick={() => { setCatFilter(c.id); setCatOpen(false); }} style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 14, background: catFilter === c.id ? '#eff6ff' : 'transparent', color: catFilter === c.id ? '#2563eb' : '#111', fontWeight: catFilter === c.id ? 600 : 400 }}>{c.name}</div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => fetchSongs()} style={btnPrimaryStyle}>Search</button>
            <button onClick={() => { setSearch(''); setCatFilter(0); }} style={btnOutlineStyle}>Clear</button>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: '80px 0' }}><IonSpinner name="crescent" color="primary" /></div>}

          {!loading && songs.length === 0 && (
            <div style={emptyStateStyle}>
              <IonIcon icon={musicalNotesOutline} style={{ fontSize: 56, marginBottom: 12 }} />
              <h2 style={{ color: '#374151', fontWeight: 700 }}>No songs found</h2>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}

          {!loading && songs.length > 0 && (
            <div style={gridStyle}>
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
            <div style={paginationRowStyle}>
              {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(pg => (
                <button key={pg} onClick={() => fetchSongs(pg)} style={{ background: pg === pagination.current_page ? '#2563eb' : '#fff', color: pg === pagination.current_page ? '#fff' : '#374151', border: '1.5px solid #d1d5db', borderRadius: 6, padding: '6px 14px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>{pg}</button>
              ))}
            </div>
          )}
        </div>

        {/* ADD/EDIT MODAL */}
        <IonModal isOpen={showForm} onDidDismiss={() => setShowForm(false)}>
          <div style={modalHeaderStyle}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{editSong ? 'Edit Song' : '+ Add New Song'}</span>
            <button onClick={() => setShowForm(false)} style={closeBtnStyle}><IonIcon icon={closeOutline} /></button>
          </div>
          <IonContent style={{ '--background': '#f3f4f6' }} className="ion-padding">
            <div style={formContainerStyle}>
              {(['title', 'author', 'composer'] as const).map(f => (
                <FormField key={f} label={f.charAt(0).toUpperCase() + f.slice(1) + (f === 'title' ? ' *' : '')}>
                  <IonInput value={String(form[f])} onIonInput={e => setForm(p => ({ ...p, [f]: e.detail.value ?? '' }))} style={inputStyle} />
                </FormField>
              ))}
              <FormField label="Category">
                <IonSelect value={form.category_id} onIonChange={e => setForm(p => ({ ...p, category_id: Number(e.detail.value) }))} style={inputStyle}>
                  <IonSelectOption value={0}>— None —</IonSelectOption>
                  {categories.map(c => <IonSelectOption key={c.id} value={c.id}>{c.name}</IonSelectOption>)}
                </IonSelect>
              </FormField>
              <FormField label="Lyrics">
                <IonTextarea value={form.lyrics} onIonInput={e => setForm(p => ({ ...p, lyrics: e.detail.value ?? '' }))} rows={8} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 13 }} />
              </FormField>
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
  { 
    text: 'Delete', 
    role: 'destructive', 
    handler: () => {
      if (deleteAlert.id) handleDelete(deleteAlert.id);
    }
  }
]}
        />

        <IonToast isOpen={toast.show} message={toast.msg} color={toast.color as any} duration={2500} onDidDismiss={() => setToast(t => ({ ...t, show: false }))} position="bottom" />
      </IonContent>
    </IonPage>
  );
};

/* Sub-components */
const SongCard: React.FC<{ song: Song; index: number; onView: () => void; onRecord: () => void }> = ({ song, index, onView, onRecord }) => (
  <div style={cardStyle}>
    <div style={cardHeaderStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={indexBadgeStyle}>{index}</span>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{song.title}</span>
      </div>
    </div>
    <div style={{ padding: '16px 16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CardField iconChar="👤" label="Author"   value={song.author} />
      <CardField iconChar="🎵" label="Composer" value={song.composer} />
      <div>
        <div style={fieldLabelStyle}><span>🏷️</span> Category</div>
        {song.category_name ? <span style={{ background: catColor(song.category_name), ...tagStyle }}>{song.category_name}</span> : <span style={{ color: '#9ca3af', fontSize: 13 }}>—</span>}
      </div>
     
    </div>
    <div style={{ padding: '0 14px 14px', display: 'flex', gap: 8 }}>
      <button onClick={onView} style={{ ...btnPrimaryStyle, flex: 1, fontSize: 13 }}><IonIcon icon={eyeOutline} /> View Song</button>
      <button onClick={onRecord} style={micBtnStyle}><IonIcon icon={micOutline} /></button>
    </div>
  </div>
);

const CardField: React.FC<{ iconChar: string; label: string; value?: string }> = ({ iconChar, label, value }) => (
  <div>
    <div style={fieldLabelStyle}><span>{iconChar}</span> {label}</div>
    <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{value || '—'}</div>
  </div>
);

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 5 }}>{label}</label>
    {children}
  </div>
);

/* Styles */
const navStyle: React.CSSProperties             = { background: '#111827', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 };
const searchContainerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 8, overflow: 'hidden' };
const navInputStyle: React.CSSProperties        = { border: 'none', outline: 'none', padding: '8px 14px', fontSize: 14, width: 220 };
const navSearchBtnStyle: React.CSSProperties    = { background: '#2563eb', border: 'none', color: '#fff', padding: '9px 14px', cursor: 'pointer', fontSize: 15 };
const avatarContainerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 14, cursor: 'pointer' };
const avatarCircleStyle: React.CSSProperties    = { width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff' };
const headerRowStyle: React.CSSProperties       = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 };
const titleStyle: React.CSSProperties           = { fontSize: 24, fontWeight: 800, color: '#111', fontFamily: 'Georgia, serif' };
const badgeStyle: React.CSSProperties           = { background: '#2563eb', color: '#fff', borderRadius: 7, padding: '3px 13px', fontWeight: 700, fontSize: 14 };
const filterBarStyle: React.CSSProperties       = { display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' };
const searchIconStyle: React.CSSProperties      = { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 16 };
const filterInputStyle: React.CSSProperties     = { width: '100%', padding: '10px 12px 10px 36px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' };
const dropdownButtonStyle: React.CSSProperties  = { background: '#fff', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '10px 14px', fontSize: 14, cursor: 'pointer', minWidth: 180, textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 };
const dropdownMenuStyle: React.CSSProperties    = { position: 'absolute', top: '110%', left: 0, zIndex: 200, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 200, overflow: 'hidden' };
const btnPrimaryStyle: React.CSSProperties      = { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 };
const btnOutlineStyle: React.CSSProperties      = { background: '#fff', color: '#111', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '9px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 };
const emptyStateStyle: React.CSSProperties      = { textAlign: 'center', padding: '80px 0', color: '#9ca3af' };
const gridStyle: React.CSSProperties            = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 };
const paginationRowStyle: React.CSSProperties   = { display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28, flexWrap: 'wrap' };
const modalHeaderStyle: React.CSSProperties     = { background: '#0f1c35', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const closeBtnStyle: React.CSSProperties        = { background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer' };
const formContainerStyle: React.CSSProperties   = { maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 };
const cardStyle: React.CSSProperties            = { background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 5px rgba(0,0,0,0.09)', display: 'flex', flexDirection: 'column' };
const cardHeaderStyle: React.CSSProperties      = { background: '#0f1c35', padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const indexBadgeStyle: React.CSSProperties      = { background: '#2563eb', color: '#fff', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 };
const fieldLabelStyle: React.CSSProperties      = { display: 'flex', alignItems: 'center', gap: 5, color: '#9ca3af', fontSize: 12, marginBottom: 5 };
const tagStyle: React.CSSProperties             = { color: '#fff', borderRadius: 5, padding: '3px 11px', fontSize: 12, fontWeight: 700, display: 'inline-block' };
const micBtnStyle: React.CSSProperties          = { background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7, width: 42, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 };
const inputStyle                                = { background: '#fff', borderRadius: 8, border: '1.5px solid #d1d5db', '--padding-start': '12px', '--padding-end': '12px' };
const dropdownItemStyle: React.CSSProperties    = { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', cursor: 'pointer', fontSize: '0.85rem', color: '#374151', fontWeight: 500, background: 'transparent' };

export default SongDetails;