import { h, Component } from 'preact';
import { IHubConnectionOptions } from './HubStore';
const linkState: any = require('linkstate');

interface IStartScreenProps {

  /** A callback to be invoked when sign-in happens. */
  onSignIn: (state: IHubConnectionOptions) => void;

  /** The latest sign-in error, if any. */
  signInError?: string;

  /** Whether the form is currently submitting. */
  submitting?: boolean;

}

interface IStartScreenState {

  /** The current connection options. */
  hubOptions: IHubConnectionOptions;

  /** Whether advanced options should display. */
  showAdvanced: boolean;

}

/**
 * Component for the login form screen.
 */
export default class LoginScreen extends Component<IStartScreenProps, IStartScreenState> {

  /** The initial page state. */
  readonly state: IStartScreenState = {
    hubOptions: {
      clientDid: '',
      clientPrivateJwk: '',
      hubDid: '',
      hubEndpoint: '',
      didResolver: ''
    },
    showAdvanced: false
  };

  /**
   * Called when the login form is submitted.
   */
  onFormSubmitted = (e: Event) => {
    e.preventDefault();
    const hubOptions = this.state.hubOptions;

    // Ensure the fields were filled out
    if (this.isEmpty(hubOptions.clientDid) || this.isEmpty(hubOptions.clientPrivateJwk) || this.isEmpty(hubOptions.didResolver)) return;

    this.props.onSignIn && this.props.onSignIn(this.state.hubOptions);
  }

  private isEmpty (str: string) {
    return !str || str.trim().length === 0;
  }

  /**
   * Called when the "show advanced settings" link is toggled.
   */
  onAdvancedLinkClicked = (e: Event) => {
    e.preventDefault();
    this.setState({
      showAdvanced: !this.state.showAdvanced
    });
  }

  /**
   * Renders the login screen.
   */
  render ({ signInError, submitting }: IStartScreenProps, { hubOptions, showAdvanced }: IStartScreenState) {
    return (
      <div class='start-screen'>
        <h1 className='m-0'>Todo</h1>
        <div className='text-muted'>A decentralized to-do list.</div>
        { signInError && <div class='alert alert-danger' role='alert'>{ signInError }</div> }
        <form style='margin-top: 20px;' onSubmit={ this.onFormSubmitted }>
          <fieldset disabled={ submitting }>

            <div class='form-group'>
              <label>Your DID</label>
              <input type='text' class='form-control' value={ hubOptions.clientDid } onChange={ linkState(this, 'hubOptions.clientDid') }
                placeholder='did:example:me.id'/>
            </div>

            <div class='form-group'>
              <label>Your JWK private key <span class='text-muted'>(it's ok, trust us)</span></label>
              <textarea class='form-control' value={ hubOptions.clientPrivateJwk } onChange={ linkState(this, 'hubOptions.clientPrivateJwk') }
                rows={4} placeholder='{ &quot;kty&quot;:&quot;RSA&quot;, &quot;kid&quot;:&quot;key-1&quot;, ... }'></textarea>
            </div>

            <div class='form-group'>
              <label>DID Resolver Endpoint</label>
              <input type='text' class='form-control' value={ hubOptions.didResolver } onChange={ linkState(this, 'hubOptions.didResolver') }
                placeholder='https://example.com/'/>
            </div>

            { showAdvanced &&
              <div class='form-group'>
                <label>Hub DID</label>
                <input type='text' class='form-control' value={ hubOptions.hubDid } onChange={ linkState(this, 'hubOptions.hubDid') }
                  placeholder='(will be resolved automatically)'/>
              </div>
            }

            { showAdvanced &&
              <div class='form-group'>
                <label>Hub Service Endpoint</label>
                <input type='text' class='form-control' value={ hubOptions.hubEndpoint } onChange={ linkState(this, 'hubOptions.hubEndpoint') }
                  placeholder='(will be resolved automatically)'/>
              </div>
            }

            <div class='row justify-content-between align-items-center'>
              <div class='col-8'>
                <a href='#' onClick={ this.onAdvancedLinkClicked }>{ showAdvanced ? 'Hide advanced settings' : 'Show advanced settings' }</a>
              </div>
              <div class='col-4 text-right'>
                <button class='btn btn-primary' type='submit'>
                  { submitting && <span class='spinner-border spinner-border-sm' role='status' aria-hidden='true'></span> }
                  Log in
                </button>
              </div>
            </div>

          </fieldset>
        </form>
      </div>
    );
  }

}
