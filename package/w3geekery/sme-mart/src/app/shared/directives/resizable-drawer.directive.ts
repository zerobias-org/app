import {
  Directive,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  Renderer2,
  inject,
} from '@angular/core';

/**
 * Makes a mat-sidenav resizable by adding a drag handle on its right edge.
 * Matches the ngx-library ZbRemoteTable draggable drawer pattern.
 *
 * Dispatches a window resize event on drag end so sibling content
 * (tables, timelines, charts) recalculates layout.
 *
 * Usage:
 *   <mat-sidenav appResizableDrawer [minWidth]="280" [maxWidthPercent]="50">
 */
@Directive({
  selector: '[appResizableDrawer]',
  standalone: true,
})
export class ResizableDrawerDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  @Input() minWidth = 280;
  @Input() maxWidthPercent = 50;
  @Input() defaultWidth = 0;

  /** Emits the final drawer width (px) when the user finishes dragging. */
  @Output() resizeEnd = new EventEmitter<number>();

  private drawerWidth = 0;
  private isResizing = false;
  private resizeStartX = 0;
  private resizeStartWidth = 0;
  private handle!: HTMLElement;

  ngOnInit(): void {
    this.drawerWidth = this.defaultWidth > 0 ? this.defaultWidth : this.minWidth;
    const nativeEl: HTMLElement = this.el.nativeElement;

    // Set initial width via CSS custom property
    this.renderer.addClass(nativeEl, 'resizable-drawer');
    nativeEl.style.setProperty('--drawer-width', `${this.drawerWidth}px`);

    // Create the resize handle
    this.handle = this.renderer.createElement('div');
    this.renderer.addClass(this.handle, 'drawer-resize-handle');

    const grip = this.renderer.createElement('div');
    this.renderer.addClass(grip, 'resize-grip');
    this.renderer.appendChild(this.handle, grip);

    // Find the inner container and append the handle
    // mat-sidenav renders a .mat-drawer-inner-container
    const innerContainer = nativeEl.querySelector('.mat-drawer-inner-container');
    if (innerContainer) {
      // Wrap existing content and add handle
      this.renderer.setStyle(innerContainer, 'display', 'flex');
      this.renderer.setStyle(innerContainer, 'flexDirection', 'row');
      this.renderer.setStyle(innerContainer, 'overflow', 'hidden');

      // Wrap existing children in a content wrapper
      const wrapper = this.renderer.createElement('div');
      this.renderer.addClass(wrapper, 'drawer-content-wrapper');
      this.renderer.setStyle(wrapper, 'flex', '1');
      this.renderer.setStyle(wrapper, 'overflowY', 'auto');
      this.renderer.setStyle(wrapper, 'overflowX', 'hidden');
      this.renderer.setStyle(wrapper, 'minWidth', '0');

      // Move existing children into wrapper
      while (innerContainer.firstChild) {
        wrapper.appendChild(innerContainer.firstChild);
      }
      this.renderer.appendChild(innerContainer, wrapper);
      this.renderer.appendChild(innerContainer, this.handle);
    }

    this.renderer.listen(this.handle, 'mousedown', (e: MouseEvent) => this.onResizeStart(e));
  }

  ngOnDestroy(): void {
    this.cleanupListeners();
  }

  private onResizeStart(event: MouseEvent): void {
    event.preventDefault();
    this.isResizing = true;
    this.resizeStartX = event.clientX;
    this.resizeStartWidth = this.drawerWidth;
    document.addEventListener('mousemove', this.onResizeMove, true);
    document.addEventListener('mouseup', this.onResizeEnd, true);
    document.addEventListener('mouseleave', this.onResizeEnd, true);
  }

  private onResizeMove = (event: MouseEvent): void => {
    if (!this.isResizing) return;
    const deltaX = event.clientX - this.resizeStartX;
    const newWidth = this.resizeStartWidth + deltaX;
    const container = this.el.nativeElement.closest('.mat-drawer-container');
    const maxWidth = container
      ? container.offsetWidth * (this.maxWidthPercent / 100)
      : window.innerWidth * (this.maxWidthPercent / 100);

    this.drawerWidth = Math.max(this.minWidth, Math.min(maxWidth, newWidth));
    this.el.nativeElement.style.setProperty('--drawer-width', `${this.drawerWidth}px`);
  };

  private onResizeEnd = (): void => {
    if (this.isResizing) {
      this.isResizing = false;
      this.cleanupListeners();
      this.resizeEnd.emit(this.drawerWidth);
      // Trigger layout recalculation for sibling content (timelines, tables, etc.)
      window.dispatchEvent(new Event('resize'));
    }
  };

  private cleanupListeners(): void {
    document.removeEventListener('mousemove', this.onResizeMove, true);
    document.removeEventListener('mouseup', this.onResizeEnd, true);
    document.removeEventListener('mouseleave', this.onResizeEnd, true);
  }
}
