import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  IonContent, IonPage, IonSpinner, IonToast,
} from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';

const API_BASE    = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_Musicsheet';
const EXPORT_BASE = 'https://itservicesph.com/IT383/MONTE/monte/index.php/songs/exportpdf';
const getToken    = () => localStorage.getItem('auth_token') ?? '';

const VOICE_COLORS: Record<string, string> = {
  soprano: '#c0392b', alto: '#8e44ad', tenor: '#2980b9', bass: '#27ae60',
};
const VOICE_LABELS: Record<string, string> = {
  soprano: 'Soprano', alto: 'Alto', tenor: 'Tenor', bass: 'Bass',
};
const VOICES = ['soprano', 'alto', 'tenor', 'bass'];
const KEYS   = ['C','G','D','A','E','B','F#','F','Bb','Eb','Ab','Db'];
const TIMES  = ['4/4','3/4','2/4','6/8','12/8'];
const NOTES  = ['C','D','E','F','G','A','B'];
const DURS   = [
  { val: 'whole',   label: '𝅝 Whole'   },
  { val: 'half',    label: '𝅗𝅥 Half'    },
  { val: 'quarter', label: '♩ Quarter' },
  { val: 'eighth',  label: '♪ Eighth'  },
];

const LINE_TOP   = 28;
const LINE_GAP   = 14;
const MIDDLE_C_Y = LINE_TOP + 5 * LINE_GAP;
const CANVAS_W   = 860;

const PITCH: Record<string, number> = {
  C3:-49,D3:-42,E3:-35,F3:-28,G3:-21,A3:-14,B3:-7,
  C4:0,  D4:7,  E4:14, F4:21, G4:28, A4:35, B4:42,
  C5:49, D5:56, E5:63, F5:70, G5:77, A5:84, B5:91,
};
const SP: Record<string, number>   = { whole:56, half:48, quarter:40, eighth:34 };
const REST: Record<string, string> = { whole:'𝄻', half:'𝄼', quarter:'𝄽', eighth:'𝄾' };

interface NoteEntry { note: string; oct: string; dur: string; syl: string; }
type AllNotes = Record<string, NoteEntry[]>;
interface Song {
  id: number; title: string; author?: string;
  composer?: string; category_name?: string; lyrics?: string;
}

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
      if (n.syl) { ctx.font = '10px sans-serif'; ctx.fillStyle = '#555'; ctx.textAlign = 'center'; ctx.fillText(n.syl, x, LINE_TOP + 5 * LINE_GAP + 20); ctx.textAlign = 'left'; }
      x += sp; continue;
    }
    const ny     = MIDDLE_C_Y - (PITCH[n.note + n.oct] || 0);
    const rx     = 6, ry = 4.5;
    const filled = n.dur === 'quarter' || n.dur === 'eighth';
    for (let la = LINE_TOP - LINE_GAP; la >= ny - 1; la -= LINE_GAP) { ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x-rx-3,la); ctx.lineTo(x+rx+3,la); ctx.stroke(); }
    for (let lb = LINE_TOP + 5*LINE_GAP; lb <= ny+1; lb += LINE_GAP) { ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x-rx-3,lb); ctx.lineTo(x+rx+3,lb); ctx.stroke(); }
    ctx.save(); ctx.translate(x, ny); ctx.rotate(-0.18);
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI*2);
    if (filled) { ctx.fillStyle = clr; ctx.fill(); }
    else { ctx.strokeStyle = clr; ctx.lineWidth = 1.8; ctx.stroke(); if (n.dur === 'whole') { ctx.beginPath(); ctx.ellipse(0,0,rx-2.5,ry-1.5,0,0,Math.PI*2); ctx.fillStyle = bg; ctx.fill(); } }
    ctx.restore();
    const stemUp = ny > LINE_TOP + 2*LINE_GAP;
    if (n.dur !== 'whole') {
      ctx.strokeStyle = '#444'; ctx.lineWidth = 1.5;
      if (stemUp) { ctx.beginPath(); ctx.moveTo(x+rx-1,ny-ry+1); ctx.lineTo(x+rx-1,ny-30); ctx.stroke(); if (n.dur === 'eighth') { ctx.beginPath(); ctx.moveTo(x+rx-1,ny-30); ctx.bezierCurveTo(x+rx+10,ny-22,x+rx+12,ny-16,x+rx+5,ny-10); ctx.stroke(); } }
      else { ctx.beginPath(); ctx.moveTo(x-rx+1,ny+ry-1); ctx.lineTo(x-rx+1,ny+30); ctx.stroke(); if (n.dur === 'eighth') { ctx.beginPath(); ctx.moveTo(x-rx+1,ny+30); ctx.bezierCurveTo(x-rx+10,ny+22,x-rx+12,ny+16,x-rx+5,ny+10); ctx.stroke(); } }
    }
    if (n.syl) { ctx.font = '11px serif'; ctx.fillStyle = '#333'; ctx.textAlign = 'center'; ctx.fillText(n.syl, x, LINE_TOP + 5*LINE_GAP + 20); ctx.textAlign = 'left'; }
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

