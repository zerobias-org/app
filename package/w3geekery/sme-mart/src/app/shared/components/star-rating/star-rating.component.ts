import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './star-rating.component.html',
  styleUrl: './star-rating.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarRating {
  private readonly _rating = signal(0);
  private readonly _hoverRating = signal(0);

  @Input()
  set rating(value: number) {
    this._rating.set(value);
  }

  @Input() interactive = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  @Output() ratingChange = new EventEmitter<number>();

  readonly stars = [1, 2, 3, 4, 5];

  readonly displayRating = computed(() => this._hoverRating() || this._rating());

  getStarIcon(star: number): string {
    const rating = this.displayRating();
    if (rating >= star) return 'star';
    if (rating >= star - 0.5) return 'star_half';
    return 'star_border';
  }

  onStarClick(star: number): void {
    if (!this.interactive) return;
    this._rating.set(star);
    this.ratingChange.emit(star);
  }

  onStarHover(star: number): void {
    if (!this.interactive) return;
    this._hoverRating.set(star);
  }

  onMouseLeave(): void {
    if (!this.interactive) return;
    this._hoverRating.set(0);
  }
}
