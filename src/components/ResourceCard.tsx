import React, { useState } from 'react';
import { Resource } from '../types';
import { ExternalLink, Star, Tag as TagIcon, Trash2, Edit2, Link as LinkIcon, FileText, Image as ImageIcon, Mic, Download, X, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  key?: string | number;
  resource: Resource;
  onToggleImportant: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (resource: Resource) => void;
  onTagClick: (tag: string) => void;
  onCategoryClick: (category: string) => void;
  viewMode: 'grid' | 'list';
}

export function ResourceCard({ resource, onToggleImportant, onDelete, onEdit, onTagClick, onCategoryClick, viewMode }: Props) {
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  let domain = '';
  try {
    domain = new URL(resource.link).hostname;
  } catch (e) {
    domain = resource.link;
  }
  
  let secondaryDomain = '';
  if (resource.secondaryUrl) {
    try {
      secondaryDomain = new URL(resource.secondaryUrl).hostname;
    } catch (e) {
      secondaryDomain = resource.secondaryUrl;
    }
  }

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  const optionsCount = 1 + (resource.secondaryUrl ? 1 : 0) + (resource.attachments?.length || 0);
  const hasMultipleOptions = optionsCount > 1;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
      return;
    }
    
    if (hasMultipleOptions) {
      setShowOptionsModal(true);
    } else {
      window.open(resource.link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={handleCardClick}
        className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-shadow group flex cursor-pointer ${viewMode === 'list' ? 'flex-row items-center gap-6' : 'flex-col gap-4'}`}
      >
        <div className={`flex items-start justify-between gap-4 ${viewMode === 'list' ? 'flex-1 min-w-0' : 'w-full'}`}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img src={faviconUrl} alt="" className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-700 p-1 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-slate-900 dark:text-white truncate" title={resource.title}>
                {resource.title}
              </h3>
              <a
                href={resource.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 mt-0.5 truncate w-fit"
              >
                <span className="truncate">{domain}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
              {hasMultipleOptions && (
                <div className="flex items-center gap-1 mt-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 w-fit px-2 py-0.5 rounded-md">
                  <Layers className="w-3 h-3" />
                  {optionsCount} Items
                </div>
              )}
            </div>
          </div>
          
          {viewMode === 'grid' && (
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); onToggleImportant(resource.id); }}
                className={`p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                  resource.isImportant ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'
                }`}
                title={resource.isImportant ? "Unmark important" : "Mark as important"}
              >
                <Star className="w-4 h-4" fill={resource.isImportant ? "currentColor" : "none"} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(resource); }}
                className="p-1.5 rounded-md text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                title="Edit resource"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(resource.id); }}
                className="p-1.5 rounded-md text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                title="Delete resource"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className={`flex flex-wrap items-center gap-2 ${viewMode === 'list' ? 'flex-1 justify-end min-w-0' : 'w-full'}`}>
          <button
            onClick={(e) => { e.stopPropagation(); onCategoryClick(resource.category); }}
            className="text-xs font-medium px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
          >
            {resource.category}
          </button>
          {resource.tags.map(tag => (
            <button
              key={tag.name}
              onClick={(e) => { e.stopPropagation(); onTagClick(tag.name); }}
              className="text-xs font-medium px-2.5 py-1 rounded-md transition-opacity hover:opacity-80 text-white shadow-sm"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </button>
          ))}
        </div>

        {viewMode === 'list' && (
          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0 ml-4 border-l border-slate-100 dark:border-slate-700 pl-4">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleImportant(resource.id); }}
              className={`p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                resource.isImportant ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'
              }`}
              title={resource.isImportant ? "Unmark important" : "Mark as important"}
            >
              <Star className="w-4 h-4" fill={resource.isImportant ? "currentColor" : "none"} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(resource); }}
              className="p-1.5 rounded-md text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
              title="Edit resource"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(resource.id); }}
              className="p-1.5 rounded-md text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              title="Delete resource"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showOptionsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowOptionsModal(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={faviconUrl} alt="" className="w-6 h-6 rounded bg-white dark:bg-slate-700 p-0.5 flex-shrink-0 shadow-sm" />
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">{resource.title}</h3>
                </div>
                <button onClick={() => setShowOptionsModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ml-2 flex-shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-2 overflow-y-auto flex-1 space-y-1">
                <a href={resource.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">Primary Link</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{domain}</div>
                  </div>
                </a>
                
                {resource.secondaryUrl && (
                  <a href={resource.secondaryUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                      <LinkIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">Secondary Link</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{secondaryDomain || resource.secondaryUrl}</div>
                    </div>
                  </a>
                )}

                {resource.attachments?.map(att => (
                  <div key={att.id}>
                    {att.type === 'image' && (
                      <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 overflow-hidden">
                          <img src={att.url} alt={att.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{att.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">Image</div>
                        </div>
                      </a>
                    )}
                    {att.type === 'pdf' && (
                      <a href={att.url} download={att.name} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{att.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">PDF Document</div>
                        </div>
                        <Download className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}
                    {att.type === 'audio' && (
                      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                          <Mic className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="text-sm font-medium text-slate-900 dark:text-white truncate mb-1">{att.name}</div>
                          <audio controls src={att.url} className="h-8 w-full" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
