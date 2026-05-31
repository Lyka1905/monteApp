import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  IonPage, IonContent, IonSpinner, IonToast, IonIcon,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import {
  micOutline, stopOutline, saveOutline, trashOutline, timeOutline,
} from 'ionicons/icons';
import Navbar from '../components/Navbar';

const API_BASE       = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_SongDetails';
const API_SHEET      = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_Musicsheet';
const API_REC        = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_Recordings';
const RECORDINGS_URL = 'https://itservicesph.com/IT383/MONTE/monte/uploads/recordings';

const stored   = JSON.parse(localStorage.getItem('user') ?? '{}');
const USER_NAME= stored?.name   ?? 'User';
const USER_ROLE= stored?.role   ?? '';
const USER_ID  = stored?.id     ?? 3;
const IS_ADMIN = USER_ROLE === 'admin';

const VOICE_COLORS: Record<string, string> = {
  soprano: '#c0392b', alto: '#8e44ad', tenor: '#2980b9', bass: '#27ae60',
};
const VOICE_LABELS: Record<string, string> = {
  soprano: 'Soprano', alto: 'Alto', tenor: 'Tenor', bass: 'Bass',
};
const VOICES     = ['soprano', 'alto', 'tenor', 'bass'];
const LINE_TOP   = 28;
const LINE_GAP   = 14;
const MIDDLE_C_Y = LINE_TOP + 5 * LINE_GAP;
const CANVAS_W   = 860;
const SP: Record<string, number>   = { whole:56, half:48, quarter:40, eighth:34 };
const REST: Record<string, string> = { whole:'𝄻', half:'𝄼', quarter:'𝄽', eighth:'𝄾' };
const PITCH: Record<string, number> = {
  C3:-49,D3:-42,E3:-35,F3:-28,G3:-21,A3:-14,B3:-7,
  C4:0,  D4:7,  E4:14, F4:21, G4:28, A4:35, B4:42,
  C5:49, D5:56, E5:63, F5:70, G5:77, A5:84, B5:91,
};

interface NoteEntry { note: string; oct: string; dur: string; syl: string; }
type AllNotes = Record<string, NoteEntry[]>;
interface Song {
  id: number; title: string; author?: string;
  composer?: string; category_name?: string; lyrics?: string;
}
interface Recording { id: number; song_id: number; user_id: number; filename: string; created_at: string; }
interface Sheet { key_signature: string; time_signature: string; tempo: number; notes_data: string; }

function drawCanvas(canvasId: string, voice: string, notes: NoteEntry[], keySig: string, timeSig: string, bg = '#fafafa', startIndex = 0): number {
  const cv = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!cv) return startIndex;
  const ctx = cv.getContext('2d')!;
  const W   = cv.width;
  const clr = VOICE_COLORS[voice];
  ctx.clearRect(0, 0, W, cv.height);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, cv.height);
  ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const ly = LINE_TOP + i * LINE_GAP;
    ctx.beginPath(); ctx.moveTo(44, ly); ctx.lineTo(W - 8, ly); ctx.stroke();
  }
  ctx.font = '54px serif'; ctx.fillStyle = clr;
  ctx.fillText('\u{1D11E}', 2, LINE_TOP + 4 * LINE_GAP + 10);
  const parts = timeSig.split('/');
  ctx.font = 'bold 13px serif'; ctx.fillStyle = '#aaa';
  ctx.fillText(parts[0], 46, LINE_TOP + 10);
  ctx.fillText(parts[1] || '4', 46, LINE_TOP + LINE_GAP * 2 + 10);
  ctx.font = '11px sans-serif'; ctx.fillStyle = '#bbb';
  ctx.fillText(keySig, 58, LINE_TOP - 4);
  let x = 68; let i = startIndex;
  for (; i < notes.length; i++) {
    const n  = notes[i];
    const sp = SP[n.dur] || 40;
    if (x + sp > W - 16) break;
    if (n.note === 'R') {
      ctx.fillStyle = '#888'; ctx.font = '16px serif';
      ctx.fillText(REST[n.dur] || '𝄽', x - 5, LINE_TOP + 2 * LINE_GAP + 4);
      x += sp; continue;
    }
    const ny     = MIDDLE_C_Y - (PITCH[n.note + n.oct] || 0);
    const rx     = 6, ry = 4.5;
    const filled = n.dur === 'quarter' || n.dur === 'eighth';
    ctx.save(); ctx.translate(x, ny); ctx.rotate(-0.18);
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    if (filled) { ctx.fillStyle = clr; ctx.fill(); }
    else { ctx.strokeStyle = clr; ctx.lineWidth = 1.8; ctx.stroke(); }
    ctx.restore();
    const stemUp = ny > LINE_TOP + 2 * LINE_GAP;
    if (n.dur !== 'whole') {
      ctx.strokeStyle = '#444'; ctx.lineWidth = 1.5;
      if (stemUp) { ctx.beginPath(); ctx.moveTo(x+rx-1,ny-ry+1); ctx.lineTo(x+rx-1,ny-30); ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(x-rx+1,ny+ry-1); ctx.lineTo(x-rx+1,ny+30); ctx.stroke(); }
    }
    if (n.syl) {
      ctx.font = '11px serif'; ctx.fillStyle = '#333'; ctx.textAlign = 'center';
      ctx.fillText(n.syl, x, LINE_TOP + 5 * LINE_GAP + 20); ctx.textAlign = 'left';
    }
    x += sp;
  }
  return i;
}

