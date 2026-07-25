import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  role: 'Admin' | 'Editor' | 'Viewer' | 'Manager';
  status: 'Active' | 'Inactive' | 'Pending';
  avatar: string;
  lastLogin: string;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private initialUsers: User[] = [
    { id: '1', name: 'John Doe', email: 'john.doe@example.com', department: 'Engineering', role: 'Admin', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=1', lastLogin: '2023-10-24 10:00' },
    { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', department: 'Marketing', role: 'Editor', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=2', lastLogin: '2023-10-25 14:30' },
    { id: '3', name: 'Michael Brown', email: 'michael.brown@example.com', department: 'Sales', role: 'Viewer', status: 'Inactive', avatar: 'https://i.pravatar.cc/150?u=3', lastLogin: '2023-09-12 09:15' },
    { id: '4', name: 'Emily Davis', email: 'emily.davis@example.com', department: 'Engineering', role: 'Manager', status: 'Pending', avatar: 'https://i.pravatar.cc/150?u=4', lastLogin: 'Never' },
    { id: '5', name: 'Chris Wilson', email: 'chris.wilson@example.com', department: 'HR', role: 'Viewer', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=5', lastLogin: '2023-10-26 11:00' },
    { id: '6', name: 'Sarah Johnson', email: 'sarah.johnson@example.com', department: 'Marketing', role: 'Editor', status: 'Pending', avatar: 'https://i.pravatar.cc/150?u=6', lastLogin: 'Never' },
  ];

  private usersSubject = new BehaviorSubject<User[]>(this.initialUsers);
  users$ = this.usersSubject.asObservable();

  addUser(user: User): void {
    const currentUsers = this.usersSubject.value;
    this.usersSubject.next([...currentUsers, user]);
  }

  getStats(): Observable<UserStats> {
    return this.users$.pipe(
      map(users => ({
        total: users.length,
        active: users.filter(u => u.status === 'Active').length,
        inactive: users.filter(u => u.status === 'Inactive').length,
        pending: users.filter(u => u.status === 'Pending').length,
      }))
    );
  }
}
