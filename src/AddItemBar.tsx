import { h, Component } from 'preact';
const linkState: any = require('linkstate');

interface IAddItemBarProps {

  /** A callback invoked when an item is added. */
  onItemAdded: (itemText: string) => void;

}

interface IAddItemBarState {

  /** The current text in the textbox. */
  itemText: string;

}

/**
 * Component containing the "add new item" textbox and button.
 */
export default class AddItemBar extends Component<IAddItemBarProps, IAddItemBarState> {

  constructor () {
    super();
  }

  /**
   * Callback invoked when the form is submitted.
   */
  onFormSubmit = (e: Event) => {
    e.preventDefault();
    if (!this.state.itemText || this.state.itemText.trim().length === 0) return;
    this.props.onItemAdded(this.state.itemText);
    this.setState({
      itemText: ''
    });
  }

  /**
   * Renders the add item bar.
   */
  render () {
    return (
      <form class='form-inline form-add-item' onSubmit={ this.onFormSubmit }>
        <label class='sr-only' for='addItemInput'>Name</label>
        <input type='text' value={ this.state.itemText } onKeyUp={ linkState(this, 'itemText') }
          class='form-control' id='addItemInput' placeholder='Add a to-do item...' />
        <button class='btn btn-primary' type='submit'>Add</button>
      </form>
    );
  }

}
