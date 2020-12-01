import axios from "axios";
import {ClientRequestOptions, HTTPClient} from "../src/lib/client";

const mockedAxios = axios as jest.Mocked<typeof axios>;
jest.mock("axios", () => ({
            create: jest.fn((cfg) => {
                mockedAxios.defaults = {...axios.defaults, ...cfg};
                return mockedAxios;
            }),
            request: jest.fn(async (cfg) => Promise.resolve({status: 200, data: "roger roger"})),
            interceptors: {response: {use: jest.fn()}},
        }),
);

describe("HTTPClient configuration", () => {

    const token = "testToken";
    const baseURL = "localhost:1111";

    afterEach(() => {
        // reset the calls & instances, but not the returned values
        jest.clearAllMocks();
    });

    test("Default HTTPClient with default settings", () => {

        const client = new HTTPClient();

        expect(mockedAxios.create).toHaveBeenCalled();
        expect(mockedAxios.create).toHaveBeenCalledWith({
            headers: client.defaultHeaders,
            timeout: client.defaultTimeout,
        });

        // Don't care about the response here, just the prepared request config
        const apiPath = "v1/test/";
        client.request("get", apiPath, {authToken: token});

        expect(mockedAxios.request).toHaveBeenCalled();

        const args = mockedAxios.request.mock.calls[0][0];
        expect(args.httpAgent).toBeUndefined();
        expect(args.timeout).toBeUndefined();
        expect(args.data).toBeUndefined();
        expect(args.params).toBeUndefined();
        expect(args.headers).toEqual({...client.defaultHeaders, ...{authorization: `Bearer ${token}`}});
    });

    test("HTTPClient constructor options", () => {

        const client = new HTTPClient({
            keepAlive: true,
        });

        // Axios instance should have httpAgents defined b/c `httpKeepAlive` was given
        expect(mockedAxios.create).toHaveBeenCalled();
        const args = mockedAxios.create.mock.calls[0][0];
        expect(args.httpAgent).toBeDefined();
        expect(args.httpsAgent).toBeDefined();
        expect(args.timeout).toEqual(client.defaultTimeout);
        expect(args.headers).toEqual({...client.defaultHeaders});

    });

    test("HTTPClient custom request options", () => {

        const client = new HTTPClient();

        const customRequestOptions = {
            timeout: 15000,
            params: {example: "test"},
            data: {hello: "1password"},
            authToken: token,
        } as ClientRequestOptions;

        client.request("get", "example", customRequestOptions);

        expect(mockedAxios.request).toHaveBeenCalled();

        const args = mockedAxios.request.mock.calls[0][0];

        expect(args.timeout).toEqual(customRequestOptions.timeout);
        expect(args.params).toEqual(customRequestOptions.params);
        expect(args.data).toEqual(customRequestOptions.data);
        expect(args.headers).toEqual({...client.defaultHeaders, ...{authorization: `Bearer ${token}`}});
    });

});
