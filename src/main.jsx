import React from 'react';
import ReactDOM from 'react-dom/client';

// CSS: index.css porta le direttive @tailwind (base/components/utilities) e gli
// helper (tactile-paper, foil, ecc.); newui.css porta font Cinzel, variabili di
// tema, animazioni della NewUI e, via @import, gli stili delle carte (tactile-card.css).
// Vanno caricati ENTRAMBI: Tailwind + stili carta + look NewUI.
import './styles/index.css';
import './mockup/newui.css';

import App from './mockup/parts/App';
import { CreatorApp } from './CreatorApp';

// Rotta riservata al Card Creator Studio (invariata): /creator oppure #creator.
function isCreatorRoute() {
  return window.location.pathname.includes('/creator') || window.location.hash.includes('creator');
}

// La NewUI naviga con lo stato interno (nessun hash): un cambio di hash significa
// quindi entrare/uscire dallo Studio Creatore, per cui ricarichiamo per commutare.
window.addEventListener('hashchange', () => window.location.reload());

const Root = isCreatorRoute() ? CreatorApp : App;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