const MusicSheetBuilder: React.FC = () => {
  const { songId } = useParams<{ songId: string }>();
  const history    = useHistory();
  const syllableRef = useRef<HTMLInputElement>(null);

  const [song,        setSong]        = useState<Song | null>(null);
  const [keySig,      setKeySig]      = useState('C');
  const [timeSig,     setTimeSig]     = useState('4/4');
  const [tempo,       setTempo]       = useState(120);
  const [fullLyrics,  setFullLyrics]  = useState('');
  const [allNotes,    setAllNotes]    = useState<AllNotes>({ soprano:[], alto:[], tenor:[], bass:[] });
  const [activeVoice, setActiveVoice] = useState('soprano');
  const [activeDur,   setActiveDur]   = useState('whole');
  const [octave,      setOctave]      = useState('4');
  const [syllable,    setSyllable]    = useState('');
  const [saving,      setSaving]      = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [showExport,  setShowExport]  = useState(false);
  const [toast,       setToast]       = useState({ show: false, msg: '', color: 'success' });

  const notify = (msg: string, color = 'success') =>
    setToast({ show: true, msg, color });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${API_BASE}/builder/${songId}`, { headers: { Authorization: `Bearer ${getToken()}` } });
        const json = await res.json();
        if (json.success) {
          setSong(json.data.song);
          const s = json.data.sheet || {};
          setKeySig(s.key_signature || 'C');
          setTimeSig(s.time_signature || '4/4');
          setTempo(s.tempo || 120);
          setFullLyrics(s.full_lyrics || json.data.song?.lyrics || '');
          try {
            const nd = JSON.parse(s.notes_data || '{}');
            const base: AllNotes = { soprano:[], alto:[], tenor:[], bass:[] };
            VOICES.forEach(v => { if (Array.isArray(nd[v])) base[v] = nd[v]; });
            setAllNotes(base);
          } catch {}
        } else notify('Failed to load sheet.', 'danger');
      } catch { notify('Network error.', 'danger'); }
      finally { setLoading(false); }
    })();
  }, [songId]);

  const totalSheets = Math.max(1, ...VOICES.map(v => computeSheetCount(allNotes[v] || [])));

  const redrawAll = useCallback(() => {
    VOICES.forEach(v => {
      const notes = allNotes[v] || [];
      let idx = 0;
      for (let s = 0; s < totalSheets; s++) {
        idx = drawCanvas(`canvas_${v}_${s}`, v, notes, keySig, timeSig, '#fafafa', idx);
      }
      let idx2 = 0;
      for (let s = 0; s < totalSheets; s++) {
        idx2 = drawCanvas(`preview_${v}_${s}`, v, notes, keySig, timeSig, '#ffffff', idx2);
      }
    });
  }, [allNotes, keySig, timeSig, totalSheets]);

  useEffect(() => { redrawAll(); }, [redrawAll]);

  const addNote = (note: string) => {
    const entry: NoteEntry = { note, oct: octave, dur: activeDur, syl: syllable.trim() };
    setAllNotes(prev => ({ ...prev, [activeVoice]: [...(prev[activeVoice]||[]), entry] }));
    setSyllable('');
    syllableRef.current?.focus();
  };

  const undo = () => setAllNotes(prev => {
    const arr = [...(prev[activeVoice]||[])]; arr.pop();
    return { ...prev, [activeVoice]: arr };
  });

  const clearVoice = () => {
    if (window.confirm(`Clear all notes for ${VOICE_LABELS[activeVoice]}?`))
      setAllNotes(prev => ({ ...prev, [activeVoice]: [] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/save/${songId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ key_signature: keySig, time_signature: timeSig, tempo, notes_data: JSON.stringify(allNotes), full_lyrics: fullLyrics }),
      });
      const json = await res.json();
      if (json.success) notify('Music sheet saved!');
      else notify(json.message || 'Save failed.', 'danger');
    } catch { notify('Network error.', 'danger'); }
    finally { setSaving(false); }
  };

const handlePrint = () => {
  // Convert all preview canvases to images first
  let sheetsHtml = '';
  for (let s = 0; s < totalSheets; s++) {
    sheetsHtml += `<div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:16px;">`;
    sheetsHtml += `<div style="font-size:12px;color:#aaa;margin-bottom:10px;">Sheet ${s + 1}${s === 0 ? ` | Key: ${keySig} | Time: ${timeSig} | Tempo: ${tempo} BPM` : ''}</div>`;
    VOICES.forEach(v => {
      const cv = document.getElementById(`preview_${v}_${s}`) as HTMLCanvasElement | null;
      if (cv) {
        const imgData = cv.toDataURL('image/png');
        sheetsHtml += `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="color:${VOICE_COLORS[v]};min-width:60px;font-size:0.8rem;font-weight:600;text-align:right;">${VOICE_LABELS[v]}</span>
            <img src="${imgData}" style="width:100%;display:block;" />
          </div>`;
      }
    });
    sheetsHtml += `</div>`;
  }

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html><html><head>
      <title>${song?.title ?? 'Music Sheet'}</title>
      <style>body{margin:20px;font-family:serif;} img{max-width:100%;}</style>
    </head><body>
      <h3 style="text-align:center;">${song?.title}</h3>
      <p style="text-align:right;font-size:0.85rem;color:#888;">${song?.author ?? ''}${song?.composer ? ', ' + song.composer : ''}</p>
      ${sheetsHtml}
      ${fullLyrics ? `<hr/><div style="font-size:0.88rem;line-height:1.9;white-space:pre-wrap;">${fullLyrics}</div>` : ''}
    </body></html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
};
  const renderSheet = (sheetIndex: number, prefix: string, bg: string) => (
    <div key={sheetIndex} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ background: '#111', color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>Sheet {sheetIndex + 1}</span>
        {sheetIndex === 0 && <span style={{ fontSize: 11, color: '#aaa' }}>Key: {keySig} | Time: {timeSig} | Tempo: {tempo} BPM</span>}
      </div>
      {VOICES.map(v => (
        <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ color: VOICE_COLORS[v], minWidth: 60, fontSize: '0.8rem', fontWeight: 600, textAlign: 'right' }}>{VOICE_LABELS[v]}</span>
          <div style={{ flex: 1, background: bg, borderRadius: 4 }}>
            <canvas id={`${prefix}_${v}_${sheetIndex}`} width={CANVAS_W} height={130} style={{ background: bg, display: 'block', width: '100%' }} />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <IonPage>
      <IonContent style={{ '--background': '#f4f6fb' } as any}>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" />

        <div className="no-print">
          <Navbar />
        </div>

        {loading ? (
          <div className="text-center py-5">
            <IonSpinner name="crescent" color="dark" />
            <p className="mt-3 text-muted small">Loading sheet...</p>
          </div>
        ) : (
          <div className="container-fluid py-3 px-3">

            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mt-2 mb-3 flex-wrap gap-2 no-print">
              <h1 className="h5 mb-0 fw-bold">
                <i className="fas fa-music me-2" />
                Music Sheet — {song?.title}
              </h1>
              <div className="d-flex gap-2 flex-wrap">
                <button onClick={() => setShowExport(true)} className="btn btn-danger btn-sm">
                  <i className="fas fa-file-pdf me-1" /> Export PDF
                </button>
                <button onClick={handlePrint} className="btn btn-outline-secondary btn-sm">
                  <i className="fas fa-print me-1" /> Print
                </button>
                <button onClick={() => history.goBack()} className="btn btn-outline-secondary btn-sm">
                  <i className="fas fa-arrow-left me-1" /> Back
                </button>
              </div>
            </div>

            {/* Builder Controls */}
            <div className="card mb-4 border-0 shadow-sm no-print">
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-3 col-6 mb-2">
                    <label className="form-label fw-bold small">Key Signature</label>
                    <select className="form-select form-select-sm" value={keySig} onChange={e => setKeySig(e.target.value)}>
                      {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div className="col-md-3 col-6 mb-2">
                    <label className="form-label fw-bold small">Time Signature</label>
                    <select className="form-select form-select-sm" value={timeSig} onChange={e => setTimeSig(e.target.value)}>
                      {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-md-3 col-6 mb-2">
                    <label className="form-label fw-bold small">Tempo (BPM)</label>
                    <input type="number" className="form-control form-control-sm" min={40} max={240} value={tempo} onChange={e => setTempo(Number(e.target.value))} />
                  </div>
                </div>
                <hr />
                <div className="mb-2">
                  <label className="form-label fw-bold small">Voice Part</label>
                  <div className="d-flex gap-2 flex-wrap">
                    {VOICES.map(v => (
                      <button key={v} type="button" onClick={() => setActiveVoice(v)} className={`btn btn-sm ${activeVoice === v ? 'btn-dark' : 'btn-outline-secondary'}`}>
                        🎵 {VOICE_LABELS[v]}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-muted small mb-2">
                  Adding to: <strong style={{ color: VOICE_COLORS[activeVoice] }}>{VOICE_LABELS[activeVoice]}</strong>
                </p>
                <div className="mb-3">
                  <label className="form-label fw-bold small">Duration</label>
                  <div className="d-flex gap-2 flex-wrap">
                    {DURS.map(d => (
                      <button key={d.val} type="button" onClick={() => setActiveDur(d.val)} className={`btn btn-sm ${activeDur === d.val ? 'btn-dark' : 'btn-outline-dark'}`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold small">Add Note</label>
                  <div className="d-flex flex-wrap gap-2 align-items-center p-3 bg-light rounded">
                    <select className="form-select form-select-sm w-auto" value={octave} onChange={e => setOctave(e.target.value)}>
                      <option value="3">Oct 3</option>
                      <option value="4">Oct 4</option>
                      <option value="5">Oct 5</option>
                    </select>
                    {NOTES.map(n => (
                      <button key={n} type="button" onClick={() => addNote(n)} className="btn btn-outline-primary btn-sm">{n}</button>
                    ))}
                    <button type="button" onClick={() => addNote('R')} className="btn btn-outline-secondary btn-sm">Rest</button>
                    <input
                      ref={syllableRef}
                      type="text"
                      className="form-control form-control-sm w-auto"
                      placeholder="Syllable"
                      style={{ maxWidth: 100 }}
                      value={syllable}
                      onChange={e => setSyllable(e.target.value)}
                    />
                    <button type="button" onClick={undo} className="btn btn-outline-warning btn-sm">↺ Undo</button>
                    <button type="button" onClick={clearVoice} className="btn btn-outline-danger btn-sm ms-auto">
                      <i className="fas fa-trash me-1" /> Clear
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="form-label fw-bold small mb-3">
                    Staff Preview
                    <span className="badge bg-secondary ms-2">{totalSheets} sheet{totalSheets > 1 ? 's' : ''}</span>
                  </label>
                  {Array.from({ length: totalSheets }, (_, s) => renderSheet(s, 'canvas', '#fafafa'))}
                </div>
                <div className="mt-4">
                  <label className="form-label fw-bold small">Full Lyrics</label>
                  <textarea className="form-control" rows={4} placeholder="Paste full lyrics here..." value={fullLyrics} onChange={e => setFullLyrics(e.target.value)} />
                </div>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary mt-3">
                  <i className="fas fa-save me-1" />
                  {saving ? 'Saving...' : 'Save Sheet'}
                </button>
              </div>
            </div>

            {/* Print Area — only this shows when printing */}
            <div id="print-only" style={{ background: '#fff' }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <h4 style={{ fontFamily: 'serif' }}>{song?.title}</h4>
                <p style={{ fontSize: '0.85rem', color: '#888', textAlign: 'right' }}>
                  {song?.author}{song?.composer ? `, ${song.composer}` : ''}
                </p>
              </div>
              {Array.from({ length: totalSheets }, (_, s) => renderSheet(s, 'preview', '#ffffff'))}
              {fullLyrics && (
                <>
                  <hr />
                  <div style={{ fontSize: '0.88rem', lineHeight: 1.9, color: '#555', whiteSpace: 'pre-wrap' }}>
                    {fullLyrics}
                  </div>
                </>
              )}
            </div>

            {/* Screen-only preview header */}
            <div className="card border-0 shadow-sm mb-4 no-print" style={{ marginTop: -16 }}>
              <div className="card-header bg-dark text-white">
                <i className="fas fa-eye me-2" /> Sheet Preview
                <span className="badge bg-secondary ms-2">{totalSheets} sheet{totalSheets > 1 ? 's' : ''}</span>
              </div>
            </div>

          </div>
        )}

        {/* Export Modal */}
        {showExport && (
          <div onClick={() => setShowExport(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 560, overflow: 'hidden' }}>
              <div className="d-flex align-items-center justify-content-between px-4 py-3 bg-dark text-white">
                <h5 className="fw-bold mb-0"><i className="fas fa-file-pdf me-2" /> Export PDF</h5>
                <button onClick={() => setShowExport(false)} style={{ background:'none', border:'none', color:'#fff', fontSize:20, cursor:'pointer' }}>×</button>
              </div>
              <div className="p-4">
                <div className="d-flex align-items-center gap-3 mb-3 p-3 rounded bg-light">
                  <div className="rounded-circle bg-dark text-white d-flex align-items-center justify-content-center" style={{ width:44, height:44, minWidth:44 }}>
                    <i className="fas fa-music" />
                  </div>
                  <div>
                    <h5 className="fw-bold mb-0">{song?.title}</h5>
                    <small className="text-muted">{song?.author || '—'}</small>
                  </div>
                </div>
                <div className="p-3 rounded border" style={{ maxHeight:180, overflowY:'auto', fontSize:'0.9rem', lineHeight:2 }}>
                  <pre style={{ fontFamily:'inherit', whiteSpace:'pre-wrap', margin:0 }}>{song?.lyrics || 'No lyrics.'}</pre>
                </div>
              </div>
              <div className="d-flex justify-content-between px-4 pb-4">
                <button onClick={() => setShowExport(false)} className="btn btn-outline-secondary">
                  <i className="fas fa-times me-2" /> Cancel
                </button>
                <a href={`${EXPORT_BASE}/${songId}`} target="_blank" rel="noreferrer" className="btn btn-danger px-4">
                  <i className="fas fa-download me-2" /> Download PDF
                </a>
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

export default MusicSheetBuilder;