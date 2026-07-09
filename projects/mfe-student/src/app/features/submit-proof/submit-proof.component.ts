import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-submit-proof',
  imports: [],
  templateUrl: './submit-proof.component.html',
  styleUrl: './submit-proof.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubmitProofComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const activityId = this.route.snapshot.queryParamMap.get('activityId');
    const queryParams = activityId ? { proofActivityId: activityId } : undefined;

    this.router.navigate(['/my-records'], {
      queryParams,
      replaceUrl: true,
    });
  }
}
