import React from 'react';

import { Redirect, Route, useLocation } from 'react-router-dom';

import {
  IonApp, IonIcon, IonLabel, IonRouterOutlet, IonSplitPane,
  IonMenu, IonContent, IonList, IonItem, IonMenuToggle, setupIonicReact,
} from '@ionic/react';

import { IonReactRouter } from '@ionic/react-router';

import {
  gridOutline, musicalNotesOutline, calendarOutline,
  megaphoneOutline, peopleOutline, pencilOutline,
  personOutline, micOutline, libraryOutline, pricetagsOutline,
  menuOutline,
} from 'ionicons/icons';

import Dashboard         from './pages/AdminDashboard';
import UserDashboard     from './pages/UserDashboard';
import UploadSystem      from './pages/UploadSystem';
import Pdfviewer         from './pages/PdfViewer';
import Recordings        from './pages/Recordings';
import MyProfile         from './pages/MyProfile';
import Login             from './pages/Login';
import ManageUsers       from './pages/ManageUsers';
import Announcements     from './pages/Announcements';
import SongDetails       from './pages/SongDetails';
import MassSchedule      from './pages/MassSchedule';
import Categories        from './pages/Categories';
import MusicSheetBuilder from './pages/MusicSheetBuilder';
import SongView          from './pages/SongView';
import PdfView           from './pages/PdfView';
import Recorder          from './pages/Recorder'; // ✅ added

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

setupIonicReact();

const getUser = () => {
  try { return JSON.parse(localStorage.getItem('user') ?? '{}'); }
  catch { return {}; }
};

const menuItemStyle = {
  '--background':           'transparent',
  '--background-activated': 'rgba(255,255,255,0.08)',
  '--background-hover':     'rgba(255,255,255,0.05)',
  '--color':                '#ccc',
  '--padding-start':        '16px',
  '--min-height':           '44px',
  fontSize:                 '14px',
};

const sectionLabelStyle: React.CSSProperties = {
  color:         '#888',
  fontSize:      '0.65rem',
  fontWeight:    700,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  padding:       '16px 16px 6px',
  display:       'block',
};

