export interface Project {
  id: string;
  name: string;
  description: string;
  owner: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  startDate: string;
  createdAt: string;
}
