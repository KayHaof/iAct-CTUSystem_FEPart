import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './not-found.html',
  styleUrls: ['./not-found.scss'],
})
export class NotFoundComponent {
  // Inject Location để xử lý nút "Quay lại"
  private location = inject(Location);

  goBack() {
    this.location.back();
  }
}
