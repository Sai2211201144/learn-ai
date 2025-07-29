import React, { useState } from 'react';
import { Module, Progress, Flashcard } from '../../types';
import LessonAccordion from './LessonAccordion';
import { ChevronDownIcon } from '../common/Icons';

interface ModuleAccordionProps {
    module: Module;
    moduleNumber: number;
    progress: Progress;
    initiallyOpen?: boolean;
    onViewFlashcards: (flashcards: Flashcard[]) => void;
    onStartSocraticDialogue: (originalText: string) => void;
}

const ModuleAccordion: React.FC<ModuleAccordionProps> = ({ 
    module, 
    moduleNumber, 
    progress, 
    initiallyOpen = false,
    onViewFlashcards,
    onStartSocraticDialogue,
}) => {
    const [isOpen, setIsOpen] = useState(initiallyOpen);

    const completedInModule = module.lessons.filter(lesson => progress.has(lesson.id)).length;
    const totalInModule = module.lessons.length;

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-100 transition-colors"
                aria-expanded={isOpen}
            >
                <div className="flex items-center">
                    <span className="flex items-center justify-center h-8 w-8 bg-green-100 text-green-700 font-bold rounded-full mr-4 flex-shrink-0 text-sm">{moduleNumber}</span>
                    <div className="text-left">
                        <h2 className="text-lg font-bold text-slate-800">{module.title}</h2>
                         <p className="text-xs text-gray-500">{completedInModule} / {totalInModule} Lessons Completed</p>
                    </div>
                </div>
                <ChevronDownIcon
                    className={`h-6 w-6 text-gray-400 transition-transform duration-300 ml-4 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-4 pb-2 border-t border-gray-200">
                    <div className="space-y-2 py-2">
                        {module.lessons.map((lesson) => (
                            <LessonAccordion 
                                key={lesson.id} 
                                lesson={lesson}
                                progress={progress}
                                onViewFlashcards={onViewFlashcards}
                                onStartSocraticDialogue={onStartSocraticDialogue}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModuleAccordion;