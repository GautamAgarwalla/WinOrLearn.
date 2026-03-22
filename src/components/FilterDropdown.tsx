import { useState, useRef, useEffect } from 'react';
import { Filter, Star, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TagData } from '../types';

interface Props {
  categories: string[];
  tags: TagData[];
  selectedCategories: string[];
  selectedTags: string[];
  showOnlyImportant: boolean;
  onToggleCategory: (category: string) => void;
  onToggleTag: (tag: string) => void;
  onToggleImportant: () => void;
  onClearAll: () => void;
}

export function FilterDropdown({
  categories,
  tags,
  selectedCategories,
  selectedTags,
  showOnlyImportant,
  onToggleCategory,
  onToggleTag,
  onToggleImportant,
  onClearAll
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeCount = selectedCategories.length + selectedTags.length + (showOnlyImportant ? 1 : 0);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
          activeCount > 0 
            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' 
            : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700/50'
        }`}
      >
        <Filter className="w-5 h-5" />
        <span className="font-medium text-sm hidden sm:inline">Filters</span>
        {activeCount > 0 && (
          <span className="bg-indigo-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            {activeCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
          >
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">Filters</h3>
                {activeCount > 0 && (
                  <button
                    onClick={onClearAll}
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Importance */}
              <div className="mb-6">
                <button
                  onClick={onToggleImportant}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    showOnlyImportant
                      ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Star className={`w-4 h-4 ${showOnlyImportant ? 'fill-current' : ''}`} />
                    Important Only
                  </div>
                  {showOnlyImportant && <Check className="w-4 h-4" />}
                </button>
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">Categories</h4>
                  <div className="space-y-1">
                    {categories.map(category => {
                      const isSelected = selectedCategories.includes(category);
                      return (
                        <button
                          key={category}
                          onClick={() => onToggleCategory(category)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-medium'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <span className="truncate">{category}</span>
                          {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">Tags</h4>
                  <div className="flex flex-wrap gap-2 px-1">
                    {tags.map(tag => {
                      const isSelected = selectedTags.includes(tag.name);
                      return (
                        <button
                          key={tag.name}
                          onClick={() => onToggleTag(tag.name)}
                          className={`text-xs font-medium px-2.5 py-1.5 rounded-md transition-all text-white shadow-sm flex items-center gap-1 ${
                            isSelected
                              ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-800 scale-105'
                              : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                          {isSelected && <Check className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                  {selectedTags.length > 1 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 px-1 italic">
                      Showing resources with ALL selected tags.
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
