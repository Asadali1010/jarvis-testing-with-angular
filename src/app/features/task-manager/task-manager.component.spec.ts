import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Ticket } from '../../core/models/ticket.model';
import { ActivityService } from '../../core/services/activity.service';
import { TicketService } from '../../core/services/ticket.service';
import { UserService } from '../../core/services/user.service';
import { TaskManagerComponent } from './task-manager.component';

describe('TaskManagerComponent', () => {
  let fixture: ComponentFixture<TaskManagerComponent>;
  let component: TaskManagerComponent;
  let ticketService: TicketService;
  let storage: Record<string, string>;

  const openTicket: Ticket = {
    id: 'ticket-open-1',
    title: 'Open task',
    description: 'Move via drag and drop.',
    status: 'open',
    priority: 'medium',
    assigneeId: null,
    createdAt: '2026-07-01T09:00:00.000Z',
    updatedAt: '2026-07-01T09:00:00.000Z',
  };

  function createDropEvent(ticket: Ticket): CdkDragDrop<Ticket[]> {
    return {
      previousIndex: 0,
      currentIndex: 0,
      previousContainer: {} as CdkDragDrop<Ticket[]>['previousContainer'],
      container: {} as CdkDragDrop<Ticket[]>['container'],
      item: { data: ticket } as CdkDragDrop<Ticket[]>['item'],
      isPointerOverContainer: true,
      distance: { x: 0, y: 0 },
      dropPoint: { x: 0, y: 0 },
      event: new MouseEvent('mouseup'),
    };
  }

  beforeEach(async () => {
    storage = {};

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        storage = {};
      },
    });

    await TestBed.configureTestingModule({
      imports: [TaskManagerComponent],
      providers: [
        TicketService,
        UserService,
        ActivityService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideRouter([]),
      ],
    }).compileComponents();

    ticketService = TestBed.inject(TicketService);
    fixture = TestBed.createComponent(TaskManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(ActivityService).clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('drag and drop status changes', () => {
    it('updates ticket status to in-progress when dropped from open column', () => {
      const updateSpy = vi.spyOn(ticketService, 'updateTicket').mockReturnValue({
        success: true,
        ticket: { ...openTicket, status: 'in-progress' },
      });

      component.onTicketDrop(createDropEvent(openTicket), 'in-progress');

      expect(updateSpy).toHaveBeenCalledOnce();
      expect(updateSpy).toHaveBeenCalledWith(openTicket.id, { status: 'in-progress' });
    });

    it('updates ticket status to done when dropped from open column', () => {
      const updateSpy = vi.spyOn(ticketService, 'updateTicket').mockReturnValue({
        success: true,
        ticket: { ...openTicket, status: 'done' },
      });

      component.onTicketDrop(createDropEvent(openTicket), 'done');

      expect(updateSpy).toHaveBeenCalledOnce();
      expect(updateSpy).toHaveBeenCalledWith(openTicket.id, { status: 'done' });
    });

    it('does not call updateTicket when dropped in the same status column', () => {
      const updateSpy = vi.spyOn(ticketService, 'updateTicket');

      component.onTicketDrop(createDropEvent(openTicket), 'open');

      expect(updateSpy).not.toHaveBeenCalled();
    });
  });
});
