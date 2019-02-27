import { HubSession, HubObjectQueryRequest, HubCommitQueryRequest, CommitStrategyBasic, Commit, RsaCommitSigner,
         HubWriteRequest, SignedCommit, HubObjectQueryResponse, HubCommitQueryResponse } from '@decentralized-identity/hub-sdk-js';
import { IHubObjectQueryOptions, IObjectMetadata, IHubCommitQueryOptions } from '@decentralized-identity/hub-common-js';
import RsaPrivateKey from '@decentralized-identity/did-auth-jose/dist/lib/crypto/rsa/RsaPrivateKey';
import { HttpResolver } from '@decentralized-identity/did-common-typescript';
import { ITodoItem } from './TodoModel';
const lodashGet = require('lodash/get');

/**
 * Options for connecting to a Hub.
 */
export interface IHubConnectionOptions {

  /** The DID of the Hub client (user). */
  clientDid: string;

  /** The private key of the Hub client in JWK string format. */
  clientPrivateJwk: string;

  /** The DID of the Hub to connect to, or empty to auto-discover. */
  hubDid: string;

  /** The Hub endpoint to connect to, or empty to auto-discover. */
  hubEndpoint: string;

  /** The DID resolver endpoint to use. */
  didResolver: string;

}

/**
 * This class handles interacting with an Identity Hub using the Identity Hub SDK.
 */
export default class HubStore {

  private hubSession?: HubSession;
  private privateKey: RsaPrivateKey;
  private signer: RsaCommitSigner;
  private resolver: HttpResolver;

  constructor (private options: IHubConnectionOptions) {

    const clientJwk = JSON.parse(options.clientPrivateJwk);

    if (!clientJwk.kid) throw new Error('Your JWK must include a KID field.');

    if (clientJwk.kid && clientJwk.kid.indexOf('#') === -1) {
      clientJwk.kid = [options.clientDid, clientJwk.kid].join('#');
    }

    this.privateKey = RsaPrivateKey.wrapJwk(clientJwk.kid, clientJwk);
    this.resolver = new HttpResolver(options.didResolver);

    this.signer = new RsaCommitSigner({
      did: options.clientDid,
      key: this.privateKey
    });
  }

  /**
   * Attempts to connect to the Hub.
   */
  public async connect () {

    console.log(`Resolving DID document for ${this.options.clientDid}`);

    const clientDidDocument = (await this.resolver.resolve(this.options.clientDid)).didDocument;
    console.log(`Found DID document for ${this.options.clientDid}`, clientDidDocument);

    if (!this.options.hubEndpoint || this.options.hubEndpoint.trim().length === 0) {

      let clientDidHubServices = clientDidDocument.getServicesByType('IdentityHub');
      if (!clientDidHubServices || clientDidHubServices.length === 0) {
        throw new Error(`Your DID document doesn't list an IdentityHub service - please manually specify a Hub endpoint.`);
      }

      let hubDid: string = lodashGet(clientDidHubServices, '[0].serviceEndpoint.instances[0]');
      if (!hubDid) throw new Error(`The IdentityHub entry in your DID document doesn't list a Hub DID.`);
      console.log(`Found IdentityHub DID: ${hubDid}`);

      const hubDidDocument = (await this.resolver.resolve(hubDid)).didDocument;
      console.log(`Got DID document for ${hubDid}`, hubDidDocument);

      const hubServiceEntries = hubDidDocument.getServicesByType('IdentityHub');
      let hubEndpoint = lodashGet(hubServiceEntries, '[0].serviceEndpoint.locations[0]');
      if (!hubEndpoint) throw new Error(`Hub's DID document does not list an endpoint.`);

      if (!hubEndpoint.includes('api')) hubEndpoint += (hubEndpoint.endsWith('/') ? '' : '/') + 'api/v1.0';

      console.log(`Found Hub service endpoint: ${hubEndpoint}`);

      this.options.hubDid = hubDid;
      this.options.hubEndpoint = hubEndpoint;
    } else {
      console.log(`Using user-specified Hub service endpoint: ${this.options.hubEndpoint}`);
    }

    this.hubSession = new HubSession({
      hubEndpoint: this.options.hubEndpoint,
      hubDid: this.options.hubDid,
      resolver: this.resolver,
      clientDid: this.options.clientDid,
      clientPrivateKey: this.privateKey,
      targetDid: this.options.clientDid
    });

    // Test Hub connection
    await this.hubSession.send(new HubObjectQueryRequest({
      interface: 'Collections',
      context: 'identity.foundation/schemas',
      type: 'ToDoItem'
    }));

    console.log('Successfully sent test read request to Hub.');
  }

