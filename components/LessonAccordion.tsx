import React, { useState, useRef, useEffect } from 'react';
import { Lesson, ContentBlock, Flashcard, Resource, PracticeProblem, Progress } from '../../types';
import { useAppContext } from '../../context/AppContext';
import * as geminiService from '../../services/geminiService';
import CodeBlock from './CodeBlock';
import QuizBlock from './QuizBlock';
import DiagramBlock from './DiagramBlock';
import InteractiveModelBlock from './InteractiveModelBlock';
import HyperparameterSimulatorBlock from './HyperparameterSimulatorBlock';
import TriageChallengeBlock from './TriageChallengeBlock';
import { ChevronRightIcon, TextIcon, CodeIcon, QuizIcon, DownloadIcon, LoadingSpinnerIcon, FlashcardsIcon, VideoIcon, DocumentIcon, ArticleIcon, CheckIcon, LeetCodeIcon, GfgIcon, ChatBubbleLeftRightIcon, ClockIcon, DiagramIcon, InteractiveModelIcon, HyperparameterIcon, BugAntIcon, LightBulbIcon } from '../common/Icons';

interface LessonAccordionProps {
    lesson: Lesson;
    progress: Progress;
    onViewFlashcards: (flashcards: Flashcard[]) => void;
    onStartSocraticDialogue: (originalText: string) => void;
}

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

const isDueForReview = (completionTimestamp: number): boolean => {
    return Date.now() - completionTimestamp > ONE_DAY_IN_MS;
};

const getResourceIcon = (type: Resource['type']) => {
    switch (type) {
        case 'video': return <VideoIcon className="h-4 w-4 text-red-500" />;
        case 'documentation': return <DocumentIcon className="h-4 w-4 text-blue-500" />;
        case 'article': return <ArticleIcon className="h-4 w-4 text-green-500" />;
        default: return null;
    }
}

const getPracticeProblemIcon = (platform: PracticeProblem['platform']) => {
    switch (platform) {
        case 'leetcode': return <LeetCodeIcon className="h-4 w-4 text-orange-500" />;
        case 'geeksforgeeks': return <GfgIcon className="h-4 w-4 text-green-600" />;
        default: return null;
    }
}

const AnalogyPopover: React.FC<{ concept: string, onClose: () => void }> = ({ concept, onClose }) => {
    const [analogy, setAnalogy] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        geminiService.generateAnalogy(concept)
            .then(setAnalogy)
            .catch(() => setAnalogy("Sorry, couldn't generate an analogy right now."))
            .finally(() => setIsLoading(false));
    }, [concept]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div ref={popoverRef} className="absolute z-20 -top-4 left-12 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-3 animate-fade-in-up">
            <h5 className="font-bold text-yellow-600 flex items-center gap-1.5 text-sm mb-2">
                <LightBulbIcon className="w-4 h-4" />
                Analogy
            </h5>
            {isLoading ? (
                <div className="flex justify-center items-center h-16">
                    <LoadingSpinnerIcon className="w-6 h-6 text-yellow-500" />
                </div>
            ) : (
                <p className="text-sm text-slate-600">{analogy}</p>
            )}
        </div>
    );
};