function computeSheetCount(notes: NoteEntry[]): number {
  let x = 68; let sheets = 1;
  for (const n of notes) {
    const sp = SP[n.dur] || 40;
    if (x + sp > CANVAS_W - 16) { sheets++; x = 68; }
    x += sp;
  }
  return sheets;
}

const SongView: React.FC = () => {
  const { id }  = useParams<{ id: string }>();
  const history = useHistory();

  const [song,       setSong]       = useState<Song | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState<'lyrics'|'sheet'|'recordings'>('lyrics');
  const [toast,      setToast]      = useState({ show: false, msg: '', color: 'success' });

  const [sheet,     setSheet]     = useState<Sheet | null>(null);
  const [allNotes,  setAllNotes]  = useState<AllNotes>({ soprano:[], alto:[], tenor:[], bass:[] });
  const [sheetLoad, setSheetLoad] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [isStopped,   setIsStopped]   = useState(false);
  const [isSaving,    setIsSaving]    = useState(false);
  const mediaRecRef  = useRef<MediaRecorder | null>(null);
  const chunksRef    = useRef<Blob[]>([]);
  const canvasRecRef = useRef<HTMLCanvasElement>(null);
  const animRef      = useRef<number>(0);
  const blobRef      = useRef<Blob | null>(null);

  const notify = (msg: string, color = 'success') =>
    setToast({ show: true, msg, color });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${API_BASE}/view/${id}`);
        const json = await res.json();
        if (json.success) { setSong(json.song); setRecordings(json.recordings ?? []); }
        else notify('Failed to load song.', 'danger');
      } catch { notify('Network error.', 'danger'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  useEffect(() => {
    if (activeTab !== 'sheet' || sheet) return;
    (async () => {
      setSheetLoad(true);
      try {
        const res  = await fetch(`${API_SHEET}/builder/${id}`);
        const json = await res.json();
        if (json.success) {
          const s = json.data.sheet || {};
          setSheet({ key_signature: s.key_signature || 'C', time_signature: s.time_signature || '4/4', tempo: s.tempo || 120, notes_data: s.notes_data || '{}' });
          try {
            const nd = JSON.parse(s.notes_data || '{}');
            const base: AllNotes = { soprano:[], alto:[], tenor:[], bass:[] };
            VOICES.forEach(v => { if (Array.isArray(nd[v])) base[v] = nd[v]; });
            setAllNotes(base);
          } catch {}
        }
      } catch {}
      finally { setSheetLoad(false); }
    })();
  }, [activeTab, id]);

  const totalSheets = Math.max(1, ...VOICES.map(v => computeSheetCount(allNotes[v] || [])));

  const redrawSheet = useCallback(() => {
    VOICES.forEach(v => {
      const notes = allNotes[v] || [];
      let idx = 0;
      for (let s = 0; s < totalSheets; s++) {
        idx = drawCanvas(`sheet_${v}_${s}`, v, notes, sheet?.key_signature || 'C', sheet?.time_signature || '4/4', '#fafafa', idx);
      }
    });
  }, [allNotes, sheet, totalSheets]);

  useEffect(() => {
    if (activeTab === 'sheet' && sheet) setTimeout(() => redrawSheet(), 100);
  }, [activeTab, sheet, redrawSheet]);

  const drawWaveform = (analyser: AnalyserNode) => {
    const cv = canvasRecRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    const buf = new Uint8Array(analyser.frequencyBinCount);
    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(buf);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.lineWidth = 2; ctx.strokeStyle = '#38bdf8'; ctx.beginPath();
      const sliceW = cv.width / buf.length;
      let x = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = buf[i] / 128;
        const y = (v * cv.height) / 2;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        x += sliceW;
      }
      ctx.lineTo(cv.width, cv.height / 2); ctx.stroke();
    };
    draw();
  };

  const startRecording = async () => {
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      const src      = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      drawWaveform(analyser);
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => { blobRef.current = new Blob(chunksRef.current, { type: 'audio/webm' }); };
      mr.start();
      mediaRecRef.current = mr;
      setIsRecording(true); setIsStopped(false); blobRef.current = null;
    } catch { notify('Microphone access denied.', 'danger'); }
  };

  const stopRecording = () => {
    mediaRecRef.current?.stop();
    cancelAnimationFrame(animRef.current);
    const cv = canvasRecRef.current;
    if (cv) { const ctx = cv.getContext('2d')!; ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, cv.width, cv.height); }
    setIsRecording(false); setIsStopped(true);
  };

  const saveRecording = async () => {
    if (!blobRef.current) { notify('No recording to save.', 'warning'); return; }
    setIsSaving(true);
    try {
      const res  = await fetch(`${API_REC}/save/${USER_ID}/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'audio/webm' },
        body: blobRef.current,
      });
      const json = await res.json();
      if (json.success) {
        notify('Recording saved!');
        blobRef.current = null; setIsStopped(false);
        const res2  = await fetch(`${API_BASE}/view/${id}`);
        const json2 = await res2.json();
        if (json2.success) setRecordings(json2.recordings ?? []);
      } else notify(json.error || 'Save failed.', 'danger');
    } catch { notify('Network error.', 'danger'); }
    finally { setIsSaving(false); }
  };

  const handleDeleteRecording = async (recId: number) => {
    if (!window.confirm('Delete this recording?')) return;
    try {
      const res  = await fetch(`${API_REC}/delete/${recId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { notify('Recording deleted!'); setRecordings(prev => prev.filter(r => r.id !== recId)); }
      else notify('Delete failed.', 'danger');
    } catch { notify('Network error.', 'danger'); }
  };

  const handleDeleteSong = async () => {
    if (!window.confirm('Delete this song?')) return;
    try {
      const res  = await fetch(`${API_BASE}/delete/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { notify('Song deleted!'); history.push('/songs'); }
      else notify('Delete failed.', 'danger');
    } catch { notify('Network error.', 'danger'); }
  };

  return (
    <IonPage>
      <IonContent style={{ '--background': '#f4f6fb' }}>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" />
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>

        <Navbar />

        {loading ? (
          <div className="text-center py-5"><IonSpinner name="crescent" color="dark" /></div>
        ) : song ? (
          <div className="container-fluid py-3 px-3">

            {/* Song Header */}
            <div className="d-flex align-items-start justify-content-between mb-3 gap-2">
              <div>
                <h2 className="fw-bold mb-1" style={{ fontSize: 18 }}>{song.title}</h2>
                <div className="d-flex flex-wrap align-items-center gap-2 text-muted" style={{ fontSize: 13 }}>
                  <span>👤 {song.author || '—'}</span>
                  <span>|</span>
                  <span>🎵 {song.composer || '—'}</span>
                  <span className="badge bg-dark">{song.category_name || '—'}</span>
                </div>
              </div>
             <div className="d-flex gap-2 flex-wrap">
  <button onClick={() => history.goBack()} className="btn btn-outline-secondary btn-sm">← Back</button>
</div>
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-3">
              {(['lyrics','sheet','recordings'] as const).map(tab => (
                <li key={tab} className="nav-item">
                  <button
                    onClick={() => setActiveTab(tab)}
                    className={`nav-link ${activeTab === tab ? 'active fw-bold' : 'text-muted'}`}
                    style={{ fontSize: 13 }}
                  >
                    {tab === 'lyrics' ? '≡ Lyrics' : tab === 'sheet' ? '🎵 Sheet' : '🎤 Recordings'}
                    {tab === 'recordings' && recordings.length > 0 && (
                      <span className="badge bg-dark ms-1">{recordings.length}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>

            {/* Tab Content */}
            <div className="card border-0 shadow-sm p-3" style={{ borderRadius: 10 }}>

              {/* Lyrics */}
              {activeTab === 'lyrics' && (
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 2, fontSize: '0.95rem', color: '#333' }}>
                  {song.lyrics || 'No lyrics available.'}
                </div>
              )}

              {/* Music Sheet */}
              {activeTab === 'sheet' && (
                <div>
                  {sheetLoad ? (
                    <div className="text-center py-4"><IonSpinner name="crescent" color="dark" /></div>
                  ) : sheet ? (
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                        <div className="d-flex gap-3 text-muted" style={{ fontSize: 13 }}>
                          <span>🔑 Key: <strong>{sheet.key_signature}</strong></span>
                          <span>⏱ Time: <strong>{sheet.time_signature}</strong></span>
                          <span>🎵 Tempo: <strong>{sheet.tempo} BPM</strong></span>
                        </div>
                        {IS_ADMIN && (
                          <button onClick={() => history.push(`/sheet-builder/${song.id}`)} className="btn btn-dark btn-sm">✏️ Edit Sheet</button>
                        )}
                      </div>
                      {Array.from({ length: totalSheets }, (_, sheetIdx) => (
                        <div key={sheetIdx} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px', marginBottom: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <span style={{ background: '#111', color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>Sheet {sheetIdx + 1}</span>
                            {sheetIdx === 0 && <span style={{ fontSize: 11, color: '#aaa' }}>Key: {sheet.key_signature} | Time: {sheet.time_signature} | Tempo: {sheet.tempo} BPM</span>}
                          </div>
                          {VOICES.map(v => (
                            <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ color: VOICE_COLORS[v], minWidth: 60, fontSize: '0.8rem', fontWeight: 600, textAlign: 'right' }}>{VOICE_LABELS[v]}</span>
                              <div style={{ flex: 1, overflowX: 'auto', background: '#fafafa', border: '1px solid #eee', borderRadius: 4 }}>
                                <canvas id={`sheet_${v}_${sheetIdx}`} width={CANVAS_W} height={130} style={{ background: '#fafafa', display: 'block' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <p style={{ fontSize: 14 }}>No music sheet available yet.</p>
                      {IS_ADMIN && (
                        <button onClick={() => history.push(`/sheet-builder/${song.id}`)} className="btn btn-dark btn-sm">✏️ Create Music Sheet</button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Recordings */}
              {activeTab === 'recordings' && (
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <h6 style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <IonIcon icon={micOutline} /> Record Your Voice
                    </h6>

                    {isRecording && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc3545', fontSize: 13, marginBottom: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc3545', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                        Recording...
                      </div>
                    )}
                    {isStopped && !isRecording && (
                      <p style={{ color: '#6c757d', fontSize: 13, marginBottom: 8 }}>Recording stopped. Click <strong>Save</strong> to save.</p>
                    )}
                    {!isRecording && !isStopped && (
                      <p style={{ color: '#6c757d', fontSize: 13, marginBottom: 8 }}>Press <strong>Start</strong> to begin recording.</p>
                    )}

                    <canvas ref={canvasRecRef} width={600} height={100} style={{ width: '100%', height: 100, background: '#0f172a', borderRadius: 8, display: 'block', marginBottom: 10 }} />

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={startRecording} disabled={isRecording} style={{ background: isRecording ? '#aaa' : '#dc3545', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: isRecording ? 'not-allowed' : 'pointer' }}>
                        <IonIcon icon={micOutline} /> Start
                      </button>
                      <button onClick={stopRecording} disabled={!isRecording} style={{ background: !isRecording ? '#aaa' : '#495057', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: !isRecording ? 'not-allowed' : 'pointer' }}>
                        <IonIcon icon={stopOutline} /> Stop
                      </button>
                      <button onClick={saveRecording} disabled={!isStopped || isSaving} style={{ background: (!isStopped || isSaving) ? '#aaa' : '#198754', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: (!isStopped || isSaving) ? 'not-allowed' : 'pointer' }}>
                        <IonIcon icon={saveOutline} /> {isSaving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h6 style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <IonIcon icon={timeOutline} /> Past Recordings
                    </h6>

                    {recordings.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px 0', color: '#aaa' }}>
                        <div style={{ fontSize: 40, marginBottom: 8 }}>🎤</div>
                        <p style={{ fontSize: 14 }}>No recordings yet.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {recordings.map(rec => (
                          <div key={rec.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                                {USER_NAME[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{USER_NAME}</div>
                                <div style={{ fontSize: 12, color: '#6c757d', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <IonIcon icon={timeOutline} style={{ fontSize: 12 }} /> {rec.created_at}
                                </div>
                              </div>
                            </div>
                            <audio controls style={{ width: '100%', height: 36, marginBottom: 8, display: 'block' }} src={`${RECORDINGS_URL}/${rec.filename}`}>
                              Your browser does not support audio.
                            </audio>
                            <button
                              onClick={() => handleDeleteRecording(rec.id)}
                              style={{ background: '#fff', color: '#dc3545', border: '1px solid #dc3545', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                            >
                              <IonIcon icon={trashOutline} /> Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-5 text-muted">Song not found.</div>
        )}

        <IonToast
          isOpen={toast.show} message={toast.msg} color={toast.color as any}
          duration={2500} onDidDismiss={() => setToast(t => ({ ...t, show: false }))} position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default SongView;