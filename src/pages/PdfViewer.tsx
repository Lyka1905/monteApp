import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  IonContent, IonPage, IonBadge, IonIcon, IonSpinner, IonToast, IonAlert, IonModal
} from '@ionic/react';
import { 
  cloudUploadOutline, eyeOutline, downloadOutline, trashOutline, 
  musicalNotes, chevronDownOutline, personOutline, logOutOutline,
  documentTextOutline, musicalNoteOutline, peopleOutline, libraryOutline,
  timeOutline, closeOutline, cloudDoneOutline, searchOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

const API_BASE   = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_Pdflibrary';
const UPLOAD_URL = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_Pdflibrary/store';
const PDF_URL    = 'https://itservicesph.com/IT383/MONTE/monte/uploads/pdfs';
const AVATAR_URL = 'https://itservicesph.com/IT383/MONTE/monte/uploads/avatars';

interface PdfFile {
  id: number;
  title: string;
  type: string;
  description: string;
  uploaded_by?: string;
  filename: string;
  created_at?: string;
}

// user is read inside the component so it always gets the latest value

const PDFviewer: React.FC = () => {
  const history    = useHistory();
  const triggerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pdfFiles,      setPdfFiles]      = useState<PdfFile[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [typeFilter,    setTypeFilter]    = useState('');
  const [search,        setSearch]        = useState('');
  const [toast,         setToast]         = useState({ show: false, msg: '', color: 'success' });
  const [showUpload,    setShowUpload]    = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [showDropdown,  setShowDropdown]  = useState(false);
  const [dropdownPos,   setDropdownPos]   = useState({ top: 0, right: 0 });
  const [deleteAlert,   setDeleteAlert]   = useState<{ show: boolean; id: number | null; title: string }>({ show: false, id: null, title: '' });
  const [dragOver,      setDragOver]      = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [viewUrl, setViewUrl] = useState('');
  const [uploadForm,    setUploadForm]    = useState({ title: '', type: 'song_sheet', description: '' });
  const [selectedFile,  setSelectedFile]  = useState<File | null>(null);

  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('user') ?? '{}'));

  useEffect(() => {
    setCurrentUser(JSON.parse(localStorage.getItem('user') ?? '{}'));
  }, []);

  const user    = currentUser;
  const isAdmin = user.role === 'admin';
  const USER_NAME   = user?.name   ?? 'User';
  const USER_AVATAR = user?.avatar ?? '';

  const notify = (msg: string, color = 'success') =>
    setToast({ show: true, msg, color });

  const [refreshKey, setRefreshKey] = useState(0);

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

 const handleView = (id: number) => {
  history.push(`/pdf-view/${id}`);
};

  const handleDownload = (filename: string, title: string) => {
    const a    = document.createElement('a');
    a.href     = `${PDF_URL}/${filename}`;
    a.download = `${title}.pdf`;
    a.target   = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    notify('Download started!');
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

    const currentUser = JSON.parse(localStorage.getItem('user') ?? '{}');
    console.log('[Upload] user_id:', currentUser?.id, '| file:', selectedFile?.name);
    const fd   = new FormData();
    fd.append('pdf_file',    selectedFile);
    fd.append('title',       uploadForm.title.trim());
    fd.append('type',        uploadForm.type);
    fd.append('description', uploadForm.description.trim());
    fd.append('user_id',     String(currentUser?.id ?? 0));

    try {
      const res  = await fetch(UPLOAD_URL, { method: 'POST', body: fd });
      const text = await res.text();
      console.log('[Upload] status:', res.status, '| response:', text);
      try {
        const json = JSON.parse(text);
        console.log('[Upload] parsed:', json);
        if (json.success || json.status === 'success' || json.status === true) {
          notify('PDF uploaded successfully!');
          setShowUpload(false);
          resetUploadForm();
          setRefreshKey(k => k + 1);
        } else {
          notify(json.message ?? JSON.stringify(json.debug) ?? 'Upload failed.', 'danger');
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

  // Filter by search
  const filteredPdfs = pdfFiles.filter(f =>
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    (f.uploaded_by ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <IonPage>
      <IonContent style={{ '--background': '#f8f9fa' } as any}>

        {/* ── NAVBAR ── */}
        <div style={navStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Search bar */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search PDFs..."
                style={{ border: 'none', outline: 'none', padding: '8px 14px', fontSize: 14, width: 220 }}
              />
              <button style={{ background: '#2563eb', border: 'none', color: '#fff', padding: '9px 14px', cursor: 'pointer', fontSize: 15 }}>
                <IonIcon icon={searchOutline} />
              </button>
            </div>

            {/* Profile dropdown */}
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

        {/* ── PROFILE DROPDOWN MENU ── */}
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
        <div style={{ padding: '25px 30px', maxWidth: '1100px', margin: '0 auto' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IonIcon icon={documentTextOutline} style={{ fontSize: '28px', color: '#212529' }} />
                <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: '#212529' }}>PDF Library</h1>
              </div>
              <p style={{ margin: '4px 0 0 38px', color: '#6c757d', fontSize: '15px' }}>Browse and view song sheets, music scores and choir materials.</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowUpload(true)}
                style={{ background: '#212529', color: '#fff', border: 'none', borderRadius: '4px', padding: '10px 16px', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <IonIcon icon={cloudUploadOutline} /> Upload PDF
              </button>
            )}
          </div>

          {/* Type Filters */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '25px', flexWrap: 'wrap' }}>
            {types.map(t => (
              <button key={t.value} onClick={() => setTypeFilter(t.value)}
                style={{ background: typeFilter === t.value ? '#212529' : '#fff', color: typeFilter === t.value ? '#fff' : '#212529', border: '1px solid #dee2e6', borderRadius: '6px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500, fontSize: '14px', cursor: 'pointer' }}>
                {t.icon && <IonIcon icon={t.icon} style={{ fontSize: '16px' }} />} {t.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e9ecef', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ background: '#212529', color: '#fff', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <IonIcon icon={documentTextOutline} style={{ fontSize: '16px' }} />
              <span style={{ fontWeight: 600, fontSize: '14px' }}>PDF Files</span>
              <IonBadge color="secondary" style={{ fontSize: '11px' }}>{filteredPdfs.length}</IonBadge>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}><IonSpinner name="crescent" /></div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ background: '#e03e3e', color: '#fff', padding: '5px', borderRadius: '4px', display: 'flex', fontSize: '12px' }}>
                              <IonIcon icon={documentTextOutline} />
                            </div>
                            <span style={{ fontWeight: 600, fontSize: '14px', color: '#212529' }}>{file.title}</span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ background: '#e9ecef', color: '#495057', padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                            {file.type.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: '#6c757d', fontSize: '13px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <IonIcon icon={personOutline} /> {file.uploaded_by || 'Staff'}
                          </div>
                        </td>
                        <td style={{ ...tdStyle, color: '#6c757d', fontSize: '13px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <IonIcon icon={timeOutline} /> {file.created_at?.split(' ')[0] || 'N/A'}
                          </div>
                        </td>
                        <td style={{ padding: '15px 20px' }}>
                          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                            <button onClick={() => handleView(file.id)}
                              style={{ background: '#212529', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                              <IonIcon icon={eyeOutline} /> View
                            </button>
                            <button onClick={() => handleDownload(file.filename, file.title)}
                              title="Download"
                              style={{ background: '#fff', border: '1px solid #dee2e6', borderRadius: '4px', padding: '6px 8px', color: '#495057', cursor: 'pointer' }}>
                              <IonIcon icon={downloadOutline} />
                            </button>
                            {isAdmin && (
                              <button onClick={() => setDeleteAlert({ show: true, id: file.id, title: file.title })}
                                title="Delete"
                                style={{ background: '#fff', border: '1px solid #ffc9c9', borderRadius: '4px', padding: '6px 8px', color: '#fa5252', cursor: 'pointer' }}>
                                <IonIcon icon={trashOutline} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#999' }}>No PDF files found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ marginTop: '40px', textAlign: 'center', color: '#adb5bd', fontSize: '13px' }}>
            © 2026 Ad Jesum Song List System
          </div>
        </div>

        <IonToast isOpen={toast.show} message={toast.msg} color={toast.color as any} duration={2000}
          onDidDismiss={() => setToast(t => ({ ...t, show: false }))} />

      </IonContent>

        {/* ── Upload Modal ── */}
        <IonModal isOpen={showUpload} onDidDismiss={() => { setShowUpload(false); resetUploadForm(); }}>
          <div style={{ background: '#1a2744', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IonIcon icon={cloudUploadOutline} style={{ fontSize: 22, color: '#fff' }} />
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 17 }}>Upload PDF</span>
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
                style={{ border: `3px dashed ${dragOver ? '#0d6efd' : '#dee2e6'}`, borderRadius: 16, padding: '2rem', textAlign: 'center', background: dragOver ? '#e8f0fe' : '#fff', cursor: 'pointer', marginBottom: 20, transition: 'all 0.2s' }}
              >
                <IonIcon icon={cloudUploadOutline} style={{ fontSize: 48, color: dragOver ? '#0d6efd' : '#adb5bd', display: 'block', margin: '0 auto 10px' }} />
                {selectedFile ? (
                  <div>
                    <IonIcon icon={cloudDoneOutline} style={{ fontSize: 20, color: '#2563eb' }} />
                    <p style={{ margin: '6px 0 0', fontWeight: 700, color: '#2563eb', fontSize: 14 }}>📄 {selectedFile.name}</p>
                    <p style={{ margin: '2px 0 0', color: '#6c757d', fontSize: 12 }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <>
                    <p style={{ fontWeight: 700, margin: '0 0 4px', color: '#212529' }}>Click to select a PDF file</p>
                    <p style={{ color: '#6c757d', fontSize: 13, margin: 0 }}>or drag and drop here · Max 10MB</p>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }}
                  onChange={e => { const file = e.target.files?.[0]; if (file) setSelectedFile(file); }} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Title <span style={{ color: '#dc2626' }}>*</span></label>
                <input value={uploadForm.title} onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Ave Maria - Sheet Music" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Type</label>
                <select value={uploadForm.type} onChange={e => setUploadForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                  <option value="song_sheet">🎵 Song Sheet</option>
                  <option value="music_score">📄 Music Score</option>
                  <option value="choir_material">👥 Choir Material</option>
                  <option value="other">📁 Other</option>
                </select>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Description <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                <textarea value={uploadForm.description} onChange={e => setUploadForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <button onClick={handleUpload} disabled={uploading}
                style={{ background: '#212529', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontWeight: 700, fontSize: 15, width: '100%', cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: uploading ? 0.7 : 1 }}>
                <IonIcon icon={cloudUploadOutline} />
                {uploading ? 'Uploading...' : 'Upload PDF'}
              </button>
            </div>
          </IonContent>
        </IonModal>

        <IonModal isOpen={viewModal} onDidDismiss={() => setViewModal(false)}>
      <div style={{ background: '#1a2744', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 17 }}>View PDF</span>
        <button onClick={() => setViewModal(false)}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer' }}>
          <IonIcon icon={closeOutline} />
        </button>
      </div>
      <iframe 
        src={viewUrl} 
        style={{ width: '100%', height: '100%', border: 'none' }} 
      />
    </IonModal>

        

        {/* Delete Alert */}
        <IonAlert
          isOpen={deleteAlert.show}
          onDidDismiss={() => setDeleteAlert({ show: false, id: null, title: '' })}
          header="Delete PDF"
          message={`Are you sure you want to delete "${deleteAlert.title}"? This cannot be undone.`}
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Delete', role: 'destructive', handler: () => { if (deleteAlert.id) handleDelete(deleteAlert.id); } }
          ]}
        />
    </IonPage>
  );
};

/* ── Styles ─────────────────────────────────────────────────────────────── */
const navStyle: React.CSSProperties             = { background: '#111827', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 };
const avatarContainerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 14, cursor: 'pointer' };
const avatarCircleStyle: React.CSSProperties    = { width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff' };
const dropdownItemStyle: React.CSSProperties    = { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', cursor: 'pointer', fontSize: '0.85rem', color: '#374151', fontWeight: 500, background: 'transparent' };
const thStyle: React.CSSProperties              = { padding: '15px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#495057' };
const tdStyle: React.CSSProperties              = { padding: '15px 20px', fontSize: '14px', color: '#212529' };
const labelStyle: React.CSSProperties           = { display: 'block', fontSize: 13, fontWeight: 700, color: '#212529', marginBottom: 6 };
const inputStyle: React.CSSProperties           = { width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#111', background: '#fff' };

export default PDFviewer;