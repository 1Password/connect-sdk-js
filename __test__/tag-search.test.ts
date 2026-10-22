import nock from "nock";
import { OnePasswordConnect, FullItem } from "../src";

const serverURL = "http://localhost:8000";
const vaultId = "test-vault";
const tag = 'rotate:"quarterly"\\team & #日本';
const client = OnePasswordConnect({ serverURL, token: "test-token" });

beforeEach(() => {
    if (!nock.isActive()) {
        nock.activate();
    }
    nock.disableNetConnect();
});
afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
});

describe.each(["eq", "co"])("tag filter %s", (operator) => {
    const search = async (value: string): Promise<FullItem[]> => operator === "eq"
        ? client.listItemsByTag(vaultId, value)
        : client.listItemsByTagContains(vaultId, value);

    test("escapes the tag as a single SCIM literal and hydrates matching items", async () => {
        const scope = nock(serverURL).get(`/v1/vaults/${vaultId}/items/`)
            .query({ filter: `tag ${operator} ${JSON.stringify(tag)}` })
            .reply(200, [{ id: "item-1" }, { id: "item-2" }])
            .get(`/v1/vaults/${vaultId}/items/item-1`).reply(200, { id: "item-1", title: "First" })
            .get(`/v1/vaults/${vaultId}/items/item-2`).reply(200, { id: "item-2", title: "Second" });
        const items = await search(tag);
        expect(items.map(item => item.title)).toEqual(["First", "Second"]);
        expect(scope.isDone()).toBe(true);
    });

    test("returns no matches for an empty tag without requesting item details", async () => {
        const scope = nock(serverURL).get(`/v1/vaults/${vaultId}/items/`)
            .query({ filter: `tag ${operator} ""` }).reply(200, []);
        await expect(search("")).resolves.toEqual([]);
        expect(scope.isDone()).toBe(true);
    });

    test("propagates a list request error", async () => {
        nock(serverURL).get(`/v1/vaults/${vaultId}/items/`)
            .query({ filter: `tag ${operator} "weekly"` }).replyWithError("list failed");
        await expect(search("weekly")).rejects.toThrow("list failed");
    });

    test("propagates an item detail error", async () => {
        nock(serverURL).get(`/v1/vaults/${vaultId}/items/`)
            .query({ filter: `tag ${operator} "weekly"` }).reply(200, [{ id: "item-1" }])
            .get(`/v1/vaults/${vaultId}/items/item-1`).replyWithError("detail failed");
        await expect(search("weekly")).rejects.toThrow("detail failed");
    });
});
