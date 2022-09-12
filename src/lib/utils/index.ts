export * as QueryBuilder from './query-builder';
export * from './error';

export const isValidId = (id: string): boolean => /^[a-z0-9]{26}$/.test(id);
