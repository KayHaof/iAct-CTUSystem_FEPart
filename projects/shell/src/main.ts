import { initFederation } from '@angular-architects/native-federation';

initFederation({
  mfeStudent: 'http://localhost:4201/remoteEntry.json',
  mfeAdmin: 'http://localhost:4202/remoteEntry.json',
})
  .catch((err) => console.error(err))
  .then(() => import('./bootstrap'))
  .catch((err) => console.error(err));
