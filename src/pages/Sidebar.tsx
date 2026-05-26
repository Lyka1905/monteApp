import React from 'react';
import {
  IonMenu, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonIcon, IonLabel, IonMenuToggle
} from '@ionic/react';
import { useLocation, useHistory } from 'react-router-dom';
import {
  speedometerOutline, musicalNotesOutline, pricetagsOutline,
  peopleOutline, micOutline, megaphoneOutline, calendarOutline,
  personOutline, logOutOutline
} from 'ionicons/icons';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const history = useHistory();

  const menuItems = [
    { title: 'Dashboard', path: '/dashboard', icon: speedometerOutline },
    { title: 'Songs', path: '/songs', icon: musicalNotesOutline },
    { title: 'Categories', path: '/categories', icon: pricetagsOutline },
    { title: 'Manage Users', path: '/manage-users', icon: peopleOutline },
    { title: 'Recordings', path: '/recordings', icon: micOutline },
    { title: 'Announcements', path: '/announcements', icon: megaphoneOutline },
    { title: 'Mass Schedule', path: '/mass-schedule', icon: calendarOutline },
  ];

  return (
    // 'menuId' must match the 'menu' prop in your IonMenuButton
    // 'contentId' must match the 'id' of your IonRouterOutlet
    <IonMenu menuId="main-menu" contentId="main-content" type="overlay">
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#1a1a2e', '--color': '#fff', 'padding': '10px' }}>
          <IonTitle className="fw-bold">Ad Jesum</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#fff' }}>
        <IonList id="menu-list" className="py-2">
          {menuItems.map((item, index) => (
            <IonMenuToggle key={index} autoHide={false}>
              <IonItem
                button
                onClick={() => history.push(item.path)}
                routerDirection="none"
                className={location.pathname === item.path ? 'item-active' : ''}
                lines="none"
                style={{ '--border-radius': '0 20px 20px 0', '--margin-bottom': '4px' }}
              >
                <IonIcon 
                  slot="start" 
                  icon={item.icon} 
                  color={location.pathname === item.path ? 'primary' : 'medium'} 
                />
                <IonLabel style={{ fontWeight: location.pathname === item.path ? '700' : '500' }}>
                  {item.title}
                </IonLabel>
              </IonItem>
            </IonMenuToggle>
          ))}

          <div className="mt-4 px-3">
             <hr className="text-muted opacity-25" />
          </div>

          <IonMenuToggle autoHide={false}>
            <IonItem 
              button 
              onClick={() => history.push('/my-profile')} 
              lines="none"
              style={{ '--border-radius': '0 20px 20px 0' }}
            >
              <IonIcon slot="start" icon={personOutline} color="medium" />
              <IonLabel>Profile</IonLabel>
            </IonItem>
            
            <IonItem 
              button 
              onClick={() => { localStorage.clear(); window.location.href='/login'; }} 
              lines="none" 
              className="text-danger"
            >
              <IonIcon slot="start" icon={logOutOutline} color="danger" />
              <IonLabel>Logout</IonLabel>
            </IonItem>
          </IonMenuToggle>
        </IonList>
      </IonContent>

      <style>{`
        .item-active {
          --background: #f0f4ff;
          --color: #0d6efd;
        }
      `}</style>
    </IonMenu>
  );
};

export default Sidebar;