import React, { useState, useEffect, useCallback } from 'react';
import {
  IonContent, IonPage, IonIcon, IonSpinner, IonToast
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  peopleOutline, personAddOutline, trashOutline,
} from 'ionicons/icons';
import Navbar from '../components/Navbar';

const API_BASE   = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_Users';
const AVATAR_URL = 'https://itservicesph.com/IT383/MONTE/monte/uploads/avatars';
const getToken   = () => localStorage.getItem('auth_token') ?? '';

const stored    = JSON.parse(localStorage.getItem('user') ?? '{}');
const USER_NAME = stored?.name ?? 'User';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  created_at: string;
}

const ManageUsers: React.FC = () => {
  const history = useHistory();

  const [users,     setUsers]     = useState<User[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [search,    setSearch]    = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState({ name: '', email: '', password: '', role: 'member' });
  const [formError, setFormError] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState({ show: false, msg: '', color: 'success' });

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
      notify('Network error.', 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

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
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <IonPage>
      <IonContent style={{ '--background': '#f4f5f8' } as any}>

        <Navbar
          searchPlaceholder="Search users..."
          onSearch={q => setSearch(q)}
        />

        <div style={{ padding: '16px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <IonIcon icon={peopleOutline} style={{ fontSize: 22 }} />
              Manage Users
            </h1>
            <button
              onClick={() => setShowModal(true)}
              style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <IonIcon icon={personAddOutline} /> Add
            </button>
          </div>

          <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ background: '#111', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <IonIcon icon={peopleOutline} style={{ color: '#fff', fontSize: 16 }} />
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>All Users</span>
              <span style={{ background: '#555', color: '#fff', borderRadius: 12, padding: '1px 9px', fontSize: 12, fontWeight: 700 }}>
                {filtered.length}
              </span>
            </div>

            {loading && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <IonSpinner name="crescent" color="primary" />
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>No users found.</div>
            )}

            {!loading && filtered.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: 500, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#111', color: '#fff' }}>
                      {['#', 'Avatar', 'Name', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, i) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={tdStyle}>{i + 1}</td>
                        <td style={tdStyle}>
                          {u.avatar ? (
                            <img src={`${AVATAR_URL}/${u.avatar}`} alt={u.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#222', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700 }}>{u.name}</td>
                        <td style={{ ...tdStyle, color: '#888', fontSize: 12 }}>{u.email}</td>
                        <td style={tdStyle}>
                          <span style={{ background: u.role === 'admin' ? '#e53e3e' : '#222', color: '#fff', borderRadius: 4, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>
                            {u.role === 'admin' ? 'Admin' : 'Member'}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: '#888', fontSize: 12 }}>{formatDate(u.created_at)}</td>
                        <td style={tdStyle}>
                          <button
                            onClick={() => deleteUser(u.id, u.name)}
                            style={{ background: '#fff', border: '2px solid #e53e3e', borderRadius: 5, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <IonIcon icon={trashOutline} style={{ color: '#e53e3e', fontSize: 15 }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ marginTop: 12, fontSize: 12, color: '#888' }}>
            Logged in as: <strong>{USER_NAME}</strong>
            <span style={{ background: isAdmin ? '#e53e3e' : '#222', color: '#fff', borderRadius: 4, padding: '1px 8px', fontSize: 11, marginLeft: 6 }}>
              {isAdmin ? 'Admin' : 'Member'}
            </span>
          </div>
        </div>

        {/* ADD USER MODAL */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
            <div style={{ background: '#fff', borderRadius: 10, width: '100%', maxWidth: 400, overflow: 'hidden' }}>
              <div style={{ background: '#111', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IonIcon icon={personAddOutline} /> Add New User
                </span>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ padding: 16 }}>
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
                  <div key={f.key} style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{f.label}</label>
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      value={(form as any)[f.key]}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #ddd', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Role</label>
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
              <div style={{ padding: '12px 16px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
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

const tdStyle: React.CSSProperties = { padding: '10px 14px', fontSize: 13, color: '#212529' };

export default ManageUsers;