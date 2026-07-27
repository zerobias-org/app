import { Routes } from '@angular/router';
import { Home } from './pages/home/home';

const TITLE = 'HL7 Analyzer';

export const routes: Routes = [
  { path: '', component: Home, title: `Overview · ${TITLE}` },
  {
    path: 'messages',
    loadComponent: () => import('./pages/messages/messages').then((m) => m.Messages),
    title: `Messages · ${TITLE}`,
  },
  {
    // `?id=<controlId>` rather than a path param: the control id is free-form HL7 text (MSH-10 can
    // legitimately contain `/`), so it belongs in a query string where it is unambiguously encoded.
    path: 'messages/detail',
    loadComponent: () => import('./pages/messages/message-detail').then((m) => m.MessageDetail),
    title: `Message · ${TITLE}`,
  },
  {
    path: 'channels',
    loadComponent: () => import('./pages/channels/channels').then((m) => m.Channels),
    title: `Channels · ${TITLE}`,
  },
  { path: '**', redirectTo: '' },
];
