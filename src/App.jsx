import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import {
  SelectTrigger,
  SelectContent,
  SelectItem,
} from './components/ui/select';
import { HoverSelect as Select } from './components/ui/hover-select';
import {
  CheckCircle,
  Edit3,
  Filter,
  SortAsc,
  SortDesc,
  Moon,
  Sun,
  Trash2,
} from 'lucide-react';
import { Dialog, DialogContent } from './components/ui/dialog';
import clsx from 'clsx';
import { db } from './db/database';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./components/ui/alert-dialog";

function App() {
  // MAIN STATES
  const [tasks, setTasks] = useState([]);
  const [taskText, setTaskText] = useState('');
  const [priority, setPriority] = useState('medium');
  const [editIndex, setEditIndex] = useState(null);
  const [editText, setEditText] = useState('');
  const [editPriority, setEditPriority] = useState('medium');

  // ENHANCEMENTS
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'completed', 'pending'
  const [sortOption, setSortOption] = useState('none'); // 'none', 'priorityAsc', 'priorityDesc', 'alphabeticalAsc', 'alphabeticalDesc'

  // CATEGORIES (persist them in 'categories' key in localStorage)
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' or a specific category

  // THEME SWITCH
  const [darkMode, setDarkMode] = useState(false);

  // Añade este estado
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  // LOAD tasks, categories & theme from localStorage on first render
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar tareas
        const storedTasks = await db.tasks.toArray();
        setTasks(storedTasks);

        // Cargar categorías
        const storedCategories = await db.categories.orderBy('name').toArray();
        setCategories(storedCategories.map(cat => cat.name));
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };

    loadData();
  }, []);

  // SAVE tasks, categories & theme whenever they change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // HANDLERS
  const addTask = async () => {
    if (taskText.trim() === '') return;
    
    try {
      const newTask = {
        text: taskText,
        priority,
        completed: false,
        createdAt: Date.now(),
        category: selectedCategory,
      };

      const id = await db.tasks.add(newTask);
      const updatedTasks = [...tasks, { ...newTask, id }];
      setTasks(updatedTasks);
      
      setTaskText('');
      setPriority('medium');
    } catch (error) {
      console.error('Error al añadir tarea:', error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await db.tasks.delete(id);
      const updatedTasks = tasks.filter(task => task.id !== id);
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
    }
  };

  const toggleComplete = async (id) => {
    try {
      const task = tasks.find(t => t.id === id);
      await db.tasks.update(id, { completed: !task.completed });
      const updatedTasks = tasks.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
      );
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
    }
  };

  const openEditDialog = (id) => {
    const task = tasks.find(t => t.id === id);
    setEditIndex(id);
    setEditText(task.text);
    setEditPriority(task.priority);
  };

  const saveEdit = async () => {
    try {
      await db.tasks.update(editIndex, { 
        text: editText,
        priority: editPriority
      });
      setTasks(prev =>
        prev.map(task => task.id === editIndex ? 
          { ...task, text: editText, priority: editPriority } : 
          task
        )
      );
      setEditIndex(null);
      setEditText('');
      setEditPriority('medium');
    } catch (error) {
      console.error('Error al editar tarea:', error);
    }
  };

  const clearAllTasks = async () => {
    setShowDeleteAllDialog(false);
    try {
      await db.tasks.clear();
      setTasks([]);
    } catch (error) {
      console.error('Error al borrar todas las tareas:', error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // Add new category
  const handleAddCategory = async () => {
    if (newCategory.trim() && !categories.includes(newCategory)) {
      try {
        await db.categories.add({ name: newCategory });
        setCategories(prev => [...prev, newCategory]);
        setNewCategory('');
      } catch (error) {
        console.error('Error al añadir categoría:', error);
      }
    }
  };

  // FILTER tasks
  const filteredTasks = tasks.filter((task) => {
    // Search filter
    const matchesSearch = task.text.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    let matchesFilter = true;
    if (filterStatus === 'completed') {
      matchesFilter = task.completed;
    } else if (filterStatus === 'pending') {
      matchesFilter = !task.completed;
    }

    // Category filter
    let matchesCategory = true;
    if (categoryFilter !== 'all') {
      matchesCategory = task.category === categoryFilter;
    }

    return matchesSearch && matchesFilter && matchesCategory;
  });

  // SORT tasks
  const sortByOption = (tasksArray) => {
    // Primero ordenamos por completado/no completado
    const sortedByCompletion = tasksArray.sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
    });

    // Luego aplicamos el ordenamiento seleccionado
    switch (sortOption) {
      case 'priorityAsc':
        return sortedByCompletion.sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          const priorityValue = { high: 3, medium: 2, low: 1 };
          return priorityValue[a.priority] - priorityValue[b.priority];
        });
      case 'priorityDesc':
        return sortedByCompletion.sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          const priorityValue = { high: 3, medium: 2, low: 1 };
          return priorityValue[b.priority] - priorityValue[a.priority];
        });
      case 'alphabeticalAsc':
        return sortedByCompletion.sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          return a.text.localeCompare(b.text);
        });
      case 'alphabeticalDesc':
        return sortedByCompletion.sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          return b.text.localeCompare(a.text);
        });
      default:
        return sortedByCompletion;
    }
  };

  const sortedTasks = sortByOption([...filteredTasks]);

  // Modificamos el cálculo de las estadísticas de progreso
  const getProgressStats = () => {
    let tasksToCount = tasks;
    
    // Si hay un filtro de categoría activo, solo contamos las tareas de esa categoría
    if (categoryFilter !== 'all') {
      tasksToCount = tasks.filter(task => task.category === categoryFilter);
    }

    const total = tasksToCount.length;
    const completed = tasksToCount.filter(task => task.completed).length;
    const percentage = total === 0 ? 0 : (completed / total) * 100;

    return {
      total,
      completed,
      percentage
    };
  };

  // En el JSX, reemplazamos las variables directas por la función
  const { total: totalTasks, completed: completedTasks, percentage: completionPercentage } = getProgressStats();

  return (
    <div
      className={clsx(
        'app-container',
        'flex flex-col items-center w-full transition-colors duration-300',
        'px-4 py-safe',
        darkMode ? 'text-gray-100 bg-gray-900' : 'text-gray-900 bg-gray-100'
      )}
    >
      {/* Header / Navbar */}
      <header
        className={clsx(
          'sticky top-0 z-40 w-full max-w-3xl',
          'flex flex-col gap-4 p-4 mb-4 rounded-b-2xl shadow-sm',
          darkMode ? 'bg-gray-800' : 'bg-white'
        )}
      >
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Tareas Juanjo Llopico</h1>
          <Button 
            variant="ghost" 
            onClick={toggleDarkMode}
            className="flex justify-center items-center w-10 h-10 rounded-full"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
        
        {/* Barra de búsqueda */}
        <div
          className={clsx(
            'flex items-center px-4 py-2 rounded-full border',
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
          )}
        >
          <span className="text-gray-500">Buscar</span>
          <Input
            placeholder="Buscar tarea..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={clsx(
              'border-0 bg-transparent focus-visible:ring-0',
              darkMode && 'text-white'
            )}
          />
        </div>
      </header>

      {/* Filter & Sort Controls */}
      <div className="sticky top-[72px] z-30 w-full max-w-3xl mb-4 space-y-4 bg-inherit pt-2">
        <div className="flex flex-wrap gap-2">
          {/* Filter by status */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="flex-1 min-w-[120px] bg-white rounded-full border-gray-200">
              <div className="flex gap-2 items-center">
                <Filter className="w-4 h-4" />
                <span className="truncate">
                  {filterStatus === 'all'
                    ? 'Todas'
                    : filterStatus === 'completed'
                    ? 'Completadas'
                    : 'Pendientes'}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="completed">Completadas</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort tasks */}
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="flex-1 min-w-[120px] bg-white rounded-full border-gray-200">
              <div className="flex gap-2 items-center">
                {sortOption === 'priorityAsc' || sortOption === 'alphabeticalAsc' ? (
                  <SortAsc className="w-4 h-4" />
                ) : sortOption === 'priorityDesc' || sortOption === 'alphabeticalDesc' ? (
                  <SortDesc className="w-4 h-4" />
                ) : (
                  <SortAsc className="w-4 h-4 text-gray-400" />
                )}
                <span>
                  {sortOption === 'none'
                    ? 'Sin Orden'
                    : sortOption === 'priorityAsc'
                    ? 'Prioridad Asc'
                    : sortOption === 'priorityDesc'
                    ? 'Prioridad Desc'
                    : sortOption === 'alphabeticalAsc'
                    ? 'Alfabético Asc'
                    : 'Alfabético Desc'}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin Orden</SelectItem>
              <SelectItem value="priorityAsc">Prioridad Asc</SelectItem>
              <SelectItem value="priorityDesc">Prioridad Desc</SelectItem>
              <SelectItem value="alphabeticalAsc">Alfabético Asc</SelectItem>
              <SelectItem value="alphabeticalDesc">Alfabético Desc</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs for Categories */}
      <div className={clsx(
        'p-4 mb-2 w-full max-w-3xl rounded-2xl shadow-sm',
        darkMode ? 'bg-gray-800' : 'bg-white'
      )}>
        <div className="flex overflow-x-auto gap-2 pb-2 ios-segmented-control">
          <div className="flex p-1 w-full bg-gray-100 rounded-full">
            <button
              className={clsx(
                'flex-1 py-2 px-4 text-sm font-medium rounded-full transition-all duration-200',
                categoryFilter === 'all' 
                  ? 'bg-white shadow-sm text-gray-900' 
                  : 'text-gray-500 hover:text-gray-900'
              )}
              onClick={() => setCategoryFilter('all')}
            >
              Todas
            </button>
            {categories.map((category, index) => (
              <button
                key={index}
                className={clsx(
                  'flex-1 py-3 px-4 text-sm font-medium rounded-full',
                  'transition-all duration-200 active:scale-95',
                  categoryFilter === category 
                    ? 'bg-white shadow-sm text-gray-900' 
                    : 'text-gray-500 hover:text-gray-900'
                )}
                onClick={() => setCategoryFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add / Manage Categories */}
      <div
        className={clsx(
          'p-4 mb-4 w-full max-w-3xl rounded-2xl shadow-sm',
          darkMode ? 'bg-gray-800' : 'bg-white'
        )}
      >
        <h2 className="mb-2 text-lg font-semibold">Gestionar Categorías</h2>
        <div className="flex gap-2">
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddCategory();
              }
            }}
            placeholder="Nueva categoría"
            className={clsx(darkMode && 'bg-gray-700 text-white', 'flex-1')}
          />
          <Button onClick={handleAddCategory}>Añadir Categoría</Button>
        </div>
      </div>

      {/* Add New Task */}
      <div
        className={clsx(
          'flex flex-col gap-3 p-4 mb-4 w-full max-w-3xl rounded-2xl',
          'sm:flex-row sm:gap-2',
          darkMode ? 'bg-gray-800' : 'bg-white'
        )}
      >
        <Input
          placeholder="Añadir nueva tarea"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addTask();
            }
          }}
          className={clsx(
            'flex-1 rounded-full',
            darkMode ? 'text-white bg-gray-700' : 'bg-gray-50'
          )}
        />
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-32 bg-white rounded-full border-gray-200">
            <span>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-36 bg-white rounded-full border-gray-200">
            <span>{selectedCategory || 'Sin categoría'}</span>
          </SelectTrigger>
          <SelectContent>
            {categories.length === 0 && (
              <div className="p-2 text-gray-500">No hay categorías creadas</div>
            )}
            {categories.map((cat, i) => (
              <SelectItem key={i} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          onClick={addTask} 
          className="text-white bg-gray-900 rounded-full hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          Añadir
        </Button>
      </div>

      {/* Progress Bar */}
      <div
        className={clsx(
          'flex flex-col gap-4 items-center p-4 mb-4 w-full max-w-3xl rounded-2xl shadow-sm sm:flex-row',
          darkMode ? 'bg-gray-800' : 'bg-white'
        )}
      >
        <div className="flex-1">
          <div className="mb-1 font-semibold">
            {completedTasks} / {totalTasks} tareas {categoryFilter !== 'all' ? `de ${categoryFilter}` : ''} completadas
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full">
            <div
              className="h-3 bg-green-500 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3 w-full max-w-3xl">
        <AnimatePresence>
          {sortedTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className={clsx(
                  'border-l-4 mb-2 transition-all duration-200 active:scale-[0.995]',
                  task.priority === 'high'
                    ? 'border-red-500'
                    : task.priority === 'medium'
                    ? 'border-yellow-500'
                    : 'border-green-500',
                  task.completed ? 'bg-gray-200' : darkMode ? 'bg-gray-800' : 'bg-white'
                )}
              >
                <CardContent className="flex gap-2 justify-between items-center">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button 
                      variant="ghost" 
                      onClick={() => toggleComplete(task.id)}
                      className="p-2 h-auto active:scale-95 transition-transform"
                    >
                      <CheckCircle
                        className={clsx(
                          'h-7 w-7',
                          task.completed ? 'text-green-500' : 'text-gray-400'
                        )}
                      />
                    </Button>
                    <div className="flex flex-col">
                      <span
                        className={clsx(
                          task.completed && 'line-through text-gray-500',
                          !task.completed && 'text-gray-800',
                          darkMode && !task.completed && 'text-white'
                        )}
                      >
                        {task.text}
                      </span>
                      {/* Priority Color Text */}
                      <span
                        className={clsx(
                          'text-sm font-semibold',
                          task.priority === 'high' && 'text-red-500',
                          task.priority === 'medium' && 'text-yellow-500',
                          task.priority === 'low' && 'text-green-500'
                        )}
                      >
                        Prioridad:{' '}
                        {task.priority === 'high'
                          ? 'Alta'
                          : task.priority === 'medium'
                          ? 'Media'
                          : 'Baja'}
                      </span>
                      {/* Category display */}
                      <span className="text-sm text-gray-500">
                        Categoría: {task.category || 'Sin categoría'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Button 
                      variant="ghost" 
                      onClick={() => openEditDialog(task.id)}
                      className="p-3 h-auto"
                    >
                      <Edit3 className="w-6 h-6" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => deleteTask(task.id)}
                      className="p-3 h-auto"
                    >
                      <Trash2 className="w-6 h-6" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Edit Dialog */}
      {editIndex !== null && (
        <Dialog open={true} onOpenChange={() => setEditIndex(null)}>
          <DialogContent className="w-[95vw] max-w-md mx-auto p-6 rounded-2xl">
            <h2 className="mb-4 text-xl font-bold">Editar Tarea</h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Texto de la tarea</label>
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Prioridad</label>
                <Select 
                  value={editPriority} 
                  onValueChange={setEditPriority}
                  className="relative z-50"
                >
                  <SelectTrigger className="w-full bg-white rounded-md border-gray-200">
                    <span>
                      {editPriority === 'high' ? 'Alta' :
                       editPriority === 'medium' ? 'Media' : 'Baja'}
                    </span>
                  </SelectTrigger>
                  <SelectContent 
                    className="z-50"
                  >
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <Button variant="outline" onClick={() => setEditIndex(null)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={saveEdit}
                  className="text-white bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Guardar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Alert Dialog */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent className="w-[95vw] max-w-md mx-auto p-6 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará todas las tareas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={clearAllTasks}
              className="text-white bg-red-400 hover:bg-red-500"
            >
              Eliminar Todo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default App;
