import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { ZbEmptyStateContainerComponent } from '@zerobias-org/ngx-library';

export interface ComingSoonData {
  title: string;
  description: string;
  featureKey: string;
}

@Component({
  selector: 'sme-mart-feature-coming-soon',
  standalone: true,
  imports: [ZbEmptyStateContainerComponent],
  templateUrl: './feature-coming-soon.component.html',
  styleUrls: ['./feature-coming-soon.component.scss'],
})
export class FeatureComingSoonComponent {
  private readonly route = inject(ActivatedRoute);

  // Reactive bridge from route.data → signal. toSignal cleans up automatically on destroy.
  readonly comingSoonData = toSignal(
    this.route.data.pipe(
      map((data) => ({
        title: (data['title'] as string) || 'Coming Soon',
        description: (data['description'] as string) || 'This feature is on the roadmap.',
        featureKey: (data['featureKey'] as string) || 'unknown',
      } as ComingSoonData))
    ),
    { initialValue: undefined }
  );
}
