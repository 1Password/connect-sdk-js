import { ResponseType } from "axios";
import Debug from "debug";
import { URL } from "url";

import { ClientRequestOptions, IRequestClient } from "./client";

const debug = Debug("opconnect:requests");

export class RequestAdapter {
    private client: IRequestClient;
    private readonly baseURL: URL;
    private readonly token: string;

    public constructor(client, opts: RequestAdapterOptions) {
        if (!opts.serverURL || !opts.token) {
            throw TypeError("Options serverURL and token are required.");
        }

        this.baseURL = new URL(opts.serverURL);
        this.token = opts.token;
        this.client = client;
    }

    /**
     * Delegate request call to client implementation.
     *
     * In the future this function may apply middleware.
     *
     * @param method
     * @param path
     * @param {RequestOptions} opts
     * @returns {Promise<Response>}
     */
    public async sendRequest(
        method: HTTPMethod,
        path: string,
        opts?: RequestOptions,
    ) {
        opts = opts || {};

        // The client implementation *must* accept the `authToken` option and
        // provide it as an Authorization header
        const clientOptions: ClientRequestOptions = {
            ...opts,
            ...{ authToken: this.token },
        };
        debug("Sending request - %s %s", method.toUpperCase(), path);
        return this.client.request(
            method,
            this.normalizeURL(path),
            clientOptions,
        );
    }

    /**
     * Prevent double slash (//) and other mishaps
     *
     * @param {string} path
     * @returns {string}
     * @private
     */
    private normalizeURL(path: string): string {
        const { href: normalizedURL } = new URL(path, this.baseURL);
        debug("formatted url: %s", normalizedURL);
        return normalizedURL;
    }
}

export interface RequestAdapterOptions {
    serverURL: string;
    token: string;
}

export interface RequestOptions {
    params?: { [key: string]: string | string[] | number[] };
    data?: { [key: string]: any } | string;
    headers?: { [key: string]: string | number };
    timeout?: number;
    responseType?: ResponseType;
}

export interface Response<T = any> {
    status: number;
    data: T;
}

export type HTTPMethod =
    | "get"
    | "GET"
    | "delete"
    | "DELETE"
    | "head"
    | "HEAD"
    | "options"
    | "OPTIONS"
    | "post"
    | "POST"
    | "put"
    | "PUT"
    | "patch"
    | "PATCH";
