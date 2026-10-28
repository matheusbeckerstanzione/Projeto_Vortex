import React, { useEffect } from 'react';
import DashboardContatos from './Dashboard/DashboardContatos';

export default function Dashboard({ initialMenu = 'inicio' }) {
  useEffect(() => {
    document.body.classList.remove('dark-bg', 'auth-no-scroll');
    document.documentElement.classList.remove('auth-no-scroll');
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflowY = 'auto';
    document.documentElement.style.overflowY = 'auto';
    document.body.style.height = 'auto';
    document.documentElement.style.height = 'auto';
  }, [initialMenu]);

  return <DashboardContatos initialMenu={initialMenu} />;
}
