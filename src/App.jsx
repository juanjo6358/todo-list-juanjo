import React, { useState, useEffect, useRef } from 'react';
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
  Search,
  Plus,
  X,
  FolderPlus
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
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./components/ui/tooltip";
import { Keyboard } from '@capacitor/keyboard';

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

  // Add this new state
  const [showSearch, setShowSearch] = useState(false);

  // Add this new state
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);

  // Add this new state
  const [showCategoriesDialog, setShowCategoriesDialog] = useState(false);

  // Primero añadimos un ref para el contenedor de scroll
  const categoriesScrollRef = useRef(null);

  // Primero añadimos un ref para el diálogo
  const sheetRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  // Actualizar los handlers de deslizamiento
  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
  };

  const handleTouchMove = (e) => {
    const currentTouch = e.touches[0].clientY;
    const delta = currentTouch - startY.current;
    
    // Solo prevenir el scroll si estamos deslizando hacia abajo
    if (delta > 0) {
      e.preventDefault();
      const sheet = sheetRef.current;
      if (sheet) {
        sheet.style.transform = `translateY(${delta}px)`;
        sheet.style.transition = 'none';
      }
    }
  };

  const handleTouchEnd = (e) => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const endY = e.changedTouches[0].clientY;
    const delta = endY - startY.current;
    
    sheet.style.transition = 'transform 0.3s ease-out';
    
    if (delta > 100) {
      // Si se ha deslizado lo suficiente, cerrar
      sheet.style.transform = 'translateY(100%)';
      setTimeout(() => setShowNewTaskDialog(false), 300);
    } else {
      // Si no, volver a la posición original
      sheet.style.transform = 'translateY(0)';
    }
  };

  // LOAD tasks, categories & theme from localStorage on first render
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar categorías primero
        const storedCategories = await db.categories.toArray();
        if (storedCategories.length === 0) {
          // Si no hay categorías, añadir algunas por defecto
          const defaultCategories = ['Personal', 'Trabajo', 'Compras'];
          await Promise.all(
            defaultCategories.map(cat => db.categories.add({ name: cat }))
          );
          setCategories(defaultCategories);
        } else {
          setCategories(storedCategories.map(cat => cat.name));
        }

        // Luego cargar tareas
        const storedTasks = await db.tasks.toArray();
        setTasks(storedTasks);
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

  // Añadir este useEffect al inicio del componente
  useEffect(() => {
    const initKeyboard = async () => {
      await Keyboard.setResizeMode({ mode: 'none' });
      await Keyboard.setScroll({ isDisabled: true });
    };
    
    initKeyboard();
  }, []);

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

  // Delete category
  const handleDeleteCategory = async (category) => {
    try {
      await db.categories.delete(category);
      setCategories(prev => prev.filter(c => c !== category));
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
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

  // En el componente App, añadir esta función
  const handleCategoryScroll = (e) => {
    const container = e.currentTarget;
    const isTouch = e.type.startsWith('touch');
    
    // Prevenir el scroll vertical en móvil
    if (isTouch && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      return;
    }

    // Calcular la nueva posición
    const scrollLeft = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;
    
    // Aplicar el scroll con animación suave
    container.style.scrollBehavior = 'smooth';
    container.scrollLeft = Math.max(0, Math.min(maxScroll, scrollLeft + e.deltaX));
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <TooltipProvider>
      <div className={clsx(
        'app-container',
        'flex flex-col items-center w-full max-w-[100vw]',
        'transition-colors duration-300',
        darkMode ? 'text-gray-100 bg-gray-900' : 'text-gray-900 bg-gray-100'
      )}>
        <header className={clsx(
          'sticky top-0 z-40 w-full',
          'flex justify-between items-center',
          darkMode ? 'bg-gray-800/90' : 'bg-white/90',
          'backdrop-blur-sm',
          'pt-[calc(env(safe-area-inset-top)+1rem)]', // Aumentamos el padding superior
          'pb-3 px-4'
        )}>
          <div className="header-inner">
            <div className="flex-1" /> {/* Espaciador izquierdo */}
            <div className="flex gap-4 items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="p-2 w-10 h-10 rounded-full"
                    onClick={() => setShowCategoriesDialog(true)}
                  >
                    <FolderPlus className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Gestionar Categorías
                </TooltipContent>
              </Tooltip>
              <Button
                variant="ghost"
                className="p-2 w-10 h-10 rounded-full"
                onClick={() => setShowSearch(true)}
              >
                <Search className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                className="p-2 w-10 h-10 rounded-full"
                onClick={toggleDarkMode}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </header>

        {/* Search Overlay (appears when showSearch is true) */}
        {showSearch && (
          <div className="fixed inset-0 z-50 bg-black/50">
            <div className={clsx(
              'fixed top-0 right-0 left-0',
              'pt-[calc(env(safe-area-inset-top)+1rem)]', // Añadimos padding-top para el notch
              'px-4 pb-4',
              'bg-white dark:bg-gray-800'
            )}>
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Buscar tarea..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <Button variant="ghost" onClick={() => setShowSearch(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Filter and Sort Options */}
        <div className="relative z-[100] flex justify-between items-center gap-2 w-full max-w-3xl px-4 mb-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="min-w-[120px] bg-white/90 backdrop-blur-sm rounded-full">
              <Filter className="mr-2 w-4 h-4" />
              <span className="truncate">
                {filterStatus === 'all' ? 'Todas' :
                 filterStatus === 'completed' ? 'Completadas' : 'Pendientes'}
              </span>
            </SelectTrigger>
            <SelectContent className="z-[9999]">
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="completed">Completadas</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="min-w-[120px] bg-white/90 backdrop-blur-sm rounded-full">
              {sortOption.includes('Asc') ? 
                <SortAsc className="mr-2 w-4 h-4" /> : 
                <SortDesc className="mr-2 w-4 h-4" />
              }
              <span className="truncate">
                {sortOption === 'none' ? 'Sin orden' :
                 sortOption.includes('priority') ? 'Prioridad' : 'Alfabético'}
              </span>
            </SelectTrigger>
            <SelectContent className="z-[9999]">
              <SelectItem value="none">Sin Orden</SelectItem>
              <SelectItem value="priorityAsc">Prioridad Asc</SelectItem>
              <SelectItem value="priorityDesc">Prioridad Desc</SelectItem>
              <SelectItem value="alphabeticalAsc">Alfabético Asc</SelectItem>
              <SelectItem value="alphabeticalDesc">Alfabético Desc</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Categories List */}
        <div className="categories-wrapper">
          <div
            ref={categoriesScrollRef}
            className="categories-scroll"
            onScroll={handleCategoryScroll}
          >
            <Button
              variant={categoryFilter === 'all' ? 'default' : 'outline'}
              className="category-button"
              onClick={() => setCategoryFilter('all')}
            >
              Todas
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={categoryFilter === category ? 'default' : 'outline'}
                className="category-button"
                onClick={() => setCategoryFilter(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Categories Dialog */}
        <Dialog open={showCategoriesDialog} onOpenChange={setShowCategoriesDialog}>
          <DialogContent className={clsx(
            'p-6 mx-auto max-w-md rounded-2xl w-[95vw]',
            'z-[9999]'
          )}>
            <h2 className="mb-4 text-xl font-bold">Gestionar Categorías</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nueva categoría..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddCategory}>
                  Añadir
                </Button>
              </div>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded-lg"
                  >
                    {category}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteCategory(category)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Progress Bar */}
        <div className={clsx(
          'sticky top-[120px] z-20 w-full max-w-3xl px-4',
          'transition-opacity duration-200',
          tasks.length === 0 && 'opacity-0'
        )}>
          <div className={clsx(
            'flex flex-col p-3 rounded-2xl shadow-sm',
            darkMode ? 'bg-gray-800/90' : 'bg-white/90',
            'backdrop-blur-sm'
          )}>
            <div className="mb-2 text-sm font-medium">
              {completedTasks} / {totalTasks} tareas {categoryFilter !== 'all' ? `de ${categoryFilter}` : ''} completadas
            </div>
            <div className="overflow-hidden h-2 bg-gray-200 rounded-full">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-2 w-full max-w-3xl">
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
                    'border-l-4 transition-all duration-200',
                    'active:scale-[0.99]',
                    task.priority === 'high' ? 'border-red-500' :
                    task.priority === 'medium' ? 'border-yellow-500' : 'border-green-500',
                    task.completed 
                      ? 'bg-gray-100/80 dark:bg-gray-800/50'
                      : darkMode ? 'bg-gray-800' : 'bg-white'
                  )}
                >
                  <CardContent className="p-2.5">
                    <div className="flex gap-2 items-center">
                      <Button 
                        variant="ghost" 
                        onClick={() => toggleComplete(task.id)}
                        className="p-1 h-auto rounded-full transition-transform active:scale-90"
                      >
                        <CheckCircle
                          className={clsx(
                            'h-5 w-5',
                            task.completed ? 'text-green-500' : 'text-gray-400'
                          )}
                        />
                      </Button>
                      <div className="flex-1 min-w-0">
                        <p className={clsx(
                          'text-sm font-medium truncate',
                          task.completed && 'line-through text-gray-400 dark:text-gray-500',
                          !task.completed && darkMode && 'text-white'
                        )}>
                          {task.text}
                        </p>
                        <div className="flex gap-2 items-center text-xs">
                          <span className={clsx(
                            'font-medium',
                            task.priority === 'high' && 'text-red-500',
                            task.priority === 'medium' && 'text-yellow-500',
                            task.priority === 'low' && 'text-green-500',
                            task.completed && 'opacity-60'
                          )}>
                            {task.priority === 'high' ? 'Alta' :
                             task.priority === 'medium' ? 'Media' : 'Baja'}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className={clsx(
                            'text-gray-500 truncate',
                            task.completed && 'opacity-60'
                          )}>
                            {task.category || 'Sin categoría'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          onClick={() => openEditDialog(task.id)}
                          className="p-1 h-auto rounded-full"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={() => deleteTask(task.id)}
                          className="p-1 h-auto text-red-500 rounded-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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

        {/* Floating Action Button for New Task */}
        <Button
          className={clsx(
            'fixed right-4 bottom-4 w-14 h-14 rounded-full',
            'flex justify-center items-center',
            'text-white bg-gray-900 shadow-lg',
            'hover:bg-gray-800 dark:bg-gray-700',
            'z-50'
          )}
          onClick={() => setShowNewTaskDialog(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>

        {/* New Task Dialog */}
        <Dialog 
          open={showNewTaskDialog} 
          onOpenChange={(open) => {
            setShowNewTaskDialog(open);
            document.body.classList.toggle('dialog-open', open);
          }}
        >
          <DialogContent 
            ref={sheetRef}
            className={clsx(
              'dialog-content',
              'mx-auto w-full sm:w-[95vw] sm:max-w-md',
              'p-4 sm:p-6',
              'overflow-y-auto'
            )}
          >
            <div 
              className="touch-handle"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
            
            <h2 className="mb-6 text-xl font-bold">Nueva Tarea</h2>
            <div className="flex flex-col gap-6">
              <Input
                placeholder="¿Qué necesitas hacer?"
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
                className="py-3 text-base"
              />
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Prioridad
                  </label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="w-full h-12 rounded-xl backdrop-blur-sm bg-white/90">
                      <div className="flex gap-2 items-center">
                        <div className={clsx(
                          'w-3 h-3 rounded-full',
                          priority === 'high' ? 'bg-red-500' :
                          priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        )} />
                        <span className="text-base">
                          {priority === 'high' ? 'Alta' :
                           priority === 'medium' ? 'Media' : 'Baja'}
                        </span>
                      </div>
                    </SelectTrigger>
                    <SelectContent 
                      position="popper" 
                      className="w-full min-w-[200px]"
                      sideOffset={5}
                    >
                      <SelectItem value="high" className="py-3 text-base">
                        <div className="flex gap-2 items-center">
                          <div className="w-3 h-3 bg-red-500 rounded-full" />
                          Alta
                        </div>
                      </SelectItem>
                      <SelectItem value="medium" className="py-3 text-base">
                        <div className="flex gap-2 items-center">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                          Media
                        </div>
                      </SelectItem>
                      <SelectItem value="low" className="py-3 text-base">
                        <div className="flex gap-2 items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full" />
                          Baja
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Categoría
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full h-12 rounded-xl backdrop-blur-sm bg-white/90">
                      <span className="text-base truncate">
                        {selectedCategory || 'Sin categoría'}
                      </span>
                    </SelectTrigger>
                    <SelectContent 
                      position="popper" 
                      className="w-full min-w-[200px]"
                      sideOffset={5}
                    >
                      <SelectItem value="" className="py-3 text-base">
                        Sin categoría
                      </SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="py-3 text-base">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewTaskDialog(false)}
                  className="flex-1 h-12 text-base"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    addTask();
                    setShowNewTaskDialog(false);
                  }}
                  className="flex-1 h-12 text-base text-white bg-gray-900"
                >
                  Añadir
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

export default App;
