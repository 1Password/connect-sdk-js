import {
    Item as SimpleItem,
    ObjectSerializer,
    FullItem,
    Item,
    ItemFile,
    Vault,
} from "../model/models";
import { RequestAdapter, Response } from "./requests";
import { ErrorMessageFactory, HttpErrorFactory, isValidId, QueryBuilder } from "./utils";

class OPResource {
    protected adapter: RequestAdapter;

    public constructor(adapter: RequestAdapter) {
        this.adapter = adapter;
    }
}

export class Vaults extends OPResource {
    private basePath = "v1/vaults";

    /**
     * Return all vaults the Service Account has permission to view.
     */
    public async list(): Promise<Vault[]> {
        const { data } = await this.adapter.sendRequest(
            "get",
            `${this.basePath}/`,
        );
        return ObjectSerializer.deserialize(data, "Array<Vault>");
    }

    /**
     * Search for all Vaults with exact match on title.
     *
     * @param {string} title
     * @returns {Promise<Vault[]>}
     */
     public async listVaultsByTitle(title: string): Promise<Vault[]> {
        const { data } = await this.adapter.sendRequest(
            "get",
            `${this.basePath}/?${QueryBuilder.filterByTitle(title)}`,
        );

        return ObjectSerializer.deserialize(data, "Array<Vault>");
    }

    /**
     * Fetch basic information about all items in specified Vault
     *
     * @param vaultId
     */
    public async listItems(vaultId: string): Promise<SimpleItem[]> {
        const { data } = await this.adapter.sendRequest(
            "get",
            `${this.basePath}/${vaultId}/items`,
        );
        return ObjectSerializer.deserialize(data, "Array<Item>");
    }

    /**
     * Get metadata about a single vault.
     *
     * @param {string} vaultQuery - the Vault's title or ID
     */
    public async getVault(vaultQuery: string): Promise<Vault> {
        if (isValidId(vaultQuery)) {
            return this.getVaultById(vaultQuery);
        }

        return this.getVaultByTitle(vaultQuery);
    }

    /**
     * Get metadata about a single vault with the provided ID.
     *
     * @param {string} vaultId
     */
    public async getVaultById(vaultId: string): Promise<Vault> {
        const { data } = await this.adapter.sendRequest(
            "get",
            `${this.basePath}/${vaultId}`,
        );
        return ObjectSerializer.deserialize(data, "Vault");
    }

    /**
     * Searches for a Vault with exact match on title.
     * If no Vaults or multiple Vaults with the same title are found, it returns an error.
     *
     * @param {string} title
     * @returns {Promise<Vault>}
     */
    public async getVaultByTitle(title: string): Promise<Vault> {
         const vaults: Vault[] = await this.listVaultsByTitle(title);

         if (!vaults?.length) {
            return Promise.reject(HttpErrorFactory.noVaultsFoundByTitle());
         }

        if (vaults.length > 1) {
            return Promise.reject(HttpErrorFactory.multipleVaultsFoundByTitle());
        }

        return vaults[0];
    }
}

export class Items extends OPResource {
    private basePath = (vaultId: string, itemId?: string): string =>
        itemId && typeof itemId !== "undefined"
            ? `v1/vaults/${vaultId}/items/${itemId}`
            : `v1/vaults/${vaultId}/items/`;

    public async create(vaultId: string, item: FullItem): Promise<FullItem> {
        item.vault = Object.assign(item.vault || {}, {
            id: vaultId
        });

        const { data } = await this.adapter.sendRequest(
            "post",
            this.basePath(vaultId),
            {
                data: ObjectSerializer.serialize(item, "FullItem"),
            },
        );
        return ObjectSerializer.deserialize(data, "FullItem");
    }

    public async update(vaultId, item: FullItem): Promise<FullItem> {
        const { data } = await this.adapter.sendRequest(
            "put",
            this.basePath(vaultId, item.id),
            { data: ObjectSerializer.serialize(item, "FullItem") },
        );

        return ObjectSerializer.deserialize(data, "FullItem");
    }

    /**
     * Get details about a specific Item in a Vault.
     *
     * @param {string} vaultId
     * @param {string} itemQuery - the Item's title or ID
     * @returns {Promise<FullItem>}
     */
    public async get(vaultId: string, itemQuery: string): Promise<FullItem> {
        if (isValidId(itemQuery)) {
            return this.getById(vaultId, itemQuery);
        }

        return this.getByTitle(vaultId, itemQuery);
    }

    /**
     * Deletes an Item with exact match on Title or ID.
     *
     * @param {string} vaultId
     * @param {string} itemQuery
     * @returns {Promise<void>}
     * @private
     */
    public async delete(vaultId: string, itemQuery: string): Promise<Response> {
        if (isValidId(itemQuery)) {
            return this.deleteById(vaultId, itemQuery);
        }

        return this.deleteByTitle(vaultId, itemQuery);
    }

    /**
     * Deletes an item with exact match on ID.
     *
     * @param {string} vaultId
     * @param {string} itemId
     * @returns {Promise<void>}
     * @private
     */
    public async deleteById(vaultId: string, itemId: string): Promise<Response> {
        return this.adapter.sendRequest(
            "delete",
            this.basePath(vaultId, itemId),
        );
    }

    public async getById(vaultId: string, itemId: string): Promise<FullItem> {
        const { data } = await this.adapter.sendRequest(
            "get",
            this.basePath(vaultId, itemId),
        );

        return ObjectSerializer.deserialize(data, "FullItem");
    }

