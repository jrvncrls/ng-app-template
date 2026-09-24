import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type LoaderSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'techyon-loader',
  standalone: true,
  templateUrl: './loader.html',
  styleUrl: './loader.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-testid]': 'testId()',
  },
})
export class Loader {
  readonly testId = input.required<string>();
  readonly size = input<LoaderSize>('md');
  readonly label = input<string>('Loading…');
}
