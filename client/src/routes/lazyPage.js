import { lazy } from 'react';

export function lazyPage(loader, name) {
  return lazy(() => loader().then((module) => ({ default: module[name] })));
}
