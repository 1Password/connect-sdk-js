import { FullItem } from "../model/fullItem";
import { Item as SimpleItem, ObjectSerializer } from "../model/models";
import { Vault } from "../model/vault";
import { RequestAdapter, Response } from "./requests";
import { HttpErrorFactory, isValidId, QueryBuilder } from "./utils";

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

    public async get(vaultId: string, opts: GetItemOptions): Promise<FullItem> {
        if (!(opts.itemId || opts.title) || (opts.itemId && opts.title)) {
            throw TypeError("Items.get() requires itemId or title");
        }

        const { data } = opts.itemId
            ? await this.getById(vaultId, opts.itemId)
            : await this.getByTitle(vaultId, opts.title);

        return ObjectSerializer.deserialize(data, "FullItem");
    }

    public async delete(vaultId: string, itemId: string): Promise<Response> {
        return await this.adapter.sendRequest(
            "delete",
            this.basePath(vaultId, itemId),
        );
    }

    private async getById(vaultId: string, itemId: string): Promise<Response> {
        return await this.adapter.sendRequest(
            "get",
            this.basePath(vaultId, itemId),
        );
    }

    /**
     * Search for all Items with exact match on title.
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

        const items: Response[] = await Promise.all(
            data.map((item) => item.id)
                .map(itemId => this.getById(vaultId, itemId))
        );

        return ObjectSerializer.deserialize(items.map(({ data }) => data), "Array<FullItem>");
    }

    /**
     * Searches for an Item with a case-sensitive, exact match on title.
     * If found, queries for complete item details and returns result.
     *
     * @param {string} vaultId
     * @param {string} title
     * @returns {Promise<FullItem>}
     * @private
     */
    private async getByTitle(
        vaultId: string,
        title: string,
    ): Promise<Response> {
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

        return this.getById(data[0].vault.id, data[0].id);
    }
}

// Either itemId OR title must be supplied
type GetItemOptions =
    | { itemId: string; title?: never }
    | { title: string; itemId?: never };
