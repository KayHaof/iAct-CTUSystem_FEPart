import { Route } from '@angular/router';

import { UserProfileComponent } from './user-profile/user-profile.component';

export const userProfileRoutes: Route[] = [
  {
    path: '',
    component: UserProfileComponent,
  },
];
