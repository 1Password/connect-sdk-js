import nock from "nock";
import { Stream, Readable } from "stream";
import {FullItem, ItemBuilder, OnePasswordConnect, Vault} from "../src";
import {OPConfig} from "../src/lib/op-connect";
import {ErrorResponse} from "../src/model/errorResponse";
import {Item} from "../src/model/item";
import CategoryEnum = Item.CategoryEnum;
import { ErrorMessageFactory, HttpErrorFactory } from "../src/lib/utils";
import { ERROR_MESSAGE } from "../src/lib/constants";
import { ApiMock } from "./mocks";
import { ItemFile } from "../src/model/itemFile";
import { FullItemAllOfFields } from "../src/model/models";

// eslint-disable-next-line @typescript-eslint/tslint/config
const mockServerUrl = "http://localhost:8000";
const mockToken = "myToken";
const VAULT_ID = ApiMock.VAULT_ID;
const ITEM_ID = ApiMock.ITEM_ID;
const FILE_ID = ApiMock.FILE_ID;
const itemTitle = 'itemTitle';
const vaultTitle = 'vaultTitle';
const OTP = '123456';

const testOpts: OPConfig = {serverURL: mockServerUrl, token: mockToken};

const op = OnePasswordConnect(testOpts);
const apiMock = new ApiMock(mockServerUrl);

