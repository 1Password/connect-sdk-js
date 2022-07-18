import { ItemUrls, ObjectSerializer } from "../../src/model/models";

describe("ObjectSerializer", () => {

    describe("deserialize", () => {

      test("should return undefined value if no property in data", () => {
        const obj: ItemUrls = ObjectSerializer.deserialize({}, "ItemUrls");

        expect(obj.href).toBeUndefined();
        expect(obj.primary).toBeUndefined();
        expect(obj.label).toBeUndefined();
      });

      test("should return undefined if no property in data is null", () => {
        const obj: ItemUrls = ObjectSerializer.deserialize({ label: null }, "ItemUrls");

        expect(obj.label).toBeNull();
      });

      test("should return undefined", () => {
        const obj: ItemUrls = ObjectSerializer.deserialize(undefined, "ItemUrls");

        expect(obj).toBeUndefined();
      });

      test("should return null", () => {
        const obj: ItemUrls = ObjectSerializer.deserialize(null, "ItemUrls");

        expect(obj).toBeNull();
      });

      test("should return ItemUrls instance", () => {
        const rawObj = {
            label: 'label',
            primary: true,
            href: "https://awesome-website.com",
            someUnexpectedProperty: 'unexpected',
        }

        const obj: ItemUrls = ObjectSerializer.deserialize(rawObj, "ItemUrls");

        expect(obj instanceof ItemUrls).toBeTruthy();
        expect(obj['someUnexpectedProperty']).toBeUndefined();
        expect(obj.label).toEqual(rawObj.label);
        expect(obj.primary).toEqual(rawObj.primary);
        expect(obj.href).toEqual(rawObj.href);
      });

    });

});
