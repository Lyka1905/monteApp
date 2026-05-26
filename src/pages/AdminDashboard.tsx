import React, { useEffect, useState, useRef } from 'react';
import {
  IonContent, IonHeader, IonPage, IonToolbar,
  IonButtons, IonMenuButton, IonIcon, IonSpinner
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  musicalNotesOutline, pricetagsOutline, peopleOutline,
  micOutline, starOutline, megaphoneOutline, calendarOutline,
  searchOutline, createOutline, speedometerOutline,
  personCircleOutline, calendarNumberOutline,
  personOutline, logOutOutline, chevronDownOutline,
  eyeOutline, homeOutline, alarmOutline,
} from 'ionicons/icons';
import 'bootstrap/dist/css/bootstrap.min.css';

const BASE_URL   = 'https://itservicesph.com/IT383/MONTE/monte/index.php';
const stored     = JSON.parse(localStorage.getItem('user') ?? '{}');
const USER_NAME  = stored?.name   ?? 'Admin';
const USER_AVATAR= stored?.avatar ?? '';
const AVATAR_URL = 'https://itservicesph.com/IT383/MONTE/monte/uploads/avatars';

interface SongItem {
  id: number;
  title: string;
  author?: string;
  composer?: string;
  category_name?: string;
  lyrics?: string;
}

interface MassInfo {
  id: number;
  mass_type: string;
  mass_date: string;
  mass_time: string;
}

interface SongOfTheDayData {
  source: 'mass_schedule' | 'manual' | 'none';
  mass: MassInfo | null;
  songs: SongItem[];
}

