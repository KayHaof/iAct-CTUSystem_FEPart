import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';

const routes: Routes = [
  {
    path: 'registration',
    loadChildren: () => loadRemoteModule('mfeRegistration', './Module').then((m) => m.routes),
  },
  // {
  //   path: 'activity',
  //   loadChildren: () => loadRemoteModule('mfeActivity', './Module').then((m) => m.APP_ROUTES),
  // },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
