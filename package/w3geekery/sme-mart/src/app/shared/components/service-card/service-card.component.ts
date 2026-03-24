import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { TitleCasePipe } from '@angular/common';
import type { ServiceOffering } from '../../../core/models';

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [MatCardModule, MatChipsModule, MatIconModule, MatMenuModule, MatButtonModule, TitleCasePipe],
  templateUrl: './service-card.component.html',
  styleUrl: './service-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceCard {
  private readonly _service = signal<ServiceOffering | null>(null);

  @Input({ required: true })
  set service(value: ServiceOffering) {
    this._service.set(value);
  }

  @Output() serviceSelect = new EventEmitter<ServiceOffering>();
  @Output() viewProviderServices = new EventEmitter<string>();
  @Output() viewProviderProfile = new EventEmitter<string>();

  readonly title = computed(() => this._service()?.title || '');
  readonly category = computed(() => this._service()?.category || '');
  readonly description = computed(() => {
    const desc = this._service()?.description || '';
    return desc.length > 120 ? desc.slice(0, 120) + '...' : desc;
  });
  readonly price = computed(() => {
    const s = this._service();
    if (!s?.price) return null;
    return `$${parseFloat(s.price).toLocaleString()}`;
  });
  readonly pricingType = computed(() => this._service()?.pricing_type || '');
  readonly deliveryTime = computed(() => this._service()?.delivery_time || null);
  readonly providerId = computed(() => this._service()?.provider_id || null);
  readonly providerName = computed(() => this._service()?.provider_display_name || null);

  onClick(): void {
    const s = this._service();
    if (s) this.serviceSelect.emit(s);
  }

  onViewProviderServices(event: MouseEvent): void {
    event.stopPropagation();
    const pid = this.providerId();
    if (pid) this.viewProviderServices.emit(pid);
  }

  onViewProviderProfile(event: MouseEvent): void {
    event.stopPropagation();
    const pid = this.providerId();
    if (pid) this.viewProviderProfile.emit(pid);
  }
}
