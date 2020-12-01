import {OnePasswordConnect} from "../src";
import {ClientRequestOptions, HTTPClient, IRequestClient} from "../src/lib/client";
import {HTTPMethod, RequestAdapter, RequestAdapterOptions, Response} from "../src/lib/requests";

const mockedRequest = jest.fn();
jest.mock("../src/lib/client", () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
        HTTPClient: jest.fn().mockImplementation(() => ({request: mockedRequest})),
    }));

test("Assert Token and BaseURL are required", () => {
    expect(() => new RequestAdapter(new HTTPClient(), {serverURL: undefined, token: undefined}))
        .toThrowError("ServerURL and Token are required.");
});

describe("Assert Adapter delegates calls to Client", () => {

    afterEach(() => {
        mockedRequest.mockClear();
    });
    // eslint-disable-next-line @typescript-eslint/tslint/config
    const serverURL = "http://localhost:9999/";
    const adapterOpts: RequestAdapterOptions = {serverURL, token: "testToken"};

    test("URL is normalized before delegation call", () => {
        const adapter = new RequestAdapter(new HTTPClient(), adapterOpts);
        adapter.sendRequest("get", "/example/1234");

        expect(mockedRequest).toBeCalledTimes(1);

        // Expect the `url` to be concatenation
        // of `serverURL` and `/example/1234` without double `//`
        expect(mockedRequest).toHaveBeenCalledWith(
            "get",
            // eslint-disable-next-line @typescript-eslint/tslint/config
            "http://localhost:9999/example/1234",
            {authToken: adapterOpts.token});
    });

});

describe("Adapter with Custom Clients", () => {

    const throwErrorUrl = "https://throwerror";
    const rejectPromiseUrl = "https://rejectpromise";

    class CustomClient implements IRequestClient {
        public defaultTimeout: number;

        public constructor() {
            this.defaultTimeout = 1000;
        }

        public async request(method: HTTPMethod, url: string, opts: ClientRequestOptions): Promise<Response> {
            if (url.startsWith(throwErrorUrl)) {
                throw new Error("Bad request!");
            }
            if (url.startsWith(rejectPromiseUrl)) {
                return Promise.reject({data: "cannot use Https", status: 400} as Response);
            }
            return {data: "aaaa", status: 200};
        }

    }

    test("Adapter returns thrown Error from custom client", async () => {
        // Asserts the adapter bubbles up the thrown Error if custom implementation
        // uses Error() instead of Promise.reject

        expect.assertions(1);

        const customClient = new CustomClient();
        const op = OnePasswordConnect({
            serverURL: throwErrorUrl,
            token: "a",
            httpClient: customClient,
        });

        try {
            await op.getItem("123", "throwError");
        } catch (e) {
            expect(e.message).toMatch("Bad request");
        }
    });

    test("Adapter returns rejected Promise from custom client", () => {
        // Assert Adapter bubbles up the rejected Promise
        const customClient = new CustomClient();

        const op = OnePasswordConnect({
            serverURL: rejectPromiseUrl,
            token: "a",
            httpClient: customClient,
        });

        expect(op.getItem("123", "rejectPromise"))
            .rejects
            .toMatchObject({data: "cannot use Https", status: 400});

    });
});
