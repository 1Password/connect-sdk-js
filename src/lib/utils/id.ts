import { v4 as uuidv4 } from 'uuid';
import { ID_PREFIX } from '../constants';

export const isValidId = (id: string): boolean => /^[a-z0-9]{26}$/.test(id);

export const isValidSectionId = (sectionId: string): boolean => sectionId.startsWith(ID_PREFIX.SECTION) && isValidId(sectionId.split("_")[1]);

const idGenerator = (prefix: string = ''): (length?: number) => string =>
    (length: number = 26): string =>
        `${prefix}${uuidv4().replace(/-/g, "").slice(0, length)}`;

/**
 * Create Section id.
 *
 * @param {number} length
 * @returns {string}
 */
export const generateSectionId = idGenerator(ID_PREFIX.SECTION);
