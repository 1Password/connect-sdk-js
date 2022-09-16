export const QUERY_PARAM_NAME = {
    FILTER: "filter",
}

export const FILTER_PARAM = {
    TITLE: "title",
}

const eqByTitle = (title: string): string => `${FILTER_PARAM.TITLE} eq "${title}"`;

const coByTitle = (title: string): string => `${FILTER_PARAM.TITLE} co "${title}"`;

const buildKeyValuePair = (queryParamName: string): (queryParamValue: string) => string =>
    (queryParamValue): string => `${queryParamName}=${queryParamValue}`;

const buildFilterQuery = buildKeyValuePair(QUERY_PARAM_NAME.FILTER);

export const filterByTitle = (title: string): string => buildFilterQuery(eqByTitle(title));

export const searchByTitle = (title: string): string => buildFilterQuery(coByTitle(title));
