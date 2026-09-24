import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { createEndorsementService } from './services/endorsementService';
import { cognitoSession } from './services/cognitoSession';
import './services/cognitoConfig';

createRoot(document.getElementById('root')!).render(
  <StrictMode><App service={createEndorsementService(cognitoSession)} /></StrictMode>,
);
