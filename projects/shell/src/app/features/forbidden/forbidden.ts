import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './forbidden.html', // Check lại tên file thật của bạn
  styleUrls: ['./forbidden.scss'], // Check lại tên file thật của bạn
})
export class ForbiddenComponent {
  private location = inject(Location);

  goBack() {
    this.location.back();
  }
}
