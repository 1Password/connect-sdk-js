import * as http from "http";
import * as https from "https";
// eslint-disable-next-line @typescript-eslint/tslint/config
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

import { getVersion } from "./metadata";
import { HTTPMethod, RequestOptions, Response } from "./requests";

/**
 * The default Request Client used by the SDK if customer does not
 * provide their own client.
 */
export class HTTPClient implements IRequestClient {
    public defaultTimeout = 15000; // 15 seconds

    public readonly defaultHeaders = {
        "content-type": "application/json",
        "user-agent": `connect-sdk-js/${getVersion()}`,
    };

    private axios: AxiosInstance;

    public constructor(conf?: ClientConfig) {
        this.axios = this.initAxios(conf);
    }

    public async request(
        method,
        url,
        opts: ClientRequestOptions,
    ): Promise<Response> {
        const requestCfg = {
            method,
            url,
            timeout: opts.timeout,
            data: opts.data,
            params: opts.params,
            headers: Object.assign({}, this.defaultHeaders, opts.headers, {
                authorization: `Bearer ${opts.authToken}`,
            }),
            responseType: opts.responseType,
        } as AxiosRequestConfig;

        const response = await this.axios.request(requestCfg);
        return { status: response.status, data: response.data } as Response;
    }

    /**
     * Factory helper that sets up axios with settings relevant to the connector.
     *
     * @param {ClientConfig} conf
     */
    private initAxios(conf: ClientConfig): AxiosInstance {
        conf = conf || {};
        const axiosConfig = {
            timeout: conf.timeout || this.defaultTimeout,
            headers: this.defaultHeaders,
        } as AxiosRequestConfig;

        if (conf.keepAlive) {
            axiosConfig.httpsAgent = new https.Agent({ keepAlive: true });
            axiosConfig.httpAgent = new http.Agent({ keepAlive: true });
        }

        const axiosInstance = axios.create(axiosConfig);

        axiosInstance.interceptors.response.use(
            (response) => response,
            // eslint-disable-next-line @typescript-eslint/promise-function-async,@typescript-eslint/tslint/config
            (error) => {
                if (error.response && error.response.data) {
                    return Promise.reject(error.response.data);
                } else {
                    return Promise.reject(error);
                }
            },
        );

        return axiosInstance;
    }
}

export interface IRequestClient {
    defaultTimeout: number;

    /**
     * Instructs client to send an HTTP request with provided configuration.
     *
     * @param {HTTPMethod} method
     * @param {string} url Full url, including path, of request destination
     * @param {ClientRequestOptions} opts
     * @returns {Promise<Response>}
     */
    request(
        method: HTTPMethod,
        url: string,
        opts: ClientRequestOptions,
    ): Promise<Response>;
}

export interface ClientConfig {
    keepAlive?: boolean;
    timeout?: number;
}

export interface ClientRequestOptions extends RequestOptions {
    authToken: string;
}
