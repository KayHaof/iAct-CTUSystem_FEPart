import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './forbidden.html',
  styleUrls: ['./forbidden.scss'],
})
export class ForbiddenComponent {
  private location = inject(Location);

  goBack() {
    this.location.back();
  }
}