    /**
     * Deletes an item with exact match on title.
     *
     * @param {string} vaultId
     * @param {string} title
     * @returns {Promise<void>}
     */
    public async deleteByTitle(vaultId: string, title: string): Promise<Response> {
        const item: SimpleItem = await this.getSimpleItemByTitle(vaultId, title);

        return this.deleteById(vaultId, item.id);
    }

    /**
     * Search for all Items with exact match on Title.
     *
     * @param {string} vaultId
     * @param {string} itemTitle
     * @returns {Promise<FullItem[]>}
     */
    public async listItemsByTitle(vaultId: string, itemTitle: string): Promise<FullItem[]> {
        const { data } = await this.adapter.sendRequest(
            "get",
            `${this.basePath(vaultId)}?${QueryBuilder.filterByTitle(itemTitle)}`,
        );

        return Promise.all(
            data.map(item => this.getById(vaultId, item.id))
        );
    }

    /**
     * Search for the Items in which the Title contains a provided string.
     *
     * @param {string} vaultId
     * @param {string} titleSearchStr
     * @returns {Promise<FullItem[]>}
     */
    public async listItemsByTitleContains(
        vaultId: string,
        titleSearchStr: string,
    ): Promise<FullItem[]> {
        const { data } = await this.adapter.sendRequest(
            "get",
            `${this.basePath(vaultId)}?${QueryBuilder.searchByTitle(
                titleSearchStr,
            )}`,
        );

        return Promise.all(data.map((item: SimpleItem) => this.getById(vaultId, item.id)));
    }

    /**
     * Searches for an Item with exact match on title.
     * If found, queries for complete item details and returns result.
     *
     * @param {string} vaultId
     * @param {string} title
     * @returns {Promise<FullItem>}
     */
    public async getByTitle(
        vaultId: string,
        title: string,
    ): Promise<FullItem> {
        const item: SimpleItem = await this.getSimpleItemByTitle(vaultId, title);

        return this.getById(item.vault.id, item.id);
    }

    public async getSimpleItemByTitle(vaultId: string, title: string): Promise<SimpleItem> {
        const queryPath = `${this.basePath(
            vaultId,
        )}?${QueryBuilder.filterByTitle(title)}`;

        const { data } = await this.adapter.sendRequest("get", queryPath);

        if (!data?.length) {
            return Promise.reject(HttpErrorFactory.noItemsFoundByTitle());
        }

        if (data.length > 1) {
            return Promise.reject(HttpErrorFactory.multipleItemsFoundByTitle());
        }

        return ObjectSerializer.deserialize(data[0], "Item");
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
    public async getOTP(vaultId: string, itemQuery: string): Promise<string> {
        const item: FullItem = await this.get(vaultId, itemQuery);
        const otp = item.extractOTP();

        if (!otp) {
            throw new Error(ErrorMessageFactory.noOTPFoundForItem(item.id));
        }

        return otp;
    }
}

export class Files extends OPResource {
    private vaults: Vaults;
    private items: Items;

    constructor(adapter: RequestAdapter, vaults: Vaults, items: Items) {
        super(adapter);
        this.vaults = vaults;
        this.items = items;
    }

    /**
     * Get a list of files an Item contains.
     *
     * @param {string} vaultQuery - the Vaults's title or ID
     * @param {string} itemQuery  - the Item's title or ID
     * @returns {Promise<ItemFile[]>}
     */
     public async listFiles(vaultQuery: string, itemQuery: string): Promise<ItemFile[]> {
        const url = await this.generateFilesUrl(vaultQuery, itemQuery);
        const { data } = await this.adapter.sendRequest("get", url);

        return ObjectSerializer.deserialize(data, "Array<ItemFile>");
    }

    /**
     * Get an Item's specific File with a matching ID value.
     *
     * @param {string} vaultQuery - the Vaults's title or ID
     * @param {string} itemQuery - the Item's title or ID
     * @param {string} fileId - File's ID
     * @returns {Promise<ItemFile>}
     * @private
     */
     async getById(vaultQuery: string, itemQuery: string, fileId: string): Promise<ItemFile> {
        const url = await this.generateSingleFileUrl(vaultQuery, itemQuery, fileId);
        const { data } = await this.adapter.sendRequest("get", url);

        return ObjectSerializer.deserialize(data, "ItemFile");
    }

    private async generateFilesUrl(vaultQuery: string, itemQuery: string): Promise<string> {
        let url = "v1/vaults";
        const vaultId = await this.vaultIdFromQuery(vaultQuery);
        const itemId = await this.itemIdFromQuery(vaultId, itemQuery);
        url += `/${vaultId}/items/${itemId}/files/`;

        return url;
    }

    private async generateSingleFileUrl(vaultQuery: string, itemQuery: string, fileId: string): Promise<string> {
        let url = await this.generateFilesUrl(vaultQuery, itemQuery);
        url += fileId;

        return url;
    }

    private async vaultIdFromQuery(query: string): Promise<string> {
        if (!isValidId(query)) {
            const vault: Vault = await this.vaults.getVaultByTitle(query);
            return vault.id;
        }

        return query;
    }

    private async itemIdFromQuery(vaultId: string, query: string): Promise<string> {
        if (!isValidId(query)) {
            const item: Item = await this.items.getSimpleItemByTitle(vaultId, query);
            return item.id;
        }

        return query;
    }
}
