import React, { useEffect, useState } from 'react';
import {
  IonContent, IonPage, IonBadge, IonIcon, IonSpinner, IonToast
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  micOutline, musicalNotesOutline, eyeOutline,
  downloadOutline, trashOutline, timeOutline,
} from 'ionicons/icons';
import Navbar from '../components/Navbar';

const API_BASE   = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_Recordings';
const FILES_BASE = 'https://itservicesph.com/IT383/MONTE/monte/uploads/recordings';

const stored  = JSON.parse(localStorage.getItem('user') ?? '{}');
const USER_ID = stored?.id ?? 3;

interface Recording {
  id: number;
  song_id?: number;
  song: string;
  date: string;
  file: string;
}

const Recordings: React.FC = () => {
  const history = useHistory();

  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [search,     setSearch]     = useState('');
  const [toast,      setToast]      = useState({ show: false, msg: '', color: 'success' });

  const notify = (msg: string, color = 'success') =>
    setToast({ show: true, msg, color });

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/recordings/${USER_ID}`);
      const json = await res.json();
      if (json.success) setRecordings(json.data.recordings);
      else notify('Failed to load recordings.', 'danger');
    } catch {
      notify('Network error.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecordings(); }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this recording?')) return;
    try {
      const res  = await fetch(`${API_BASE}/delete/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { notify('Recording deleted!'); fetchRecordings(); }
      else notify(json.message ?? 'Delete failed.', 'danger');
    } catch {
      notify('Network error.', 'danger');
    }
  };

const handleDownload = async (file: string) => {
  try {
    notify('Downloading...');
    const response = await fetch(`${FILES_BASE}/${file}`);
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    const { Filesystem, Directory } = await import('@capacitor/filesystem');

    await Filesystem.writeFile({
      path: `Download/${file}`,
      data: base64,
      directory: Directory.ExternalStorage,
    });

    notify('Saved to Downloads folder!');
  } catch (e: any) {
    notify(`Failed: ${e.message}`, 'danger');
  }
};
  const handleViewSong = (rec: Recording) => {
    if (rec.song_id) history.push(`/song-view/${rec.song_id}`);
    else history.push('/songs');
  };

  const filtered = recordings.filter(r =>
    r.song.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <IonPage>
      <IonContent style={{ '--background': '#f8f9fa' } as any}>

        {/* ── NAVBAR ── */}
        <Navbar
          searchPlaceholder="Search recordings..."
          onSearch={q => setSearch(q)}
        />

        {/* ── PAGE CONTENT ── */}
        <div style={{ padding: '16px' }}>

          {/* Page Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontWeight: 700, margin: 0, fontSize: 18, color: '#212529', display: 'flex', alignItems: 'center', gap: 6 }}>
              <IonIcon icon={micOutline} /> My Recordings
              <IonBadge color="dark" mode="ios" style={{ fontSize: '0.85rem', padding: '3px 8px', marginLeft: 4 }}>
                {filtered.length}
              </IonBadge>
            </h2>
            <button
              onClick={() => history.push('/songs')}
              style={{ background: '#212529', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <IonIcon icon={musicalNotesOutline} /> Songs
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <IonSpinner name="crescent" color="dark" />
            </div>
          )}

          {/* List */}
          {!loading && (
            <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ background: '#212529', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <IonIcon icon={micOutline} style={{ color: '#fff', fontSize: 16 }} />
                <span style={{ color: '#fff', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>ALL RECORDINGS</span>
              </div>

              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>
                  <IonIcon icon={micOutline} style={{ fontSize: 40, display: 'block', margin: '0 auto 10px' }} />
                  No recordings found.
                </div>
              ) : (
                filtered.map((rec, index) => (
                  <div key={rec.id} style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0' }}>
                    {/* Row 1: number + song name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ color: '#aaa', fontSize: 12, minWidth: 20 }}>{index + 1}</span>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#212529', flex: 1 }}>{rec.song}</span>
                    </div>

                    {/* Row 2: date */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6c757d', fontSize: 12, marginBottom: 10 }}>
                      <IonIcon icon={timeOutline} style={{ fontSize: 12 }} /> {rec.date}
                    </div>

                    {/* Row 3: audio player — full width */}
                    <audio controls style={{ width: '100%', height: 36, marginBottom: 10, display: 'block' }}>
                      <source src={`${FILES_BASE}/${rec.file}`} type="audio/webm" />
                    </audio>

                    {/* Row 4: action buttons */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleViewSong(rec)}
                        style={{ background: '#212529', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 10px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', flex: 1, justifyContent: 'center' }}
                      >
                        <IonIcon icon={eyeOutline} /> View Song
                      </button>
                      <button
                        onClick={() => handleDownload(rec.file)}
                        style={{ background: '#fff', border: '1px solid #dee2e6', borderRadius: 4, padding: '6px 10px', color: '#495057', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <IonIcon icon={downloadOutline} />
                      </button>
                      <button
                        onClick={() => handleDelete(rec.id)}
                        style={{ background: '#fff', border: '1px solid #ffc9c9', borderRadius: 4, padding: '6px 10px', color: '#fa5252', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <IonIcon icon={trashOutline} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div style={{ marginTop: 32, textAlign: 'center', color: '#adb5bd', fontSize: 12 }}>
            © 2026 Ad Jesum Song List System
          </div>
        </div>

      </IonContent>

      <IonToast
        isOpen={toast.show}
        message={toast.msg}
        color={toast.color as any}
        duration={2500}
        onDidDismiss={() => setToast(t => ({ ...t, show: false }))}
        position="bottom"
      />
    </IonPage>
  );
};

export default Recordings;