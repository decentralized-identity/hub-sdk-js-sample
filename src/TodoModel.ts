import HubStore from './HubStore';

/**
 * Interface representing a single to-do item.
 */
export interface ITodoItem {

  /** The text of the to-do item. */
  text: string;

  /** Whether the to-do is completed. */
  done: boolean;

  /** The text of the to-do item. */
  object_id: string;

  /** Whether the to-do is being updated. */
  updating?: boolean;

}

/**
 * Handles integration between the UI and the `HubStore`.
 */
export default class TodoModel {

  private todos: Array<ITodoItem> = [];

  constructor (private store: HubStore) {
    // tslint:disable-next-line:no-floating-promises
    this.fetchFromStore();
  }

  /**
   * Retrieves all pre-existing to-dos from the Hub.
   */
  private async fetchFromStore () {
    const todos = await this.store.fetchTodos();
    this.todos = todos;
    this.inform();
  }

  /**
   * Adds a new to-do.
   */
  public addTodo = async (text: string) => {
    const todo = {
      text,
      done: false,
      object_id: '',
      updating: true
    };

    this.todos.push(todo);
    this.inform();

    const objectId = await this.store.createTodo(text);
    todo.object_id = objectId;

    todo.updating = false;
    this.inform();
  }

  /**
   * Toggles the done state of a to-do.
   */
  public toggleTodo = async (todo: ITodoItem) => {
    todo.updating = true;
    todo.done = !todo.done;
    this.inform();

    await this.store.updateTodo(todo.object_id, todo.text, todo.done);

    todo.updating = false;
    this.inform();
  }

  /**
   * Deletes a to-do.
   */
  public deleteTodo = async (todo: ITodoItem) => {
    todo.updating = true;
    this.inform();

    await this.store.deleteTodo(todo.object_id);

    todo.updating = false;
    this.todos = this.todos.filter(t => t.object_id !== todo.object_id);
    this.inform();
  }

  /** Array of change listeners. */
  private listners: Array<(todos: Array<ITodoItem>) => void> = [];

  /**
   * Adds a new change listener.
   */
  public listen (listener: (todos: Array<ITodoItem>) => void) {
    this.listners.push(listener);
  }

  /**
   * Informs all change listeners of a chnge.
   */
  private inform () {
    this.listners.forEach(listener => listener(this.todos));
  }

}
