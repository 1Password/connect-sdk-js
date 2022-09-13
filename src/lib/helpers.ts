import { FullItem, FullItemAllOfFields } from "../model/models";

export class ItemHelper {
    /**
     * Returns OTP from an Item.
     *
     * If there are more than one OTP field in an item
     * it always returns the first/main one.
     *
     * @param {FullItem} item
     * @returns {string}
     */
     public static extractOTP(item: FullItem): string {
        return item?.fields?.find(({ type }) => type === FullItemAllOfFields.TypeEnum.Otp)?.otp || "";
    }
}