const AppShell: React.FC = () => {
  const location = useLocation();
  const [user, setUser] = React.useState(getUser());
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    setUser(getUser());
  }, [location.pathname]);

  const userName = user?.name ?? 'User';
  const userRole = (user?.role ?? '').toLowerCase();
  const isAdmin  = userRole === 'admin';

  const isLoginPage = location.pathname === '/login' || location.pathname === '/';
  const showSidebar = !isLoginPage;
  const sideWidth   = collapsed ? '68px' : '260px';

  return (
    <IonSplitPane contentId="main" when={showSidebar ? 'md' : 'false'} style={{ '--side-width': sideWidth, '--side-min-width': sideWidth, '--side-max-width': sideWidth }}>

      {showSidebar && (
        <IonMenu contentId="main" menuId="main-menu" type="overlay" style={{ '--width': sideWidth, transition: 'width 0.28s', '--border': 'none' } as any}>
          <IonContent style={{ '--background': '#1a1c27' }}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

              {/* BRANDING */}
              <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {!collapsed && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <IonIcon icon={musicalNotesOutline} style={{ color: '#fff', fontSize: 22 }} />
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: '1.2rem', letterSpacing: '0.5px' }}>
                      Ad Jesum
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setCollapsed(c => !c)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: '#fff',
                    display: 'flex', alignItems: 'center', padding: 6, borderRadius: 6,
                    marginLeft: collapsed ? 'auto' : 0,
                    marginRight: collapsed ? 'auto' : 0,
                  }}
                >
                  <IonIcon icon={menuOutline} style={{ fontSize: 24 }} />
                </button>
              </div>

              <IonList style={{ background: 'transparent', padding: 0, flex: 1 }}>
                <IonMenuToggle autoHide={false}>

                  {!collapsed && <small style={sectionLabelStyle}>Main</small>}

                  <IonItem routerLink={isAdmin ? '/dashboard' : '/UserDashboard'} lines="none" detail={false} style={menuItemStyle} title="Dashboard">
                    <IonIcon slot="start" icon={gridOutline} style={{ color: '#9499a7', fontSize: 18 }} />
                    {!collapsed && <IonLabel>Dashboard</IonLabel>}
                  </IonItem>

                  <IonItem routerLink="/songs" lines="none" detail={false} style={menuItemStyle} title="Songs">
                    <IonIcon slot="start" icon={musicalNotesOutline} style={{ color: '#9499a7', fontSize: 18 }} />
                    {!collapsed && <IonLabel>Songs</IonLabel>}
                  </IonItem>

                  {isAdmin && (
                    <IonItem routerLink="/categories" lines="none" detail={false} style={menuItemStyle} title="Categories">
                      <IonIcon slot="start" icon={pricetagsOutline} style={{ color: '#9499a7', fontSize: 18 }} />
                      {!collapsed && <IonLabel>Categories</IonLabel>}
                    </IonItem>
                  )}

                  <IonItem routerLink="/view-pdf" lines="none" detail={false} style={menuItemStyle} title="PDF Library">
                    <IonIcon slot="start" icon={libraryOutline} style={{ color: '#9499a7', fontSize: 18 }} />
                    {!collapsed && <IonLabel>PDF Library</IonLabel>}
                  </IonItem>

                  <IonItem routerLink="/mass-schedule" lines="none" detail={false} style={menuItemStyle} title="Mass Schedule">
                    <IonIcon slot="start" icon={calendarOutline} style={{ color: '#9499a7', fontSize: 18 }} />
                    {!collapsed && <IonLabel>Mass Schedule</IonLabel>}
                  </IonItem>

                  <IonItem routerLink="/announcements" lines="none" detail={false} style={menuItemStyle} title="Announcements">
                    <IonIcon slot="start" icon={megaphoneOutline} style={{ color: '#9499a7', fontSize: 18 }} />
                    {!collapsed && <IonLabel>Announcements</IonLabel>}
                  </IonItem>

                  {isAdmin && (
                    <>
                      {!collapsed && <small style={sectionLabelStyle}>Admin</small>}

                      <IonItem routerLink="/upload-system" lines="none" detail={false} style={menuItemStyle} title="Music Sheet Builder">
                        <IonIcon slot="start" icon={pencilOutline} style={{ color: '#9499a7', fontSize: 18 }} />
                        {!collapsed && <IonLabel>Music Sheet Builder</IonLabel>}
                      </IonItem>

                      <IonItem routerLink="/manage-users" lines="none" detail={false} style={menuItemStyle} title="Manage Users">
                        <IonIcon slot="start" icon={peopleOutline} style={{ color: '#9499a7', fontSize: 18 }} />
                        {!collapsed && <IonLabel>Manage Users</IonLabel>}
                      </IonItem>
                    </>
                  )}

                  {!collapsed && <small style={sectionLabelStyle}>My Account</small>}

                  <IonItem routerLink="/my-profile" lines="none" detail={false} style={menuItemStyle} title="My Profile">
                    <IonIcon slot="start" icon={personOutline} style={{ color: '#9499a7', fontSize: 18 }} />
                    {!collapsed && <IonLabel>My Profile</IonLabel>}
                  </IonItem>

                  <IonItem routerLink="/recordings" lines="none" detail={false} style={menuItemStyle} title="My Recordings">
                    <IonIcon slot="start" icon={micOutline} style={{ color: '#9499a7', fontSize: 18 }} />
                    {!collapsed && <IonLabel>My Recordings</IonLabel>}
                  </IonItem>

                </IonMenuToggle>
              </IonList>

              {/* LOGGED IN AS */}
              {!collapsed && (
                <div style={{ padding: '15px 20px', background: '#252836', borderTop: '1px solid #ffffff10' }}>
                  <div style={{ color: '#888', fontSize: '11px', marginBottom: '4px' }}>Logged in as:</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{userName}</span>
                    <span style={{
                      background: isAdmin ? '#dc3545' : '#007bff',
                      color: '#fff', borderRadius: '4px', padding: '2px 8px',
                      fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                    }}>
                      {isAdmin ? 'Admin' : 'Member'}
                    </span>
                  </div>
                </div>
              )}

            </div>
          </IonContent>
        </IonMenu>
      )}

      {/* Main content */}
      <div id="main" className="ion-page">
        <IonRouterOutlet>
          <Route exact path="/login"           render={() => <Login />} />
          <Route exact path="/UserDashboard"   render={() => <UserDashboard />} />
          <Route exact path="/user-dashboard"  render={() => <UserDashboard />} />
          <Route exact path="/dashboard"       render={() => <Dashboard />} />
          <Route exact path="/songs"           render={() => <SongDetails />} />
          <Route exact path="/categories"      render={() => <Categories />} />
          <Route exact path="/view-pdf"        render={() => <Pdfviewer />} />
          <Route exact path="/mass-schedule"   render={() => <MassSchedule />} />
          <Route exact path="/announcements"   render={() => <Announcements />} />
          <Route exact path="/recordings"      render={() => <Recordings />} />
          <Route exact path="/my-profile"      render={() => <MyProfile />} />
          <Route exact path="/manage-users"    render={() => <ManageUsers />} />
          <Route exact path="/upload-system"   render={() => <UploadSystem />} />
          {/* ✅ Fixed: render instead of component, Recorder imported */}
          <Route exact path="/record/:songId"  render={() => <Recorder />} />
          <Route path="/sheet-builder/:songId" render={() => <MusicSheetBuilder />} />
          <Route path="/song-view/:id"         render={() => <SongView />} />
          <Route path="/pdf-view/:id"          render={() => <PdfView />} /> 
          <Route exact path="/"                render={() => <Redirect to="/login" />} />
        </IonRouterOutlet>
      </div>

    </IonSplitPane>
  );
};

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <AppShell />
    </IonReactRouter>
  </IonApp>
);

export default App;