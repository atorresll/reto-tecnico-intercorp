import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { EndorsementForm } from './components/EndorsementForm';
import { createEndorsementService } from './services/endorsementService';
import { cognitoSession } from './services/cognitoSession';
import './services/cognitoConfig';

createRoot(document.getElementById('root')!).render(
  <StrictMode><EndorsementForm service={createEndorsementService(cognitoSession)} /></StrictMode>,
);
