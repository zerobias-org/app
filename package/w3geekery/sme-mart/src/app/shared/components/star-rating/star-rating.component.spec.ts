import { TestBed } from '@angular/core/testing';
import { StarRating } from './star-rating.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('StarRating', () => {
  let component: StarRating;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [StarRating] });
    const fixture = TestBed.createComponent(StarRating);
    component = fixture.componentInstance;
  });

  it('should show full star for rating >= star value', () => {
    component.rating = 4;
    expect(component.getStarIcon(3)).toBe('star');
    expect(component.getStarIcon(4)).toBe('star');
  });

  it('should show half star for rating between star-0.5 and star', () => {
    component.rating = 3.5;
    expect(component.getStarIcon(4)).toBe('star_half');
  });

  it('should show empty star for rating below star-0.5', () => {
    component.rating = 3;
    expect(component.getStarIcon(5)).toBe('star_border');
  });

  it('should not emit on click when not interactive', () => {
    component.interactive = false;
    let emitted = false;
    component.ratingChange.subscribe(() => { emitted = true; });
    component.onStarClick(3);
    expect(emitted).toBe(false);
  });

  it('should emit on click when interactive', () => {
    component.interactive = true;
    let value = 0;
    component.ratingChange.subscribe((v: number) => { value = v; });
    component.onStarClick(4);
    expect(value).toBe(4);
  });

  it('should use hover rating when hovering', () => {
    component.rating = 2;
    component.interactive = true;
    component.onStarHover(5);
    expect(component.displayRating()).toBe(5);
  });

  it('should revert to base rating on mouse leave', () => {
    component.rating = 2;
    component.interactive = true;
    component.onStarHover(5);
    component.onMouseLeave();
    expect(component.displayRating()).toBe(2);
  });
});
