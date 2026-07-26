import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Project } from './project.models';
import { ProjectService } from './project.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.css'],
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);

  project: Project | null = null;
  form: Partial<Project> = {};
  isEditing = false;
  isSaving = false;
  notFound = false;
  isLoading = true;

  priorities: Project['priority'][] = ['Low', 'Medium', 'High', 'Critical'];
  statuses: Project['status'][] = ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];

  private subscriptions = new Subscription();
  private projectId = '';

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.paramMap.subscribe((params) => {
        this.projectId = params.get('id') ?? '';
        this.loadProject();
      })
    );

    this.subscriptions.add(
      this.projectService.projects$.subscribe(() => {
        if (this.projectId) {
          this.loadProject(false);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadProject(showLoading = true): void {
    if (showLoading) {
      this.isLoading = true;
    }

    const found = this.projectService.getProjectById(this.projectId);
    if (!found) {
      this.project = null;
      this.notFound = true;
      this.isEditing = false;
      this.isSaving = false;
      this.form = {};
    } else {
      this.project = found;
      this.notFound = false;
      if (!this.isEditing) {
        this.form = { ...found };
      }
    }

    this.isLoading = false;
  }

  startEditing(): void {
    if (!this.project) {
      return;
    }
    this.form = { ...this.project };
    this.isEditing = true;
  }

  cancelEditing(): void {
    if (this.project) {
      this.form = { ...this.project };
    }
    this.isEditing = false;
  }

  save(): void {
    if (!this.project || this.notFound) {
      return;
    }

    const name = (this.form.name ?? '').trim();
    const owner = (this.form.owner ?? '').trim();
    if (!name || !owner) {
      return;
    }

    this.isSaving = true;
    const updates: Partial<Omit<Project, 'id' | 'createdAt'>> = {
      name,
      description: (this.form.description ?? '').trim(),
      owner,
      priority: this.form.priority,
      status: this.form.status,
      startDate: this.form.startDate,
    };

    this.projectService.updateProject(this.project.id, updates);
    this.project = { ...this.project, ...updates };
    this.form = { ...this.project };
    this.isEditing = false;
    this.isSaving = false;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Planning':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'In Progress':
        return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
      case 'On Hold':
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
      case 'Completed':
        return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'Critical':
        return 'text-rose-600 dark:text-rose-400 font-bold';
      case 'High':
        return 'text-orange-600 dark:text-orange-400 font-semibold';
      case 'Medium':
        return 'text-amber-600 dark:text-amber-400';
      case 'Low':
        return 'text-slate-600 dark:text-slate-400';
      default:
        return 'text-gray-600';
    }
  }
}
