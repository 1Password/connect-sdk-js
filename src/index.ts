import { FullItem } from "./model/fullItem";
import { FullItemAllOfFields } from "./model/fullItemAllOfFields";
import TypeEnum = FullItemAllOfFields.TypeEnum;
import PurposeEnum = FullItemAllOfFields.PurposeEnum;
import CategoryEnum = FullItem.CategoryEnum;

export {
    TypeEnum as FieldType,
    PurposeEnum as FieldPurpose,
    CategoryEnum as ItemCategory,
};

export { newConnectClient as OnePasswordConnect, OPConnect } from "./lib/op-connect";

export { FullItem, Vault, GeneratorRecipe } from "./model/models";
export {
    IRequestClient,
    ClientRequestOptions,
    ClientConfig,
} from "./lib/client";
export { ItemBuilder } from "./lib/builders";

export { HttpError } from './lib/utils/error'
