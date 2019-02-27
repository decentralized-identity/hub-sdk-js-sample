![DIF Logo](https://raw.githubusercontent.com/decentralized-identity/decentralized-identity.github.io/master/images/logo-small.png)

# Identity Hub JavaScript SDK Sample

This repository contains a sample app using the DIF [Identity Hub JavaScript SDK](https://github.com/decentralized-identity/hub-sdk-js).

For more details about the APIs used, see the [Hub SDK API Reference](https://identity.foundation/hub-sdk-js/).

## Running the sample app

To run the sample app, clone this repository locally and then run:

```
npm install
npm run build
npm run start
```
## How it works

The sample app stores objects representing to-do items in your Hub:

1. When you add a new to-do, the app authors a `create` commit to instantiate a new object and issues a `HubWriteRequest` to commit the operation to your Hub.

2. When you change the `done` state of a to-do, the app authors an `update` commit. This commit references the `object_id` of the to-do and contains the updated to-do state. The app then issues a `HubWriteRequest` to commit the update operation to your Hub.

3. When you delete a to-do, the app authors a `delete` commit referencing the `object_id` of the to-do and issues a `HubWriteRequest` to commit the delete operation to your Hub.

4. When you close and re-open the app, the app fetches any existing to-dos from your Hub. The app issues a `HubObjectQueryRequest` to identify the `object_id`s of all objects having the to-do schema. The app then issues a `HubCommitQueryRequest` to retrieve the constituent commits of all of the identified objects. Once all commits are retrieved, the app uses the `CommitStrategyBasic` strategy to compile the commits into the final state of each to-do.

The code interacting with the Hub JS SDK is mostly found in the `src/HubStore.ts` file.
