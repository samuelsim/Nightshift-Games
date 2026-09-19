export const environment = {
  production: true,
  colyseusUrl: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`
};
