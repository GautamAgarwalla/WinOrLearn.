import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Link as LinkIcon, Paperclip, Mic, Square, Trash2, FileText, Image as ImageIcon, Tag as TagIcon } from 'lucide-react';
import { Resource, Attachment, TagData } from '../types';
import { motion, AnimatePresence } from 'motion/react';

const TAG_COLORS = [
  '#ef4444', // red-500
  '#ea580c', // orange-600
  '#d97706', // amber-600
  '#65a30d', // lime-600
  '#16a34a', // green-600
  '#0891b2', // cyan-600
  '#2563eb', // blue-600
  '#4f46e5', // indigo-600
  '#9333ea', // purple-600
  '#db2777'  // pink-600
];

interface Props {
  onAdd: (resource: Omit<Resource, 'id' | 'createdAt'>) => void;
  categories: string[];
  availableTags: TagData[];
}

export function ResourceForm({ onAdd, categories, availableTags }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [secondaryUrl, setSecondaryUrl] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<TagData[]>([]);
  const [createdTags, setCreatedTags] = useState<TagData[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [isImportant, setIsImportant] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setAttachments(prev => [...prev, { id: crypto.randomUUID(), type: 'audio', url: base64data, name: `Voice Note ${new Date().toLocaleTimeString()}` }]);
        };
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const type = file.type.startsWith('image/') ? 'image' : 'pdf';
        setAttachments(prev => [...prev, { id: crypto.randomUUID(), type, url: base64data, name: file.name }]);
      };
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleAddTag = () => {
    const name = newTagName.trim();
    if (!name) return;
    
    const existing = availableTags.find(t => t.name.toLowerCase() === name.toLowerCase()) || 
                     createdTags.find(t => t.name.toLowerCase() === name.toLowerCase());
                     
    if (existing) {
      if (!selectedTags.some(t => t.name === existing.name)) {
        setSelectedTags(prev => [...prev, existing]);
      }
    } else {
      const newTag = { name, color: newTagColor };
      setSelectedTags(prev => [...prev, newTag]);
      setCreatedTags(prev => [...prev, newTag]);
    }
    
    setNewTagName('');
    setIsAddingTag(false);
  };

  const toggleTag = (tag: TagData) => {
    setSelectedTags(prev => 
      prev.some(t => t.name === tag.name) 
        ? prev.filter(t => t.name !== tag.name)
        : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalLink = link;
    if (!/^https?:\/\//i.test(finalLink)) {
      finalLink = 'https://' + finalLink;
    }

    let finalSecondaryUrl = secondaryUrl;
    if (finalSecondaryUrl && !/^https?:\/\//i.test(finalSecondaryUrl)) {
      finalSecondaryUrl = 'https://' + finalSecondaryUrl;
    }

    const finalCategory = category === 'new' ? newCategory.trim() : category;
    
    if (!title.trim() || !finalLink.trim() || !finalCategory) return;

    onAdd({
      title: title.trim(),
      link: finalLink,
      secondaryUrl: finalSecondaryUrl || undefined,
      category: finalCategory,
      tags: selectedTags,
      isImportant,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    setTitle('');
    setLink('');
    setSecondaryUrl('');
    setCategory('');
    setNewCategory('');
    setSelectedTags([]);
    setCreatedTags([]);
    setIsImportant(false);
    setAttachments([]);
    setIsOpen(false);
  };

  return (
    <AnimatePresence mode="wait">
      {!isOpen ? (
        <motion.button
          key="add-button"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          onClick={() => setIsOpen(true)}
          className="w-full py-4 px-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-all flex items-center justify-center gap-3 font-medium group"
        >
          <div className="bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 p-2 rounded-full transition-colors">
            <Plus className="w-5 h-5" />
          </div>
          Add New Resource
        </motion.button>
      ) : (
        <motion.div
          key="add-form"
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98, y: -10 }}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <div className="bg-indigo-100 dark:bg-indigo-500/20 p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Plus className="w-4 h-4" />
              </div>
              Add Resource
            </h3>
            <button type="button" onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:placeholder-slate-500 transition-all"
                  placeholder="e.g., React Documentation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
                <select
                  required
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="new">+ Create new category</option>
                </select>
                
                {category === 'new' && (
                  <motion.input
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    type="text"
                    required
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full mt-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:placeholder-slate-500 transition-all"
                    placeholder="New category name"
                  />
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Video Link</label>
                <input
                  type="url"
                  required
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:placeholder-slate-500 transition-all"
                  placeholder="https://youtube.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Other Link <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input
                  type="url"
                  value={secondaryUrl}
                  onChange={e => setSecondaryUrl(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:placeholder-slate-500 transition-all"
                  placeholder="https://github.com/..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {Array.from(new Map([...availableTags, ...createdTags].map(t => [t.name.toLowerCase(), t])).values())
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(tag => {
                  const isSelected = selectedTags.some(t => t.name === tag.name);
                  return (
                    <button
                      key={tag.name}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all text-white shadow-sm ${
                        isSelected 
                          ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900 scale-105' 
                          : 'opacity-50 hover:opacity-90'
                      }`}
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setIsAddingTag(!isAddingTag)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-transparent border-dashed hover:border-slate-300 dark:hover:border-slate-600"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Tag
                </button>
              </div>

              <AnimatePresence>
                {isAddingTag && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newTagName}
                          onChange={e => setNewTagName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                          placeholder="Tag name"
                          className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleAddTag}
                          disabled={!newTagName.trim()}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {TAG_COLORS.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewTagColor(color)}
                            className={`w-6 h-6 rounded-full transition-transform ${newTagColor === color ? 'scale-125 ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 dark:ring-offset-slate-900' : 'hover:scale-110'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Attachments & Media</label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors text-xs font-medium shadow-sm">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input type="file" className="hidden" accept="image/*,.pdf" multiple onChange={handleFileUpload} />
                  </label>
                  
                  {isRecording ? (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors text-xs font-medium animate-pulse shadow-sm"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors text-xs font-medium shadow-sm"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Record</span>
                    </button>
                  )}
                </div>
              </div>

              {attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attachments.map(att => (
                    <div key={att.id} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className={`p-1.5 rounded-md shrink-0 ${
                          att.type === 'image' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' :
                          att.type === 'pdf' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' :
                          'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {att.type === 'image' && <ImageIcon className="w-4 h-4" />}
                          {att.type === 'pdf' && <FileText className="w-4 h-4" />}
                          {att.type === 'audio' && <Mic className="w-4 h-4" />}
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{att.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                  <p className="text-sm text-slate-500 dark:text-slate-400">No attachments yet. Upload files or record a voice note.</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={isImportant}
                    onChange={e => setIsImportant(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  Mark as important
                </span>
              </label>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow-md rounded-xl transition-all active:scale-95"
                >
                  Save Resource
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
