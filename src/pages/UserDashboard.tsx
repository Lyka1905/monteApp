import React, { useState, useEffect, useRef } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar,
  IonButtons, IonMenuButton, IonIcon, IonSpinner,
} from '@ionic/react';
import {
  musicalNotesOutline, calendarOutline, megaphoneOutline,
  personOutline, micOutline, pricetagsOutline, starOutline,
  searchOutline, chevronDownOutline, logOutOutline,
  personCircleOutline, chevronForwardOutline, calendarNumberOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const API_BASE = 'https://itservicesph.com/IT383/MONTE/monte/index.php/Api_dashboard';
const AVATAR_URL = 'https://itservicesph.com/IT383/MONTE/monte/uploads/avatars';

const UserDashboard: React.FC = () => {
  const history = useHistory();
  const stored  = JSON.parse(localStorage.getItem('user') ?? '{}');
  const USER_NAME   = stored?.name   ?? 'Member';
  const USER_AVATAR = stored?.avatar ?? '';

  const [showWelcome,    setShowWelcome]    = useState(true);
  const [stats,          setStats]          = useState({ songs: 0, categories: 0, recordings: 0 });
  const [announcements,  setAnnouncements]  = useState<any[]>([]);
  const [upcomingMasses, setUpcomingMasses] = useState<any[]>([]);
  const [songOfTheDay,   setSongOfTheDay]   = useState<any>(null);
  const [loading,        setLoading]        = useState(true);
  const [showDropdown,   setShowDropdown]   = useState(false);
  const [dropdownPos,    setDropdownPos]    = useState({ top: 0, right: 0 });
  const [searchQuery,    setSearchQuery]    = useState('');
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res    = await fetch(API_BASE);
        const result = await res.json();
        if (result.status === 'success') {
          setStats({
            songs:      result.stats.total_songs,
            categories: result.stats.total_categories,
            recordings: result.stats.total_recordings,
          });
          setAnnouncements(result.announcements   || []);
          setUpcomingMasses(result.upcoming_masses || []);
          setSongOfTheDay(result.song_of_the_day  || null);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
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

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
  const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#1a1a2e', '--color': '#fff', '--min-height': '56px' }}>
          <IonButtons slot="start">
            <IonMenuButton color="light" />
          </IonButtons>

          <div slot="end" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '12px' }}>
            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '8px', padding: '4px 12px', gap: '8px'
            }}>
              <IonIcon icon={searchOutline} style={{ color: '#aaa', fontSize: '1rem' }} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search songs..."
                style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.85rem', width: '160px' }}
              />
              <button onClick={handleSearch} style={{ background: '#0d6efd', border: 'none', borderRadius: '6px', padding: '3px 10px', color: '#fff', cursor: 'pointer' }}>
                <IonIcon icon={searchOutline} style={{ fontSize: '0.85rem' }} />
              </button>
            </div>

            {/* Profile trigger */}
            <div
              ref={triggerRef}
              onClick={handleToggleDropdown}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px', background: showDropdown ? 'rgba(255,255,255,0.1)' : 'transparent' }}
            >
              {USER_AVATAR ? (
                <img src={`${AVATAR_URL}/${USER_AVATAR}`} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <IonIcon icon={personCircleOutline} style={{ fontSize: '2rem', color: '#ccc' }} />
              )}
              <span style={{ color: '#fff', fontSize: '0.85rem' }}>{USER_NAME}</span>
              <IonIcon icon={chevronDownOutline} style={{ color: '#aaa', fontSize: '0.75rem', transition: 'transform 0.2s', transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#f4f6fb' }}>
        <div className="container-fluid p-3">

          {/* Welcome Alert */}
          {showWelcome && (
            <div className="alert alert-success d-flex align-items-center justify-content-between border-0 shadow-sm mb-3 py-2 rounded-3" role="alert">
              <div className="small">Welcome back, <strong>{USER_NAME}!</strong></div>
              <button type="button" className="btn-close small" style={{ fontSize: '0.5rem' }} onClick={() => setShowWelcome(false)} />
            </div>
          )}

          {/* Title */}
          <div className="mb-3">
            <h4 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <IonIcon icon={musicalNotesOutline} style={{ fontSize: '1.5rem' }} />
              Dashboard
            </h4>
            <p className="text-muted small mb-0">Welcome back, <strong>{USER_NAME}!</strong> 👋</p>
          </div>

          {/* Stat Cards */}
          <div className="row g-3 mb-4">
            {[
              { label: 'Total Songs',      value: stats.songs,      color: '#0d6efd', icon: musicalNotesOutline, link: 'View Songs',      route: '/songs'      },
              { label: 'Total Categories', value: stats.categories, color: '#198754', icon: pricetagsOutline,    link: 'View Categories', route: '/categories' },
              { label: 'Total Recordings', value: stats.recordings, color: '#dc3545', icon: micOutline,          link: 'My Recordings',   route: '/recordings' },
            ].map((card, i) => (
              <div className="col-4" key={i}>
                <div
                  className="card border-0 shadow-sm rounded-3 overflow-hidden position-relative"
                  style={{ background: card.color, color: '#fff', cursor: 'pointer' }}
                  onClick={() => history.push(card.route)}
                >
                  <div className="p-3 position-relative" style={{ zIndex: 1 }}>
                    <small className="opacity-75 d-block mb-1" style={{ fontSize: '0.78rem' }}>{card.label}</small>
                    <h2 className="fw-bold mb-2">
                      {loading ? <IonSpinner name="dots" /> : card.value}
                    </h2>
                    <div className="d-flex justify-content-between align-items-center" style={{ borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '8px' }}>
                      <small style={{ textDecoration: 'underline', fontSize: '0.78rem' }}>{card.link}</small>
                      <IonIcon icon={chevronForwardOutline} />
                    </div>
                  </div>
                  <IonIcon icon={card.icon} className="position-absolute opacity-25" style={{ fontSize: '5rem', right: '-8px', bottom: '-8px', zIndex: 0 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Lower Section */}
          <div className="row g-3">

            {/* Song of the Day */}
            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-header border-0 py-3 d-flex justify-content-between align-items-center" style={{ background: '#1a1a2e', color: '#fff' }}>
                  <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                    <IonIcon icon={starOutline} className="me-2 text-warning" />
                    Song of the Day
                  </span>
                </div>
                <div className="card-body p-0">
                  {songOfTheDay ? (
                    <>
                      <div className="p-3 border-bottom" style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                        <span>⛪ Songs for <strong>{songOfTheDay.mass_type}</strong> ◆ {formatTime(songOfTheDay.mass_time)}</span>
                      </div>
                      {songOfTheDay.songs?.map((song: any, i: number) => (
                        <div key={i} className="d-flex align-items-center justify-content-between p-3 border-bottom" style={{ background: '#f8f9fa' }}>
                          <div>
                            <div className="fw-bold small">{song.title}</div>
                            {song.category_name && (
                              <span style={{ background: '#2563eb', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{song.category_name}</span>
                            )}
                          </div>
                          <button onClick={() => history.push(`/song-view/${song.id}`)} style={{ background: '#2563eb', border: 'none', borderRadius: 6, color: '#fff', padding: '6px 10px', cursor: 'pointer' }}>
                            <IonIcon icon={musicalNotesOutline} />
                          </button>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center py-5">
                      <IonIcon icon={starOutline} style={{ fontSize: '3.5rem', color: '#ccc' }} />
                      <p className="text-muted small mt-3">No mass scheduled for today!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Announcements */}
            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-header border-0 py-3 d-flex justify-content-between align-items-center" style={{ background: '#1a1a2e', color: '#fff' }}>
                  <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                    <IonIcon icon={megaphoneOutline} className="me-2" />
                    Announcements
                  </span>
                  <button className="btn btn-sm" onClick={() => history.push('/announcements')} style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '6px', fontSize: '0.78rem', padding: '2px 10px' }}>
                    View All
                  </button>
                </div>
                <div className="card-body p-0">
                  {announcements.length > 0 ? announcements.map((item, index) => (
                    <div key={index} className="p-3 border-bottom">
                      <div className="fw-bold small text-dark text-uppercase">{item.title}</div>
                      <small className="text-muted d-block text-truncate">{item.content}</small>
                      <small className="text-muted" style={{ fontSize: '0.7rem' }}>{item.created_at}</small>
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

            {/* Upcoming Masses */}
            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-header border-0 py-3 d-flex justify-content-between align-items-center" style={{ background: '#1a1a2e', color: '#fff' }}>
                  <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                    <IonIcon icon={calendarNumberOutline} className="me-2" />
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
                        <span><IonIcon icon={calendarOutline} className="me-1" />{formatDate(mass.mass_date)}</span>
                        <span>|</span>
                        <span><IonIcon icon={calendarOutline} className="me-1" />{formatTime(mass.mass_time)}</span>
                      </div>
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

          <div className="text-center text-muted small mt-4 pb-3">
            © 2026 <strong>Ad Jesum Song List System</strong>
          </div>

        </div>
      </IonContent>

      {/* Dropdown */}
      {showDropdown && (
        <div style={{
          position: 'fixed', top: dropdownPos.top, right: dropdownPos.right,
          background: '#fff', borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          minWidth: '190px', zIndex: 99999, overflow: 'hidden',
          animation: 'fadeInDown 0.15s ease', pointerEvents: 'all',
        }}>
          <div style={{ padding: '12px 16px', background: '#1a1a2e', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
            {USER_AVATAR ? (
              <img src={`${AVATAR_URL}/${USER_AVATAR}`} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 16 }}>
                {USER_NAME[0].toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>{USER_NAME}</div>
              <div style={{ color: '#9ca3af', fontSize: '0.72rem' }}>Member</div>
            </div>
          </div>

          <div
            onMouseDown={() => { setShowDropdown(false); window.location.href = '/my-profile'; }}
            style={dropdownItemStyle}
            onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <IonIcon icon={personOutline} style={{ fontSize: '1rem', color: '#374151' }} />
            <span>My Profile</span>
          </div>

          <div style={{ height: '1px', background: '#e5e7eb', margin: '0 12px' }} />

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

export default UserDashboard;