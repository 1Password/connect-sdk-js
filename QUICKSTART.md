# Quickstart

## Creating a Connect API Client

```ts
import { OnePasswordConnect } from "@1password/connect";

// Create new connector with HTTP Pooling
const op = OnePasswordConnect({
    serverURL: "http://localhost:8080",
    token: "my-token",
    keepAlive: true,
});
```

## Working with Vaults

```ts
// Get a list of all vaults
const vaults = await op.listVaults();

// Get a specific vault
const vault1 = await op.getVault("vaultId _or_ vaultTitle");
const vault2 = await op.getVaultById("vaultId");
const vault3 = await op.getVaultByTitle("Vault Title");
```

## Working with Items

```ts
import { ItemBuilder } from "@1password/connect";

const vaultId = "vaultId";

// Create an item
const newItem = new ItemBuilder()
    .setCategory("LOGIN")
    .addField({
        label: "Example",
        value: "MySecret",
        sectionName: "Demo Section",
    })
    .build();

const createdItem = await op.createItem(vaultId, newItem);

// Get an item
const item = await op.getItem(vaultId, "itemId _or_ itemTitle");
const itemById = await op.getItemById("itemId");
const itemByName = await op.getItemByTitle(vaultId, "Item Title");

// Update an item
item.title = "New Item Title";
const updatedItem = await op.updateItem(vaultId, item);

// Delete an item
await op.deleteItem(vaultId, updatedItem.id);
```

## Custom HTTPClient

You can provide a custom HTTPClient class to customize how the library sends requests to the server. The HTTPClient must implement the `IRequestClient` interface:

```ts
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

-   Handle proxy network access.
-   Add additional logging.
-   Use your own Node.js HTTP request library.

### Defining `ClientRequestOptions`

The `HTTPClient.request(method, url, opts)` method requires an options argument. The following table describes each option:

| Option      | Required | Description                                                               |
| :---------- | :------: | :------------------------------------------------------------------------ |
| `authToken` |   Yes    | The token used to authenticate the client to a 1Password Connect API.     |
| `params`    |    No    | Object with string key-value pairs to be used as query string parameters. |
| `data`      |    No    | A string or object made up of key-value pairs. Defines the request body.  |
| `headers`   |    No    | Object with string key-value pairs. Merged with default headers.          |
| `timeout`   |    No    | Sets timeout value for the HTTP request.                                  |

### Logging with `debug`

The 1Password Connect JS client uses the [`debug`](https://www.npmjs.com/package/debug) library to log runtime information.

All log messages are defined under the `opconnect` namespace. To print log statements, include the `opconnect` namespace when defining the `DEBUG` environment variable:

```
DEBUG=opconnect:*
```
