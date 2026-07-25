import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { User } from './user.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent {
  @Output() userCreated = new EventEmitter<User>();
  @Output() cancel = new EventEmitter<void>();

  userForm: FormGroup;
  isSubmitting = false;

  roles: User['role'][] = ['Admin', 'Editor', 'Viewer', 'Manager'];
  statuses: User['status'][] = ['Active', 'Inactive', 'Pending'];

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      department: ['', [Validators.required]],
      role: ['', [Validators.required]],
      status: ['Active', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.isSubmitting = true;
      const userData = this.userForm.value;
      
      // Simulate API delay and create a User object
      setTimeout(() => {
        const newUser: User = {
          ...userData,
          id: Date.now().toString(),
          avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
          lastLogin: 'Never'
        };
        this.userCreated.emit(newUser);
        this.isSubmitting = false;
      }, 500);
    } else {
      this.userForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