  /**
   * Retrieves existing to-dos from the Hub.
   */
  public async fetchTodos (): Promise<Array<ITodoItem>> {
    const objectIds = await this.fetchAllObjectIds();

    if (objectIds.length === 0) {
      console.log('No objects found.');
      return [];
    }

    const relevantCommits = await this.fetchAllCommitsRelatedToObjects(objectIds);

    // Group commits by object_id
    const commitsByObject = this.groupCommitsByObjectId(relevantCommits);

    const strategy = new CommitStrategyBasic();
    const resolvedTodos: Array<ITodoItem> = [];
    const commitsByObjectEntries = Object.entries(commitsByObject);

    // Iterate through each object and transform the commits into a final resolved state
    for (let i = 0; i < commitsByObjectEntries.length; i++) {
      let [objectId, commits] = commitsByObjectEntries[i];
      const resolvedObject = await strategy.resolveObject(commits);

      if (resolvedObject !== null) {
        resolvedTodos.push({
          object_id: objectId,
          text: resolvedObject.text,
          done: resolvedObject.done
        });
      }
    }

    console.log('Resolved current todos', resolvedTodos);

    return resolvedTodos;
  }

  /**
   * Retrieves metadata from the Hub for all ToDoItem objects.
   */
  private async fetchAllObjectIds () {
    const queryOptions: IHubObjectQueryOptions = {
      interface: 'Collections',
      context: 'identity.foundation/schemas',
      type: 'ToDoItem'
    };

    const objects: IObjectMetadata[] = [];
    let response: HubObjectQueryResponse | undefined = undefined;

    do {
      let skipTokenField: any = response && response.hasSkipToken()
        ? { skip_token: response.getSkipToken() }
        : {};
      const request = new HubObjectQueryRequest(Object.assign(queryOptions, skipTokenField));
      response = await this.hubSession!.send(request);
      objects.push(...response.getObjects());
      console.log(response);
      console.log(`Fetched ${response.getObjects().length} objects.`);
    } while (response.hasSkipToken());

    const objectIds = objects.map(o => o.id);
    console.log('Discovered object IDs', objectIds.map(id => id.substr(0, 8)));

    return objectIds;
  }

  /**
   * Retrieves all commits for each of the given object IDs.
   */
  private async fetchAllCommitsRelatedToObjects (objectIds: string[]) {
    const queryOptions: IHubCommitQueryOptions = {
      object_id: objectIds
    };

    const commits: SignedCommit[] = [];
    let response: HubCommitQueryResponse | undefined = undefined;

    do {
      let skipTokenField: any = response && response.hasSkipToken()
        ? { skip_token: response.getSkipToken() }
        : {};
      const request = new HubCommitQueryRequest(Object.assign(queryOptions, skipTokenField));
      response = await this.hubSession!.send(request);
      commits.push(...response.getCommits());
      console.log(response);
      console.log(`Fetched ${response.getCommits().length} commits.`);
    } while (response.hasSkipToken());

    console.log('Retrieved commits', commits);

    return commits;
  }

  /**
   * Given a flat list of commits, groups them based on the object ID.
   *
   * @param commits The commits to group.
   */
  private groupCommitsByObjectId (commits: SignedCommit[]) {
    let objects: { [id: string]: SignedCommit[] } = {};
    commits.forEach((commit) => {
      let commitObjectId = commit.getObjectId();
      let object = objects[commitObjectId];
      if (object) {
        object.push(commit);
      } else {
        objects[commitObjectId] = [commit];
      }
    });
    return objects;
  }

  /**
   * Commits a new to-do to the Hub.
   *
   * @param text The to-do text.
   */
  public async createTodo (text: string): Promise<string> {
    let response = await this.writeCommit(new Commit({
      protected: this.getStandardHeaders('create'),
      payload: {
        text,
        done: false
      }
    }));

    return response.getRevisions()[0];
  }

  /**
   * Commits an update to a to-do.
   *
   * @param object_id The object_id of the to-do.
   * @param text The current text.
   * @param done The current done state.
   */
  public async updateTodo (object_id: string, text: string, done: boolean) {
    return this.writeCommit(new Commit({
      protected: this.getStandardHeaders('update', object_id),
      payload: {
        text,
        done
      }
    }));
  }

  /**
   * Commits a deletion of a to-do.
   *
   * @param object_id The object_id of the to-do to delete.
   */
  public async deleteTodo (object_id: string) {
    return this.writeCommit(new Commit({
      protected: this.getStandardHeaders('delete', object_id),
      payload: {}
    }));
  }

  /**
   * Helper method to write a Commit to the Hub.
   */
  private async writeCommit (commit: Commit) {
    const signedCommit = await this.signer.sign(commit);

    const commitRequest = new HubWriteRequest(signedCommit);
    const commitResponse = await this.hubSession!.send(commitRequest);

    console.log(commitResponse);
    return commitResponse;
  }

  /**
   * Helper method to build the headers for a commit.
   */
  private getStandardHeaders (operation: 'create' | 'update' | 'delete', object_id?: string) {
    return Object.assign({
      committed_at: (new Date()).toISOString(),
      iss: this.options.clientDid,
      sub: this.options.clientDid,
      interface: 'Collections',
      context: 'identity.foundation/schemas',
      type: 'ToDoItem',
      operation,
      commit_strategy: 'basic'
    }, object_id ? { object_id } : {});
  }

}