const LessonAccordion: React.FC<LessonAccordionProps> = ({ lesson, progress, onViewFlashcards, onStartSocraticDialogue }) => {
    const { 
        activeCourse,
        generatingLessonFlashcardId,
        handleToggleLessonComplete,
        handleGenerateLessonFlashcards,
        handleSaveNote 
    } = useAppContext();

    const [isOpen, setIsOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [note, setNote] = useState(lesson.notes || '');
    const [isNoteSaved, setIsNoteSaved] = useState(false);
    const [showAnalogy, setShowAnalogy] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const noteTimeoutRef = useRef<number | null>(null);

    const isComplete = progress.has(lesson.id);
    const completionTimestamp = progress.get(lesson.id);
    const needsReview = completionTimestamp ? isDueForReview(completionTimestamp) : false;
    const isGenerating = generatingLessonFlashcardId === lesson.id;

    useEffect(() => {
        setNote(lesson.notes || '');
    }, [lesson.notes]);

    const handleSaveNoteClick = () => {
        if (!activeCourse) return;
        handleSaveNote(activeCourse.id, lesson.id, note);
        setIsNoteSaved(true);
        if (noteTimeoutRef.current) clearTimeout(noteTimeoutRef.current);
        noteTimeoutRef.current = window.setTimeout(() => setIsNoteSaved(false), 2000);
    }

    const handleCheckboxClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (activeCourse) {
            handleToggleLessonComplete(activeCourse.id, lesson.id);
        }
    };

    const handleFlashcardClick = () => {
        if (lesson.flashcards && lesson.flashcards.length > 0) {
            onViewFlashcards(lesson.flashcards);
        } else {
            handleGenerateLessonFlashcards(lesson.id);
        }
    };

    const handleDownloadPdf = async () => {
        if (!isOpen || !contentRef.current) return;
        setIsDownloading(true);
        // PDF generation logic...
        setIsDownloading(false);
    };

    const renderContentBlock = (block: ContentBlock) => {
        const getIcon = () => {
            switch(block.type) {
                case 'text': return <TextIcon className="h-5 w-5 text-sky-500"/>;
                case 'code': return <CodeIcon className="h-5 w-5 text-amber-500"/>;
                case 'quiz': return <QuizIcon className="h-5 w-5 text-lime-500"/>;
                case 'diagram': return <DiagramIcon className="h-5 w-5 text-purple-500"/>;
                case 'interactive_model': return <InteractiveModelIcon className="h-5 w-5 text-indigo-500"/>;
                case 'hyperparameter_simulator': return <HyperparameterIcon className="h-5 w-5 text-rose-500"/>;
                case 'triage_challenge': return <BugAntIcon className="h-5 w-5 text-teal-500"/>;
                default: return null;
            }
        }
    
        return (
            <div key={block.id} className="flex items-start space-x-4 p-4 bg-white rounded-md relative group border border-gray-200">
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center mt-1">{getIcon()}</div>
                <div className="flex-grow">
                    {block.type === 'text' && block.text && <p className="text-gray-700 leading-relaxed">{block.text}</p>}
                    {block.type === 'code' && block.code && <CodeBlock code={block.code} />}
                    {block.type === 'quiz' && block.quiz && <QuizBlock quizData={block.quiz} />}
                    {block.type === 'diagram' && block.diagram && <DiagramBlock mermaidString={block.diagram} />}
                    {block.type === 'interactive_model' && block.interactiveModel && <InteractiveModelBlock modelData={block.interactiveModel} />}
                    {block.type === 'hyperparameter_simulator' && block.hyperparameterSimulator && <HyperparameterSimulatorBlock modelData={block.hyperparameterSimulator} />}
                    {block.type === 'triage_challenge' && block.triageChallenge && <TriageChallengeBlock challengeData={block.triageChallenge} />}
                </div>
                {block.type === 'text' && block.text && (
                    <button onClick={() => onStartSocraticDialogue(block.text!)} className="absolute top-2 right-2 p-1 bg-gray-200 text-gray-500 rounded-full hover:bg-green-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all" title="Deep Dive with AI Tutor">
                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className={`bg-gray-50 rounded-lg transition-opacity ${isComplete ? 'opacity-60' : 'opacity-100'}`}>
            <div className="flex justify-between items-center p-2 text-left hover:bg-gray-100 transition-colors rounded-lg">
                <div onClick={handleCheckboxClick} className="flex items-center cursor-pointer p-2 -ml-1">
                    <input type="checkbox" checked={isComplete} readOnly className="w-5 h-5 rounded border-gray-300 bg-white text-green-600 focus:ring-green-500 cursor-pointer" />
                </div>
                <button onClick={() => setIsOpen(!isOpen)} className="flex-grow flex items-center gap-2 text-left mx-2" aria-expanded={isOpen} aria-controls={`lesson-content-${lesson.id}`}>
                    <ChevronRightIcon className={`flex-shrink-0 h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                    {needsReview && <span title="Due for review" className="flex-shrink-0"><ClockIcon className="h-4 w-4 text-yellow-500"/></span>}
                     <div className="flex-grow relative">
                        <h3 className={`font-semibold text-slate-700 transition-colors ${isComplete ? 'line-through text-gray-400' : ''}`}>{lesson.title}</h3>
                        <p className="text-sm text-gray-500 hidden sm:block truncate">{lesson.objective}</p>
                        {showAnalogy && <AnalogyPopover concept={lesson.title} onClose={() => setShowAnalogy(false)} />}
                    </div>
                </button>
                <div className="flex items-center flex-shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); setShowAnalogy(!showAnalogy); }} className="ml-2 p-1.5 text-gray-500 rounded-full hover:bg-yellow-100 hover:text-yellow-600 transition-colors" title="Get Analogy">
                        <LightBulbIcon className="h-5 w-5" />
                    </button>
                    <button onClick={handleFlashcardClick} disabled={isGenerating} className="ml-1 p-1.5 text-gray-500 rounded-full hover:bg-gray-200 hover:text-green-600 disabled:opacity-50 disabled:cursor-wait transition-colors" title={isGenerating ? "Generating..." : (lesson.flashcards && lesson.flashcards.length > 0 ? "View Flashcards" : "Generate Flashcards")}>
                        {isGenerating ? <LoadingSpinnerIcon className="h-5 w-5" /> : <FlashcardsIcon className="h-5 w-5" />}
                    </button>
                    <button onClick={handleDownloadPdf} disabled={!isOpen || isDownloading} className="ml-1 p-1.5 text-gray-500 rounded-full hover:bg-gray-200 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title={isOpen ? "Download PDF" : "Expand to download"}>
                        {isDownloading ? <LoadingSpinnerIcon className="h-5 w-5" /> : <DownloadIcon className="h-5 w-5" />}
                    </button>
                </div>
            </div>
            <div id={`lesson-content-${lesson.id}`} className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-3 border-t border-gray-200 bg-white">
                    <div ref={contentRef} className="space-y-4">
                        {lesson.contentBlocks.map(renderContentBlock)}
                        
                        <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                            <h4 className="font-semibold text-slate-700 mb-2">My Insights</h4>
                            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Jot down notes, questions, or summaries..." className="w-full h-24 p-2 bg-white border border-gray-300 rounded-md text-slate-700 focus:ring-green-500 focus:border-green-500"></textarea>
                            <button onClick={handleSaveNoteClick} className="mt-2 px-3 py-1 text-sm bg-green-600 text-white font-semibold rounded-md hover:bg-green-500 disabled:bg-green-100 disabled:text-green-400 transition-colors flex items-center gap-2">
                                {isNoteSaved ? <><CheckIcon className="w-4 h-4" /> Saved!</> : 'Save Note'}
                            </button>
                        </div>
                        
                        {lesson.resources && lesson.resources.length > 0 && (
                            <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                                <h4 className="font-semibold text-slate-700 mb-2">Recommended Resources</h4>
                                <ul className="space-y-2">
                                    {lesson.resources.map((resource, index) => (
                                        <li key={index} className="flex items-center">
                                            <span className="mr-2">{getResourceIcon(resource.type)}</span>
                                            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:text-green-500 hover:underline underline-offset-2">{resource.title}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {lesson.practiceProblems && lesson.practiceProblems.length > 0 && (
                            <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                                <h4 className="font-semibold text-slate-700 mb-2">Practice Problems</h4>
                                <ul className="space-y-2">
                                    {lesson.practiceProblems.map((problem, index) => (
                                        <li key={index} className="flex items-center">
                                            <span className="mr-2 flex-shrink-0">{getPracticeProblemIcon(problem.platform)}</span>
                                            <a href={problem.url} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:text-green-500 hover:underline underline-offset-2">{problem.title}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LessonAccordion;
