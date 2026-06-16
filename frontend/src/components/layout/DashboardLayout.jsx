import React, { useState } from 'react';
import { s } from '../../styles/ticketStyles';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import NewTicketModal from '../tickets/NewTicketModal';

const DashboardLayout = ({ children, activeView, setActiveView, categoriesData, onTicketCreated }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div style={s.root}>
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      <main style={s.main}>
        <Topbar activeView={activeView} onNewTicket={() => setShowModal(true)} />
        
        {/* Content of the active view is passed as children */}
        {children}
      </main>

      {showModal && (
        <NewTicketModal 
          categoriesData={categoriesData}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            if (onTicketCreated) onTicketCreated();
          }}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
