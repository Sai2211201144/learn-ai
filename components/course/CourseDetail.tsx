import React from 'react';
import { Course, Flashcard } from '../../types';
import { useAppContext } from '../../context/AppContext';
import ModuleAccordion from './ModuleAccordion';
import ProgressBar from '../common/ProgressBar';
import { ShareIcon, LogoIcon, ChevronLeftIcon, SparklesIcon, BeakerIcon } from '../common/Icons';

interface CourseDetailProps {
    course: Course;
    onBackToCanvas: () => void;
    onViewFlashcards: (flashcards: Flashcard[]) => void;
    onStartSocraticDialogue: (originalText: string) => void;
    onTestConcepts: () => void;
    onExploreMore: () => void;
}

const CourseDetail: React.FC<CourseDetailProps> = ({ 
    course, 
    onBackToCanvas, 
    onViewFlashcards,
    onStartSocraticDialogue,
    onTestConcepts,
    onExploreMore
}) => {
    const [shareStatus, setShareStatus] = React.useState('Share');
    const { progressData } = useAppContext();
    const courseProgress = progressData[course.id] || new Map();

    const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
    const completedLessons = courseProgress.size;
    const completionPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
                setShareStatus('Copied!');
                setTimeout(() => setShareStatus('Share'), 2000);
            })
            .catch(err => {
                setShareStatus('Failed!');
                console.error('Failed to copy URL: ', err);
                setTimeout(() => setShareStatus('Share'), 2000);
            });
    };

    return (
        <div className="w-full max-w-4xl animate-fade-in-up">
            <header className="mb-8">
                <div className="flex justify-between items-start mb-4">
                     <div>
                        <button
                            onClick={onBackToCanvas}
                            className="flex items-center text-sm text-gray-500 hover:text-green-600 transition-colors mb-4"
                            title="Back to My Topics"
                        >
                            <ChevronLeftIcon className="h-4 w-4 mr-1" />
                            Back to Topics
                        </button>
                        <div className="flex items-center">
                            <LogoIcon className="h-8 w-8 mr-3 text-green-500 flex-shrink-0" />
                            <h1 className="text-4xl font-extrabold text-slate-800">{course.title}</h1>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0 mt-12">
                        <button
                            onClick={onExploreMore}
                            className="flex items-center px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm font-semibold border border-blue-300"
                            title="Explore related topics"
                        >
                             <SparklesIcon className="h-4 w-4 mr-2" />
                             Explore More
                        </button>
                        <button
                            onClick={onTestConcepts}
                            className="flex items-center px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors text-sm font-semibold border border-indigo-300"
                            title="Test your knowledge on this course"
                        >
                             <BeakerIcon className="h-4 w-4 mr-2" />
                             Test Concepts
                        </button>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-600">Topic Progress</span>
                        <span className="text-sm font-medium text-green-600">{completedLessons} / {totalLessons} Complete</span>
                    </div>
                    <ProgressBar progress={completionPercentage} />
                </div>
            </header>

            <div className="space-y-3">
                {course.modules.map((module, index) => (
                    <ModuleAccordion
                        key={index}
                        module={module}
                        moduleNumber={index + 1}
                        progress={courseProgress}
                        initiallyOpen={index === 0}
                        onViewFlashcards={onViewFlashcards}
                        onStartSocraticDialogue={onStartSocraticDialogue}
                    />
                ))}
            </div>
        </div>
    );
};

export default CourseDetail;