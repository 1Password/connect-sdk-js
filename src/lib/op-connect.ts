import { FullItem } from "../model/fullItem";
import { Item as SimpleItem } from "../model/item";
import { Vault } from "../model/vault";
import { Items, Vaults } from "./resources";

import { HTTPClient, IRequestClient } from "./client";

import { RequestAdapter } from "./requests";

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
     * Get details about a specific vault.
     *
     * If the Service Account does not have permission to view the vault, an
     * error is returned.
     *
     * @param {string} vaultId
     * @returns {Promise<Vault>}
     */
    public async getVault(vaultId: string): Promise<Vault> {
        return await this.vaults.getVault(vaultId);
    }

    /**
     * Get details about a specific vault with a matching Title value.
     *
     * The Vault Title is case-sensitive and must be an exact-match.
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
     * Get details about a specific Item in a Vault.
     *
     * @param {string} vaultId
     * @param {string} itemId
     * @returns {Promise<FullItem>}
     */
    public async getItem(vaultId: string, itemId: string): Promise<FullItem> {
        return await this.items.get(vaultId, { itemId });
    }

    /**
     * Get details about a specific item with a matching Title value.
     *
     * The Item Title is case-sensitive and must be an exact-match.
     *
     * @param {string} vaultId
     * @param {string} title
     * @returns {Promise<FullItem>}
     */
    public async getItemByTitle(
        vaultId: string,
        title: string,
    ): Promise<FullItem> {
        return await this.items.get(vaultId, { title });
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
     * Deletes a single Item matching the given Item ID.
     *
     * @param {string} vaultId
     * @param {string} itemId
     * @returns {Promise<void>}
     */
    public async deleteItem(vaultId: string, itemId: string): Promise<void> {
        await this.items.delete(vaultId, itemId);
        return;
    }
}
