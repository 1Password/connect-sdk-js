import { FullItem } from "../model/fullItem";
import { Item as SimpleItem } from "../model/item";
import { Vault } from "../model/vault";
import { ItemFile } from "../model/itemFile";
import { Items, Vaults } from "./resources";

import { HTTPClient, IRequestClient } from "./client";

import { RequestAdapter } from "./requests";
import { ERROR_MESSAGE } from "./constants";

export interface OPConfig {
    serverURL: string;
    token: string;
    httpClient?: IRequestClient; // allow consumer to provide custom client.
    keepAlive?: boolean;
    timeout?: number;
}

/**
 * OnePasswordConnect client factory.
 *
 * @param {OPConfig} opts
 * @returns {OPConnect}
 */
export const newConnectClient = (opts: OPConfig): OPConnect => {
    if (opts && typeof opts !== "object") {
        throw new TypeError("Options argument must be an object");
    }

    if (!opts.serverURL || !opts.token) {
        throw new Error("Options serverURL and token are required.");
    }

    return new OPConnect(opts);
};

class OPConnect {
    private vaults: Vaults;
    private items: Items;

    private readonly httpAdapter: RequestAdapter;

    public constructor(opts: OPConfig) {
        this.httpAdapter = new RequestAdapter(
            opts.httpClient ? opts.httpClient : new HTTPClient(opts),
            { serverURL: opts.serverURL, token: opts.token },
        );

        this.vaults = new Vaults(this.httpAdapter);
        this.items = new Items(this.httpAdapter);
    }

    /**
     * Returns a list of all Vaults the Service Account has permission
     * to view.
     *
     * @returns {Promise<Vault[]>}
     */
    public async listVaults(): Promise<Vault[]> {
        return await this.vaults.list();
    }

    /**
     * Returns a list of Vaults with a matching Title value.
     *
     * The Vault Title must be an exact-match.
     *
     * @param {string} vaultTitle
     * @returns {Promise<Vault[]>}
     */
     public async listVaultsByTitle(vaultTitle: string): Promise<Vault[]> {
        return this.vaults.listVaultsByTitle(vaultTitle);
    }

    /**
     * Get details about a specific vault wih a matching ID or Title value.
     *
     * If the Service Account does not have permission to view the vault, an
     * error is returned.
     *
     * @param {string} vaultQuery
     * @returns {Promise<Vault>}
     */
    public async getVault(vaultQuery: string): Promise<Vault> {
        if (!vaultQuery) {
            throw new Error(ERROR_MESSAGE.PROVIDE_VAULT_NAME_OR_ID);
        }

        return this.vaults.getVault(vaultQuery);
    }

    /**
     * Get details about a specific vault with a matching ID value.
     *
     * @param {string} vaultId
     * @returns {Promise<Vault>}
     */
    public async getVaultById(vaultId: string): Promise<Vault> {
        return await this.vaults.getVaultById(vaultId);
    }

    /**
     * Get details about a specific vault with a matching Title value.
     *
     * The Vault Title must be an exact-match.
     *
     * @param {string} vaultTitle
     * @returns {Promise<Vault>}
     */
    public async getVaultByTitle(vaultTitle: string): Promise<Vault> {
        return await this.vaults.getVaultByTitle(vaultTitle);
    }

    /**
     * Lists all Items inside a specific Vault.
     *
     * @param {string} vaultId
     * @returns {Promise<SimpleItem[]>}
     */
    public async listItems(vaultId: string): Promise<SimpleItem[]> {
        return await this.vaults.listItems(vaultId);
    }

    /**
     * Returns a list of Items with a matching Title value.
     *
     * @param {string} vaultId
     * @param {string} itemTitle
     * @returns {Promise<FullItem[]>}
     */
    public async listItemsByTitle(vaultId: string, itemTitle: string): Promise<FullItem[]> {
        return await this.items.listItemsByTitle(vaultId, itemTitle);
    }

