import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { RenderMode } from '@angular/ssr';

import { serverRoutes } from './app.routes.server';

const APP_ROUTE_PATHS = ['', 'login', 'dashboard', 'users', 'settings', 'profile'];

describe('server routes (SSR)', () => {
  it('configures prerender mode for all paths via catch-all route', () => {
    expect(serverRoutes).toEqual([
      {
        path: '**',
        renderMode: RenderMode.Prerender,
      },
    ]);
  });

  it('covers every application route path under the prerender catch-all', () => {
    const prerenderRoute = serverRoutes.find((route) => route.path === '**');
    expect(prerenderRoute).toBeDefined();
    expect(prerenderRoute?.renderMode).toBe(RenderMode.Prerender);

    for (const path of APP_ROUTE_PATHS) {
      const coversPath = serverRoutes.some(
        (route) =>
          route.renderMode === RenderMode.Prerender &&
          (route.path === '**' || route.path === path),
      );
      expect(coversPath).toBe(true);
    }
  });

  it('keeps SSR enabled in the production build configuration', () => {
    const angularConfig = JSON.parse(
      readFileSync(join(process.cwd(), 'angular.json'), 'utf-8'),
    ) as {
      projects: Record<
        string,
        { architect: { build: { options: { outputMode?: string; ssr?: { entry: string } } } } }
      >;
    };

    const buildOptions =
      angularConfig.projects['jarvis-testing-application'].architect.build.options;

    expect(buildOptions.outputMode).toBe('server');
    expect(buildOptions.ssr?.entry).toBe('src/server.ts');
  });

  it('keeps the production initial bundle within configured performance budgets', () => {
    const angularConfig = JSON.parse(
      readFileSync(join(process.cwd(), 'angular.json'), 'utf-8'),
    ) as {
      projects: Record<
        string,
        {
          architect: {
            build: {
              configurations: {
                production: {
                  budgets: Array<{
                    type: string;
                    maximumWarning: string;
                    maximumError: string;
                  }>;
                };
              };
            };
          };
        }
      >;
    };

    const budgets =
      angularConfig.projects['jarvis-testing-application'].architect.build.configurations
        .production.budgets;
    const initialBudget = budgets.find((budget) => budget.type === 'initial');

    expect(initialBudget).toEqual({
      type: 'initial',
      maximumWarning: '500kB',
      maximumError: '1MB',
    });
  });
});
