import { RenderMode } from '@angular/ssr';

import { serverRoutes } from './app.routes.server';

describe('server routes', () => {
  it('prerenders all application routes', () => {
    expect(serverRoutes).toEqual([
      {
        path: '**',
        renderMode: RenderMode.Prerender,
      },
    ]);
  });
});
