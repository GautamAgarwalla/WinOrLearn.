import React, { useState, useEffect, useRef } from 'react';
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
  resource: Resource | null;
  categories: string[];
  availableTags: TagData[];
  onSave: (updatedResource: Resource) => void;
  onClose: () => void;
}

export function EditResourceModal({ resource, categories, availableTags, onSave, onClose }: Props) {
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
    if (resource) {
      setTitle(resource.title);
      setLink(resource.link);
      setSecondaryUrl(resource.secondaryUrl || '');
      setCategory(categories.includes(resource.category) ? resource.category : 'new');
      setNewCategory(categories.includes(resource.category) ? '' : resource.category);
      setSelectedTags(resource.tags || []);
      setCreatedTags([]);
      setIsImportant(resource.isImportant);
      setAttachments(resource.attachments || []);
    }
  }, [resource, categories]);

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
    if (!resource) return;
    
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

    onSave({
      ...resource,
      title: title.trim(),
      link: finalLink,
      secondaryUrl: finalSecondaryUrl || undefined,
      category: finalCategory,
      tags: selectedTags,
      isImportant,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
  };

  return (
    <AnimatePresence>
      {resource && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <h3 className="font-semibold text-slate-900 dark:text-white">Edit Resource</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 sm:p-5">
              <form id="edit-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:placeholder-slate-500"
                    placeholder="e.g., React Documentation"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Video Link</label>
                    <input
                      type="url"
                      required
                      value={link}
                      onChange={e => setLink(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:placeholder-slate-500"
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Other Link (Optional)</label>
                    <input
                      type="url"
                      value={secondaryUrl}
                      onChange={e => setSecondaryUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:placeholder-slate-500"
                      placeholder="https://github.com/..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    required
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-2"
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="new">+ Create new category</option>
                  </select>
                  
                  {category === 'new' && (
                    <input
                      type="text"
                      required
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:placeholder-slate-500"
                      placeholder="New category name"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags</label>
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

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editIsImportant"
                    checked={isImportant}
                    onChange={e => setIsImportant(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-900 focus:ring-indigo-500"
                  />
                  <label htmlFor="editIsImportant" className="text-sm text-slate-700 dark:text-slate-300">
                    Mark as important
                  </label>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Attachments</label>
                  <div className="flex flex-wrap gap-3 mb-3">
                    <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors text-sm font-medium">
                      <Paperclip className="w-4 h-4" />
                      <span>Upload File</span>
                      <input type="file" className="hidden" accept="image/*,.pdf" multiple onChange={handleFileUpload} />
                    </label>
                    
                    {isRecording ? (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-700 dark:text-red-400 rounded-lg transition-colors text-sm font-medium animate-pulse"
                      >
                        <Square className="w-4 h-4" />
                        <span>Stop Recording</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors text-sm font-medium"
                      >
                        <Mic className="w-4 h-4" />
                        <span>Record Voice Note</span>
                      </button>
                    )}
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      {attachments.map(att => (
                        <div key={att.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-2 overflow-hidden">
                            {att.type === 'image' && <ImageIcon className="w-4 h-4 text-indigo-500 shrink-0" />}
                            {att.type === 'pdf' && <FileText className="w-4 h-4 text-red-500 shrink-0" />}
                            {att.type === 'audio' && <Mic className="w-4 h-4 text-emerald-500 shrink-0" />}
                            <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{att.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(att.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-slate-200 dark:border-slate-700 shrink-0 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-form"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
