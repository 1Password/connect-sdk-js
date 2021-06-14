# 1Password Connect Node SDK

[![Codecov Coverage](https://img.shields.io/codecov/c/github/1Password/connect-sdk-js/coverage-report.svg?style=flat-square)](https://codecov.io/gh/1Password/connect-sdk-js/)

The 1Password Connect Node SDK provides your JavaScript & TypeScript applications access to the 1Password Connect API hosted on your infrastructure and leverage the power of [1Password Secrets Automation](https://1password.com/secrets)

The library can be used by NodeJS applications, tools, and other automations to access and manage items in 1Password Vaults.

## Installation

You can install the SDK using npm

```
npm install @1password/connect
```

or using Yarn
```
yarn add @1password/connect
```

## Usage

### Environment Variables

| Variable   | Description                                                                                            |
| :--------- | ------------------------------------------------------------------------------------------------------ |
| `OP_VAULT` | `ItemBuilder` will default to this vault UUID if `.setVault()` is not called when defining a new Item. |

#### Creating an API client

```typescript
import { OnePasswordConnect, ItemBuilder } from "@1password/connect";

// Create new connector with HTTP Pooling
const op = OnePasswordConnect({
	serverURL: "http://localhost:8080",
	token: "my-token",
	keepAlive: true,
});
```

#### Retrieving Vaults

```typescript
// Get all vaults
let allVaults = await op.listVaults();

// Get a specific vault
let vault = await op.getVault({vault_id});
```

#### Interacting with Items

```typescript
const myVaultId = {vault_uuid};

// Create an Item
const newItem = ItemBuilder()
	.setVault(myVaultId)
    .setCategory("LOGIN")
	.addField({
		label: "Example",
		value: "MySecret",
		sectionName: "Demo Section",
	})
	.build();

const createdItem = await op.createItem(newItem);

// Get an Item
const item = await op.getItem(myVaultId, {item_uuid});

// Get Item by name
const namedItem = await op.getItemByTitle(myVaultId, "Example Title");

// Update an Item
item.title = "New Title";
const updatedItem = await op.updateItem(myVaultId, myItem);

// Delete an Item
await op.deleteItem(myVaultId, updatedItem.id);
```

### Custom HTTPClient

You may provide a custom HTTPClient class to customize how the library sends requests to the server.

The HTTPClient must implement the `IRequestClient` interface:

```typescript
import { ClientRequestOptions } from "./client";
interface IRequestClient {
	defaultTimeout: number;

	request(
		method: HTTPMethod,
		url: string,
		opts: ClientRequestOptions,
	): Promise<Response>;
}
```

You can use a custom client to:

-   handle proxy network access
-   add additional logging
-   use your own node HTTP request library

#### Defining `ClientRequestOptions`

The `HTTPClient.request(method, url, opts)` method requires an options argument. The following table describes each option:

| Option      | Description                                                              | Required |
| :---------- | :----------------------------------------------------------------------- | -------: |
| `authToken` | The token used to authenticate the client to a 1Password Connect API.    |  **Yes** |
| `params`    | Object with string key-value pairs to be used as querystring parameters  |       No |
| `data`      | A string or object made up of key-value pairs. Defines the request body. |       No |
| `headers`   | Object with string key-value pairs. Merged with default headers.         |       No |
| `timeout`   | Sets timeout value for the HTTP request.                                 |       No |

### Logging with `debug`

The 1Password Connect JS client uses the [`debug`](https://www.npmjs.com/package/debug) library to log runtime information.

All log messages are defined under the `opconnect` namespace. To print log statements, include the `opconnect` namespace when defining the `DEBUG` environment variable:

```
DEBUG=opconnect
```

## Development

### Running Tests

From repository root:

```shell script
make test
```

### Building

```shell script
make build
```

---

# About 1Password

**[1Password](https://1password.com/)** is the world’s most-loved password manager. By combining industry-leading security and award-winning design, the company provides private, secure, and user-friendly password management to businesses and consumers globally. More than 60,000 business customers trust 1Password as their enterprise password manager.

# Security

1Password requests you practice responsible disclosure if you discover a vulnerability. Please submit discoveries via [BugCrowd](https://bugcrowd.com/agilebits).

For information about security practices, please visit our [Security homepage](https://1password.com/security/).
