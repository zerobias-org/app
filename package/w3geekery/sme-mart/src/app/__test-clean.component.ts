import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-test-clean',
  standalone: true,
  template: '<div>clean</div>',
})
export class TestCleanComponent {
  readonly value = input<string>('');
  readonly changed = output<string>();
}
