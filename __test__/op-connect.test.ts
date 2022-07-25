import nock from "nock";
import {FullItem, ItemBuilder, OnePasswordConnect, Vault} from "../src";
import {OPConfig} from "../src/lib/op-connect";
import {ErrorResponse} from "../src/model/errorResponse";
import {Item} from "../src/model/item";
import CategoryEnum = Item.CategoryEnum;
import { HttpErrorFactory } from "../src/lib/utils";
import { ERROR_MESSAGE } from "../src/lib/constants";

// eslint-disable-next-line @typescript-eslint/tslint/config
const mockServerUrl = "http://localhost:8000";
const mockToken = "myToken";
const VAULTID = "197dcc5e-606c-4c12-8ce2-d1b018c50260";

const testOpts: OPConfig = {serverURL: mockServerUrl, token: mockToken};

describe("Test OnePasswordConnect CRUD", () => {

    beforeEach((done) => {
        if (!nock.isActive()) nock.activate();
        done();
    });

    afterEach(() => {
        nock.restore();
    });

    test("list vaults", async () => {
        const op = OnePasswordConnect(testOpts);

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
        // assert multiple vault items are returned

        nock(mockServerUrl).get(`/v1/vaults/${VAULTID}/items`).replyWithFile(
            200,
            __dirname + "/responses/vault-items.json",
        );

        const op = OnePasswordConnect(testOpts);

        const vaultItems = await op.listItems(VAULTID);

        expect(Array.isArray(vaultItems)).toBe(true);
        vaultItems.forEach((vaultItem) => {
            expect(vaultItem instanceof Item).toBe(true);
        });

    });

    test("create vault item", async () => {

        const itemDetailResponse = await require("./responses/item-detail.json");
        itemDetailResponse.vault.id = VAULTID;

        nock(mockServerUrl).post(
            `/v1/vaults/${VAULTID}/items/`).reply(
            200,
            itemDetailResponse,
        );

        const item = new ItemBuilder()
            .setCategory(CategoryEnum.Login)
            .build();

        const op = OnePasswordConnect(testOpts);

        const persistedItem = await op.createItem(VAULTID, item);

        expect(persistedItem instanceof FullItem).toEqual(true);
    });

    test("update vault item", async () => {
        const itemDetailResponse = await require("./responses/item-detail.json");

        const itemID = "8f948af8-a116-4932-8cdf-82102f134cc4";

        nock(mockServerUrl)
            .get(`/v1/vaults/${VAULTID}/items/${itemID}`)
            .reply(200, (uri, requestBody) => {
                const resp = JSON.parse(JSON.stringify(itemDetailResponse));
                resp.id = itemID;
                resp.vault.id = VAULTID;
                return resp;
            })
            .put(`/v1/vaults/${VAULTID}/items/${itemID}`)
            .reply(200, (uri, requestBody) => requestBody);

        const op = OnePasswordConnect(testOpts);

        const itemToBeUpdated = await op.getItem(VAULTID, itemID);
        itemToBeUpdated.title = "Updated Title";
        itemToBeUpdated.tags = ["tag1", "tag2"];

        const updatedItem = await op.updateItem(VAULTID, itemToBeUpdated);

        expect(updatedItem instanceof FullItem).toEqual(true);
        expect(updatedItem.title).toBe("Updated Title");
        expect(updatedItem.tags.sort()).toEqual(itemToBeUpdated.tags.sort());
    });
    test("delete vault item", async () => {
        const fakeItemId = "51c71c29-13d6-41b1-b724-9843bb8536c6";

        nock(mockServerUrl)
            .delete(`/v1/vaults/${VAULTID}/items/${fakeItemId}`)
            .reply(204);

        const op = OnePasswordConnect(testOpts);
        await op.deleteItem(VAULTID, fakeItemId);
    });

    test("get item by title", async () => {
        const fullItem = await require("./responses/item-detail.json");
        const itemSearchResults = await require("./responses/vault-items.json");
        const title = "Bank of 1Password";

        nock(mockServerUrl)
            .get(`/v1/vaults/${VAULTID}/items/`)
            .query({
                filter: `title eq "${title}"`,
            })
            .reply(200, itemSearchResults)
            .get(`/v1/vaults/${itemSearchResults[0].vault.id}/items/${itemSearchResults[0].id}`)
            .reply(200, fullItem);

        const op = OnePasswordConnect(testOpts);
        const itemByTitle = await op.getItemByTitle(VAULTID, title);
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

        const op = OnePasswordConnect(testOpts);
        const vaults: Vault[] = await op.listVaultsByTitle(title);

        expect(vaults).toHaveLength(2);
        expect(vaults[0].name).toEqual(title);
        expect(vaults[1].name).toEqual(title);
    });

    describe("getVaultByTitle", () => {

        test("should throw an error if no vaults found", async () => {
            const op = OnePasswordConnect(testOpts);
            const title = "awsome_title";

            nock(mockServerUrl)
                .get("/v1/vaults")
                .query({
                    filter: `title eq "${title}"`,
                })
                .reply(200, []);

            await expect(() => op.getVaultByTitle(title)).rejects.toEqual(HttpErrorFactory.noVaultsFoundByTitle());
        });

        test("should throw an error if more than 1 vault found", async () => {
            const op = OnePasswordConnect(testOpts);
            const title = "awsome_title";

            nock(mockServerUrl)
                .get("/v1/vaults")
                .query({
                    filter: `title eq "${title}"`,
                })
                .reply(200, [{}, {}]);

            await expect(() => op.getVaultByTitle(title)).rejects.toEqual(HttpErrorFactory.multipleVaultsFoundByTitle());
        });

        test("should return vault", async () => {
            const op = OnePasswordConnect(testOpts);
            const title = "awsome_title";

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

    describe("getVault", () => {
        const op = OnePasswordConnect(testOpts);

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

    describe("listItemsByTitle", () => {
        const title = "some title";
        const op = OnePasswordConnect(testOpts);
        const getItemsByTitleMock = (title: string) => nock(mockServerUrl)
                .get(`/v1/vaults/${VAULTID}/items/`)
                .query({
                    filter: `title eq "${title}"`,
                });
        const getFullItemMock = (itemId: string) =>
            nock(mockServerUrl).get(`/v1/vaults/${VAULTID}/items/${itemId}`);

        test("should return empty array if nothing found", async () => {
            getItemsByTitleMock(title).reply(200, []);

            const result: FullItem[] = await op.listItemsByTitle(VAULTID, title);

            expect(result).toHaveLength(0);
        });

        test("should re-throw api error", async () => {
            const badRequestError = { status: 400, message: "Some bad request" };

            getItemsByTitleMock(title).replyWithError(badRequestError);

            await expect(() => op.listItemsByTitle(VAULTID, title)).rejects.toEqual(badRequestError);
        });

        test("should return 2 items", async () => {
            const item1 = { id: "1" } as Item;
            const item2 = { id: "2" } as Item;

            getItemsByTitleMock(title).reply(200, [item1, item2]);
            getFullItemMock(item1.id).reply(200, item1);
            getFullItemMock(item2.id).reply(200, item2);

            const result: FullItem[] = await op.listItemsByTitle(VAULTID, title);

            expect(result).toHaveLength(2);
            expect(result[0].id).toEqual(item1.id);
            expect(result[1].id).toEqual(item2.id);
        });
    })
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

        const op = OnePasswordConnect(testOpts);

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
        const getItemPath = `/v1/vaults/${VAULTID}/items/`;

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

        const op = OnePasswordConnect(testOpts);

        // Assert multiple returned items throws an error
        try {
            await op.getItemByTitle(VAULTID, title);
        } catch (error) {
            expect(error).toEqual(HttpErrorFactory.multipleItemsFoundByTitle());
        }

        // Assert empty array returned by server throws error
        try {
            await op.getItemByTitle(VAULTID, title);
        } catch (error) {
            expect(error).toEqual(HttpErrorFactory.noItemsFoundByTitle());
        }

        // Assert error thrown when object returned;
        // expect array when querying by Title
        try {
            await op.getItemByTitle(VAULTID, title);
        } catch (error) {
            expect(error).toEqual(HttpErrorFactory.noItemsFoundByTitle());
        }
    });
});
