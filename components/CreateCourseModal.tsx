import React, { useState } from 'react';
import { KnowledgeLevel } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { CloseIcon, LogoIcon } from '../common/Icons';

interface CreateCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (topic: string, level: KnowledgeLevel, folderId: string | null) => void;
    error: string | null;
}

const CreateCourseModal: React.FC<CreateCourseModalProps> = ({ isOpen, onClose, onGenerate, error: propError }) => {
    const { folders } = useAppContext();
    const [topic, setTopic] = useState('');
    const [level, setLevel] = useState<KnowledgeLevel>('beginner');
    const [folderId, setFolderId] = useState<string | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);

    const levels: { level: KnowledgeLevel; label: string; description: string }[] = [
        { level: 'beginner', label: 'Beginner', description: 'Start from scratch, cover the basics.' },
        { level: 'intermediate', label: 'Intermediate', description: 'Assume some familiarity, focus on core concepts.' },
        { level: 'advanced', label: 'Advanced', description: 'Dive into details, complex topics, and best practices.' },
    ];

    if (!isOpen) return null;
    
    const handleGenerateClick = () => {
        if (!topic.trim()) {
            setLocalError("Please enter a topic to begin.");
            return;
        }
        onGenerate(topic, level, folderId);
    };

    const handleTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTopic(e.target.value);
        if (localError) {
            setLocalError(null);
        }
    };
    
    const displayError = propError || localError;

    return (
        <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-modal-bg" 
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl border border-gray-200 animate-modal-content"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                            <LogoIcon className="w-7 h-7 text-green-500" />
                            Create New Topic
                        </h2>
                        <p className="text-gray-500 mt-1">What would you like to learn about?</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-700 transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label htmlFor="topic-input" className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
                        <input
                            id="topic-input"
                            type="text"
                            value={topic}
                            onChange={handleTopicChange}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerateClick()}
                            placeholder="e.g., 'Quantum Physics'"
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-slate-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        />
                    </div>

                    <div>
                        <h3 className="block text-sm font-medium text-slate-700 mb-2">Knowledge Level</h3>
                        <div className="grid sm:grid-cols-3 gap-3">
                            {levels.map((l) => (
                                <button
                                    key={l.level}
                                    onClick={() => setLevel(l.level)}
                                    className={`text-left p-3 rounded-lg border-2 transition-all duration-200 ${level === l.level ? 'bg-green-50 border-green-500' : 'bg-white border-gray-300 hover:border-green-400'}`}
                                >
                                    <p className="font-bold text-green-600 capitalize">{l.label}</p>
                                    <p className="text-xs text-gray-500">{l.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {folders.length > 0 && (
                        <div>
                            <label htmlFor="folder-select" className="block text-sm font-medium text-slate-700 mb-1">Add to Folder (Optional)</label>
                            <select
                                id="folder-select"
                                value={folderId ?? ''}
                                onChange={(e) => setFolderId(e.target.value || null)}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                            >
                                <option value="">Uncategorized</option>
                                {folders.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {displayError && <p className="mt-4 text-center text-red-500 animate-shake">{displayError}</p>}
                
                <div className="mt-8 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-100 text-slate-700 font-bold rounded-lg hover:bg-gray-200 border border-gray-300">
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerateClick}
                        disabled={!topic.trim()}
                        className="px-5 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/30"
                    >
                        Generate Topic
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateCourseModal;
