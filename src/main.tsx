import React, { Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import Index from './pages/Index'
import './index.css'
import './i18n'; 
import { initAnalytics } from './analytics';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback="...loading">
      <Index />
    </Suspense>
  </React.StrictMode>,
)

// Initialize analytics after initial render
initAnalytics();