describe("Test OnePasswordConnect CRUD", () => {

    beforeEach((done) => {
        if (!nock.isActive()) nock.activate();
        if (!apiMock.nock.isActive()) apiMock.nock.activate();
        done();
    });

    afterEach(() => {
        nock.restore();
        apiMock.nock.cleanAll();
    });

    test("list vaults", async () => {
        nock(mockServerUrl).get("/v1/vaults/").replyWithFile(
            200,
            __dirname + "/responses/vaults.json",
        );

        const vaults = await op.listVaults();
        expect(Array.isArray(vaults)).toBe(true);
        expect(vaults.length).toBeGreaterThanOrEqual(1);
        expect(vaults[0] instanceof Vault).toBe(true);
    });

    test("list vault items", async () => {
        nock(mockServerUrl).get(`/v1/vaults/${VAULT_ID}/items`).replyWithFile(
            200,
            __dirname + "/responses/vault-items.json",
        );

        const vaultItems = await op.listItems(VAULT_ID);

        expect(Array.isArray(vaultItems)).toBe(true);
        vaultItems.forEach((vaultItem) => {
            expect(vaultItem instanceof Item).toBe(true);
        });

    });

    test("create vault item", async () => {
        const itemDetailResponse = await require("./responses/item-detail.json");
        itemDetailResponse.vault.id = VAULT_ID;

        nock(mockServerUrl).post(
            `/v1/vaults/${VAULT_ID}/items/`).reply(
            200,
            itemDetailResponse,
        );

        const item = new ItemBuilder()
            .setCategory(CategoryEnum.Login)
            .build();

        const persistedItem = await op.createItem(VAULT_ID, item);

        expect(persistedItem instanceof FullItem).toEqual(true);
    });

    test("update vault item", async () => {
        const itemDetailResponse = await require("./responses/item-detail.json");

        const itemID = "363tl3fu6cdc2b4yctxwpqmv2l";

        nock(mockServerUrl)
            .get(`/v1/vaults/${VAULT_ID}/items/${itemID}`)
            .reply(200, (uri, requestBody) => {
                const resp = JSON.parse(JSON.stringify(itemDetailResponse));
                resp.id = itemID;
                resp.vault.id = VAULT_ID;
                return resp;
            })
            .put(`/v1/vaults/${VAULT_ID}/items/${itemID}`)
            .reply(200, (uri, requestBody) => requestBody);

        const itemToBeUpdated = await op.getItem(VAULT_ID, itemID);
        itemToBeUpdated.title = "Updated Title";
        itemToBeUpdated.tags = ["tag1", "tag2"];

        const updatedItem: FullItem = await op.updateItem(VAULT_ID, itemToBeUpdated);

        expect(updatedItem instanceof FullItem).toEqual(true);
        expect(updatedItem.title).toBe("Updated Title");
        expect(updatedItem.tags?.sort()).toEqual(itemToBeUpdated.tags.sort());
    });

    test("get item by title", async () => {
        const fullItem = await require("./responses/item-detail.json");
        const itemSearchResults = await require("./responses/vault-items.json");
        const title = "Bank of 1Password";

        nock(mockServerUrl)
            .get(`/v1/vaults/${VAULT_ID}/items/`)
            .query({
                filter: `title eq "${title}"`,
            })
            .reply(200, itemSearchResults)
            .get(`/v1/vaults/${itemSearchResults[0].vault.id}/items/${itemSearchResults[0].id}`)
            .reply(200, fullItem);

        const itemByTitle = await op.getItemByTitle(VAULT_ID, title);
        expect(itemByTitle instanceof FullItem).toEqual(true);
        expect(itemByTitle.title).toEqual(title);

    });

    test("get vaults by title", async () => {
        const vaultsResponse: Vault[] = await require("./responses/same-title-vaults.json");
        const title = "Same title";

        apiMock.listVaultsByTitle(title).reply(200, vaultsResponse)
        const vaults: Vault[] = await op.listVaultsByTitle(title);

        expect(vaults).toHaveLength(2);
        expect(vaults[0].name).toEqual(title);
        expect(vaults[1].name).toEqual(title);
    });

    describe("get vault by title", () => {
        const title = "awesome_title";

        test("should throw an error if no vaults found", async () => {
            apiMock.listVaultsByTitle(title).reply(200, []);

            await expect(() => op.getVaultByTitle(title)).rejects.toEqual(HttpErrorFactory.noVaultsFoundByTitle());
        });

        test("should throw an error if more than 1 vault found", async () => {
            apiMock.listVaultsByTitle(title).reply(200, [{}, {}]);

            await expect(() => op.getVaultByTitle(title)).rejects.toEqual(HttpErrorFactory.multipleVaultsFoundByTitle());
        });

        test("should return vault", async () => {
            apiMock.listVaultsByTitle(title).reply(200, [{ name: title } as Vault]);

            const vault: Vault = await op.getVaultByTitle(title);

            expect(vault.name).toEqual(title);
        });

    });

    describe("get vault", () => {
        test.each([
            [undefined],
            [null],
            [""],
        ])("should throw error if %s provided", async (vaultQuery) => {
            // @ts-ignore
            await expect(() => op.getVault(vaultQuery))
                .rejects.toThrow(ERROR_MESSAGE.PROVIDE_VAULT_NAME_OR_ID);
        });

        test("should return vault by id", async () => {
            const vaultId = "llriqid2uq6ucvxpe2nta4hcb1";

            nock(mockServerUrl)
                .get(`/v1/vaults/${vaultId}`)
                .reply(200, { id: vaultId });

            const vault: Vault = await op.getVault(vaultId);

            expect(vault.id).toEqual(vaultId);
        });

        test("should return vault by title", async () => {
            apiMock.listVaultsByTitle(vaultTitle).reply(200, [{ name: vaultTitle }]);
            const vault: Vault = await op.getVault(vaultTitle);

            expect(vault.name).toEqual(vaultTitle);
        });
    });

    describe("list items by title", () => {
        const title = "some title";
        const getItemsByTitleMock = (title: string) => nock(mockServerUrl)
                .get(`/v1/vaults/${VAULT_ID}/items/`)
                .query({
                    filter: `title eq "${title}"`,
                });
        const getFullItemMock = (itemId: string) =>
            nock(mockServerUrl).get(`/v1/vaults/${VAULT_ID}/items/${itemId}`);

        test("should return empty array if nothing found", async () => {
            getItemsByTitleMock(title).reply(200, []);

            const result: FullItem[] = await op.listItemsByTitle(VAULT_ID, title);

            expect(result).toHaveLength(0);
        });

        test("should re-throw api error", async () => {
            const badRequestError = new Error('Some bad request');

            getItemsByTitleMock(title).replyWithError(badRequestError);

            await expect(() => op.listItemsByTitle(VAULT_ID, title)).rejects.toEqual(badRequestError);
        });

        test("should return 2 items", async () => {
            const item1 = { id: "1" } as Item;
            const item2 = { id: "2" } as Item;

            getItemsByTitleMock(title).reply(200, [item1, item2]);
            getFullItemMock(item1.id!).reply(200, item1);
            getFullItemMock(item2.id!).reply(200, item2);

            const result: FullItem[] = await op.listItemsByTitle(VAULT_ID, title);

            expect(result).toHaveLength(2);
            expect(result[0].id).toEqual(item1.id);
            expect(result[1].id).toEqual(item2.id);
        });
    });

    describe("get item", () => {
        test.each([
            [undefined],
            [null],
            [""],
        ])("should throw error if %s provided", async (itemQuery) => {
            // @ts-ignore
            await expect(() => op.getItem(VAULT_ID, itemQuery))
                .rejects.toThrow(ERROR_MESSAGE.PROVIDE_ITEM_NAME_OR_ID);
        });

        test("should return item by id", async () => {
            apiMock.getItemById()
                .reply(200, { id: ITEM_ID });

            const item: FullItem = await op.getItem(VAULT_ID, ITEM_ID);

            expect(item.id).toEqual(ITEM_ID);
        });

        test("should return item by title", async () => {
            const itemMock: FullItem = { id: ITEM_ID, title: itemTitle, vault: { id: VAULT_ID } } as FullItem;

            apiMock.listItemsByTitle(itemTitle)
                .reply(200, [itemMock]);

            apiMock.getItemById()
                .reply(200, itemMock);

            const item: FullItem = await op.getItem(VAULT_ID, itemTitle);

            expect(item.title).toEqual(itemTitle);
        });
    });

    describe("get item by id", () => {
        test("should find item by id", async () => {
            apiMock.getItemById()
                .reply(200, { id: ITEM_ID });

            const item: Item = await op.getItemById(VAULT_ID, ITEM_ID);

            expect(item.id).toEqual(ITEM_ID);
        });

        test("should re-throw api error", async () => {
            const notFoundError = new Error('Item not found');

            apiMock.getItemById()
                .replyWithError(notFoundError);

            await expect(() => op.getItemById(VAULT_ID, ITEM_ID))
                .rejects.toEqual(notFoundError);
        });
    });

    describe("delete item by title", () => {
        test("should reject if no items found", async () => {
            apiMock.listItemsByTitle(itemTitle)
                .reply(200, []);

            apiMock.deleteItemById()
                .reply(204);

            await expect(() => op.deleteItemByTitle(VAULT_ID, itemTitle))
                .rejects.toEqual(HttpErrorFactory.noItemsFoundByTitle());
        });

        test("should reject if more than 1 item with given title found", async () => {
            apiMock.listItemsByTitle(itemTitle)
                .reply(200, [{ id: ITEM_ID }, {}]);

            apiMock.deleteItemById()
                .reply(204);

            await expect(() => op.deleteItemByTitle(VAULT_ID, itemTitle))
                .rejects.toEqual(HttpErrorFactory.multipleItemsFoundByTitle());
        });

        test("should finish successfully", async () => {
            apiMock.listItemsByTitle(itemTitle)
                .reply(200, [{ id: ITEM_ID }]);

            apiMock.deleteItemById()
                .reply(204);

            await op.deleteItemByTitle(VAULT_ID, itemTitle);
        });
    });

    describe("delete item by id", () => {
        test("should throw error if delete not existing item", async () => {
            apiMock.deleteItemById()
                .reply(404);

            await expect(() => op.deleteItemById(VAULT_ID, ITEM_ID))
                .rejects.toThrow();
        });

        test("should finish successfully ", async () => {
            apiMock.deleteItemById().reply(204);
            await op.deleteItemById(VAULT_ID, ITEM_ID);
        });
    });

    describe("delete item", () => {
        test.each([
            [undefined],
            [null],
            [""],
        ])("should throw error if %s provided", async (itemQuery) => {
            // @ts-ignore
            await expect(() => op.deleteItem(VAULT_ID, itemQuery))
                .rejects.toThrow(ERROR_MESSAGE.PROVIDE_ITEM_NAME_OR_ID);
        });

        test("should throw an error if 2 items found by title", async () => {
            apiMock.listItemsByTitle(itemTitle).reply(200, [{}, {}]);

            await expect(() => op.deleteItem(VAULT_ID, itemTitle))
                .rejects.toEqual(HttpErrorFactory.multipleItemsFoundByTitle());
        });

        test("should throw an error if no items found by title", async () => {
            apiMock.listItemsByTitle(itemTitle).reply(200, []);

            await expect(() => op.deleteItem(VAULT_ID, itemTitle))
                .rejects.toEqual(HttpErrorFactory.noItemsFoundByTitle());
        });

        test("should finish successfully if valid item id provided", async () => {
            apiMock.deleteItemById().reply(204);
            await op.deleteItem(VAULT_ID, ITEM_ID);
        });

        test("should finish successfully if existing item title provided", async () => {
            apiMock.listItemsByTitle(itemTitle)
                .reply(200, [{ id: ITEM_ID, title: itemTitle }]);
            apiMock.deleteItemById()
                .reply(204);

            await op.deleteItem(VAULT_ID, itemTitle);
        });
    });

    describe("list files", () => {
        test("should reject promise if not existed item provided", async () => {
            apiMock.listVaultsByTitle(vaultTitle).reply(200, [{ id: VAULT_ID }]);
            apiMock.listItemsByTitle(itemTitle).reply(200, []);

            await expect(() => op.listFiles(VAULT_ID, itemTitle))
                .rejects.toEqual(HttpErrorFactory.noItemsFoundByTitle());
        });

        test("should return empty array if item with no files", async () => {
            apiMock.listItemFiles().reply(200, []);

            const files: ItemFile[] = await op.listFiles(VAULT_ID, ITEM_ID);

            expect(files).toHaveLength(0);
        });

        test("should return files list when search by vault and item id", async () => {
            apiMock.listItemFiles().reply(200, [{} as ItemFile]);

            const files: ItemFile[] = await op.listFiles(VAULT_ID, ITEM_ID);

            expect(files).toHaveLength(1);
        });

        test("should return files list when search by vault and item title", async () => {
            apiMock.listVaultsByTitle(vaultTitle).reply(200, [{ id: VAULT_ID }]);
            apiMock.listItemsByTitle(itemTitle).reply(200, [{ id: ITEM_ID, vault: { id: VAULT_ID } }]);
            apiMock.listItemFiles().reply(200, [{} as ItemFile]);

            const files: ItemFile[] = await op.listFiles(VAULT_ID, ITEM_ID);

            expect(files).toHaveLength(1);
        });
    });

    describe("get item otp", () => {
        test("should throw error if request to connect returns an error", async () => {
            apiMock.getItemById().reply(404);

            await expect(() => op.getItemOTP(VAULT_ID, ITEM_ID))
                .rejects.toThrow();
        });

        test("should throw error if item has no OTP", async () => {
            apiMock.getItemById().reply(200, { id: ITEM_ID });

            await expect(() => op.getItemOTP(VAULT_ID, ITEM_ID))
                .rejects.toThrow(ErrorMessageFactory.noOTPFoundForItem(ITEM_ID));
        });

        test("should return OTP", async () => {
            apiMock.getItemById().reply(200, { id: ITEM_ID, fields: [{ type: FullItemAllOfFields.TypeEnum.Otp, totp: OTP }] });
            const otp: string = await op.getItemOTP(VAULT_ID, ITEM_ID);

            expect(otp).toEqual(OTP);
        });
    });

    describe("List items by title contains", () => {
        const title = "some title";

        test("should return empty array if nothing found", async () => {
            apiMock.listItemsByTitleContains(title).reply(200, []);

            const result: FullItem[] = await op.listItemsByTitleContains(VAULT_ID, title);

            expect(result).toHaveLength(0);
        });

        test("should re-throw api error", async () => {
            const badRequestError = new Error('Some bad request');

            apiMock.listItemsByTitleContains(title).replyWithError(badRequestError);

            await expect(() => op.listItemsByTitleContains(VAULT_ID, title)).rejects.toEqual(badRequestError);
        });

        test("should return 2 items", async () => {
            const item1 = { id: "1" } as Item;
            const item2 = { id: "2" } as Item;

            apiMock.listItemsByTitleContains(title).reply(200, [item1, item2]);

            apiMock.getItemById(item1.id).reply(200, item1);
            apiMock.getItemById(item2.id).reply(200, item2);

            const result: FullItem[] = await op.listItemsByTitleContains(VAULT_ID, title);

            expect(result).toHaveLength(2);
            expect(result[0].id).toEqual(item1.id);
            expect(result[1].id).toEqual(item2.id);
        });
    });

    describe("get file by id", () => {
        test.each(["", null, undefined])
            ("should throw error if %s provides as file id", async (fileId) => {
                // @ts-ignore
                await expect(() => op.getFileById(vaultTitle, itemTitle, fileId)).rejects.toThrow(new Error(ErrorMessageFactory.noFileIdProvided()));
            });

        test("should throw error if invalid vault id provided", async () => {
            apiMock.listVaultsByTitle(vaultTitle).replyWithError("something went wrong");

            await expect(() => op.getFileById(vaultTitle, itemTitle, FILE_ID)).rejects.toEqual(new Error("something went wrong"));
        });

        test("should throw error if there is more than one vault with provided title", async () => {
            apiMock.listVaultsByTitle(vaultTitle).reply(200, [{}, {}]);

            await expect(() => op.getFileById(vaultTitle, itemTitle, FILE_ID)).rejects.toEqual(HttpErrorFactory.multipleVaultsFoundByTitle());
        });

        test("should throw error if invalid item id provided", async () => {
            apiMock.listVaultsByTitle(vaultTitle).reply(200, [{ id: VAULT_ID }]);
            apiMock.listItemsByTitle(itemTitle).replyWithError("something went wrong");

            await expect(() => op.getFileById(vaultTitle, itemTitle, FILE_ID)).rejects.toEqual(new Error("something went wrong"));
        });

        test("should throw error if there is more than one item with provided title", async () => {
            apiMock.listVaultsByTitle(vaultTitle).reply(200, [{ id: VAULT_ID }]);
            apiMock.listItemsByTitle(itemTitle).reply(200, [{}, {}]);

            await expect(() => op.getFileById(vaultTitle, itemTitle, FILE_ID)).rejects.toEqual(HttpErrorFactory.multipleItemsFoundByTitle());
        });

        test("should return file when search by vault and item title", async () => {
            apiMock.listVaultsByTitle(vaultTitle).reply(200, [{ id: VAULT_ID }]);
            apiMock.listItemsByTitle(itemTitle).reply(200, [{ id: ITEM_ID, vault: { id: VAULT_ID } }]);
            apiMock.getFileById().reply(200, { id: FILE_ID });

            const file: ItemFile = await op.getFileById(vaultTitle, itemTitle, FILE_ID);
            expect(file.id).toEqual(FILE_ID);
        });

        test("should return file when search by vault and item id", async () => {
            apiMock.getFileById().reply(200, { id: FILE_ID });

            const file: ItemFile = await op.getFileById(VAULT_ID, ITEM_ID, FILE_ID);
            expect(file.id).toEqual(FILE_ID);
        });
    });

    describe('get file content', () => {
        const FILE_CONTENT = "File content... 🖖🚀";

        describe('as a string', () => {
            test.each(["", null, undefined])
            ("should throw error if %s provides as file id", async (fileId) => {
                // @ts-ignore
                await expect(() => op.getFileContent(vaultTitle, itemTitle, fileId)).rejects.toThrow(new Error(ErrorMessageFactory.noFileIdProvided()));
            });

            test("should throw error if invalid vault id provided", async () => {
                apiMock.listVaultsByTitle(vaultTitle).replyWithError("something went wrong");

                await expect(() => op.getFileContent(vaultTitle, itemTitle, FILE_ID)).rejects.toEqual(new Error("something went wrong"));
            });

            test("should throw error if there is more than one vault with provided title", async () => {
                apiMock.listVaultsByTitle(vaultTitle).reply(200, [{}, {}]);

                await expect(() => op.getFileContent(vaultTitle, itemTitle, FILE_ID)).rejects.toEqual(HttpErrorFactory.multipleVaultsFoundByTitle());
            });

            test("should throw error if invalid item id provided", async () => {
                apiMock.listVaultsByTitle(vaultTitle).reply(200, [{ id: VAULT_ID }]);
                apiMock.listItemsByTitle(itemTitle).replyWithError("something went wrong");

                await expect(() => op.getFileContent(vaultTitle, itemTitle, FILE_ID)).rejects.toEqual(new Error("something went wrong"));
            });

            test("should throw error if there is more than one item with provided title", async () => {
                apiMock.listVaultsByTitle(vaultTitle).reply(200, [{ id: VAULT_ID }]);
                apiMock.listItemsByTitle(itemTitle).reply(200, [{}, {}]);

                await expect(() => op.getFileContent(vaultTitle, itemTitle, FILE_ID)).rejects.toEqual(HttpErrorFactory.multipleItemsFoundByTitle());
            });

            test("should return file content when search by vault and item title", async () => {
                apiMock.listVaultsByTitle(vaultTitle).reply(200, [{ id: VAULT_ID }]);
                apiMock.listItemsByTitle(itemTitle).reply(200, [{ id: ITEM_ID, vault: { id: VAULT_ID } }]);
                apiMock.getFileContent().reply(200, () => Readable.from(FILE_CONTENT));

                const content: string = await op.getFileContent(VAULT_ID, ITEM_ID, FILE_ID);
                expect(content).toEqual(FILE_CONTENT);
            });

            test("should return file content when search by vault and item id", async () => {
                apiMock.getFileContent().reply(200, () => Readable.from(FILE_CONTENT));

                const content: string = await op.getFileContent(VAULT_ID, ITEM_ID, FILE_ID);
                expect(content).toEqual(FILE_CONTENT);
            });
        });

        describe('as a stream', () => {
            test.each(["", null, undefined])
            ("should throw error if %s provides as file id", async (fileId) => {
                // @ts-ignore
                await expect(() => op.getFileContentStream(vaultTitle, itemTitle, fileId)).rejects.toThrow(new Error(ErrorMessageFactory.noFileIdProvided()));
            });

            test("should throw error if invalid vault id provided", async () => {
                apiMock.listVaultsByTitle(vaultTitle).replyWithError("something went wrong");

                await expect(() => op.getFileContentStream(vaultTitle, itemTitle, FILE_ID)).rejects.toEqual(new Error("something went wrong"));
            });

            test("should throw error if there is more than one vault with provided title", async () => {
                apiMock.listVaultsByTitle(vaultTitle).reply(200, [{}, {}]);

                await expect(() => op.getFileContentStream(vaultTitle, itemTitle, FILE_ID)).rejects.toEqual(HttpErrorFactory.multipleVaultsFoundByTitle());
            });

            test("should throw error if invalid item id provided", async () => {
                apiMock.listVaultsByTitle(vaultTitle).reply(200, [{ id: VAULT_ID }]);
                apiMock.listItemsByTitle(itemTitle).replyWithError("something went wrong");

                await expect(() => op.getFileContentStream(vaultTitle, itemTitle, FILE_ID)).rejects.toEqual(new Error("something went wrong"));
            });

            test("should throw error if there is more than one item with provided title", async () => {
                apiMock.listVaultsByTitle(vaultTitle).reply(200, [{ id: VAULT_ID }]);
                apiMock.listItemsByTitle(itemTitle).reply(200, [{}, {}]);

                await expect(() => op.getFileContentStream(vaultTitle, itemTitle, FILE_ID)).rejects.toEqual(HttpErrorFactory.multipleItemsFoundByTitle());
            });

            test("should return file stream when search by vault and item title", async () => {
                apiMock.listVaultsByTitle(vaultTitle).reply(200, [{ id: VAULT_ID }]);
                apiMock.listItemsByTitle(itemTitle).reply(200, [{ id: ITEM_ID, vault: { id: VAULT_ID } }]);
                apiMock.getFileContent().reply(200, () => Readable.from(FILE_CONTENT));

                const fileStream: Stream = await op.getFileContentStream(VAULT_ID, ITEM_ID, FILE_ID);
                expect(fileStream).toBeInstanceOf(Readable);
            });

            test("should return file stream when search by vault and item id", async () => {
                apiMock.getFileContent().reply(200, () => Readable.from(FILE_CONTENT));

                const fileStream: Stream = await op.getFileContentStream(VAULT_ID, ITEM_ID, FILE_ID);
                expect(fileStream).toBeInstanceOf(Readable);
            });
        });
    });
});

