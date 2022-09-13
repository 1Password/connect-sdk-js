import nock from "nock";
import {FullItem, ItemBuilder, OnePasswordConnect, Vault} from "../src";
import {OPConfig} from "../src/lib/op-connect";
import {ErrorResponse} from "../src/model/errorResponse";
import {Item} from "../src/model/item";
import CategoryEnum = Item.CategoryEnum;
import { ErrorMessageFactory, HttpErrorFactory } from "../src/lib/utils";
import { ERROR_MESSAGE } from "../src/lib/constants";
import { ApiMock } from "./mocks";
import { ItemFile } from "../dist/model/itemFile";
import { FullItemAllOfFields } from "../src/model/models";

// eslint-disable-next-line @typescript-eslint/tslint/config
const mockServerUrl = "http://localhost:8000";
const mockToken = "myToken";
const VAULT_ID = ApiMock.VAULT_ID;
const ITEM_ID = ApiMock.ITEM_ID;
const itemTitle = 'itemTitle';
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

        const updatedItem = await op.updateItem(VAULT_ID, itemToBeUpdated);

        expect(updatedItem instanceof FullItem).toEqual(true);
        expect(updatedItem.title).toBe("Updated Title");
        expect(updatedItem.tags.sort()).toEqual(itemToBeUpdated.tags.sort());
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

        nock(mockServerUrl)
            .get(`/v1/vaults`)
            .query({
                filter: `title eq "${title}"`,
            })
            .reply(200, vaultsResponse)

        const vaults: Vault[] = await op.listVaultsByTitle(title);

        expect(vaults).toHaveLength(2);
        expect(vaults[0].name).toEqual(title);
        expect(vaults[1].name).toEqual(title);
    });

    describe("get vault by title", () => {
        const title = "awesome_title";

        test("should throw an error if no vaults found", async () => {
            nock(mockServerUrl)
                .get("/v1/vaults")
                .query({
                    filter: `title eq "${title}"`,
                })
                .reply(200, []);

            await expect(() => op.getVaultByTitle(title)).rejects.toEqual(HttpErrorFactory.noVaultsFoundByTitle());
        });

        test("should throw an error if more than 1 vault found", async () => {
            nock(mockServerUrl)
                .get("/v1/vaults")
                .query({
                    filter: `title eq "${title}"`,
                })
                .reply(200, [{}, {}]);

            await expect(() => op.getVaultByTitle(title)).rejects.toEqual(HttpErrorFactory.multipleVaultsFoundByTitle());
        });

        test("should return vault", async () => {
            nock(mockServerUrl)
                .get("/v1/vaults")
                .query({
                    filter: `title eq "${title}"`,
                })
                .reply(200, [{ name: title } as Vault]);

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
            await expect(() => op.getVault(vaultQuery))
                .rejects.toThrowError(ERROR_MESSAGE.PROVIDE_VAULT_NAME_OR_ID);
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
            const vaultTitle = "some title";

            nock(mockServerUrl)
                .get(`/v1/vaults`)
                .query({
                    filter: `title eq "${vaultTitle}"`,
                })
                .reply(200, [{ name: vaultTitle }]);

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
            const badRequestError = { status: 400, message: "Some bad request" };

            getItemsByTitleMock(title).replyWithError(badRequestError);

            await expect(() => op.listItemsByTitle(VAULT_ID, title)).rejects.toEqual(badRequestError);
        });

        test("should return 2 items", async () => {
            const item1 = { id: "1" } as Item;
            const item2 = { id: "2" } as Item;

            getItemsByTitleMock(title).reply(200, [item1, item2]);
            getFullItemMock(item1.id).reply(200, item1);
            getFullItemMock(item2.id).reply(200, item2);

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
            await expect(() => op.getItem(VAULT_ID, itemQuery))
                .rejects.toThrowError(ERROR_MESSAGE.PROVIDE_ITEM_NAME_OR_ID);
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
            const notFoundError = { status: 404, message: "Item not found" };

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
                .rejects.toThrowError();
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
            await expect(() => op.deleteItem(VAULT_ID, itemQuery))
                .rejects.toThrowError(ERROR_MESSAGE.PROVIDE_ITEM_NAME_OR_ID);
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
        test("should throw error if invalid itemId provided", async () => {
            const itemId = "invalid_item_id";
            apiMock.listItemFiles(undefined, itemId).replyWithError("No items found");

            await expect(() => op.listFiles(VAULT_ID, itemId))
                .rejects.toThrowError("No items found");
        });

        test("should return empty array if item with no files", async () => {
            apiMock.listItemFiles().reply(200, []);

            const files: ItemFile[] = await op.listFiles(VAULT_ID, ITEM_ID);

            expect(files).toHaveLength(0);
        });

        test("should return item with single file", async () => {
            apiMock.listItemFiles().reply(200, [{} as ItemFile]);

            const files: ItemFile[] = await op.listFiles(VAULT_ID, ITEM_ID);

            expect(files).toHaveLength(1);
        });
    });

    describe("get item otp", () => {
        test("should throw error if request to connect returns an error", async () => {
            apiMock.getItemById().reply(404);

            await expect(() => op.getItemOTP(VAULT_ID, ITEM_ID))
                .rejects.toThrowError();
        });

        test("should throw error if item has no OTP", async () => {
            apiMock.getItemById().reply(200, { id: ITEM_ID });

            await expect(() => op.getItemOTP(VAULT_ID, ITEM_ID))
                .rejects.toThrowError(ErrorMessageFactory.noOTPFoundForItem(ITEM_ID));
        });

        test("should return OTP", async () => {
            apiMock.getItemById().reply(200, { id: ITEM_ID, fields: [{ type: FullItemAllOfFields.TypeEnum.Otp, totp: OTP }] });
            const otp: string = await op.getItemOTP(VAULT_ID, ITEM_ID);

            expect(otp).toEqual(OTP);
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

        expect(() => OnePasswordConnect({serverURL: undefined, token: undefined})).toThrowError();
        expect(() => OnePasswordConnect({serverURL: mockServerUrl, token: undefined})).toThrowError();
        expect(() => OnePasswordConnect({serverURL: undefined, token: mockToken})).toThrowError();

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
