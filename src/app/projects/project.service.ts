import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Project } from './project.models';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private initialProjects: Project[] = [
    {
      id: '1',
      name: 'Website Redesign',
      description: 'Modernize the company website with a responsive design and improved UX.',
      owner: 'Jane Smith',
      priority: 'High',
      status: 'In Progress',
      startDate: '2025-11-01',
      createdAt: '2025-10-15T09:00:00.000Z',
    },
    {
      id: '2',
      name: 'Mobile App Launch',
      description: 'Develop and release the iOS and Android companion app.',
      owner: 'John Doe',
      priority: 'Critical',
      status: 'Planning',
      startDate: '2026-01-15',
      createdAt: '2025-10-20T14:30:00.000Z',
    },
    {
      id: '3',
      name: 'API Migration',
      description: 'Migrate legacy REST endpoints to the new GraphQL API layer.',
      owner: 'Michael Brown',
      priority: 'Medium',
      status: 'In Progress',
      startDate: '2025-09-10',
      createdAt: '2025-09-01T08:00:00.000Z',
    },
    {
      id: '4',
      name: 'Security Audit',
      description: 'Conduct a full security review and remediate findings.',
      owner: 'Emily Davis',
      priority: 'High',
      status: 'On Hold',
      startDate: '2025-12-01',
      createdAt: '2025-10-25T11:00:00.000Z',
    },
    {
      id: '5',
      name: 'Customer Portal',
      description: 'Build a self-service portal for customer account management.',
      owner: 'Chris Wilson',
      priority: 'Medium',
      status: 'Completed',
      startDate: '2025-06-01',
      createdAt: '2025-05-15T10:00:00.000Z',
    },
    {
      id: '6',
      name: 'Data Warehouse',
      description: 'Consolidate analytics data into a centralized warehouse.',
      owner: 'Sarah Johnson',
      priority: 'Low',
      status: 'Planning',
      startDate: '2026-03-01',
      createdAt: '2025-11-01T16:45:00.000Z',
    },
  ];

  private projectsSubject = new BehaviorSubject<Project[]>(this.initialProjects);
  projects$ = this.projectsSubject.asObservable();

  /**
   * Set when another page (e.g. the dashboard quick action) navigates to the
   * Projects page intending to open the create-project form. Kept out of the URL so
   * prerendered pages hydrate with the form closed.
   */
  private createProjectRequested = false;

  requestCreateProject(): void {
    this.createProjectRequested = true;
  }

  /** Returns whether a create was requested, clearing the request. */
  consumeCreateProjectRequest(): boolean {
    const requested = this.createProjectRequested;
    this.createProjectRequested = false;
    return requested;
  }

  addProject(project: Project): void {
    const currentProjects = this.projectsSubject.value;
    this.projectsSubject.next([...currentProjects, project]);
  }

  getProjectById(id: string): Project | undefined {
    return this.projectsSubject.value.find(p => p.id === id);
  }

  updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): void {
    const currentProjects = this.projectsSubject.value;
    const index = currentProjects.findIndex(p => p.id === id);
    if (index === -1) {
      return;
    }
    const updated = { ...currentProjects[index], ...updates };
    const next = [...currentProjects];
    next[index] = updated;
    this.projectsSubject.next(next);
  }

  deleteProject(id: string): boolean {
    const currentProjects = this.projectsSubject.value;
    if (!currentProjects.some(p => p.id === id)) {
      return false;
    }
    this.projectsSubject.next(currentProjects.filter(p => p.id !== id));
    return true;
  }
}
