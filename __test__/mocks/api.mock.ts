import nock from "nock";

export class ApiMock {
    static VAULT_ID = 'llriqid2uq6ucvxpe21vaultid';
    static ITEM_ID =  "llriqid2uq6ucvxpe2n1itemid";

    public nock: any;
    private scope: nock.Scope;
    private pathBuilder: PathBuilder;

    constructor(serverUrl: string) {
        this.nock = nock;
        this.scope = nock(serverUrl);
        this.pathBuilder = new PathBuilder({
            vaultId: ApiMock.VAULT_ID,
            itemId: ApiMock.ITEM_ID,
        })
    }

    getItemById(itemId?: string, vaultId?: string): nock.Interceptor {
        return this.scope.get(this.pathBuilder.itemById(itemId, vaultId));
    }

    listItemsByTitle(title: string, itemId?: string, vaultId?: string): nock.Interceptor {
        return this.scope.get(this.pathBuilder.items(vaultId))
                .query({
                    filter: `title eq "${title}"`,
                });
    }

    deleteItemById(itemId?: string, vaultId?: string): nock.Interceptor {
        return this.scope.delete(this.pathBuilder.itemById(itemId, vaultId));
    }

    listItemFiles(vaultId?: string, itemId?: string): nock.Interceptor {
        return this.scope.get(this.pathBuilder.listFiles(vaultId, itemId));
    }
}

class PathBuilder {
    private readonly VAULT_ID: string;
    private readonly ITEM_ID: string;

    constructor(options: Options) {
        this.VAULT_ID = options.vaultId;
        this.ITEM_ID = options.itemId;
    }

    vaults(): string {
        return "/v1/vaults/";
    }

    vaultById(vaultId?: string): string {
        return `${this.vaults()}${vaultId || this.VAULT_ID}`;
    }

    items(vaultId?: string): string {
        return `${this.vaultById(vaultId)}/items/`;
    }

    itemById(itemId?: string, vaultId?: string): string {
        return `${this.items(vaultId)}${itemId || this.ITEM_ID}`;
    }

    listFiles(vaultId?: string, itemId?: string): string {
        return `${this.items(vaultId)}${itemId || this.ITEM_ID}/files`;
    }
}

interface Options {
    vaultId: string;
    itemId: string;
}
