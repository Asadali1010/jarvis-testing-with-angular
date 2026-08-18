export type ConstructionJobStatus =
  | 'scheduled'
  | 'in-progress'
  | 'delayed'
  | 'completed';

export interface ConstructionJob {
  id: string;
  name: string;
  site: string;
  startDate: string;
  endDate: string;
  status: ConstructionJobStatus;
  crewIds: string[];
}

export interface CreateConstructionJobInput {
  name: string;
  site: string;
  startDate: string;
  endDate: string;
  status?: ConstructionJobStatus;
  crewIds?: string[];
}

export type UpdateConstructionJobInput = Partial<CreateConstructionJobInput>;

export type ConstructionJobMutationResult =
  | { success: true; job: ConstructionJob }
  | { success: false; error: string };

export type ConstructionJobDeleteResult =
  | { success: true; affected: number }
  | { success: false; error: string };

/** Maximum lengths for construction job fields. */
export const CONSTRUCTION_JOB_FIELD_LIMITS = {
  name: 120,
  site: 200,
} as const;
