import React, { useEffect, useState } from 'react';
import {
  IonPage, IonContent, IonSpinner, IonIcon,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import {
  documentTextOutline, arrowBackOutline,
  personOutline, timeOutline,
} from 'ionicons/icons';
import Navbar from '../components/Navbar';

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
  const { id }  = useParams<{ id: string }>();
  const history = useHistory();

  const [pdf,     setPdf]     = useState<PdfFile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/view/${id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setPdf(json.data);
        setLoading(false);
      });
  }, [id]);

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

        <Navbar />

        {/* Header */}
        <div style={{ background: '#1e3a5f', padding: '14px 16px', margin: '16px', borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ background: 'rgba(255,255,255,0.15)', padding: '8px 10px', borderRadius: 6 }}>
                <IonIcon icon={documentTextOutline} style={{ fontSize: 24, color: '#fff' }} />
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{pdf?.title}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <span style={{ color: '#9ca3af', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IonIcon icon={personOutline} /> {pdf?.uploaded_by}
                  </span>
                  <span style={{ color: '#9ca3af', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IonIcon icon={timeOutline} /> {pdf?.created_at?.split(' ')[0]}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => history.goBack()}
              style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
            >
              <IonIcon icon={arrowBackOutline} /> Back
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div style={{ padding: '0 16px 24px' }}>
          <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
            <embed
              src={`${PDF_URL}/${pdf?.filename}`}
              type="application/pdf"
              style={{ width: '100%', height: 'calc(100vh - 220px)', border: 'none', display: 'block' }}
            />
          </div>
        </div>

      </IonContent>
    </IonPage>
  );
};

export default PdfView;