const AdminDashboard: React.FC = () => {
  const history = useHistory();
  const [stats,          setStats]          = useState({ songs: 0, categories: 0, users: 0, recordings: 0 });
  const [announcements,  setAnnouncements]  = useState<any[]>([]);
  const [upcomingMasses, setUpcomingMasses] = useState<any[]>([]);
  const [sotd,           setSotd]           = useState<SongOfTheDayData | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [sotdLoading,    setSotdLoading]    = useState(true);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [showDropdown,   setShowDropdown]   = useState(false);
  const [dropdownPos,    setDropdownPos]    = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  // Fetch main dashboard stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${BASE_URL}/Api_dashboard`);
        const result   = await response.json();
        if (result.status === 'success') {
          setStats({
            songs:      result.stats.total_songs,
            categories: result.stats.total_categories,
            users:      result.stats.total_users,
            recordings: result.stats.total_recordings,
          });
          setAnnouncements(result.announcements    || []);
          setUpcomingMasses(result.upcoming_masses || []);
        }
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // Fetch Song of the Day separately
  useEffect(() => {
    const fetchSotd = async () => {
      try {
        const response = await fetch(`${BASE_URL}/Api_Songoftheday`);
        const result   = await response.json();
        if (result.status === 'success') {
          setSotd(result);
        }
      } catch (error) { console.error('SOTD error:', error); }
      finally { setSotdLoading(false); }
    };
    fetchSotd();
  }, []);

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

  const handleSearch = () => {
    if (searchQuery.trim()) history.push(`/songs?search=${encodeURIComponent(searchQuery.trim())}`);
    else history.push('/songs');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour   = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  // ── Song of the Day Card ──────────────────────────────────────────
  const renderSongOfTheDay = () => {
    if (sotdLoading) {
      return (
        <div className="d-flex justify-content-center align-items-center py-5">
          <IonSpinner name="crescent" />
        </div>
      );
    }

    // Has today's mass with songs
    if (sotd?.source === 'mass_schedule' && sotd.mass && sotd.songs.length > 0) {
      return (
        <>
          <small className="text-muted d-flex align-items-center gap-1 mb-3">
            <IonIcon icon={homeOutline} />
            Songs for <strong className="mx-1">{sotd.mass.mass_type}</strong>
            <IonIcon icon={alarmOutline} className="ms-1" />
            {formatTime(sotd.mass.mass_time)}
          </small>
          {sotd.songs.map((song) => (
            <div key={song.id} className="d-flex align-items-center justify-content-between mb-2 p-2 rounded" style={{ background: '#f8f9fa' }}>
              <div>
                <div className="fw-semibold small">{song.title}</div>
                {song.category_name && (
                  <span className="badge bg-primary mt-1" style={{ fontSize: '0.7rem' }}>
                    {song.category_name}
                  </span>
                )}
              </div>
              <button
                className="btn btn-primary btn-sm d-flex align-items-center justify-content-center"
                style={{ width: 34, height: 34 }}
                onClick={() => history.push(`/song-view/${song.id}`)}
              >
                <IonIcon icon={eyeOutline} />
              </button>
            </div>
          ))}
        </>
      );
    }

    // Manual song of the day
    if (sotd?.source === 'manual' && sotd.songs.length > 0) {
      const song = sotd.songs[0];
      return (
        <div className="text-center">
          <IonIcon icon={musicalNotesOutline} style={{ fontSize: '3rem', color: '#0d6efd' }} />
          <h6 className="fw-bold mt-3 mb-1">{song.title}</h6>
          <p className="text-muted small mb-2">{song.author ?? 'Unknown Artist'}</p>
          {song.category_name && (
            <span className="badge bg-primary mb-3">{song.category_name}</span>
          )}
          {song.lyrics && (
            <p className="small text-muted text-start" style={{ maxHeight: 80, overflow: 'hidden' }}>
              {song.lyrics.substring(0, 150)}...
            </p>
          )}
          <button
            className="btn btn-primary btn-sm w-100 mt-2"
            onClick={() => history.push(`/song-view/${song.id}`)}
          >
            <IonIcon icon={eyeOutline} className="me-1" /> View Full Song
          </button>
        </div>
      );
    }

    // No song today
    return (
      <div className="text-center py-4 text-muted">
        <IonIcon icon={starOutline} style={{ fontSize: '3.5rem', color: '#ccc' }} />
        <p className="small mt-3">
          No song selected for today!<br />
          <small>Click the edit button to set one!</small>
        </p>
      </div>
    );
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#1a1a2e', '--color': '#fff', '--min-height': '56px' }}>
          <IonButtons slot="start">
            <IonMenuButton color="light" menu="main-menu" />
          </IonButtons>

          <div slot="end" style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingRight: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '4px', overflow: 'hidden', height: '35px' }}>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search songs..."
                style={{ background: 'transparent', border: 'none', outline: 'none', color: '#333', fontSize: '0.85rem', padding: '0 12px', width: '180px' }}
              />
              <button onClick={handleSearch} style={{ background: '#0d6efd', border: 'none', height: '100%', padding: '0 12px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <IonIcon icon={searchOutline} />
              </button>
            </div>

            <div ref={triggerRef} onClick={handleToggleDropdown} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              {USER_AVATAR ? (
                <img src={`${AVATAR_URL}/${USER_AVATAR}`} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} />
              ) : (
                <IonIcon icon={personCircleOutline} style={{ fontSize: '2rem', color: '#ccc' }} />
              )}
              <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 500 }}>{USER_NAME}</span>
              <IonIcon icon={chevronDownOutline} style={{ color: '#aaa', fontSize: '0.8rem' }} />
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#f4f6fb' }}>
        <div className="container-fluid p-4">
          <div className="mb-4">
            <h4 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <IonIcon icon={speedometerOutline} style={{ fontSize: '1.5rem' }} />
              Dashboard
            </h4>
            <p className="text-muted small mb-0">Welcome back, <strong>{USER_NAME}!</strong> 👋</p>
          </div>

          {/* Stats Cards */}
          <div className="row g-3 mb-4">
            {[
              { label: 'Total Songs',      value: stats.songs,      color: '#0d6efd', icon: musicalNotesOutline, link: 'View Songs',      route: '/songs'        },
              { label: 'Total Categories', value: stats.categories, color: '#198754', icon: pricetagsOutline,    link: 'View Categories', route: '/categories'   },
              { label: 'Total Users',      value: stats.users,      color: '#ffc107', icon: peopleOutline,       link: 'Manage Users',    route: '/manage-users' },
              { label: 'Total Recordings', value: stats.recordings, color: '#dc3545', icon: micOutline,          link: 'My Recordings',   route: '/recordings'   },
            ].map((card, i) => (
              <div className="col-md-3 col-6" key={i}>
                <div
                  className="card border-0 rounded-3 overflow-hidden position-relative"
                  style={{ background: card.color, color: '#fff', cursor: 'pointer', minHeight: 130 }}
                  onClick={() => history.push(card.route)}
                >
                  <div className="p-3 position-relative" style={{ zIndex: 1 }}>
                    <small className="opacity-75 d-block mb-1 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>{card.label}</small>
                    <h2 className="fw-bold mb-3">
                      {loading ? <IonSpinner name="dots" /> : card.value}
                    </h2>
                    <div className="d-flex justify-content-between align-items-center" style={{ borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '8px' }}>
                      <small style={{ textDecoration: 'underline', fontSize: '0.78rem' }}>{card.link}</small>
                      <span style={{ fontSize: '1rem' }}>→</span>
                    </div>
                  </div>
                  <IonIcon icon={card.icon} className="position-absolute opacity-25" style={{ fontSize: '5rem', right: '-8px', bottom: '-8px', zIndex: 0 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Row */}
          <div className="row g-3">

            {/* ── Song of the Day ── */}
            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-header border-0 py-3" style={{ background: '#1a1a2e', color: '#fff' }}>
                  <span className="fw-semibold d-flex align-items-center gap-2" style={{ fontSize: '0.9rem' }}>
                    <IonIcon icon={starOutline} />
                    Song of the Day
                  </span>
                </div>
                <div className="card-body">
                  {renderSongOfTheDay()}
                </div>
              </div>
            </div>

            {/* ── Announcements ── */}
            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-header border-0 py-3 d-flex justify-content-between align-items-center" style={{ background: '#1a1a2e', color: '#fff' }}>
                  <span className="fw-semibold d-flex align-items-center gap-2" style={{ fontSize: '0.9rem' }}>
                    <IonIcon icon={megaphoneOutline} />
                    Announcements
                  </span>
                  <button className="btn btn-sm" onClick={() => history.push('/announcements')} style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '6px', fontSize: '0.78rem', padding: '2px 10px' }}>
                    View All
                  </button>
                </div>
                <div className="card-body p-0">
                  {announcements.length > 0 ? announcements.map((item, index) => (
                    <div key={index} className="p-3 border-bottom">
                      <div className="fw-bold small text-dark">{item.title}</div>
                      <small className="text-muted d-block text-truncate">{item.content}</small>
                      <small className="text-muted" style={{ fontSize: '0.7rem' }}>{formatDate(item.created_at)}</small>
                    </div>
                  )) : (
                    <div className="d-flex flex-column align-items-center justify-content-center py-5">
                      <IonIcon icon={megaphoneOutline} style={{ fontSize: '2.5rem', color: '#ccc' }} />
                      <p className="text-muted small mt-2">No announcements yet!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Upcoming Masses ── */}
            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-header border-0 py-3 d-flex justify-content-between align-items-center" style={{ background: '#1a1a2e', color: '#fff' }}>
                  <span className="fw-semibold d-flex align-items-center gap-2" style={{ fontSize: '0.9rem' }}>
                    <IonIcon icon={calendarNumberOutline} />
                    Upcoming Masses
                  </span>
                  <button className="btn btn-sm" onClick={() => history.push('/mass-schedule')} style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '6px', fontSize: '0.78rem', padding: '2px 10px' }}>
                    View All
                  </button>
                </div>
                <div className="card-body p-0">
                  {upcomingMasses.length > 0 ? upcomingMasses.map((mass, index) => (
                    <div key={index} className="p-3 border-bottom">
                      <div className="fw-bold small text-dark text-capitalize mb-1">{mass.mass_type || 'Mass Service'}</div>
                      <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.78rem' }}>
                        <span>📅 {formatDate(mass.mass_date)}</span>
                        <span>|</span>
                        <span>🕐 {formatTime(mass.mass_time)}</span>
                      </div>
                      {mass.notes && <small className="text-muted fst-italic d-block mt-1" style={{ fontSize: '0.7rem' }}>{mass.notes}</small>}
                    </div>
                  )) : (
                    <div className="d-flex flex-column align-items-center justify-content-center py-5">
                      <IonIcon icon={calendarOutline} style={{ fontSize: '2.5rem', color: '#ccc' }} />
                      <p className="text-muted small mt-2">No upcoming schedules.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </IonContent>

      {/* User Dropdown */}
      {showDropdown && (
        <div style={{ position: 'fixed', top: dropdownPos.top, right: dropdownPos.right, background: '#fff', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.18)', minWidth: '190px', zIndex: 99999, overflow: 'hidden', pointerEvents: 'all' }}>
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

          <div onMouseDown={() => { setShowDropdown(false); history.push('/my-profile'); }} style={dropdownItemStyle} onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <IonIcon icon={personOutline} style={{ fontSize: '1rem', color: '#374151' }} />
            <span>My Profile</span>
          </div>

          <div style={{ height: '1px', background: '#e5e7eb', margin: '0 12px' }} />

          <div onMouseDown={() => { localStorage.clear(); window.location.href = '/login'; }} style={{ ...dropdownItemStyle, color: '#dc2626' }} onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <IonIcon icon={logOutOutline} style={{ fontSize: '1rem', color: '#dc2626' }} />
            <span>Logout</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </IonPage>
  );
};

const dropdownItemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '10px',
  padding: '10px 16px', cursor: 'pointer', fontSize: '0.85rem',
  color: '#374151', fontWeight: 500, background: 'transparent',
};

export default AdminDashboard;