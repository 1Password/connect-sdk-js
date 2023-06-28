# Quickstart

## Creating an API Client

```typescript
import { OnePasswordConnect, ItemBuilder } from "@1password/connect";

// Create new connector with HTTP Pooling
const op = OnePasswordConnect({
    serverURL: "http://localhost:8080",
    token: "my-token",
    keepAlive: true,
});
```

## Working with Vaults

```typescript
// Get all vaults
let allVaults = await op.listVaults();

// Get a specific vault
let vault = await op.getVault({ vault_id });
```

## Working with Items

```typescript
const myVaultId = { vault_uuid };

// Create an Item
const newItem = new ItemBuilder()
    .setCategory("LOGIN")
    .addField({
        label: "Example",
        value: "MySecret",
        sectionName: "Demo Section",
    })
    .build();

const createdItem = await op.createItem(myVaultId, newItem);

// Get an Item
const item = await op.getItem(myVaultId, { item_uuid });

// Get Item by name
const namedItem = await op.getItemByTitle(myVaultId, "Example Title");

// Update an Item
item.title = "New Title";
const updatedItem = await op.updateItem(myVaultId, myItem);

// Delete an Item
await op.deleteItem(myVaultId, updatedItem.id);
```

## Custom HTTPClient

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

### Defining `ClientRequestOptions`

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
DEBUG=opconnect:*
```
