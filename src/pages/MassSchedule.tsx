import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent, IonPage, IonSpinner, IonToast, IonIcon
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  calendarOutline, timeOutline, eyeOutline, trashOutline,
  home, chevronDownOutline, personOutline, logOutOutline,
  searchOutline, closeOutline, addOutline, musicalNotesOutline,
} from 'ionicons/icons';

const BASE_URL   = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_Massschedule';
const AVATAR_URL = 'https://itservicesph.com/IT383/MONTE/monte/uploads/avatars';

const stored      = JSON.parse(localStorage.getItem('user') ?? '{}');
const USER_NAME   = stored?.name   ?? 'User';
const USER_AVATAR = stored?.avatar ?? '';

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
  const history    = useHistory();
  const triggerRef = useRef<HTMLDivElement>(null);

  const user    = JSON.parse(localStorage.getItem('user') ?? '{}');
  const isAdmin = user.role === 'admin';

  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos,  setDropdownPos]  = useState({ top: 0, right: 0 });
  const [search,       setSearch]       = useState('');
  const [loading,      setLoading]      = useState(false);
  const [schedules,    setSchedules]    = useState<Schedule[]>([]);
  const [toast,        setToast]        = useState({ show: false, msg: '', color: 'success' });

  // View modal
  const [viewModal,   setViewModal]   = useState(false);
  const [viewDetail,  setViewDetail]  = useState<ScheduleDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Add modal
  const [addModal,  setAddModal]  = useState(false);
  const [allSongs,  setAllSongs]  = useState<Song[]>([]);
  const [form,      setForm]      = useState({ mass_type: '', mass_date: '', mass_time: '', notes: '' });
  const [selectedSongs, setSelectedSongs] = useState<number[]>([]);
  const [saving,    setSaving]    = useState(false);

  const notify = (msg: string, color = 'success') =>
    setToast({ show: true, msg, color });

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleToggleDropdown = () => {
    if (!showDropdown && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setShowDropdown(o => !o);
  };

  // Fetch schedules
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

  // Separate upcoming and past
  const now      = new Date();
  const upcoming = schedules.filter(s => new Date(s.mass_date) >= now);
  const past     = schedules.filter(s => new Date(s.mass_date) <  now);

  const filterFn = (s: Schedule) =>
    s.mass_type.toLowerCase().includes(search) ||
    (s.notes || '').toLowerCase().includes(search);

  // View schedule
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

  // Delete schedule
  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      const res  = await fetch(`${BASE_URL}/delete/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { notify('Schedule deleted!'); fetchSchedules(); }
      else notify(json.message || 'Delete failed.', 'danger');
    } catch { notify('Network error.', 'danger'); }
  };

  // Open Add modal — fetch songs too
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

  // Toggle song selection
  const toggleSong = (id: number) =>
    setSelectedSongs(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );

  // Save new schedule
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
      if (json.success) {
        notify('Schedule added!');
        setAddModal(false);
        fetchSchedules();
      } else notify(json.message || 'Save failed.', 'danger');
    } catch { notify('Network error.', 'danger'); }
    finally { setSaving(false); }
  };

  // ── Render table rows ──────────────────────────────────
  const renderRows = (list: Schedule[], isUpcoming: boolean) =>
    list.filter(filterFn).map((m, i) => (
      <tr key={m.id} style={{ borderBottom: '1px solid #eee' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#f8f9fa')}
        onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
        <td style={tdStyle}>{i + 1}</td>
        <td style={{ ...tdStyle, fontWeight: 700 }}>
          {m.mass_type}
          <span style={{ background: isUpcoming ? '#198754' : '#6c757d', color: '#fff', padding: '2px 8px', borderRadius: 5, fontSize: 11, marginLeft: 8 }}>
            {isUpcoming ? 'Upcoming' : 'Past'}
          </span>
        </td>
        <td style={tdStyle}>
          <IonIcon icon={calendarOutline} style={{ marginRight: 5, verticalAlign: 'middle', color: '#888' }} />
          {new Date(m.mass_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </td>
        <td style={tdStyle}>
          <IonIcon icon={timeOutline} style={{ marginRight: 5, verticalAlign: 'middle', color: '#888' }} />
          {m.mass_time}
        </td>
        <td style={{ ...tdStyle, color: '#888', fontSize: 14 }}>{m.notes || '—'}</td>
        <td style={{ padding: '15px 20px', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              onClick={() => handleView(m.id)}
              style={{ background: '#212529', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
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

        {/* Navbar */}
        <div style={navStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
              <input
                placeholder="Search schedules..."
                style={{ border: 'none', outline: 'none', padding: '8px 14px', fontSize: 14, width: 220 }}
                onChange={e => setSearch(e.target.value.toLowerCase())}
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

        {/* Profile Dropdown */}
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
            <div onMouseDown={() => { setShowDropdown(false); history.push('/my-profile'); }} style={dropdownItemStyle} onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <IonIcon icon={personOutline} style={{ fontSize: '1rem', color: '#374151' }} />
              <span>My Profile</span>
            </div>
            <div style={{ height: 1, background: '#e5e7eb', margin: '0 12px' }} />
            <div onMouseDown={() => { localStorage.clear(); window.location.href = '/login'; }} style={{ ...dropdownItemStyle, color: '#dc2626' }} onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <IonIcon icon={logOutOutline} style={{ fontSize: '1rem', color: '#dc2626' }} />
              <span>Logout</span>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div style={{ padding: '30px 40px', maxWidth: 1100, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <IonIcon icon={home} style={{ fontSize: 35, color: '#212529' }} />
              <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700, color: '#212529' }}>Mass Schedule</h1>
            </div>
            {isAdmin && (
              <button
                onClick={openAddModal}
                style={{ background: '#212529', color: '#fff', border: 'none', borderRadius: 5, padding: '10px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <IonIcon icon={addOutline} style={{ fontSize: 20 }} /> Add Schedule
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <IonSpinner name="crescent" color="dark" />
            </div>
          ) : (
            <>
              {/* Upcoming Masses */}
              <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: 30 }}>
                <div style={{ background: '#212529', color: '#fff', padding: '15px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <IonIcon icon={calendarOutline} />
                  <span style={{ fontWeight: 600 }}>Upcoming Masses</span>
                  <span style={{ background: '#6c757d', padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>{upcoming.filter(filterFn).length}</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      {['#', 'Mass Type', 'Date', 'Time', 'Notes', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 20px', textAlign: h === 'Actions' ? 'center' : 'left', color: '#495057', fontSize: 13, borderBottom: '2px solid #dee2e6' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.filter(filterFn).length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px 0', color: '#aaa' }}>No upcoming masses.</td></tr>
                    ) : renderRows(upcoming, true)}
                  </tbody>
                </table>
              </div>

              {/* Past Masses */}
              <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <div style={{ background: '#212529', color: '#fff', padding: '15px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <IonIcon icon={timeOutline} />
                  <span style={{ fontWeight: 600 }}>Past Masses</span>
                  <span style={{ background: '#6c757d', padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>{past.filter(filterFn).length}</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      {['#', 'Mass Type', 'Date', 'Time', 'Notes', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 20px', textAlign: h === 'Actions' ? 'center' : 'left', color: '#495057', fontSize: 13, borderBottom: '2px solid #dee2e6' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {past.filter(filterFn).length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px 0', color: '#aaa' }}>No past masses.</td></tr>
                    ) : renderRows(past, false)}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div style={{ marginTop: 50, textAlign: 'center', color: '#adb5bd', fontSize: 14 }}>
            © 2026 Ad Jesum Song List System
          </div>
        </div>

        {/* ── VIEW MODAL ── */}
        {viewModal && (
          <div onClick={() => setViewModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, width: '90%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ background: '#212529', color: '#fff', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>📅 Schedule Details</span>
                <button onClick={() => setViewModal(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>
                  <IonIcon icon={closeOutline} />
                </button>
              </div>

              {viewLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}><IonSpinner name="crescent" color="dark" /></div>
              ) : viewDetail && (
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: '#6c757d' }}>Mass Type</p>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 16, textTransform: 'capitalize' }}>{viewDetail.mass_type}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 4px', fontSize: 12, color: '#6c757d' }}>Date</p>
                      <p style={{ margin: 0, fontWeight: 600 }}>
                        <IonIcon icon={calendarOutline} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        {new Date(viewDetail.mass_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 4px', fontSize: 12, color: '#6c757d' }}>Time</p>
                      <p style={{ margin: 0, fontWeight: 600 }}>
                        <IonIcon icon={timeOutline} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        {viewDetail.mass_time}
                      </p>
                    </div>
                  </div>
                  {viewDetail.notes && (
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ margin: '0 0 4px', fontSize: 12, color: '#6c757d' }}>Notes</p>
                      <p style={{ margin: 0 }}>{viewDetail.notes}</p>
                    </div>
                  )}
                  {viewDetail.songs && viewDetail.songs.length > 0 && (
                    <div>
                      <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6c757d' }}>Songs for this Mass</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {viewDetail.songs.map(s => (
                          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f8f9fa', borderRadius: 6 }}>
                            <IonIcon icon={musicalNotesOutline} style={{ color: '#6366f1' }} />
                            <span style={{ fontSize: 14 }}>{s.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ padding: '12px 24px 20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setViewModal(false)} style={{ background: '#212529', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ADD MODAL ── */}
        {addModal && (
          <div onClick={() => setAddModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, width: '90%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ background: '#212529', color: '#fff', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>➕ Add Mass Schedule</span>
                <button onClick={() => setAddModal(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>
                  <IonIcon icon={closeOutline} />
                </button>
              </div>

              <div style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: 'calc(90vh - 130px)' }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                    Mass Type <span style={{ color: '#dc3545' }}>*</span>
                  </label>
                  <input
                    className="form-control"
                    placeholder="e.g. Sunday Mass"
                    value={form.mass_type}
                    onChange={e => setForm(f => ({ ...f, mass_type: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #dee2e6', fontSize: 14 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                      Date <span style={{ color: '#dc3545' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={form.mass_date}
                      onChange={e => setForm(f => ({ ...f, mass_date: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #dee2e6', fontSize: 14 }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                      Time <span style={{ color: '#dc3545' }}>*</span>
                    </label>
                    <input
                      type="time"
                      value={form.mass_time}
                      onChange={e => setForm(f => ({ ...f, mass_time: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #dee2e6', fontSize: 14 }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Optional notes..."
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #dee2e6', fontSize: 14, resize: 'vertical' }}
                  />
                </div>

                {/* Song selection */}
                {allSongs.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                      Songs <span style={{ color: '#6c757d', fontWeight: 400 }}>(optional)</span>
                    </label>
                    <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: 6, padding: '8px 0' }}>
                      {allSongs.map(s => (
                        <div key={s.id}
                          onClick={() => toggleSong(s.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', cursor: 'pointer', background: selectedSongs.includes(s.id) ? '#f0f4ff' : 'transparent' }}
                          onMouseEnter={e => { if (!selectedSongs.includes(s.id)) e.currentTarget.style.background = '#f8f9fa'; }}
                          onMouseLeave={e => { if (!selectedSongs.includes(s.id)) e.currentTarget.style.background = 'transparent'; }}>
                          <div style={{ width: 18, height: 18, borderRadius: 4, border: selectedSongs.includes(s.id) ? '2px solid #6366f1' : '2px solid #dee2e6', background: selectedSongs.includes(s.id) ? '#6366f1' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {selectedSongs.includes(s.id) && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                          </div>
                          <span style={{ fontSize: 14 }}>{s.title}</span>
                        </div>
                      ))}
                    </div>
                    {selectedSongs.length > 0 && (
                      <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6366f1' }}>{selectedSongs.length} song{selectedSongs.length > 1 ? 's' : ''} selected</p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer buttons */}
              <div style={{ padding: '12px 24px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #e5e7eb' }}>
                <button onClick={() => setAddModal(false)} style={{ background: '#fff', color: '#6c757d', border: '1px solid #dee2e6', borderRadius: 6, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} style={{ background: '#212529', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 24px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </div>
          </div>
        )}

        <IonToast
          isOpen={toast.show} message={toast.msg} color={toast.color as any}
          duration={2500} onDidDismiss={() => setToast(t => ({ ...t, show: false }))}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

const navStyle: React.CSSProperties             = { background: '#111827', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 };
const avatarContainerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 14, cursor: 'pointer' };
const avatarCircleStyle: React.CSSProperties    = { width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff' };
const dropdownItemStyle: React.CSSProperties    = { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', cursor: 'pointer', fontSize: '0.85rem', color: '#374151', fontWeight: 500, background: 'transparent' };
const tdStyle: React.CSSProperties              = { padding: '15px 20px', color: '#555' };

export default MassSchedule;