import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent, IonPage, IonIcon, IonSpinner, IonToast,
} from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import {
  micOutline, stopCircleOutline, saveOutline,
  arrowBackOutline, musicalNotesOutline, timeOutline,
  trashOutline, chevronDownOutline, personOutline, logOutOutline,
  searchOutline, headsetOutline,
} from 'ionicons/icons';

const API_BASE   = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_Recorder';
const FILES_BASE = 'https://itservicesph.com/IT383/MONTE/monte/uploads/recordings';
const AVATAR_URL = 'https://itservicesph.com/IT383/MONTE/monte/uploads/avatars';

const stored      = JSON.parse(localStorage.getItem('user') ?? '{}');
const USER_NAME   = stored?.name   ?? 'User';
const USER_AVATAR = stored?.avatar ?? '';

interface Song {
  id: number;
  title: string;
  author?: string;
  category_name?: string;
  lyrics?: string;
}

interface Recording {
  id: number;
  filename: string;
  created_at: string;
  user_name?: string;
}

const Recorder: React.FC = () => {
  const { songId }  = useParams<{ songId: string }>();
  const history     = useHistory();
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const triggerRef  = useRef<HTMLDivElement>(null);

  const [song,         setSong]         = useState<Song | null>(null);
  const [recordings,   setRecordings]   = useState<Recording[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [status,       setStatus]       = useState<{ msg: string; color: string }>({ msg: 'Press Start to begin', color: '#6b7280' });
  const [isRecording,  setIsRecording]  = useState(false);
  const [isSaving,     setIsSaving]     = useState(false);
  const [previewUrl,   setPreviewUrl]   = useState<string | null>(null);
  const [saved,        setSaved]        = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos,  setDropdownPos]  = useState({ top: 0, right: 0 });
  const [toast,        setToast]        = useState({ show: false, msg: '', color: 'success' });

  const user    = JSON.parse(localStorage.getItem('user') ?? '{}');
  const isAdmin = user.role === 'admin';

  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const blobRef     = useRef<Blob | null>(null);
  const animIdRef   = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const notify = (msg: string, color = 'success') =>
    setToast({ show: true, msg, color });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${API_BASE}/get_song/${songId}`);
        const json = await res.json();
        if (json.success) {
          setSong(json.data.song);
          setRecordings(json.data.recordings ?? []);
        } else notify('Failed to load song.', 'danger');
      } catch { notify('Network error.', 'danger'); }
      finally  { setLoading(false); }
    })();
  }, [songId]);

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

  const drawWave = () => {
    const canvas   = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d')!;
    const buf = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(buf);
    ctx.fillStyle = '#1a2744';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth   = 2.5;
    ctx.strokeStyle = '#4fc3f7';
    ctx.beginPath();
    const sliceW = canvas.width / buf.length;
    let x = 0;
    buf.forEach((v, i) => {
      const y = (v / 128) * canvas.height / 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      x += sliceW;
    });
    ctx.stroke();
    animIdRef.current = requestAnimationFrame(drawWave);
  };

  const handleStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      blobRef.current   = null;
      setPreviewUrl(null);
      setSaved(false);

      audioCtxRef.current = new AudioContext();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      audioCtxRef.current.createMediaStreamSource(stream).connect(analyserRef.current);
      drawWave();

      const mediaRec = new MediaRecorder(stream);
      mediaRecRef.current = mediaRec;

      mediaRec.ondataavailable = e => chunksRef.current.push(e.data);
      mediaRec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        blobRef.current = blob;
        setPreviewUrl(URL.createObjectURL(blob));
        cancelAnimationFrame(animIdRef.current);
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = '#1a2744';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        setStatus({ msg: '🎧 Preview ready — click Save!', color: '#2563eb' });
        setIsRecording(false);
      };

      mediaRec.start();
      setIsRecording(true);
      setStatus({ msg: '🔴 Recording...', color: '#dc2626' });
    } catch {
      setStatus({ msg: '⚠️ Microphone access denied!', color: '#d97706' });
    }
  };

  const handleStop = () => {
    mediaRecRef.current?.stop();
  };

  // ── Save recording — X-User-Id header removed, user.id now in URL ──
  const handleSave = async () => {
    if (!blobRef.current) return;
    setIsSaving(true);
    setStatus({ msg: '⏳ Saving...', color: '#d97706' });
    try {
      const res  = await fetch(`${API_BASE}/save/${user.id}/${songId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'audio/webm',
        },
        body: blobRef.current,
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setPreviewUrl(null);
        blobRef.current = null;
        setStatus({ msg: '✅ Recording Saved!', color: '#16a34a' });
        notify('Recording saved!');
        const res2  = await fetch(`${API_BASE}/get_song/${songId}`);
        const json2 = await res2.json();
        if (json2.success) setRecordings(json2.data.recordings ?? []);
      } else {
        setStatus({ msg: '❌ Save failed. Try again.', color: '#dc2626' });
      }
    } catch {
      setStatus({ msg: '❌ Save failed. Try again.', color: '#dc2626' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this recording?')) return;
    try {
      const res  = await fetch(`${API_BASE}/delete/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        notify('Recording deleted.');
        setRecordings(prev => prev.filter(r => r.id !== id));
      } else notify(json.message ?? 'Delete failed.', 'danger');
    } catch { notify('Network error.', 'danger'); }
  };

  return (
    <IonPage>
      <IonContent style={{ '--background': '#f4f6fb' } as any}>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" />

        {/* Navbar */}
        <div style={navStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
              <input placeholder="Search..." style={{ border: 'none', outline: 'none', padding: '8px 14px', fontSize: 14, width: 220 }} />
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
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <IonSpinner name="crescent" color="dark" />
          </div>
        ) : (
          <div className="container-fluid py-3 px-3">

            {/* Hero Header */}
            <div style={heroStyle}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 22, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IonIcon icon={micOutline} /> {song?.title}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', margin: '4px 0 0', fontSize: 14 }}>
                  <IonIcon icon={personOutline} style={{ marginRight: 4 }} />
                  {song?.author || '—'}
                  &nbsp;|&nbsp;
                  <span style={{ background: '#2563eb', borderRadius: 4, padding: '1px 8px', fontSize: 12 }}>
                    {song?.category_name || 'Uncategorized'}
                  </span>
                </p>
              </div>
              <button onClick={() => history.goBack()} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <IonIcon icon={arrowBackOutline} /> Back
              </button>
            </div>

            <div className="row g-4">

              {/* Lyrics */}
              <div className="col-md-5">
                <div style={cardStyle}>
                  <div style={cardHeaderStyle}>
                    <IonIcon icon={musicalNotesOutline} style={{ marginRight: 8 }} /> Lyrics
                  </div>
                  <div style={{ padding: '1.5rem', maxHeight: 500, overflowY: 'auto', background: '#fffdf7', borderLeft: '4px solid #1a2744' }}>
                    <pre style={{ fontFamily: 'inherit', lineHeight: 2, whiteSpace: 'pre-wrap', fontSize: '0.95rem', margin: 0, color: '#333' }}>
                      {song?.lyrics || 'No lyrics available.'}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Recorder */}
              <div className="col-md-7">
                <div style={cardStyle}>
                  <div style={cardHeaderStyle}>
                    <IonIcon icon={micOutline} style={{ marginRight: 8 }} /> Voice Recorder
                  </div>
                  <div style={{ padding: '1.5rem' }}>

                    {/* Status */}
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <span style={{ background: status.color, color: '#fff', borderRadius: 20, padding: '6px 18px', fontSize: 14, fontWeight: 600 }}>
                        {status.msg}
                      </span>
                    </div>

                    {/* Waveform */}
                    <div style={{ background: '#1a2744', borderRadius: 12, padding: 8, marginBottom: 16 }}>
                      <canvas ref={canvasRef} width={500} height={70} style={{ width: '100%', display: 'block', borderRadius: 8 }} />
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 24 }}>
                      <div style={{ textAlign: 'center' }}>
                        <button
                          onClick={handleStart}
                          disabled={isRecording || isSaving}
                          style={{ ...recBtnStyle, background: 'linear-gradient(135deg,#e74c3c,#c0392b)', boxShadow: isRecording ? '0 0 0 8px rgba(231,76,60,0.3)' : '0 4px 15px rgba(0,0,0,0.2)', opacity: isRecording ? 0.5 : 1 }}
                        >
                          <IonIcon icon={micOutline} style={{ fontSize: 28 }} />
                        </button>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Start</div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <button
                          onClick={handleStop}
                          disabled={!isRecording}
                          style={{ ...recBtnStyle, background: 'linear-gradient(135deg,#555,#333)', opacity: !isRecording ? 0.4 : 1 }}
                        >
                          <IonIcon icon={stopCircleOutline} style={{ fontSize: 28 }} />
                        </button>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Stop</div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <button
                          onClick={handleSave}
                          disabled={!previewUrl || isSaving || isRecording}
                          style={{ ...recBtnStyle, background: 'linear-gradient(135deg,#27ae60,#1e8449)', opacity: (!previewUrl || isSaving) ? 0.4 : 1 }}
                        >
                          {isSaving
                            ? <IonSpinner name="crescent" style={{ width: 24, height: 24, color: '#fff' }} />
                            : <IonIcon icon={saveOutline} style={{ fontSize: 28 }} />
                          }
                        </button>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Save</div>
                      </div>
                    </div>

                    {/* Preview */}
                    {previewUrl && (
                      <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <IonIcon icon={headsetOutline} /> Preview your recording:
                        </p>
                        <audio controls style={{ width: '100%' }}>
                          <source src={previewUrl} type="audio/webm" />
                        </audio>
                      </div>
                    )}

                    {/* Saved message */}
                    {saved && (
                      <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 8, padding: '16px', textAlign: 'center', color: '#065f46' }}>
                        <strong>✅ Recording Saved!</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Past Recordings */}
                {recordings.length > 0 && (
                  <div style={{ ...cardStyle, marginTop: 20 }}>
                    <div style={cardHeaderStyle}>
                      <IonIcon icon={timeOutline} style={{ marginRight: 8 }} />
                      Past Recordings
                      <span style={{ background: '#2563eb', color: '#fff', borderRadius: 12, padding: '1px 9px', fontSize: 12, fontWeight: 700, marginLeft: 8 }}>
                        {recordings.length}
                      </span>
                    </div>
                    <div style={{ padding: '1rem' }}>
                      {recordings.map(r => (
                        <div key={r.id} style={recordingItemStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <small style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <IonIcon icon={timeOutline} />
                              {new Date(r.created_at).toLocaleString()}
                              {isAdmin && r.user_name && (
                                <strong style={{ marginLeft: 6 }}>— {r.user_name}</strong>
                              )}
                            </small>
                            <button
                              onClick={() => handleDelete(r.id)}
                              style={{ background: '#fff', border: '1px solid #fca5a5', borderRadius: 4, padding: '4px 8px', color: '#ef4444', cursor: 'pointer' }}
                            >
                              <IonIcon icon={trashOutline} />
                            </button>
                          </div>
                          <audio controls style={{ width: '100%' }}>
                            <source src={`${FILES_BASE}/${r.filename}`} type="audio/webm" />
                          </audio>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
const heroStyle: React.CSSProperties            = { background: 'linear-gradient(135deg,#1a2744 0%,#2c3e6b 100%)', borderRadius: 16, padding: '1.5rem 2rem', color: '#fff', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const cardStyle: React.CSSProperties            = { background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' };
const cardHeaderStyle: React.CSSProperties      = { background: '#1a2744', color: '#fff', padding: '12px 20px', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center' };
const recBtnStyle: React.CSSProperties          = { width: 76, height: 76, borderRadius: '50%', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' };
const recordingItemStyle: React.CSSProperties   = { background: '#f8f9fa', borderRadius: 10, padding: '0.875rem', marginBottom: 10, border: '1px solid #e9ecef' };

export default Recorder;