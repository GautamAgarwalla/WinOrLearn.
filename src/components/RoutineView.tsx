import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, Plus, Trash2, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RoutineTask, DailyTask, DayOfWeek } from '../types';
import localforage from 'localforage';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => {
  const hour = i + 6; // Start from 6 AM
  return `${hour.toString().padStart(2, '0')}:00`;
});

export function RoutineView() {
  const [routine, setRoutine] = useState<RoutineTask[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const currentDayIndex = currentTime.getDay();
  const currentDayName = DAYS[currentDayIndex === 0 ? 6 : currentDayIndex - 1];
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(currentDayName);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDays, setNewTaskDays] = useState<DayOfWeek[]>([]);
  const [newTaskTime, setNewTaskTime] = useState('');

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Load data
  useEffect(() => {
    Promise.all([
      localforage.getItem<RoutineTask[]>('study-routine'),
      localforage.getItem<DailyTask[]>('study-daily-tasks')
    ]).then(([savedRoutine, savedDaily]) => {
      if (savedRoutine) setRoutine(savedRoutine);
      if (savedDaily) setDailyTasks(savedDaily);
      setIsLoaded(true);
    });
  }, []);

  // Save data
  useEffect(() => {
    if (isLoaded) {
      localforage.setItem('study-routine', routine);
      localforage.setItem('study-daily-tasks', dailyTasks);
    }
  }, [routine, dailyTasks, isLoaded]);

  // Generate daily tasks for today if they don't exist
  useEffect(() => {
    if (!isLoaded) return;

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const dayIndex = today.getDay(); // 0 is Sunday
    const dayName = DAYS[dayIndex === 0 ? 6 : dayIndex - 1];

    const tasksForToday = routine.filter(rt => rt.days.includes(dayName));
    
    setDailyTasks(prev => {
      const existingToday = prev.filter(dt => dt.date === dateStr);
      const newDailyTasks = [...prev];
      let changed = false;

      tasksForToday.forEach(rt => {
        if (!existingToday.some(dt => dt.routineTaskId === rt.id)) {
          newDailyTasks.push({
            id: crypto.randomUUID(),
            routineTaskId: rt.id,
            title: rt.title,
            date: dateStr,
            isCompleted: false
          });
          changed = true;
        }
      });

      return changed ? newDailyTasks : prev;
    });
  }, [routine, isLoaded]);

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = dailyTasks.filter(dt => !dt.isCompleted && dt.date < todayStr);

  const handleAddTask = () => {
    if (!newTaskTitle || newTaskDays.length === 0) return;
    const newTask: RoutineTask = {
      id: crypto.randomUUID(),
      title: newTaskTitle,
      days: newTaskDays,
      time: newTaskTime || undefined
    };
    setRoutine(prev => [...prev, newTask]);
    setNewTaskTitle('');
    setNewTaskDays([]);
    setNewTaskTime('');
    setShowAddModal(false);
  };

  const toggleDay = (day: DayOfWeek) => {
    setNewTaskDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleCellClick = (day: DayOfWeek, time: string) => {
    setNewTaskDays([day]);
    setNewTaskTime(time);
    setShowAddModal(true);
  };

  const toggleTaskCompletion = (id: string) => {
    setDailyTasks(prev => prev.map(dt => dt.id === id ? { ...dt, isCompleted: !dt.isCompleted } : dt));
  };

  const reassignTask = (task: DailyTask, targetDay: string) => {
    setDailyTasks(prev => [
      ...prev.filter(dt => dt.id !== task.id),
      { ...task, date: targetDay, wasOverdue: true }
    ]);
  };

  const todayTasks = dailyTasks.filter(dt => dt.date === todayStr);
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  return (
    <div className="space-y-8">
      {/* Overdue Notification */}
      <AnimatePresence>
        {overdueTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-4 overflow-hidden"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-rose-800 dark:text-rose-400">Unfinished Tasks!</h3>
                <p className="text-xs text-rose-600 dark:text-rose-500 mb-3">You have {overdueTasks.length} tasks from previous days that were not completed.</p>
                <div className="space-y-2">
                  {overdueTasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded-lg border border-rose-100 dark:border-rose-500/10">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{task.title} <span className="text-[10px] opacity-50">({task.date})</span></span>
                      <button 
                        onClick={() => reassignTask(task, todayStr)}
                        className="text-[10px] font-bold bg-rose-500 text-white px-2 py-1 rounded hover:bg-rose-600 transition-colors"
                      >
                        MOVE TO TODAY
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-8">
        {/* Weekly Calendar Grid */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <CalendarDays className="w-5 h-5 sm:w-6 h-6 text-indigo-500" />
              Weekly Schedule
            </h2>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="hidden xs:flex items-center gap-2 text-[10px] sm:text-xs font-medium text-slate-500">
                <div className="w-2.5 h-2.5 sm:w-3 h-3 bg-indigo-500/20 border border-indigo-500/30 rounded"></div>
                Scheduled
                <div className="w-2.5 h-2.5 sm:w-3 h-3 bg-emerald-500/20 border border-emerald-500/30 rounded ml-2"></div>
                Current Day
              </div>
              <button 
                onClick={() => {
                  setNewTaskDays([selectedDay]);
                  setNewTaskTime(`${currentHour}:00`);
                  setShowAddModal(true);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 font-bold text-xs sm:text-sm w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                ADD TASK
              </button>
            </div>
          </div>

          {/* Mobile Day Selector */}
          <div className="flex sm:hidden overflow-x-auto p-1 bg-slate-100 dark:bg-slate-900/50 rounded-2xl gap-1 no-scrollbar">
            {DAYS.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${
                  selectedDay === day 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {day.substring(0, 3)}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[320px] sm:min-w-[800px]">
                {/* Grid Header */}
                <div className="grid grid-cols-[60px_repeat(7,1fr)] sm:grid-cols-[80px_repeat(7,1fr)] border-b border-slate-100 dark:border-slate-700">
                  <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/50"></div>
                  {DAYS.map((day) => (
                    <div 
                      key={day} 
                      className={`p-2 sm:p-4 text-center border-l border-slate-100 dark:border-slate-700 transition-all ${
                        day === currentDayName ? 'bg-emerald-500/5 dark:bg-emerald-500/10' : ''
                      } ${selectedDay !== day ? 'hidden sm:block' : 'block'}`}
                    >
                      <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${
                        day === currentDayName ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                      }`}>
                        {day.substring(0, 3)}<span className="hidden sm:inline">{day.substring(3)}</span>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Grid Body */}
                <div className="relative">
                  {TIME_SLOTS.map((time) => (
                    <div key={time} className="grid grid-cols-[60px_repeat(7,1fr)] sm:grid-cols-[80px_repeat(7,1fr)] border-b border-slate-50 dark:border-slate-700/50 group">
                      <div className="p-2 sm:p-3 text-[9px] sm:text-[10px] font-bold text-slate-400 text-right pr-2 sm:pr-4 bg-slate-50/50 dark:bg-slate-900/20">
                        {time}
                      </div>
                      {DAYS.map((day) => {
                        const tasksInSlot = routine.filter(rt => rt.days.includes(day) && rt.time === time);
                        const isCurrentSlot = day === currentDayName && parseInt(time.split(':')[0]) === currentHour;
                        
                        return (
                          <div 
                            key={`${day}-${time}`}
                            onClick={() => handleCellClick(day, time)}
                            className={`p-1 min-h-[50px] sm:min-h-[60px] border-l border-slate-50 dark:border-slate-700/50 cursor-pointer transition-colors relative ${
                              isCurrentSlot ? 'bg-emerald-500/5 dark:bg-emerald-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                            } ${selectedDay !== day ? 'hidden sm:block' : 'block'}`}
                          >
                            <div className="flex flex-col gap-1">
                              {tasksInSlot.map(task => (
                                <div 
                                  key={task.id}
                                  className="bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 rounded-lg p-1 sm:p-1.5 group/task relative"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <p className="text-[9px] sm:text-[10px] font-bold text-indigo-700 dark:text-indigo-300 leading-tight truncate">
                                    {task.title}
                                  </p>
                                  <button 
                                    onClick={() => setRoutine(prev => prev.filter(t => t.id !== task.id))}
                                    className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover/task:opacity-100 transition-opacity shadow-lg"
                                  >
                                    <Trash2 className="w-2 h-2 sm:w-2.5 h-2.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            {/* Current Time Indicator Line */}
                            {isCurrentSlot && (
                              <div 
                                className="absolute left-0 right-0 h-0.5 bg-emerald-500 z-10 pointer-events-none shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                style={{ top: `${(currentMinute / 60) * 100}%` }}
                              >
                                <div className="absolute -left-1 -top-1 w-1.5 h-1.5 sm:w-2 h-2 bg-emerald-500 rounded-full"></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Focus */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
              Today's Focus
            </h2>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {todayTasks.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 border-dashed">
                <p className="text-slate-500">No tasks scheduled for today. Take a break or add something new!</p>
              </div>
            ) : (
              todayTasks.map(task => (
                <motion.div 
                  layout
                  key={task.id} 
                  className={`p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                    task.isCompleted 
                      ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md'
                  }`}
                >
                  <button 
                    onClick={() => toggleTaskCompletion(task.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 mt-0.5 ${
                      task.isCompleted 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                    }`}
                  >
                    {task.isCompleted && <CheckCircle className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-lg leading-tight mb-1 ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2">
                      {task.wasOverdue && (
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded">Rescheduled</span>
                      )}
                      {routine.find(rt => rt.id === task.routineTaskId)?.time && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {routine.find(rt => rt.id === task.routineTaskId)?.time}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden"
            >
              <h3 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-slate-900 dark:text-white">Add Routine Task</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Task Title</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                    className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                    placeholder="e.g., Study Mathematics"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Repeat On</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(day => (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          newTaskDays.includes(day)
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Time Slot</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="time" 
                      value={newTaskTime}
                      onChange={e => setNewTaskTime(e.target.value)}
                      className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                    />
                    <div className="flex items-center gap-2 text-xs text-slate-500 italic">
                      <Clock className="w-4 h-4" />
                      Pick a specific time
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={handleAddTask}
                    disabled={!newTaskTitle || newTaskDays.length === 0}
                    className="flex-2 px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    SAVE TASK
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