describe("Connector HTTP errors", () => {

    beforeEach((done) => {
        if (!nock.isActive()) nock.activate();
        done();
    });

    afterEach(() => {
        nock.restore();
    });

    test("factory requires serverURL and token", () => {
        // @ts-ignore 
        expect(() => OnePasswordConnect({serverURL: undefined, token: undefined})).toThrow();
        // @ts-ignore 
        expect(() => OnePasswordConnect({serverURL: mockServerUrl, token: undefined})).toThrow();
        // @ts-ignore 
        expect(() => OnePasswordConnect({serverURL: undefined, token: mockToken})).toThrow();

    });

    test("assert error response structure", async () => {
        expect.assertions(4);

        const scope = nock(mockServerUrl)
            .get("/v1/vaults/1234")
            .reply(401, {status: 401, message: "Invalid token"})
            .get("/v1/vaults/1234")
            .reply(403, {status: 403, message: "Vault not in scope"})
            .get("/v1/vaults/1234/items")
            .reply(404, {status: 404, message: "Vault not found"});

        // No token, unauthenticated
        try {
            await op.getVaultById("1234");
        } catch (error) {
            expect(error).toEqual({status: 401, message: "Invalid token"} as ErrorResponse);
        }

        // Token has wrong scopes
        try {
            await op.getVaultById("1234");
        } catch (error) {
            expect(error).toEqual({status: 403, message: "Vault not in scope"} as ErrorResponse);
        }

        // Vault not found
        try {
            await op.listItems("1234");
        } catch (error) {
            expect(error).toEqual({status: 404, message: "Vault not found"} as ErrorResponse);
        }

        expect(scope.isDone()).toEqual(true);

    });

    test("get item by title errors - multiple items returned", async () => {
        expect.assertions(3);
        const fullItem = await require("./responses/item-detail.json");
        const title = "Bank";
        const querystring = {filter: `title eq "${title}"`};
        const getItemPath = `/v1/vaults/${VAULT_ID}/items/`;

        nock(mockServerUrl)
            .get(getItemPath)
            .query(querystring)
            .reply(200, [fullItem, fullItem])
            // return empty array (no results)
            .get(getItemPath)
            .query(querystring)
            .reply(200, [])
            // return object when expecting array
            .get(getItemPath)
            .query(querystring)
            .reply(200, {});

        // Assert multiple returned items throws an error
        try {
            await op.getItemByTitle(VAULT_ID, title);
        } catch (error) {
            expect(error).toEqual(HttpErrorFactory.multipleItemsFoundByTitle());
        }

        // Assert empty array returned by server throws error
        try {
            await op.getItemByTitle(VAULT_ID, title);
        } catch (error) {
            expect(error).toEqual(HttpErrorFactory.noItemsFoundByTitle());
        }

        // Assert error thrown when object returned;
        // expect array when querying by Title
        try {
            await op.getItemByTitle(VAULT_ID, title);
        } catch (error) {
            expect(error).toEqual(HttpErrorFactory.noItemsFoundByTitle());
        }
    });
});
