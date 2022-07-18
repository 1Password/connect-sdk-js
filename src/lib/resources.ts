import { FullItem } from "../model/fullItem";
import { Item as SimpleItem, ObjectSerializer } from "../model/models";
import { Vault } from "../model/vault";
import { RequestAdapter, Response } from "./requests";
import * as QueryBuilder from "./utils";

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
     * Searches for all Vaults with exact match on title.
     *
     * @param {string} title
     * @returns {Promise<Vault[]>}
     * @private
     */
     public async getVaultsByTitle(title: string): Promise<Vault[]> {
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
     * Get metadata about a single vault
     *
     * @param vaultId
     */
    public async getVault(vaultId: string): Promise<Vault> {
        const { data } = await this.adapter.sendRequest(
            "get",
            `${this.basePath}/${vaultId}`,
        );
        return ObjectSerializer.deserialize(data, "Vault");
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
        )}?filter=title eq "${title}"`;

        const { data } = await this.adapter.sendRequest("get", queryPath);

        if (!data?.length) {
            return Promise.reject({
                status: 404,
                message: "No Items found with title",
            });
        }

        if (data.length > 1) {
            return Promise.reject({
                status: 400,
                message:
                    "Found multiple Items with given title. Provide a more specific Item title",
            });
        }

        return this.getById(data[0].vault.id, data[0].id);
    }
}

// Either itemId OR title must be supplied
type GetItemOptions =
    | { itemId: string; title?: never }
    | { title: string; itemId?: never };
