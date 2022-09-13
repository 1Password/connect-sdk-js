export * from './errorResponse';
export * from './fullItem';
export * from './fullItemAllOf';
export * from './fullItemAllOfFields';
export * from './fullItemAllOfSection';
export * from './fullItemAllOfSections';
export * from './generatorRecipe';
export * from './item';
export * from './itemUrls';
export * from './itemVault';
export * from './itemFile';
export * from './vault';

import { ErrorResponse } from './errorResponse';
import { FullItem } from './fullItem';
import { FullItemAllOf } from './fullItemAllOf';
import { FullItemAllOfFields } from './fullItemAllOfFields';
import { FullItemAllOfSection } from './fullItemAllOfSection';
import { FullItemAllOfSections } from './fullItemAllOfSections';
import { GeneratorRecipe } from './generatorRecipe';
import { Item } from './item';
import { ItemUrls } from './itemUrls';
import { ItemVault } from './itemVault';
import { Vault } from './vault';

let primitives = [
    "string",
    "boolean",
    "double",
    "integer",
    "long",
    "float",
    "number",
    "any"
];

let enumsMap: { [index: string]: any } = {
    "FullItem.CategoryEnum": FullItem.CategoryEnum,
    "FullItemAllOfFields.TypeEnum": FullItemAllOfFields.TypeEnum,
    "FullItemAllOfFields.PurposeEnum": FullItemAllOfFields.PurposeEnum,
    "GeneratorRecipe.CharacterSetsEnum": GeneratorRecipe.CharacterSetsEnum,
    "Item.CategoryEnum": Item.CategoryEnum,
    "Vault.TypeEnum": Vault.TypeEnum,
}

let typeMap: { [index: string]: any } = {
    "ErrorResponse": ErrorResponse,
    "FullItem": FullItem,
    "FullItemAllOf": FullItemAllOf,
    "FullItemAllOfFields": FullItemAllOfFields,
    "FullItemAllOfSection": FullItemAllOfSection,
    "FullItemAllOfSections": FullItemAllOfSections,
    "GeneratorRecipe": GeneratorRecipe,
    "Item": Item,
    "ItemUrls": ItemUrls,
    "ItemVault": ItemVault,
    "Vault": Vault,
}

export class ObjectSerializer {
    public static findCorrectType(data: any, expectedType: string) {
        if (data == undefined) {
            return expectedType;
        } else if (primitives.indexOf(expectedType.toLowerCase()) !== -1) {
            return expectedType;
        } else if (expectedType === "Date") {
            return expectedType;
        } else {
            if (enumsMap[expectedType]) {
                return expectedType;
            }

            if (!typeMap[expectedType]) {
                return expectedType; // w/e we don't know the type
            }

            // Check the discriminator
            let discriminatorProperty = typeMap[expectedType].discriminator;
            if (discriminatorProperty == null) {
                return expectedType; // the type does not have a discriminator. use it.
            } else {
                if (data[discriminatorProperty]) {
                    var discriminatorType = data[discriminatorProperty];
                    if (typeMap[discriminatorType]) {
                        return discriminatorType; // use the type given in the discriminator
                    } else {
                        return expectedType; // discriminator did not map to a type
                    }
                } else {
                    return expectedType; // discriminator was not present (or an empty string)
                }
            }
        }
    }

    public static serialize(data: any, type: string) {
        if (data == undefined) {
            return data;
        } else if (primitives.indexOf(type.toLowerCase()) !== -1) {
            return data;
        } else if (type.lastIndexOf("Array<", 0) === 0) { // string.startsWith pre es6
            let subType: string = type.replace("Array<", ""); // Array<Type> => Type>
            subType = subType.substring(0, subType.length - 1); // Type> => Type
            let transformedData: any[] = [];
            for (let index in data) {
                let date = data[index];
                transformedData.push(ObjectSerializer.serialize(date, subType));
            }
            return transformedData;
        } else if (type === "Date") {
            return data.toISOString();
        } else {
            if (enumsMap[type]) {
                return data;
            }
            if (!typeMap[type]) { // in case we dont know the type
                return data;
            }

            // Get the actual type of this object
            type = this.findCorrectType(data, type);

            // get the map for the correct type.
            let attributeTypes = typeMap[type].getAttributeTypeMap();
            let instance: { [index: string]: any } = {};
            for (let index in attributeTypes) {
                let attributeType = attributeTypes[index];
                instance[attributeType.baseName] = ObjectSerializer.serialize(data[attributeType.name], attributeType.type);
            }
            return instance;
        }
    }

    public static deserialize(data: any, type: string) {
        // polymorphism may change the actual type.
        type = ObjectSerializer.findCorrectType(data, type);
        if (data == undefined) {
            return data;
        } else if (primitives.indexOf(type.toLowerCase()) !== -1) {
            return data;
        } else if (type.lastIndexOf("Array<", 0) === 0) { // string.startsWith pre es6
            let subType: string = type.replace("Array<", ""); // Array<Type> => Type>
            subType = subType.substring(0, subType.length - 1); // Type> => Type
            let transformedData: any[] = [];
            for (let index in data) {
                let date = data[index];
                transformedData.push(ObjectSerializer.deserialize(date, subType));
            }
            return transformedData;
        } else if (type === "Date") {
            return new Date(data);
        } else {
            if (enumsMap[type]) {// is Enum
                return data;
            }

            if (!typeMap[type]) { // dont know the type
                return data;
            }
            let instance = new typeMap[type]();
            let attributeTypes = typeMap[type].getAttributeTypeMap();
            for (let index in attributeTypes) {
                let attributeType = attributeTypes[index];
                instance[attributeType.name] = ObjectSerializer.deserialize(data[attributeType.baseName], attributeType.type);
            }
            return instance;
        }
    }
}
