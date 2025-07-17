[//]: # (START/LATEST)
# Latest

## Features
  * A user-friendly description of a new feature. {issue-number}

## Fixes
 * A user-friendly description of a fix. {issue-number}

## Security
 * A user-friendly description of a security fix. {issue-number}

---

[//]: # (START/v1.4.2)
# v1.4.2

## Fixes
 * Export `HttpError` interface. Kudos to @cze-aeb {#124}
 * Update dependencies. {#125}

## Security
* Mask Authorization header value in `AxiosError`. {#127}

---

[//]: # (START/v1.4.1)
# v1.4.1

## Fixes
 * Remove unused packages from devDependencies. {#110}

## Security
 * Update all dependencies and fix security vulnerabilities identified by `npm audit`. Credit and thanks go to @gevalo1 for this contribution. {#109}

---

[//]: # (START/v1.4.0)
# v1.4.0

## Features
  * Export the `OPConnect` class to make it consumable for end users. Credit and thanks go to @simhnna for this contribution. {#94}
  * Add `getFileContent` and `getFileContentStream` methods to the op-connect client. {#64}
  * Add `getFileById` method to the op-connect client. {#63}

## Security
 * Address various security vulnerabilities with package dependencies. {#89, #90, #92, #100, #102, #103, #104}

---

[//]: # (START/v1.3.0)
# v1.3.0

## Features
 * Add functionality to fetch a list of the items by title containing provided string {#82}

---

[//]: # (START/v1.2.0)
# v1.2.0

## Features
 * Return `label` property in ItemUrl object. {#66}
 * Add functionality to fetch multiple vaults {#67}
 * Add functionality to fetch single vault by title {#68}
 * Enable fetching a single vault with three separate methods: {#69}
    - `getVault` - get the vault based on its ID or name
    - `getVaultById` - get the vault with the provided ID
    - `getVaultByTitle` - get the vault with the provided title. Note: The title has to be unique. If multiple vaults have the same title, consider getting the vault by its ID instead.
 * Add functionality to fetch multiple items by title {#70}
 * Enable fetching a single item with three separate methods: {#71}
    - `getItem` - get the item based on its ID or name
    - `getItemById` - get the item with the provided ID
    - `getItemByTitle` - get the item with the provided title. Note: The title has to be unique. If multiple items have the same title, consider getting the item by its ID instead.
 * Add functionality to remove single item by title {#72, #74}
 * Enable deleting a single item with three separate methods:  {#75}
    - `deleteItem` - delete the item based on its ID or name
    - `deleteItemById` - delete the item with the provided ID
    - `deleteItemByTitle` - delete the item with the provided title. Note: The title has to be unique. If multiple items have the same title, consider deleting the item by its ID instead.
 * Add functionality to fetch item's files {#76}
 * Add functionality to fetch Item's OTP {#81}

 ## Fixes
 * Remove `crypto` library {#78}

---

[//]: # (START/v1.1.0)
# v1.1.0

## Features
 * Field recipe now supports a set of characters that should be excluded when generating a password. This is achieved with the `excludeCharacters` property (requires Connect `v1.4.0` or later). {#43}

## Fixes
 * The SDK now works properly when used with [ncc](https://github.com/vercel/ncc)(#52)

## Security
 * Add shell escaping to GitHub Action to avoid command injection. (#51)
 * Updated some dependencies of this SDK that have open security advisories. Issues found in those dependencies do not directly impact this SDK.

---

[//]: # (START/v1.0.5)
# v1.0.5

## Fixes
 * The field `TypeEnum.Totp` now points to the correct value. {#40}

## Security
 * Updated some dependencies of this SDK that have open security advisories. Issues found in those dependencies do not directly impact this SDK.

---

[//]: # (START/v1.0.4)
# v1.0.4

## Fixes
 * Make the `characterSets` of the recipe serializable. {#37}

---

[//]: # (START/v1.0.3)
# v1.0.3

## Features
* Add test coverage report using Codecov {#27}
* Remove `setVault` from ItemBuilder {#31}

## Fixes
* Fix ItemBuilder example and logging section in README {#28}
* Fix create item example in README {#30}

## Security
* Update axios to v0.21.3 {#33}
* Update tmpl to v1.0.5

---

[//]: # (START/v1.0.2)
# v1.0.2

## Fixes
* Remove unused code created by the openapi-generator-cli. {#25}

## Security
* Update dependencies to address Dependabot security alerts. {#24}

---

[//]: # ("START/v1.0.1")

# v1.0.1

## Features

-   Add support for items of type `API_CREDENTIAL`. (#20)
-   Add a containerized example implementation. (#17)

## Fixes

-   Fix error when HTTP response object does not contain a `data` key. (#16)
-   Updated the README with instructions on how to install the package. (#11)
-   Unify the usage of "serverURL" and token options. (#13)
-   Replace TSLint with ESLint plugin. (#18)

---

[//]: # "START/v1.0.0"

# v1.0.0

## Features:

-   Access 1Password Vaults and Items using 1Password Secrets Automation in your applications

---

[//]: # "START/v0.0.3"

# v0.0.3

## Security:

-   Bump `axios` dependency (#2)

---

[//]: # "START/v0.0.2"

# v0.0.2

## Features:

-   Initial closed beta release!

---
