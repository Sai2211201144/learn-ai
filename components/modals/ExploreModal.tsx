import React from 'react';
import { RelatedTopic, KnowledgeLevel } from '../../types';
import { CloseIcon, SparklesIcon, LoadingSpinnerIcon } from '../common/Icons';

interface ExploreModalProps {
    isOpen: boolean;
    isLoading: boolean;
    onClose: () => void;
    courseTitle: string;
    relatedTopics: RelatedTopic[];
    onGenerateCourse: (topic: string, level: KnowledgeLevel) => void;
}

const ExploreModal: React.FC<ExploreModalProps> = ({
    isOpen,
    isLoading,
    onClose,
    courseTitle,
    relatedTopics,
    onGenerateCourse
}) => {
    if (!isOpen) return null;

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
                            <SparklesIcon className="w-7 h-7 text-blue-500" />
                            Explore Related Topics
                        </h2>
                        <p className="text-gray-500 mt-1">Based on your course: <span className="font-semibold text-slate-600">"{courseTitle}"</span></p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-700 transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="mt-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-48">
                            <LoadingSpinnerIcon className="w-8 h-8 text-blue-500" />
                            <p className="mt-4 text-slate-600">Finding related topics...</p>
                        </div>
                    ) : relatedTopics.length > 0 ? (
                        <div className="space-y-4">
                            {relatedTopics.map((topic, index) => (
                                <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                     <h3 className="font-bold text-lg text-blue-800">{topic.topic}</h3>
                                     <p className="text-sm text-blue-700 mb-3 italic">"{topic.reason}"</p>
                                     <button 
                                        onClick={() => onGenerateCourse(topic.topic, 'intermediate')}
                                        className="px-3 py-1 bg-green-600 text-white font-semibold rounded-md hover:bg-green-500 text-sm"
                                     >
                                        Generate Course
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-10">
                            <p className="text-slate-600">Couldn't find any specific recommendations at this time.</p>
                        </div>
                    )}
                </div>

                 <div className="mt-8 flex justify-end">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-100 text-slate-700 font-bold rounded-lg hover:bg-gray-200 border border-gray-300">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExploreModal;