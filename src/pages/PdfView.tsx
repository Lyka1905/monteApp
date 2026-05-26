import React, { useEffect, useState } from 'react';
import { IonPage, IonContent, IonSpinner } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import { documentTextOutline, downloadOutline, arrowBackOutline, personOutline, timeOutline } from 'ionicons/icons';

const API_BASE = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_Pdflibrary';
const PDF_URL  = 'https://itservicesph.com/IT383/MONTE/monte/uploads/pdfs';

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

  useEffect(() => {
    fetch(`${API_BASE}/view/${id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setPdf(json.data);
        setLoading(false);
      });
  }, [id]);

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

const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(`${PDF_URL}/${pdf?.filename}`)}&embedded=true`;

  return (
    <IonPage>
      <IonContent style={{ '--background': '#f8f9fa' } as any}>

       {/* HEADER */}
<div style={{ background: '#1e3a5f', padding: '30px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px', borderRadius: 10 }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
   <div style={{ background: 'rgba(255,255,255,0.15)', padding: '8px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 {/* PDF Icon */}
<div style={{ position: 'relative', width: 24, height: 28 }}>
  <IonIcon icon={documentTextOutline} style={{ fontSize: 24, color: '#fff' }} />
  <span style={{
    position: 'absolute', bottom: 0, left: '50%',
    transform: 'translateX(-50%)',
    color: '#fff',
    fontSize: 5, fontWeight: 900,
    padding: '0px 2px',
    letterSpacing: 0.5
  }}>PDF</span>
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
    
    <button onClick={() => history.goBack()}
      style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
      <IonIcon icon={arrowBackOutline} style={{ fontSize: 16 }} /> Back
    </button>
  </div>
</div>

        {/* PDF VIEWER */}
        <div style={{ background: '#f8f9fa', padding: '24px', minHeight: 'calc(100vh - 90px)', display: 'flex', justifyContent: 'center' }}>
         <div style={{ width: '100%', maxWidth: '100%', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <iframe
              src={googleViewerUrl}
              style={{ width: '100%', height: 'calc(100vh - 100px)', border: 'none' }}
              title={pdf?.title}
            />
          </div>
        </div>

      </IonContent>
    </IonPage>
  );
};

export default PdfView;