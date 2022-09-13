import { isValidSectionId } from './../../src/lib/utils/id';
import { ID_PREFIX } from './../../src/lib/constants';
import { generateSectionId, isValidId } from "../../src/lib/utils";

describe("isValidId", () => {
    test.each([
        ["false for empty id", "", false],
        ["false for null id", null, false],
        ["false for undefined id", undefined, false],
        ["false for invalid id", "123", false],
        ["false for id with invalid character", "llriqid2uq6ucvxpe2nta-hcb1", false],
        ["false for id with capital latter character", "Llriqid2uq6ucvxpe2nta-hcb1", false],
        ["true for valid id", "llriqid2uq6ucvxpe2nta4hcb1", true],
    ])(`should return %s`, (_, id, expected) => {
        expect(isValidId(id)).toEqual(expected);
    });
})

describe("generateSectionId", () => {
    const sectionId = generateSectionId();

    test("should start with Section_ prefix", () => {
        expect(sectionId.startsWith(ID_PREFIX.SECTION)).toBeTruthy();
    });

    test("should ends with 26 lenght alphanumeric id", () => {
        const suffix = sectionId.split("_")[1];
        expect(isValidId(suffix)).toBeTruthy();
    });

    test("should be valid section id", () => {
        expect(isValidSectionId(sectionId)).toBeTruthy();
    })
});
