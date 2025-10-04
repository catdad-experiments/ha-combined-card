import { NAME } from './utils';

import "./combined-card";
import "./combined-card-editor";

import "./kiosk-card";

// Note: this is what adds the card to the UI card selector
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: NAME,
  name: "Combined Card",
  description: "Combine a stack of cards into a single seamless card",
}, {
  type: 'kiosk-card',
  name: 'Kiosk Card',
  description: 'Hide the navigation UI for the dashboard where this card is rendered'
});
