export const environment = {
  production: true,
  isLocalDev: false,
  socketUrlPath: '', // Empty = no WebSocket connection (portal-only feature)
  localPortalOrigin: '',
  cdnUrl: 'https://cdn.zerobias.com',
  smeMartConnectionId: '', // Set per deployment
  dbMode: 'hub' as 'hub' | 'neon',
  neonConnectionString: '', // Never used in prod — Hub Module handles credentials
};
