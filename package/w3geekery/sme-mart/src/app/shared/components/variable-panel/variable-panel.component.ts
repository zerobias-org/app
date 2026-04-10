import {
  Component, input, output, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomVariable } from '@/core/models';

@Component({
  selector: 'app-variable-panel',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './variable-panel.component.html',
  styleUrl: './variable-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VariablePanelComponent {
  readonly customVariables = input<CustomVariable[]>([]);
  readonly addVariable = output<CustomVariable>();
  readonly updateVariable = output<{ index: number; variable: CustomVariable }>();
  readonly removeVariable = output<number>();
}
