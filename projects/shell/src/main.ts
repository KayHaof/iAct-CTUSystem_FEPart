import { initFederation } from '@angular-architects/native-federation';

initFederation({
  mfeActivity: 'http://localhost:4201/remoteEntry.json',
  mfeRegistration: 'http://localhost:4202/remoteEntry.json',
  mfeCredit: 'http://localhost:4203/remoteEntry.json',
  mfeAdmin: 'http://localhost:4204/remoteEntry.json',
})
  .catch((err) => console.error(err))
  .then((_) => import('./bootstrap'))
  .catch((err) => console.error(err));
