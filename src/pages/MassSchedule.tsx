import React, { useState, useEffect } from 'react';
import {
  IonContent, IonPage, IonIcon, IonSpinner, IonToast
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  calendarOutline, timeOutline, eyeOutline, trashOutline,
  home, addOutline, musicalNotesOutline, closeOutline,
} from 'ionicons/icons';
import Navbar from '../components/Navbar';

const BASE_URL = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_Massschedule';

interface Schedule {
  id: number;
  mass_type: string;
  mass_date: string;
  mass_time: string;
  notes: string;
}
interface Song { id: number; title: string; }
interface ScheduleDetail extends Schedule { songs: Song[]; }

const MassSchedule: React.FC = () => {
  const history = useHistory();

  const user    = JSON.parse(localStorage.getItem('user') ?? '{}');
  const isAdmin = user.role === 'admin';

  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [toast,     setToast]     = useState({ show: false, msg: '', color: 'success' });

  const [viewModal,   setViewModal]   = useState(false);
  const [viewDetail,  setViewDetail]  = useState<ScheduleDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [addModal,      setAddModal]      = useState(false);
  const [allSongs,      setAllSongs]      = useState<Song[]>([]);
  const [form,          setForm]          = useState({ mass_type: '', mass_date: '', mass_time: '', notes: '' });
  const [selectedSongs, setSelectedSongs] = useState<number[]>([]);
  const [saving,        setSaving]        = useState(false);

  const notify = (msg: string, color = 'success') =>
    setToast({ show: true, msg, color });

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/index`);
      const json = await res.json();
      if (json.success) setSchedules(json.data);
      else notify('Failed to load schedules.', 'danger');
    } catch { notify('Network error.', 'danger'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSchedules(); }, []);

  const now      = new Date();
  const upcoming = schedules.filter(s => new Date(s.mass_date) >= now);
  const past     = schedules.filter(s => new Date(s.mass_date) <  now);

  const filterFn = (s: Schedule) =>
    s.mass_type.toLowerCase().includes(search) ||
    (s.notes || '').toLowerCase().includes(search);

  const handleView = async (id: number) => {
    setViewModal(true);
    setViewLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/view/${id}`);
      const json = await res.json();
      if (json.success) setViewDetail({ ...json.data.schedule, songs: json.data.songs });
      else notify('Failed to load schedule.', 'danger');
    } catch { notify('Network error.', 'danger'); }
    finally { setViewLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      const res  = await fetch(`${BASE_URL}/delete/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { notify('Schedule deleted!'); fetchSchedules(); }
      else notify(json.message || 'Delete failed.', 'danger');
    } catch { notify('Network error.', 'danger'); }
  };

  const openAddModal = async () => {
    setForm({ mass_type: '', mass_date: '', mass_time: '', notes: '' });
    setSelectedSongs([]);
    setAddModal(true);
    try {
      const res  = await fetch(`${BASE_URL}/songs`);
      const json = await res.json();
      if (json.success) setAllSongs(json.data);
    } catch {}
  };

  const toggleSong = (id: number) =>
    setSelectedSongs(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );

  const handleSave = async () => {
    if (!form.mass_type || !form.mass_date || !form.mass_time) {
      notify('Mass type, date, and time are required.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const res  = await fetch(`${BASE_URL}/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, song_ids: selectedSongs }),
      });
      const json = await res.json();
      if (json.success) { notify('Schedule added!'); setAddModal(false); fetchSchedules(); }
      else notify(json.message || 'Save failed.', 'danger');
    } catch { notify('Network error.', 'danger'); }
    finally { setSaving(false); }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const renderRows = (list: Schedule[], isUpcoming: boolean) =>
    list.filter(filterFn).map((m, i) => (
      <tr key={m.id} style={{ borderBottom: '1px solid #eee' }}>
        <td style={tdStyle}>{i + 1}</td>
        <td style={{ ...tdStyle, fontWeight: 700 }}>
          {m.mass_type}
          <span style={{ background: isUpcoming ? '#198754' : '#6c757d', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 10, marginLeft: 6 }}>
            {isUpcoming ? 'Upcoming' : 'Past'}
          </span>
        </td>
        <td style={tdStyle}>{formatDate(m.mass_date)}</td>
        <td style={tdStyle}>{m.mass_time}</td>
        <td style={{ ...tdStyle, color: '#888', fontSize: 13 }}>{m.notes || '—'}</td>
        <td style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => handleView(m.id)}
              style={{ background: '#212529', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <IonIcon icon={eyeOutline} /> View
            </button>
            {isAdmin && (
              <button
                onClick={() => handleDelete(m.id)}
                style={{ background: 'transparent', border: '1px solid #dc3545', borderRadius: 4, padding: '6px 8px', color: '#dc3545', cursor: 'pointer' }}>
                <IonIcon icon={trashOutline} />
              </button>
            )}
          </div>
        </td>
      </tr>
    ));

  return (
    <IonPage>
      <IonContent style={{ '--background': '#f8f9fa' } as any}>

        <Navbar
          searchPlaceholder="Search schedules..."
          onSearch={q => setSearch(q.toLowerCase())}
        />

        <div style={{ padding: '16px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <IonIcon icon={home} style={{ fontSize: 22 }} /> Mass Schedule
            </h1>
            {isAdmin && (
              <button
                onClick={openAddModal}
                style={{ background: '#212529', color: '#fff', border: 'none', borderRadius: 5, padding: '7px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <IonIcon icon={addOutline} /> Add
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <IonSpinner name="crescent" color="dark" />
            </div>
          ) : (
            <>
              {/* Upcoming */}
              <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 20 }}>
                <div style={{ background: '#212529', color: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IonIcon icon={calendarOutline} />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Upcoming Masses</span>
                  <span style={{ background: '#6c757d', padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>{upcoming.filter(filterFn).length}</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: 500, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        {['#', 'Mass Type', 'Date', 'Time', 'Notes', 'Actions'].map(h => (
                          <th key={h} style={thStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {upcoming.filter(filterFn).length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#aaa' }}>No upcoming masses.</td></tr>
                      ) : renderRows(upcoming, true)}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Past */}
              <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ background: '#212529', color: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IonIcon icon={timeOutline} />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Past Masses</span>
                  <span style={{ background: '#6c757d', padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>{past.filter(filterFn).length}</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: 500, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        {['#', 'Mass Type', 'Date', 'Time', 'Notes', 'Actions'].map(h => (
                          <th key={h} style={thStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {past.filter(filterFn).length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#aaa' }}>No past masses.</td></tr>
                      ) : renderRows(past, false)}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          <div style={{ marginTop: 40, textAlign: 'center', color: '#adb5bd', fontSize: 13 }}>
            © 2026 Ad Jesum Song List System
          </div>
        </div>

        {/* VIEW MODAL */}
        {viewModal && (
          <div onClick={() => setViewModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 520, overflow: 'hidden' }}>
              <div style={{ background: '#212529', color: '#fff', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>📅 Schedule Details</span>
                <button onClick={() => setViewModal(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>
                  <IonIcon icon={closeOutline} />
                </button>
              </div>
              {viewLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><IonSpinner name="crescent" color="dark" /></div>
              ) : viewDetail && (
                <div style={{ padding: '16px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#6c757d' }}>Mass Type</p>
                  <p style={{ margin: '0 0 14px', fontWeight: 700, fontSize: 16, textTransform: 'capitalize' }}>{viewDetail.mass_type}</p>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 4px', fontSize: 12, color: '#6c757d' }}>Date</p>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{formatDate(viewDetail.mass_date)}</p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 4px', fontSize: 12, color: '#6c757d' }}>Time</p>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{viewDetail.mass_time}</p>
                    </div>
                  </div>
                  {viewDetail.notes && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ margin: '0 0 4px', fontSize: 12, color: '#6c757d' }}>Notes</p>
                      <p style={{ margin: 0, fontSize: 13 }}>{viewDetail.notes}</p>
                    </div>
                  )}
                  {viewDetail.songs?.length > 0 && (
                    <div>
                      <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6c757d' }}>Songs for this Mass</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {viewDetail.songs.map(s => (
                          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f8f9fa', borderRadius: 6 }}>
                            <IonIcon icon={musicalNotesOutline} style={{ color: '#6366f1' }} />
                            <span style={{ fontSize: 13 }}>{s.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setViewModal(false)} style={{ background: '#212529', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADD MODAL */}
        {addModal && (
          <div onClick={() => setAddModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ background: '#212529', color: '#fff', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>➕ Add Mass Schedule</span>
                <button onClick={() => setAddModal(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>
                  <IonIcon icon={closeOutline} />
                </button>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Mass Type *</label>
                  <input placeholder="e.g. Sunday Mass" value={form.mass_type} onChange={e => setForm(f => ({ ...f, mass_type: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Date *</label>
                    <input type="date" value={form.mass_date} onChange={e => setForm(f => ({ ...f, mass_date: e.target.value }))} style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Time *</label>
                    <input type="time" value={form.mass_time} onChange={e => setForm(f => ({ ...f, mass_time: e.target.value }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Notes</label>
                  <textarea rows={3} placeholder="Optional notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                {allSongs.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Songs (optional)</label>
                    <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: 6 }}>
                      {allSongs.map(s => (
                        <div key={s.id} onClick={() => toggleSong(s.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', cursor: 'pointer', background: selectedSongs.includes(s.id) ? '#f0f4ff' : 'transparent' }}>
                          <div style={{ width: 18, height: 18, borderRadius: 4, border: selectedSongs.includes(s.id) ? '2px solid #6366f1' : '2px solid #dee2e6', background: selectedSongs.includes(s.id) ? '#6366f1' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {selectedSongs.includes(s.id) && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                          </div>
                          <span style={{ fontSize: 13 }}>{s.title}</span>
                        </div>
                      ))}
                    </div>
                    {selectedSongs.length > 0 && (
                      <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6366f1' }}>{selectedSongs.length} song{selectedSongs.length > 1 ? 's' : ''} selected</p>
                    )}
                  </div>
                )}
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #e5e7eb' }}>
                <button onClick={() => setAddModal(false)} style={{ background: '#fff', color: '#6c757d', border: '1px solid #dee2e6', borderRadius: 6, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ background: '#212529', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13 }}>
                  {saving ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </div>
          </div>
        )}

        <IonToast isOpen={toast.show} message={toast.msg} color={toast.color as any} duration={2500} onDidDismiss={() => setToast(t => ({ ...t, show: false }))} position="bottom" />
      </IonContent>
    </IonPage>
  );
};

const thStyle: React.CSSProperties = { padding: '10px 16px', textAlign: 'left', color: '#495057', fontSize: 12, borderBottom: '2px solid #dee2e6' };
const tdStyle: React.CSSProperties = { padding: '12px 16px', color: '#555', fontSize: 13 };
const labelStyle: React.CSSProperties = { display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #dee2e6', fontSize: 14, boxSizing: 'border-box' };

export default MassSchedule;