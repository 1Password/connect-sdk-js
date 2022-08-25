import { FullItem } from "../model/fullItem";
import { Item as SimpleItem, ObjectSerializer } from "../model/models";
import { Vault } from "../model/vault";
import { RequestAdapter, Response } from "./requests";
import { HttpErrorFactory, isValidId, QueryBuilder } from "./utils";
import { ItemFile } from "../model/itemFile";

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
            `${this.basePath}?${QueryBuilder.filterByTitle(title)}`,
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

    private async getSimpleItemByTitle(vaultId: string, title: string): Promise<SimpleItem> {
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
     * Search by title for all Items which contains a given title.
     *  If found, queries for complete item details and returns results
     *
     * @param {string} vaultId
     * @param {string} itemTitle
     * @returns {Promise<FullItem[]>}
     */
      public async listItemsByTitleSearch(
        vaultId: string,
        itemTitle: string,
    ): Promise<FullItem[]> {
        const { data } = await this.adapter.sendRequest(
            "get",
            `${this.basePath(vaultId)}?${QueryBuilder.searchByTitle(
                itemTitle,
            )}`,
        );

        return Promise.all(data.map((item: SimpleItem) => this.getById(vaultId, item.id)));
    }

    /**
     * Get a list of files an Item contains.
     *
     * @param {string} vaultId
     * @param {string} itemId
     * @returns {Promise<ItemFile[]>}
     */
    public async listFiles(vaultId: string, itemId: string): Promise<ItemFile[]> {
        const { data } = await this.adapter.sendRequest(
            "get",
            `${this.basePath(vaultId, itemId)}/files`
        );

        return ObjectSerializer.deserialize(data, "Array<ItemFile>");
    }
}
