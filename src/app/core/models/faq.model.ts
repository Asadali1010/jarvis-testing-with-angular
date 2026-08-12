export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqCategory {
  id: string;
  title: string;
  description: string;
  items: FaqItem[];
}

export const FAQ_DATA: FaqCategory[] = [
  {
    id: 'authentication',
    title: 'Authentication',
    description: 'Sign-in, passwords, and session security for Jarvis Enterprise.',
    items: [
      {
        id: 'auth-sign-in',
        question: 'How do I sign in to Jarvis Enterprise?',
        answer:
          'Use your work email and password on the login page. Administrators provision accounts through the Users module. If you forget your credentials, select "Forgot password" to receive a reset link.',
      },
      {
        id: 'auth-session',
        question: 'How long does my session stay active?',
        answer:
          'Session duration follows the timeout configured in Settings under Security. When the limit is reached, you are signed out automatically and must authenticate again to continue.',
      },
      {
        id: 'auth-2fa',
        question: 'Can I enable two-factor authentication?',
        answer:
          'Yes. Open Settings, go to the Security section, and enable two-factor authentication. Once active, each sign-in requires your password plus a verification code from your authenticator app.',
      },
    ],
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Overview widgets, activity feeds, and workspace insights.',
    items: [
      {
        id: 'dashboard-overview',
        question: 'What appears on the dashboard?',
        answer:
          'The dashboard summarizes workspace health with stat cards, recent activity, quick actions, and personalized greetings. It is the default landing page after you sign in.',
      },
      {
        id: 'dashboard-activity',
        question: 'How is recent activity tracked?',
        answer:
          'Jarvis Enterprise records meaningful events—logins, profile updates, ticket changes, and user actions—in the activity timeline. Entries are scoped to your permissions and refresh as you navigate.',
      },
    ],
  },
  {
    id: 'task-manager',
    title: 'Task Manager',
    description: 'Tickets, assignments, and workflow tracking.',
    items: [
      {
        id: 'tasks-create',
        question: 'How do I create a new ticket?',
        answer:
          'Open Task Manager and use the new ticket form. Provide a title, description, priority, and assignee. Saved tickets appear in the board and can be filtered by status or owner.',
      },
      {
        id: 'tasks-status',
        question: 'What ticket statuses are available?',
        answer:
          'Tickets move through Open, In Progress, Review, and Closed states. Update status from the ticket card or detail view to reflect current progress for your team.',
      },
    ],
  },
  {
    id: 'users',
    title: 'Users',
    description: 'Directory, roles, and team administration.',
    items: [
      {
        id: 'users-directory',
        question: 'How do I find or manage team members?',
        answer:
          'The Users page lists everyone in your workspace with search and filters. Administrators can add users, edit roles, and deactivate accounts from the user detail panel.',
      },
    ],
  },
  {
    id: 'settings-profile',
    title: 'Settings & Profile',
    description: 'Personal preferences, appearance, and account details.',
    items: [
      {
        id: 'settings-preferences',
        question: 'Where do I change theme and notification preferences?',
        answer:
          'Go to Settings to adjust appearance (theme, sidebar behavior, compact mode), notification channels, security options, and regional formats such as language, date, and timezone.',
      },
      {
        id: 'profile-edit',
        question: 'How do I update my profile information?',
        answer:
          'Visit Profile to view your account details. Select Edit profile to change your name, phone, address, bio, and other editable fields. Email, role, and department require an administrator.',
      },
    ],
  },
];
