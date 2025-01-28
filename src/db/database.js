import Dexie from 'dexie';

export class TodoDatabase extends Dexie {
  constructor() {
    super('TodoDatabase');
    
    // Define las tablas
    this.version(1).stores({
      tasks: '++id, text, priority, completed, createdAt, category', // id es autoincremental
      categories: '++id, name'
    });

    // Bind las tablas a propiedades
    this.tasks = this.table('tasks');
    this.categories = this.table('categories');
  }
}

// Crear y exportar una instancia de la base de datos
export const db = new TodoDatabase(); 