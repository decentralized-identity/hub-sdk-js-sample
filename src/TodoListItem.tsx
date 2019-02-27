import { h, Component } from 'preact';
import { ITodoItem } from './TodoModel';
import classNames from 'classnames';

interface ITodoListItemProps {

  /** The to-do this list item represents. */
  item: ITodoItem;

  /** A callback to invoke when the done state of this to-do is toggled. */
  onToggle: (item: ITodoItem) => void;

  /** A callback to invoke when this to-do is deleted. */
  onDelete: (item: ITodoItem) => void;

}

/**
 * Component to display a `<li>` containing a single to-do item.
 */
export default class TodoListItem extends Component<ITodoListItemProps, {}> {

  /**
   * Renders a to-do list item.
   */
  render ({ item, onToggle, onDelete }: ITodoListItemProps) {
    const randomId = Math.random().toString(36).substr(2);
    const itemClass = classNames({
      'list-group-item': true,
      'done': item.done,
      'disabled': item.updating
    });

    return (
      <li class={itemClass} style='padding: .75rem;'>
        <div class='custom-control custom-checkbox'>
          <input type='checkbox' class='custom-control-input' checked={ item.done } id={ randomId } onChange={ () => onToggle(item) } />
          <label class='custom-control-label' for={ randomId }>{ item.text }</label>
          <button type='button' class='close' aria-label='Close' onClick={ () => onDelete(item) }>
            <span aria-hidden='true'>×</span>
          </button>
        </div>
      </li>
    );
  }

}
