import { ERROR_MESSAGE } from "../constants";

export interface HttpError {
    status: number;
    message: string;
}

export class HttpErrorFactory {
    static noVaultsFoundByTitle(): HttpError {
        return {
            status: 404,
            message: ERROR_MESSAGE.NO_VAULTS_FOUND_BY_TITLE
        }
    }

    static multipleVaultsFoundByTitle(): HttpError {
        return {
            status: 400,
            message: ERROR_MESSAGE.MULTIPLE_VAULTS_FOUND_BY_TITLE
        }
    }

    static noItemsFoundByTitle(): HttpError {
        return {
            status: 404,
            message: ERROR_MESSAGE.NO_ITEMS_FOUND_BY_TITLE
        }
    }

    static multipleItemsFoundByTitle(): HttpError {
        return {
            status: 400,
            message: ERROR_MESSAGE.MULTIPLE_ITEMS_FOUND_BY_TITLE
        }
    }
}

export class ErrorMessageFactory {
    static noOTPFoundForItem(itemId = ""): string {
        return `${ERROR_MESSAGE.NO_OTP_FOR_THE_ITEM} ${itemId}`;
    }

    static noFileIdProvided(): string {
        return ERROR_MESSAGE.NO_FILE_ID_PROVIDED;
    }
}
