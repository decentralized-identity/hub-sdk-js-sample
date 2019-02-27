import { h, Component } from 'preact';
import AddItemBar from './AddItemBar';
import TodoModel, { ITodoItem } from './TodoModel';
import TodoListItem from './TodoListItem';

interface IMainScreenProps {

  /** A reference to the main TodoModel. */
  model: TodoModel;

  /** A callback invoked when a to-do is added. */
  onTodoAdded: (text: string) => void;

  /** A callback invoked when a to-do's done state is toggled. */
  onTodoToggled: (todo: ITodoItem) => void;

  /** A callback invoked when a to-do is deleted. */
  onTodoDeleted: (todo: ITodoItem) => void;

}

interface IMainScreenState {

  /** Whether the data is still loading. */
  loading: boolean;

  /** The current list of to-dos. */
  todos: ITodoItem[];

}

/**
 * Component for the to-do list screen.
 */
export default class MainScreen extends Component<IMainScreenProps, IMainScreenState> {

  /** The initial state of the main screen. */
  readonly state: IMainScreenState = {
    loading: true,
    todos: []
  };

  constructor (props: IMainScreenProps) {
    super(props);

    // Listen for model updates
    props.model.listen((todos) => this.setState({
      todos,
      loading: false
    }));
  }

  /**
   * Renders the main interface.
   */
  render ({ onTodoAdded, onTodoToggled, onTodoDeleted }: IMainScreenProps, { loading, todos }: IMainScreenState) {
    return (
      <div>
        <AddItemBar onItemAdded={ onTodoAdded } />
        <ul class='list-group'>
          { loading && <div class='text-center text-muted'><div class='spinner-border' role='status'><span class='sr-only'>Loading...</span></div></div> }
          { !loading && todos.length > 0 && todos.map(todo => <TodoListItem item={ todo } onToggle={ onTodoToggled } onDelete={ onTodoDeleted } />) }
          { !loading && todos.length === 0 && <li class='list-group-item text-muted text-center'>No items yet.</li> }
        </ul>
      </div>
    );
  }

}
