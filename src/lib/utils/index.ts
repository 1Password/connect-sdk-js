export * as QueryBuilder from './query-builder';
export * from './http-error-factory';

export const isValidId = (id: string): boolean => /^[a-z0-9]{26}$/.test(id);
