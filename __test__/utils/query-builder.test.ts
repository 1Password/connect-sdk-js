import { QueryBuilder } from "../../src/lib/utils";

describe("QueryBuilder", () => {
    describe("filterByTitle", () => {
        const title = 'some title';
        const filterQuery: string = QueryBuilder.filterByTitle(title);
        const [key, value] = filterQuery.split("=");

        test("should create query param key equal filter", () => {
            expect(key).toEqual(QueryBuilder.QUERY_PARAM_NAME.FILTER);
        });

        describe("query value", () => {
            test("should start with title", () => {
                expect(value.startsWith(QueryBuilder.FILTER_PARAM.TITLE)).toBeTruthy();
            });

            test("should include eq", () => {
                expect(value.includes("eq")).toBeTruthy();
            });

            test("should contain provided title", () => {
                expect(value.includes(title)).toBeTruthy();
            });
        });
    });

    describe("searchByTitle", () => {
        const title = 'some title';
        const filterQuery: string = QueryBuilder.searchByTitle(title);
        const [key, value] = filterQuery.split("=");

        test("should create query param key equal filter", () => {
            expect(key).toEqual(QueryBuilder.QUERY_PARAM_NAME.FILTER);
        });

        describe("query value", () => {
            test("should start with title", () => {
                expect(value.startsWith(QueryBuilder.FILTER_PARAM.TITLE)).toBeTruthy();
            });

            test("should include co", () => {
                expect(value.includes("co")).toBeTruthy();
            });

            test("should contain provided title", () => {
                expect(value.includes(title)).toBeTruthy();
            });
        });
    });
    
})