    /**
     * Returns a list of Items that contain provided string.
     *
     *
     * @param {string} vaultId
     * @param {string} titleSearchStr
     * @returns {Promise<FullItem[]>}
     */
    public async listItemsByTitleContains(
        vaultId: string,
        titleSearchStr: string,
    ): Promise<FullItem[]> {
        return this.items.listItemsByTitleContains(vaultId, titleSearchStr);
    }

    /**
     * Get details about a specific Item in a Vault.
     *
     * @param {string} vaultId
     * @param {string} itemQuery
     * @returns {Promise<FullItem>}
     */
    public async getItem(vaultId: string, itemQuery: string): Promise<FullItem> {
        if (!itemQuery) {
            throw new Error(ERROR_MESSAGE.PROVIDE_ITEM_NAME_OR_ID);
        }

        return this.items.get(vaultId, itemQuery);
    }

    /**
     * Get details about a specific Item with a matching ID value.
     *
     * @param {string} vaultId
     * @param {string} itemId
     * @returns {Promise<FullItem>}
     */
    public async getItemById(vaultId: string, itemId: string): Promise<FullItem> {
        return this.items.getById(vaultId, itemId);
    }

    /**
     * Get details about a specific Item with a matching Title value.
     *
     * The Item Title must be an exact-match.
     *
     * @param {string} vaultId
     * @param {string} title
     * @returns {Promise<FullItem>}
     */
    public async getItemByTitle(
        vaultId: string,
        title: string,
    ): Promise<FullItem> {
        return this.items.getByTitle(vaultId, title);
    }

    /**
     * Get Item's OTP.
     * itemQuery param can be an item's Title or ID.
     *
     * If there are more than one OTP field in an item
     * it always returns the first/main one.
     *
     * @param {string} vaultId
     * @param {string} itemQuery
     * @returns {Promise<string>}
     */
     public async getItemOTP(
        vaultId: string,
        itemQuery: string,
    ): Promise<string> {
        return this.items.getOTP(vaultId, itemQuery);
    }

    /**
     * Creates a new Item inside the specified Vault.
     *
     * @param {string} vaultId
     * @param {FullItem} item
     * @returns {Promise<FullItem>}
     */
    public async createItem(
        vaultId: string,
        item: FullItem,
    ): Promise<FullItem> {
        return this.items.create(vaultId, item);
    }

    /**
     * Perform a replacement update of an Item. The given `item` object will
     * overwrite the existing item in the Vault.
     *
     * @param {string} vaultId
     * @param {FullItem} item
     * @returns {Promise<FullItem>}
     */
    public async updateItem(
        vaultId: string,
        item: FullItem,
    ): Promise<FullItem> {
        if (!item.id) throw Error("Item ID must be defined.");
        return await this.items.update(vaultId, item);
    }

    /**
     * Delete a specific item with a matching ID or Title.
     *
     * The Item Title must be an exact-match.
     *
     * @param {string} vaultId
     * @param {string} itemQuery
     * @returns {Promise<void>}
     */
    public async deleteItem(vaultId: string, itemQuery: string): Promise<void> {
        if (!itemQuery) {
            throw new Error(ERROR_MESSAGE.PROVIDE_ITEM_NAME_OR_ID);
        }

        await this.items.delete(vaultId, itemQuery);
    }

    /**
     * Delete a specific item with a matching ID value.
     *
     * @param {string} vaultId
     * @param {string} itemId
     * @returns {Promise<void>}
     */
    public async deleteItemById(vaultId: string, itemId: string): Promise<void> {
        await this.items.deleteById(vaultId, itemId);
    }

    /**
     * Delete a specific item with a matching Title value.
     *
     * The Item Title must be an exact-match.
     *
     * @param {string} vaultId
     * @param {string} itemTitle
     * @returns {Promise<void>}
     */
    public async deleteItemByTitle(vaultId: string, itemTitle: string): Promise<void> {
          await this.items.deleteByTitle(vaultId, itemTitle);
    }

    /**
     * Get a list of files an Item contains.
     *
     * @param {string} vaultId
     * @param {string} itemId
     * @returns {Promise<ItemFile[]>}
     */
    public async listFiles(vaultId: string, itemId: string): Promise<ItemFile[]> {
        return this.items.listFiles(vaultId, itemId);
    }
}
