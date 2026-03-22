import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Library, Star, Tag as TagIcon, LayoutGrid, List as ListIcon, Sun, Moon, Check, RotateCcw, X as CloseIcon, Calendar, ArrowLeft } from 'lucide-react';
import localforage from 'localforage';
import { Resource, TagData } from './types';
import { ResourceCard } from './components/ResourceCard';
import { ResourceForm } from './components/ResourceForm';
import { ConfirmModal } from './components/ConfirmModal';
import { EditResourceModal } from './components/EditResourceModal';
import { FilterDropdown } from './components/FilterDropdown';
import { Logo } from './components/Logo';
import { RoutineView } from './components/RoutineView';
import { motion, AnimatePresence } from 'motion/react';

const INITIAL_RESOURCES: Resource[] = [];

export default function App() {
  const [resources, setResources] = useState<Resource[]>(INITIAL_RESOURCES);
  const [savedCategories, setSavedCategories] = useState<string[]>([]);
  const [savedTags, setSavedTags] = useState<TagData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      localforage.getItem<any[]>('study-resources'),
      localforage.getItem<string[]>('study-categories'),
      localforage.getItem<TagData[]>('study-tags')
    ]).then(([savedRes, savedCats, savedTgs]) => {
      let migratedRes: Resource[] = [];
      if (savedRes) {
        // Migrate old string tags to TagData objects
        migratedRes = savedRes.map(r => ({
          ...r,
          tags: r.tags.map((t: any) => typeof t === 'string' ? { name: t, color: '#6366f1' } : t)
        }));
        setResources(migratedRes);
      }
      
      if (savedCats) {
        setSavedCategories(savedCats);
      } else if (migratedRes.length > 0) {
        const cats = new Set(migratedRes.map(r => r.category));
        setSavedCategories(Array.from(cats).sort());
      }

      if (savedTgs) {
        setSavedTags(savedTgs);
      } else if (migratedRes.length > 0) {
        const tagMap = new Map<string, string>();
        migratedRes.forEach(r => {
          r.tags.forEach(t => {
            if (!tagMap.has(t.name)) {
              tagMap.set(t.name, t.color);
            }
          });
        });
        setSavedTags(Array.from(tagMap.entries()).map(([name, color]) => ({ name, color })).sort((a, b) => a.name.localeCompare(b.name)));
      }
      
      setIsLoaded(true);
    });
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showOnlyImportant, setShowOnlyImportant] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'resources' | 'routine'>('resources');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [lastDeletedResource, setLastDeletedResource] = useState<Resource | null>(null);
  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (isLoaded) {
      localforage.setItem('study-resources', resources);
      localforage.setItem('study-categories', savedCategories);
      localforage.setItem('study-tags', savedTags);
    }
  }, [resources, savedCategories, savedTags, isLoaded]);

  const filteredResources = useMemo(() => {
    return resources
      .filter(r => {
        if (selectedCategories.length > 0 && !selectedCategories.includes(r.category)) return false;
        // AND logic for tags: resource must have ALL selected tags
        if (selectedTags.length > 0 && !selectedTags.every(st => r.tags.some(t => t.name === st))) return false;
        if (showOnlyImportant && !r.isImportant) return false;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            r.title.toLowerCase().includes(query) ||
            r.link.toLowerCase().includes(query) ||
            r.category.toLowerCase().includes(query) ||
            r.tags.some(t => t.name.toLowerCase().includes(query))
          );
        }
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [resources, searchQuery, selectedCategories, selectedTags, showOnlyImportant]);

  const handleAddResource = (newResource: Omit<Resource, 'id' | 'createdAt'>) => {
    const resource: Resource = {
      ...newResource,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setResources(prev => [resource, ...prev]);
    
    // Update categories
    if (!savedCategories.includes(resource.category)) {
      setSavedCategories(prev => [...prev, resource.category].sort());
    }
    
    // Update tags
    setSavedTags(prev => {
      const newTags = [...prev];
      let changed = false;
      resource.tags.forEach(t => {
        if (!newTags.some(existing => existing.name === t.name)) {
          newTags.push(t);
          changed = true;
        }
      });
      return changed ? newTags.sort((a, b) => a.name.localeCompare(b.name)) : prev;
    });
  };

  const handleEditResource = (updatedResource: Resource) => {
    setResources(prev => prev.map(r => r.id === updatedResource.id ? updatedResource : r));
    setEditingResource(null);
    
    // Update categories
    if (!savedCategories.includes(updatedResource.category)) {
      setSavedCategories(prev => [...prev, updatedResource.category].sort());
    }
    
    // Update tags
    setSavedTags(prev => {
      const newTags = [...prev];
      let changed = false;
      updatedResource.tags.forEach(t => {
        if (!newTags.some(existing => existing.name === t.name)) {
          newTags.push(t);
          changed = true;
        }
      });
      return changed ? newTags.sort((a, b) => a.name.localeCompare(b.name)) : prev;
    });
  };

  const handleToggleImportant = (id: string) => {
    setResources(prev =>
      prev.map(r => (r.id === id ? { ...r, isImportant: !r.isImportant } : r))
    );
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      const resourceToDelete = resources.find(r => r.id === deleteId);
      if (resourceToDelete) {
        setLastDeletedResource(resourceToDelete);
        setShowToast(true);
        
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }
        
        toastTimeoutRef.current = setTimeout(() => {
          setShowToast(false);
        }, 5000);
      }
      
      setResources(prev => prev.filter(r => r.id !== deleteId));
      setDeleteId(null);
    }
  };

  const undoDelete = () => {
    if (lastDeletedResource) {
      setResources(prev => [lastDeletedResource, ...prev].sort((a, b) => b.createdAt - a.createdAt));
      setLastDeletedResource(null);
      setShowToast(false);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button 
                onClick={() => setActiveTab('resources')}
                className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                title="Back to Resources"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Logo className="w-8 h-8 sm:w-10 h-10" />
              <div className="flex flex-col hidden xs:flex">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">DECLUTTER</h1>
                <span className="text-[0.5rem] sm:text-[0.65rem] font-bold tracking-widest text-slate-500 dark:text-slate-400 mt-1">STUDY RESOURCE ORGANIZER</span>
              </div>
            </div>
            
            <div className="hidden md:flex flex-1 max-w-2xl mx-4 items-center gap-2">
              {activeTab === 'resources' && (
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search resources, categories, or tags..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900/50 border-transparent rounded-full focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500/30 transition-all outline-none dark:text-white dark:placeholder-slate-500"
                  />
                </div>
              )}
              {activeTab === 'resources' && (
                <FilterDropdown
                  categories={savedCategories}
                  tags={savedTags}
                  selectedCategories={selectedCategories}
                  selectedTags={selectedTags}
                  showOnlyImportant={showOnlyImportant}
                  onToggleCategory={(category) => {
                    setSelectedCategories(prev => 
                      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
                    );
                  }}
                  onToggleTag={(tag) => {
                    setSelectedTags(prev => 
                      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                    );
                  }}
                  onToggleImportant={() => setShowOnlyImportant(!showOnlyImportant)}
                  onClearAll={() => {
                    setSelectedCategories([]);
                    setSelectedTags([]);
                    setShowOnlyImportant(false);
                  }}
                />
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('resources')}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-sm font-bold transition-all ${
                    activeTab === 'resources' 
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Library className="w-3.5 h-3.5 sm:w-4 h-4" />
                  <span className="hidden xs:inline">RESOURCES</span>
                </button>
                <button
                  onClick={() => setActiveTab('routine')}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-sm font-bold transition-all ${
                    activeTab === 'routine' 
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 sm:w-4 h-4" />
                  <span className="hidden xs:inline">ROUTINE</span>
                </button>
              </div>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-md transition-colors text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700/50"
                title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Search/Filter Row - Visible on all screens for better layout consistency */}
          {activeTab === 'resources' && (
            <div className="mt-4 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900/50 border-transparent rounded-full text-sm focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 transition-all outline-none dark:text-white"
                />
              </div>
              <FilterDropdown
                categories={savedCategories}
                tags={savedTags}
                selectedCategories={selectedCategories}
                selectedTags={selectedTags}
                showOnlyImportant={showOnlyImportant}
                onToggleCategory={(category) => {
                  setSelectedCategories(prev => 
                    prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
                  );
                }}
                onToggleTag={(tag) => {
                  setSelectedTags(prev => 
                    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                  );
                }}
                onToggleImportant={() => setShowOnlyImportant(!showOnlyImportant)}
                onClearAll={() => {
                  setSelectedCategories([]);
                  setSelectedTags([]);
                  setShowOnlyImportant(false);
                }}
              />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'resources' ? (
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <aside className="w-full md:w-64 flex-shrink-0 space-y-8">
              <div>
                <ResourceForm onAdd={handleAddResource} categories={savedCategories} availableTags={savedTags} />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white truncate">
                  {searchQuery ? 'Search Results' : 
                   (selectedCategories.length > 0 || selectedTags.length > 0 || showOnlyImportant) ? 'Filtered Resources' :
                   'All Resources'}
                </h2>
                <span className="text-sm text-slate-500 dark:text-slate-400 flex-shrink-0 ml-4">
                  {filteredResources.length} {filteredResources.length === 1 ? 'resource' : 'resources'}
                </span>
              </div>

              {filteredResources.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed">
                  <Logo className="w-16 h-16 mx-auto mb-4 opacity-50 grayscale" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No resources found</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    {searchQuery || selectedCategories.length > 0 || selectedTags.length > 0 || showOnlyImportant
                      ? "Try adjusting your filters or search query."
                      : "Get started by adding your first study resource!"}
                  </p>
                  {(searchQuery || selectedCategories.length > 0 || selectedTags.length > 0 || showOnlyImportant) && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategories([]);
                        setSelectedTags([]);
                        setShowOnlyImportant(false);
                      }}
                      className="mt-4 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium text-sm"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                <motion.div 
                  layout
                  className={
                    viewMode === 'grid' 
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                      : "flex flex-col gap-4"
                  }
                >
                  <AnimatePresence mode="popLayout">
                    {filteredResources.map(resource => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        onToggleImportant={handleToggleImportant}
                        onDelete={handleDelete}
                        onEdit={setEditingResource}
                        onTagClick={tag => {
                          setSelectedTags(prev => prev.includes(tag) ? prev : [...prev, tag]);
                          setSelectedCategories([]);
                          setShowOnlyImportant(false);
                        }}
                        onCategoryClick={category => {
                          setSelectedCategories(prev => prev.includes(category) ? prev : [...prev, category]);
                          setSelectedTags([]);
                          setShowOnlyImportant(false);
                        }}
                        viewMode={viewMode}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </div>
        ) : (
          <RoutineView />
        )}
      </main>

      <ConfirmModal
        isOpen={deleteId !== null}
        title="Delete Resource"
        message="Are you sure you want to delete this resource? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />

      <EditResourceModal
        resource={editingResource}
        categories={savedCategories}
        availableTags={savedTags}
        onSave={handleEditResource}
        onClose={() => setEditingResource(null)}
      />

      {/* Undo Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-50 flex items-center gap-4 bg-slate-900 dark:bg-slate-800 text-white px-6 py-4 rounded-xl shadow-2xl border border-slate-700/50 min-w-[320px]"
          >
            <div className="flex-1">
              <p className="text-sm font-medium">Resource deleted</p>
            </div>
            <button
              onClick={undoDelete}
              className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold text-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              UNDO
            </button>
            <div className="w-px h-4 bg-slate-700 mx-1"></div>
            <button
              onClick={() => setShowToast(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
