import React, { useEffect, useState, useRef } from 'react';
import { 
  IonPage, 
  IonContent, 
  IonSpinner,
  IonIcon,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { documentTextOutline, downloadOutline, arrowBackOutline, personOutline, timeOutline, chevronDownOutline, searchOutline, logOutOutline } from 'ionicons/icons';

const API_BASE = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_Pdflibrary';
const PDF_URL  = 'https://itservicesph.com/IT383/MONTE/monte/uploads/pdfs';

const stored      = JSON.parse(localStorage.getItem('user') ?? '{}');
const USER_NAME   = stored?.name   ?? 'User';
const USER_AVATAR = stored?.avatar ?? '';
const AVATAR_URL  = 'https://itservicesph.com/IT383/MONTE/monte/uploads/avatars';

interface PdfFile {
  id: number;
  title: string;
  filename: string;
  uploaded_by?: string;
  created_at?: string;
}

const PdfView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [pdf, setPdf] = useState<PdfFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos]   = useState({ top: 0, right: 0 });
  const [search, setSearch]             = useState('');
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/view/${id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setPdf(json.data);
        setLoading(false);
      });
  }, [id]);

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

  const handleDownload = () => {
    if (!pdf) return;
    const a = document.createElement('a');
    a.href = `${PDF_URL}/${pdf.filename}`;
    a.download = `${pdf.title}.pdf`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) return (
    <IonPage>
      <IonContent>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <IonSpinner name="crescent" />
        </div>
      </IonContent>
    </IonPage>
  );

  return (
    <IonPage>
      <IonContent style={{ '--background': '#f8f9fa' } as any}>

        {/* NAVBAR */}
        <div style={{ background: '#111827', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories..." style={{ border: 'none', outline: 'none', padding: '8px 14px', fontSize: 14, width: 220 }} />
              <button style={{ background: '#2563eb', border: 'none', color: '#fff', padding: '9px 14px', cursor: 'pointer', fontSize: 15 }}><IonIcon icon={searchOutline} /></button>
            </div>
            <div ref={triggerRef} onClick={handleToggleDropdown} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 14, cursor: 'pointer' }}>
              {USER_AVATAR ? (
                <img src={`${AVATAR_URL}/${USER_AVATAR}`} alt="avatar" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} />
              ) : (
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff' }}>
                  {USER_NAME[0].toUpperCase()}
                </div>
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
            <div onMouseDown={() => { setShowDropdown(false); history.push('/my-profile'); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', cursor: 'pointer', fontSize: '0.85rem', color: '#374151', fontWeight: 500, background: 'transparent' }} onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <IonIcon icon={personOutline} style={{ fontSize: '1rem', color: '#374151' }} /><span>My Profile</span>
            </div>
            <div style={{ height: 1, background: '#e5e7eb', margin: '0 12px' }} />
            <div onMouseDown={() => { localStorage.clear(); window.location.href = '/login'; }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', cursor: 'pointer', fontSize: '0.85rem', color: '#dc2626', fontWeight: 500, background: 'transparent' }} onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <IonIcon icon={logOutOutline} style={{ fontSize: '1rem', color: '#dc2626' }} /><span>Logout</span>
            </div>
          </div>
        )}

        {/* HEADER */}
        <div style={{ background: '#1e3a5f', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px', borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '8px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: 24, height: 28 }}>
                <IonIcon icon={documentTextOutline} style={{ fontSize: 24, color: '#fff' }} />
                <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 5, fontWeight: 900, padding: '0px 2px', letterSpacing: 0.5 }}>PDF</span>
              </div>
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 28, marginBottom: 6 }}>{pdf?.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ color: '#9ca3af', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <IonIcon icon={personOutline} /> {pdf?.uploaded_by}
                </span>
                <span style={{ color: '#9ca3af', fontSize: 13 }}>|</span>
                <span style={{ color: '#9ca3af', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <IonIcon icon={timeOutline} /> {pdf?.created_at?.split(' ')[0]}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleDownload}
              style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <IonIcon icon={downloadOutline} style={{ fontSize: 16 }} /> Download
            </button>
            <button onClick={() => history.goBack()}
              style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <IonIcon icon={arrowBackOutline} style={{ fontSize: 16 }} /> Back
            </button>
          </div>
        </div>

        {/* PDF VIEWER — native browser toolbar (no Google Viewer) */}
        <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
            <embed
              src={`${PDF_URL}/${pdf?.filename}`}
              type="application/pdf"
              style={{ width: '100%', height: 'calc(100vh - 180px)', border: 'none', display: 'block' }}
            />
          </div>
        </div>

      </IonContent>
    </IonPage>
  );
};

export default PdfView;