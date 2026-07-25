import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toggle.component.html',
})
export class ToggleComponent {
  @Input() label: string = '';
  @Input() checked: boolean = false;
  @Input() disabled: boolean = false;
  @Input() id: string = '';

  @Output() toggleChange = new EventEmitter<boolean>();

  onToggle() {
    if (!this.disabled) {
      this.checked = !this.checked;
      this.toggleChange.emit(this.checked);
    }
  }
}
