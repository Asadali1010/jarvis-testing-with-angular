import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Project } from './project.models';
import { ProjectService } from './project.service';
import { ProjectFormComponent } from './project-form.component';

type SortColumn = 'name' | 'owner' | 'priority' | 'status' | 'startDate' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const PRIORITY_ORDER: Record<Project['priority'], number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
};

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectFormComponent],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css'],
})
export class ProjectsComponent implements OnInit {
  private projectService = inject(ProjectService);
  private router = inject(Router);

  readonly projects = signal<Project[]>([]);
  readonly searchTerm = signal('');
  readonly isLoading = signal(true);
  readonly currentPage = signal(1);
  readonly sortColumn = signal<SortColumn>('createdAt');
  readonly sortDirection = signal<SortDirection>('desc');
  readonly showProjectForm = signal(false);
  readonly pageSize = 8;

  readonly filteredProjects = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.projects();
    if (!term) {
      return list;
    }
    return list.filter(
      (project) =>
        project.name.toLowerCase().includes(term) ||
        project.owner.toLowerCase().includes(term) ||
        project.description.toLowerCase().includes(term) ||
        project.status.toLowerCase().includes(term)
    );
  });

  readonly sortedProjects = computed(() => {
    const column = this.sortColumn();
    const direction = this.sortDirection();
    const multiplier = direction === 'asc' ? 1 : -1;

    return [...this.filteredProjects()].sort((a, b) => {
      let comparison = 0;
      switch (column) {
        case 'priority':
          comparison = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
          break;
        case 'startDate':
        case 'createdAt':
          comparison = new Date(a[column]).getTime() - new Date(b[column]).getTime();
          break;
        default:
          comparison = a[column].localeCompare(b[column]);
      }
      return comparison * multiplier;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.sortedProjects().length / this.pageSize))
  );

  readonly paginatedProjects = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    return this.sortedProjects().slice(startIndex, startIndex + this.pageSize);
  });

  readonly rangeStart = computed(() =>
    this.sortedProjects().length === 0 ? 0 : (this.currentPage() - 1) * this.pageSize + 1
  );

  readonly rangeEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize, this.sortedProjects().length)
  );

  ngOnInit(): void {
    this.isLoading.set(true);
    this.projectService.projects$.subscribe((projects) => {
      this.projects.set(projects);
      this.isLoading.set(false);
    });

    if (this.projectService.consumeCreateProjectRequest()) {
      this.showProjectForm.set(true);
    }
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
  }

  toggleSort(column: SortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.currentPage.set(1);
  }

  sortIndicator(column: SortColumn): string {
    if (this.sortColumn() !== column) {
      return '';
    }
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  goToPage(page: number): void {
    this.currentPage.set(Math.max(1, Math.min(page, this.totalPages())));
  }

  openProjectForm(): void {
    this.showProjectForm.set(true);
  }

  closeProjectForm(): void {
    this.showProjectForm.set(false);
  }

  handleProjectCreated(newProject: Project): void {
    this.projectService.addProject(newProject);
    this.sortColumn.set('createdAt');
    this.sortDirection.set('desc');
    this.currentPage.set(1);
    this.closeProjectForm();
  }

  navigateToProject(id: string): void {
    this.router.navigate(['/projects', id]);
  }

  onRowKeydown(event: KeyboardEvent, id: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.navigateToProject(id);
    }
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
