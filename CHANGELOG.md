[//]: # (START/LATEST)
# Latest

## Features
  * A user-friendly description of a new feature. {issue-number}

## Fixes
 * A user-friendly description of a fix. {issue-number}

## Security
 * A user-friendly description of a security fix. {issue-number}

---

[//]: # (START/v1.1.0)
# v1.1.0

## Features
 * Field recipe now supports a set of characters that should be excluded when generating a password. This is achieved with the `excludeCharacters` property (requires Connect `v1.4.0` or later). {#43}

## Fixes
 * The SDK now works properly when used with [ncc](https://github.com/vercel/ncc)(#52)

## Security
 * Add shell escaping to GH Action to avoid command injection. (#51)
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
