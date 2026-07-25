import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './form-field.component.html',
})
export class FormFieldComponent {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() type: 'text' | 'password' | 'email' | 'number' = 'text';
  @Input() id: string = '';
  @Input() value: string = '';
  @Input() disabled: boolean = false;
  @Input() error: string = '';
  @Input() required: boolean = false;

  @Output() valueChange = new EventEmitter<string>();

  onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.valueChange.emit(input.value);
  }
}
