import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  IonContent, IonPage, IonIcon, IonSpinner, IonToast
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  peopleOutline, personAddOutline, trashOutline,
  searchOutline, chevronDownOutline, personOutline, logOutOutline,
} from 'ionicons/icons';

const API_BASE   = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_Users';
const AVATAR_URL = 'https://itservicesph.com/IT383/MONTE/monte/uploads/avatars';
const getToken   = () => localStorage.getItem('auth_token') ?? '';

const stored      = JSON.parse(localStorage.getItem('user') ?? '{}');
const USER_NAME   = stored?.name   ?? 'User';
const USER_AVATAR = stored?.avatar ?? '';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  created_at: string;
}

const ManageUsers: React.FC = () => {
  const history    = useHistory();
  const triggerRef = useRef<HTMLDivElement>(null);

  const [users,        setUsers]        = useState<User[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState('');
  const [showModal,    setShowModal]    = useState(false);
  const [form,         setForm]         = useState({ name: '', email: '', password: '', role: 'member' });
  const [formError,    setFormError]    = useState('');
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState({ show: false, msg: '', color: 'success' });
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos,  setDropdownPos]  = useState({ top: 0, right: 0 });

  const user    = JSON.parse(localStorage.getItem('user') ?? '{}');
  const isAdmin = user.role === 'admin';

  const notify = (msg: string, color = 'success') =>
    setToast({ show: true, msg, color });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/index`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (json.success) setUsers(json.data);
      else notify('Failed to load users.', 'danger');
    } catch {
      notify('Network error. Cannot connect to server.', 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

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

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const deleteUser = async (id: number, name: string) => {
    if (!window.confirm(`Delete user "${name}"?`)) return;
    try {
      const res  = await fetch(`${API_BASE}/delete/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (json.success) { notify('User deleted successfully.'); fetchUsers(); }
      else notify(json.message ?? 'Failed to delete user.', 'danger');
    } catch {
      notify('Network error.', 'danger');
    }
  };

  const submitAddUser = async () => {
    setFormError('');
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('Name, email, and password are required.');
      return;
    }
    setSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        notify('User added successfully!');
        setShowModal(false);
        setForm({ name: '', email: '', password: '', role: 'member' });
        fetchUsers();
      } else {
        setFormError(json.message ?? 'Something went wrong.');
      }
    } catch {
      setFormError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <IonPage>
      <IonContent style={{ '--background': '#f4f5f8' } as any}>

        {/* ── NAVBAR — katulad ng Categories ── */}
        <div style={navStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Search bar */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', padding: '8px 14px', fontSize: 14, width: 220 }}
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
        <div style={{ padding: '24px 28px' }}>

          {/* Page Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <IonIcon icon={peopleOutline} style={{ fontSize: 26 }} />
              Manage Users
            </h1>
            <button
              onClick={() => setShowModal(true)}
              style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <IonIcon icon={personAddOutline} /> Add User
            </button>
          </div>

          {/* Table Card */}
          <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ background: '#111', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <IonIcon icon={peopleOutline} style={{ color: '#fff', fontSize: 18 }} />
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>All Users</span>
              <span style={{ background: '#555', color: '#fff', borderRadius: 12, padding: '1px 9px', fontSize: 12, fontWeight: 700 }}>
                {filtered.length}
              </span>
            </div>

            {loading && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <IonSpinner name="crescent" color="primary" />
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
                No users found.
              </div>
            )}

            {!loading && filtered.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#111', color: '#fff' }}>
                      {['#', 'Avatar', 'Name', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, fontSize: 13 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, i) => (
                      <tr
                        key={u.id}
                        style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
                        onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa')}
                      >
                        <td style={{ padding: '12px 16px', color: '#888', fontSize: 14 }}>{i + 1}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {u.avatar ? (
                            <img src={`${AVATAR_URL}/${u.avatar}`} alt={u.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#222', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 14 }}>{u.name}</td>
                        <td style={{ padding: '12px 16px', color: '#888', fontSize: 13 }}>{u.email}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: u.role === 'admin' ? '#e53e3e' : '#222', color: '#fff', borderRadius: 4, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                            {u.role === 'admin' ? 'Admin' : 'Member'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#888', fontSize: 13 }}>{formatDate(u.created_at)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            onClick={() => deleteUser(u.id, u.name)}
                            style={{ background: '#fff', border: '2px solid #e53e3e', borderRadius: 5, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#fff0f0')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                          >
                            <IonIcon icon={trashOutline} style={{ color: '#e53e3e', fontSize: 16 }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ marginTop: 16, fontSize: 12, color: '#888' }}>
            Logged in as: <strong>{USER_NAME}</strong>
            <span style={{ background: '#e53e3e', color: '#fff', borderRadius: 4, padding: '1px 8px', fontSize: 11, marginLeft: 6 }}>
              {isAdmin ? 'Admin' : 'Member'}
            </span>
          </div>
        </div>

        {/* ── ADD USER MODAL ── */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 10, width: '90%', maxWidth: 400, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
              <div style={{ background: '#111', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IonIcon icon={personAddOutline} /> Add New User
                </span>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ padding: 20 }}>
                {formError && (
                  <div style={{ background: '#fff0f0', color: '#e53e3e', borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: 13 }}>
                    {formError}
                  </div>
                )}
                {[
                  { label: 'Name',     key: 'name',     type: 'text',     placeholder: 'Enter name'     },
                  { label: 'Email',    key: 'email',    type: 'email',    placeholder: 'Enter email'    },
                  { label: 'Password', key: 'password', type: 'password', placeholder: 'Enter password' },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 5 }}>{f.label}</label>
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      value={(form as any)[f.key]}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #ddd', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 5 }}>Role</label>
                  <select
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #ddd', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div style={{ padding: '12px 20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  onClick={() => { setShowModal(false); setFormError(''); }}
                  style={{ background: '#eee', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitAddUser}
                  disabled={saving}
                  style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </div>
          </div>
        )}

        <IonToast
          isOpen={toast.show}
          message={toast.msg}
          color={toast.color as any}
          duration={2500}
          onDidDismiss={() => setToast(t => ({ ...t, show: false }))}
          position="bottom"
        />

      </IonContent>
    </IonPage>
  );
};

/* ── Styles ── */
const navStyle: React.CSSProperties             = { background: '#111827', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 };
const avatarContainerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 14, cursor: 'pointer' };
const avatarCircleStyle: React.CSSProperties    = { width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff' };
const dropdownItemStyle: React.CSSProperties    = { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', cursor: 'pointer', fontSize: '0.85rem', color: '#374151', fontWeight: 500, background: 'transparent' };

export default ManageUsers;