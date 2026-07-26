import {
  Component,
  EventEmitter,
  HostListener,
  Output,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Project } from './project.models';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.css'],
})
export class ProjectFormComponent implements AfterViewInit {
  @Output() projectCreated = new EventEmitter<Project>();
  @Output() cancel = new EventEmitter<void>();

  @ViewChild('firstInput') firstInput?: ElementRef<HTMLInputElement>;

  projectForm: FormGroup;
  isSubmitting = false;

  priorities: Project['priority'][] = ['Low', 'Medium', 'High', 'Critical'];
  statuses: Project['status'][] = ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];

  constructor(private fb: FormBuilder) {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      owner: ['', [Validators.required]],
      priority: ['Medium', [Validators.required]],
      status: ['Planning', [Validators.required]],
      startDate: ['', [Validators.required]],
    });
  }

  ngAfterViewInit(): void {
    this.firstInput?.nativeElement.focus();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.onCancel();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('project-form-backdrop')) {
      this.onCancel();
    }
  }

  onSubmit(): void {
    if (this.projectForm.valid) {
      this.isSubmitting = true;
      const formValue = this.projectForm.value;
      const newProject: Project = {
        id: Date.now().toString(),
        name: formValue.name.trim(),
        description: (formValue.description ?? '').trim(),
        owner: formValue.owner.trim(),
        priority: formValue.priority,
        status: formValue.status,
        startDate: formValue.startDate,
        createdAt: new Date().toISOString(),
      };
      this.projectCreated.emit(newProject);
      this.isSubmitting = false;
      this.resetForm();
    } else {
      this.projectForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.resetForm();
    this.cancel.emit();
  }

  private resetForm(): void {
    this.projectForm.reset({
      priority: 'Medium',
      status: 'Planning',
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.projectForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }
}
