import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  IonContent, IonPage, IonBadge, IonIcon, IonSpinner,
  IonToast, IonModal, IonAlert
} from '@ionic/react';
import {
  cloudUploadOutline, eyeOutline, downloadOutline, trashOutline,
  documentTextOutline, musicalNoteOutline, peopleOutline, libraryOutline,
  timeOutline, closeOutline, cloudDoneOutline, personOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import Navbar from '../components/Navbar';

const API_BASE   = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_Pdflibrary';
const UPLOAD_URL = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_Pdflibrary/store';
const PDF_URL    = 'https://itservicesph.com/IT383/MONTE/monte/uploads/pdfs';

interface PdfFile {
  id: number;
  title: string;
  type: string;
  description: string;
  uploaded_by?: string;
  filename: string;
  created_at?: string;
}

const PDFviewer: React.FC = () => {
  const history      = useHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pdfFiles,    setPdfFiles]    = useState<PdfFile[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [typeFilter,  setTypeFilter]  = useState('');
  const [search,      setSearch]      = useState('');
  const [toast,       setToast]       = useState({ show: false, msg: '', color: 'success' });
  const [showUpload,  setShowUpload]  = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [deleteAlert, setDeleteAlert] = useState<{ show: boolean; id: number | null; title: string }>({ show: false, id: null, title: '' });
  const [dragOver,    setDragOver]    = useState(false);
  const [uploadForm,  setUploadForm]  = useState({ title: '', type: 'song_sheet', description: '' });
  const [selectedFile,setSelectedFile]= useState<File | null>(null);
  const [refreshKey,  setRefreshKey]  = useState(0);

  const [currentUser] = useState(() => JSON.parse(localStorage.getItem('user') ?? '{}'));
  const isAdmin    = currentUser.role === 'admin';

  const notify = (msg: string, color = 'success') =>
    setToast({ show: true, msg, color });

  const fetchPdfs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      const res  = await fetch(`${API_BASE}/pdfs?${params}&_=${Date.now()}`);
      const json = await res.json();
      if (json.success) setPdfFiles(json.data.pdfs);
    } catch {
      notify('Network error.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, refreshKey]);

  useEffect(() => { fetchPdfs(); }, [fetchPdfs]);

  const handleDownload = (filename: string, title: string) => {
  fetch(`${PDF_URL}/${filename}`)
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `${title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      notify('Download started!');
    })
    .catch(() => notify('Download failed.', 'danger'));
};

  const handleDelete = async (id: number) => {
    try {
      const res  = await fetch(`${API_BASE}/delete/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { notify('PDF deleted.'); fetchPdfs(); }
      else notify(json.message ?? 'Delete failed.', 'danger');
    } catch { notify('Network error.', 'danger'); }
  };

  const handleUpload = async () => {
    if (!selectedFile)            { notify('Please select a PDF file.', 'warning'); return; }
    if (!uploadForm.title.trim()) { notify('Title is required.', 'warning'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('pdf_file',    selectedFile);
    fd.append('title',       uploadForm.title.trim());
    fd.append('type',        uploadForm.type);
    fd.append('description', uploadForm.description.trim());
    fd.append('user_id',     String(currentUser?.id ?? 0));
    try {
      const res  = await fetch(UPLOAD_URL, { method: 'POST', body: fd });
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        if (json.success || json.status === 'success' || json.status === true) {
          notify('PDF uploaded successfully!');
          setShowUpload(false);
          resetUploadForm();
          setRefreshKey(k => k + 1);
        } else {
          notify(json.message ?? 'Upload failed.', 'danger');
        }
      } catch {
        if (res.ok) {
          notify('PDF uploaded successfully!');
          setShowUpload(false);
          resetUploadForm();
          setRefreshKey(k => k + 1);
        } else {
          notify(`Upload failed (${res.status})`, 'danger');
        }
      }
    } catch (err: any) {
      notify(`Network error: ${err?.message}`, 'danger');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadForm({ title: '', type: 'song_sheet', description: '' });
    setSelectedFile(null);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') setSelectedFile(file);
    else notify('Please drop a PDF file only.', 'warning');
  };

  const types = [
    { label: 'All',             value: '',                icon: null               },
    { label: 'Song Sheets',     value: 'song_sheet',      icon: musicalNoteOutline  },
    { label: 'Music Scores',    value: 'music_score',     icon: documentTextOutline },
    { label: 'Choir Materials', value: 'choir_materials', icon: peopleOutline       },
    { label: 'Other',           value: 'other',           icon: libraryOutline      },
  ];

  const filteredPdfs = pdfFiles.filter(f =>
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    (f.uploaded_by ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <IonPage>
      <IonContent style={{ '--background': '#f8f9fa' } as any}>

        <Navbar
          searchPlaceholder="Search PDFs..."
          onSearch={q => setSearch(q)}
        />

        <div style={{ padding: '16px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <IonIcon icon={documentTextOutline} style={{ fontSize: 22 }} /> PDF Library
              </h1>
              <p style={{ margin: '4px 0 0', color: '#6c757d', fontSize: 13 }}>Browse song sheets, music scores and choir materials.</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowUpload(true)}
                style={{ background: '#212529', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 14px', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
              >
                <IonIcon icon={cloudUploadOutline} /> Upload
              </button>
            )}
          </div>

          {/* Type Filters */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {types.map(t => (
              <button key={t.value} onClick={() => setTypeFilter(t.value)}
                style={{ background: typeFilter === t.value ? '#212529' : '#fff', color: typeFilter === t.value ? '#fff' : '#212529', border: '1px solid #dee2e6', borderRadius: 6, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500, fontSize: 12, cursor: 'pointer' }}>
                {t.icon && <IonIcon icon={t.icon} style={{ fontSize: 14 }} />} {t.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', border: '1px solid #e9ecef' }}>
            <div style={{ background: '#212529', color: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <IonIcon icon={documentTextOutline} style={{ fontSize: 16 }} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>PDF Files</span>
              <IonBadge color="secondary" style={{ fontSize: 11 }}>{filteredPdfs.length}</IonBadge>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center' }}><IonSpinner name="crescent" /></div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: 480, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <th style={thStyle}>#</th>
                      <th style={thStyle}>Title</th>
                      <th style={thStyle}>Type</th>
                      <th style={thStyle}>Uploaded By</th>
                      <th style={thStyle}>Date</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPdfs.length > 0 ? filteredPdfs.map((file, i) => (
                      <tr key={file.id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                        <td style={{ ...tdStyle, color: '#adb5bd' }}>{i + 1}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ background: '#e03e3e', color: '#fff', padding: 4, borderRadius: 4, fontSize: 12, display: 'flex' }}>
                              <IonIcon icon={documentTextOutline} />
                            </div>
                            <span style={{ fontWeight: 600, fontSize: 13 }}>{file.title}</span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ background: '#e9ecef', color: '#495057', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                            {file.type.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: '#6c757d', fontSize: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <IonIcon icon={personOutline} /> {file.uploaded_by || 'Staff'}
                          </div>
                        </td>
                        <td style={{ ...tdStyle, color: '#6c757d', fontSize: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <IonIcon icon={timeOutline} /> {file.created_at?.split(' ')[0] || 'N/A'}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <button onClick={() => history.push(`/pdf-view/${file.id}`)}
                              style={{ background: '#212529', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 10px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                              <IonIcon icon={eyeOutline} /> View
                            </button>
                            <button onClick={() => handleDownload(file.filename, file.title)}
                              style={{ background: '#fff', border: '1px solid #dee2e6', borderRadius: 4, padding: '5px 8px', color: '#495057', cursor: 'pointer' }}>
                              <IonIcon icon={downloadOutline} />
                            </button>
                            {isAdmin && (
                              <button onClick={() => setDeleteAlert({ show: true, id: file.id, title: file.title })}
                                style={{ background: '#fff', border: '1px solid #ffc9c9', borderRadius: 4, padding: '5px 8px', color: '#fa5252', cursor: 'pointer' }}>
                                <IonIcon icon={trashOutline} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#999' }}>No PDF files found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ marginTop: 32, textAlign: 'center', color: '#adb5bd', fontSize: 12 }}>
            © 2026 Ad Jesum Song List System
          </div>
        </div>

        <IonToast isOpen={toast.show} message={toast.msg} color={toast.color as any} duration={2000}
          onDidDismiss={() => setToast(t => ({ ...t, show: false }))} />

        {/* Upload Modal */}
        <IonModal isOpen={showUpload} onDidDismiss={() => { setShowUpload(false); resetUploadForm(); }}>
          <div style={{ background: '#1a2744', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IonIcon icon={cloudUploadOutline} style={{ fontSize: 20, color: '#fff' }} />
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Upload PDF</span>
            </div>
            <button onClick={() => { setShowUpload(false); resetUploadForm(); }}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer' }}>
              <IonIcon icon={closeOutline} />
            </button>
          </div>

          <IonContent style={{ '--background': '#f8f9fa' }} className="ion-padding">
            <div style={{ maxWidth: 520, margin: '0 auto', paddingTop: 8 }}>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ border: `3px dashed ${dragOver ? '#0d6efd' : '#dee2e6'}`, borderRadius: 16, padding: '2rem', textAlign: 'center', background: dragOver ? '#e8f0fe' : '#fff', cursor: 'pointer', marginBottom: 16 }}
              >
                <IonIcon icon={cloudUploadOutline} style={{ fontSize: 40, color: dragOver ? '#0d6efd' : '#adb5bd', display: 'block', margin: '0 auto 10px' }} />
                {selectedFile ? (
                  <div>
                    <IonIcon icon={cloudDoneOutline} style={{ fontSize: 18, color: '#2563eb' }} />
                    <p style={{ margin: '6px 0 0', fontWeight: 700, color: '#2563eb', fontSize: 13 }}>📄 {selectedFile.name}</p>
                    <p style={{ margin: '2px 0 0', color: '#6c757d', fontSize: 12 }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <>
                    <p style={{ fontWeight: 700, margin: '0 0 4px', color: '#212529', fontSize: 14 }}>Click to select a PDF file</p>
                    <p style={{ color: '#6c757d', fontSize: 12, margin: 0 }}>or drag and drop · Max 10MB</p>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }}
                  onChange={e => { const file = e.target.files?.[0]; if (file) setSelectedFile(file); }} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Title *</label>
                <input value={uploadForm.title} onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Ave Maria - Sheet Music" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Type</label>
                <select value={uploadForm.type} onChange={e => setUploadForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                  <option value="song_sheet">🎵 Song Sheet</option>
                  <option value="music_score">📄 Music Score</option>
                  <option value="choir_material">👥 Choir Material</option>
                  <option value="other">📁 Other</option>
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Description (optional)</label>
                <textarea value={uploadForm.description} onChange={e => setUploadForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <button onClick={handleUpload} disabled={uploading}
                style={{ background: '#212529', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontWeight: 700, fontSize: 14, width: '100%', cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: uploading ? 0.7 : 1 }}>
                <IonIcon icon={cloudUploadOutline} />
                {uploading ? 'Uploading...' : 'Upload PDF'}
              </button>
            </div>
          </IonContent>
        </IonModal>

        {/* Delete Alert */}
        <IonAlert
          isOpen={deleteAlert.show}
          onDidDismiss={() => setDeleteAlert({ show: false, id: null, title: '' })}
          header="Delete PDF"
          message={`Are you sure you want to delete "${deleteAlert.title}"?`}
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Delete', role: 'destructive', handler: () => { if (deleteAlert.id) handleDelete(deleteAlert.id); } }
          ]}
        />

      </IonContent>
    </IonPage>
  );
};

const thStyle: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#495057' };
const tdStyle: React.CSSProperties = { padding: '12px 16px', fontSize: 13, color: '#212529' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 700, color: '#212529', marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#111', background: '#fff' };

export default PDFviewer;