import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-submit-proof',
  imports: [RouterLink],
  templateUrl: './submit-proof.component.html',
  styleUrl: './submit-proof.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubmitProofComponent {}
