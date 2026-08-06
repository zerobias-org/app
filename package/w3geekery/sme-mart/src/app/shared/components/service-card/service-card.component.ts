import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import type { VendorListing } from '../../../core/models';

/** 'BESPOKE_SERVICE' -> 'Bespoke Service'. The enum values are SCREAMING_SNAKE on the wire. */
function toDisplayLabel(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [MatCardModule, MatChipsModule, MatIconModule, MatMenuModule, MatButtonModule],
  templateUrl: './service-card.component.html',
  styleUrl: './service-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceCard {
  readonly service = input.required<VendorListing>();

  readonly serviceSelect = output<VendorListing>();
  readonly viewProviderServices = output<string>();
  readonly viewProviderProfile = output<string>();

  readonly title = computed(() => this.service().title);
  /** Was the free-text `category`; the listing's sub-type is the closest successor. */
  readonly kindLabel = computed(() => toDisplayLabel(this.service().kind));
  readonly description = computed(() => {
    const desc = this.service().summary ?? '';
    return desc.length > 120 ? desc.slice(0, 120) + '...' : desc;
  });
  /**
   * The listing stores no money - pricing lives in the Ledger and `offers` carries
   * pointers with display labels. Show the first offer's label when one exists; there
   * is deliberately no price/pricingType successor to render.
   */
  readonly offerLabel = computed(() => this.service().offers[0]?.label ?? null);
  readonly deliveryTime = computed(() => this.service().deliveryTime);
  readonly ownerId = computed(() => this.service().ownerId);
  readonly ownerName = computed(() => this.service().ownerDisplayName ?? null);

  onClick(): void {
    this.serviceSelect.emit(this.service());
  }

  onViewProviderServices(event: MouseEvent): void {
    event.stopPropagation();
    const id = this.ownerId();
    if (id) this.viewProviderServices.emit(id);
  }

  onViewProviderProfile(event: MouseEvent): void {
    event.stopPropagation();
    const id = this.ownerId();
    if (id) this.viewProviderProfile.emit(id);
  }
}
