# JavaScript Connect SDK Example

This example demonstrates how to create, read, and modify items available to your 1Password Connect deployment using the JavaScript Connect SDK.
Given a (secret) string, this example will create an item, add it to given vault, retrieve it and, eventually, remove it.

## Prerequisites

In order to be able to run this example, one will need:

* [Docker](https://docs.docker.com/install/), installed and running
* a [1Password Connect](https://support.1password.com/secrets-automation/#step-2-deploy-a-1password-connect-server) server, hosted on your infrastructure
* a Connect token, with read/write permissions for at least one vault accessible by the Connect instance


## Running the example

Build the JavaScript docker demo
```
 docker build -t js-connect-sdk-example .
```

Run the docker demo with the required fields passed as environment variables
```
docker run -it \
    -e OP_CONNECT_TOKEN=<YOUR_CONNECT_TOKEN> \
    -e OP_VAULT=<YOUR_VAULT_ID> \
    -e OP_CONNECT_HOST=<YOUR_CONNECT_HOST> \ 
    -e SECRET_STRING=<ANY_RANDOM_STRING> \
    js-connect-sdk-example
```

If your connect instance is deployed locally, the `OP_CONNECT_HOST` environment variable should be set to `http://host.docker.internal:8080`.

You should now be able to see, in real time, the 5 different steps (creation of client, creation of item, posting to vault, retrieval from vault, deletion) as they happen.
