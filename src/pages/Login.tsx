import React, { useState } from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  musicalNotesOutline, mailOutline, lockClosedOutline,
  personAddOutline, logInOutline,
} from 'ionicons/icons';

const API_BASE = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Auth';

const Login: React.FC = () => {
  const history = useHistory();
  const [mode, setMode]             = useState<'login' | 'register'>('login');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [regName, setRegName]       = useState('');
  const [regEmail, setRegEmail]     = useState('');
  const [regPass, setRegPass]       = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [loading, setLoading]       = useState(false);

 const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    console.log('handleLogin called!', email, password);
    if (!email || !password) { alert('Please enter both email and password.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/react_login`, { // ✅ FIXED: was react_login
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      const result = await res.json();

      if (result.status === 'success') {
        localStorage.setItem('user', JSON.stringify(result.user));
        const role = (result.user?.role ?? '').toLowerCase();
        if (role === 'admin') {
          history.replace('/dashboard');
        } else {
          history.replace('/UserDashboard');
        }
      } else {
        alert(result.message || 'Invalid credentials.');
      }
    } catch (err) {
      console.error(err);
      alert('Cannot connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPass || !regConfirm) {
      alert('Please fill in all fields.'); return;
    }
    if (regPass !== regConfirm) {
      alert('Passwords do not match.'); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/react_register`, { // ✅ FIXED: was react_register
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name:     regName.trim(),
          email:    regEmail.trim(),
          password: regPass.trim(),
        }),
      });

      const result = await res.json();

      if (result.status === 'success') {
        alert('Account created! Please log in.');
        setMode('login');
        setRegName(''); setRegEmail(''); setRegPass(''); setRegConfirm('');
      } else {
        alert(result.message || 'Registration failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent style={{ '--background': '#0d6efd' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 20 }}>
          <div style={{
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480,
            overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          }}>

            <div style={{ textAlign: 'center', padding: '32px 32px 20px' }}>
              <IonIcon icon={musicalNotesOutline} style={{ fontSize: 48, color: '#0d6efd' }} />
              <h2 style={{ margin: '8px 0 2px', fontWeight: 800, fontSize: 26, color: '#111' }}>Ad Jesum</h2>
              <p style={{ margin: 0, color: '#888', fontSize: 14 }}>Song List System</p>
            </div>

            <div style={{ height: 1, background: '#eee' }} />

            <div style={{ padding: '24px 32px' }}>

              {mode === 'login' && (
                <form onSubmit={handleLogin}>
                  <div style={fieldWrapStyle}>
                    <IonIcon icon={mailOutline} style={{ color: '#0d6efd', fontSize: 18, marginRight: 10, flexShrink: 0 }} />
                    <input
                      type="email" placeholder="Email address"
                      value={email} onChange={e => setEmail(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ ...fieldWrapStyle, marginBottom: 16 }}>
                    <IonIcon icon={lockClosedOutline} style={{ color: '#888', fontSize: 18, marginRight: 10, flexShrink: 0 }} />
                    <input
                      type="password" placeholder="Password"
                      value={password} onChange={e => setPassword(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button type="button" onClick={() => setMode('register')} style={linkBtnStyle}>
                      <IonIcon icon={personAddOutline} style={{ fontSize: 16 }} />
                      Create an account
                    </button>
                    <button type="button" onClick={handleLogin} disabled={loading} style={submitBtnStyle}>
                      <IonIcon icon={logInOutline} style={{ fontSize: 18 }} />
                      {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                  </div>
                </form>
              )}

              {mode === 'register' && (
                <form onSubmit={handleRegister}>
                  {[
                    { icon: personAddOutline,  placeholder: 'Full Name',        value: regName,    setter: setRegName,    type: 'text'     },
                    { icon: mailOutline,        placeholder: 'Email address',    value: regEmail,   setter: setRegEmail,   type: 'email'    },
                    { icon: lockClosedOutline,  placeholder: 'Password',         value: regPass,    setter: setRegPass,    type: 'password' },
                    { icon: lockClosedOutline,  placeholder: 'Confirm Password', value: regConfirm, setter: setRegConfirm, type: 'password' },
                  ].map((f, i) => (
                    <div key={i} style={fieldWrapStyle}>
                      <IonIcon icon={f.icon} style={{ color: '#000101', fontSize: 18, marginRight: 10, flexShrink: 0 }} />
                      <input
                        type={f.type} placeholder={f.placeholder}
                        value={f.value} onChange={e => f.setter(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  ))}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <button type="button" onClick={() => setMode('login')} style={linkBtnStyle}>
                      Already have an account
                    </button>
                    <button type="submit" disabled={loading} style={submitBtnStyle}>
                      {loading ? 'Creating...' : 'Create Account'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div style={{ height: 1, background: '#eee' }} />
            <div style={{ textAlign: 'center', padding: '14px', color: '#aaa', fontSize: 13 }}>
              Ad Jesum © 2026
            </div>

          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

const fieldWrapStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  background: '#f0f4ff', borderRadius: 8,
  padding: '12px 14px', marginBottom: 12,
  border: '1.5px solid #d0dcff',
};
const inputStyle: React.CSSProperties = {
  border: 'none', background: 'transparent',
  outline: 'none', fontSize: 14, width: '100%', color: '#111',
};
const linkBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: '#0d6efd',
  fontSize: 13, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 5,
  padding: 0, fontWeight: 600,
};
const submitBtnStyle: React.CSSProperties = {
  background: '#0d6efd', color: '#fff', border: 'none',
  borderRadius: 8, padding: '10px 22px', fontSize: 14,
  fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 8,
};

export default Login;