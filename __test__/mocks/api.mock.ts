import nock from "nock";

export class ApiMock {
    static VAULT_ID = 'llriqid2uq6ucvxpe21vaultid';
    static ITEM_ID =  "llriqid2uq6ucvxpe2n1itemid";
    static FILE_ID =  "llriqid2uq6ucvxpe2n1fileid";

    public nock: any;
    private scope: nock.Scope;
    private pathBuilder: PathBuilder;

    constructor(serverUrl: string) {
        this.nock = nock;
        this.scope = nock(serverUrl);
        this.pathBuilder = new PathBuilder({
            vaultId: ApiMock.VAULT_ID,
            itemId: ApiMock.ITEM_ID,
            fileId: ApiMock.FILE_ID,
        })
    }

    getItemById(itemId?: string, vaultId?: string): nock.Interceptor {
        return this.scope.get(this.pathBuilder.itemById(itemId, vaultId));
    }

    listItemsByTitle(title: string, vaultId?: string): nock.Interceptor {
        return this.scope.get(this.pathBuilder.items(vaultId))
            .query({
                filter: `title eq "${title}"`,
            });
    }

    deleteItemById(itemId?: string, vaultId?: string): nock.Interceptor {
        return this.scope.delete(this.pathBuilder.itemById(itemId, vaultId));
    }

    listItemFiles(vaultId?: string, itemId?: string): nock.Interceptor {
        return this.scope.get(this.pathBuilder.files(vaultId, itemId));
    }

    listItemsByTitleContains(title: string, vaultId?: string): nock.Interceptor {
        return this.scope.get(this.pathBuilder.items(vaultId))
            .query({
                filter: `title co "${title}"`,
            });
    }

    listVaultsByTitle(title: string): nock.Interceptor {
        return this.scope.get(this.pathBuilder.vaults())
            .query({
                filter: `title eq "${title}"`,
            });
    }

    getFileById(fileId?: string, vaultId?: string, itemId?: string): nock.Interceptor {
        return this.scope.get(this.pathBuilder.fileById(vaultId, itemId, fileId));
    }

    getFileContent(fileId?: string, vaultId?: string, itemId?: string): nock.Interceptor {
        return this.scope.get(this.pathBuilder.fileContent(vaultId, itemId, fileId));
    }
}

class PathBuilder {
    private readonly VAULT_ID: string;
    private readonly ITEM_ID: string;
    private readonly FILE_ID: string;

    constructor(options: Options) {
        this.VAULT_ID = options.vaultId;
        this.ITEM_ID = options.itemId;
        this.FILE_ID = options.fileId;
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

    files(vaultId?: string, itemId?: string): string {
        return `${this.itemById(itemId, vaultId)}/files/`;
    }

    fileById(fileId?: string, vaultId?: string, itemId?: string): string {
        return `${this.files(vaultId, itemId)}${fileId || this.FILE_ID}`;
    }

    fileContent(fileId?: string, vaultId?: string, itemId?: string): string {
        return `${this.fileById(vaultId, itemId)}/content`;
    }
}

interface Options {
    vaultId: string;
    itemId: string;
    fileId: string;
}
