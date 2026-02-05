import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-server-error',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './server-error.html',
  styleUrls: ['./server-error.scss'],
})
export class ServerErrorComponent {}
