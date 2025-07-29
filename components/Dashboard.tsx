import React, { useState, useRef, useEffect } from 'react';
import { Course, Progress, Folder } from '../../types';
import { useAppContext } from '../../context/AppContext';
import ProgressBar from '../common/ProgressBar';
import { TrashIcon, LogoIcon, ClockIcon, FolderPlusIcon, PencilIcon, EllipsisVerticalIcon, FolderIcon, ClipboardDocumentCheckIcon, ArrowUturnLeftIcon, WrenchScrewdriverIcon, CommandLineIcon } from '../common/Icons';

interface DashboardProps {
    onSelectCourse: (courseId: string) => void;
    onCreateNew: () => void;
    onTestSkills: () => void;
    onViewProjects: () => void;
    onCodeSnippets: () => void;
}

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

const isDueForReview = (completionTimestamp: number): boolean => {
    return Date.now() - completionTimestamp > ONE_DAY_IN_MS;
};

const Dashboard: React.FC<DashboardProps> = ({ onSelectCourse, onCreateNew, onTestSkills, onViewProjects, onCodeSnippets }) => {
    const { 
      courses, 
      folders, 
      progressData, 
      lastActiveCourseId,
      handleDeleteCourse,
      handleCreateFolder,
      handleDeleteFolder,
      handleUpdateFolderName,
      handleMoveCourseToFolder
    } = useAppContext();
    
    const [isEditingName, setIsEditingName] = useState<string | null>(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const lastActiveCourse = lastActiveCourseId ? courses.find(c => c.id === lastActiveCourseId) : null;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isEditingName && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditingName]);

    const calculateProgress = (course: Course) => {
        const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
        if (totalLessons === 0) return 0;
        const completedLessons = progressData[course.id]?.size || 0;
        return (completedLessons / totalLessons) * 100;
    };

    const hasReviewableLessons = (courseId: string): boolean => {
        const progress = progressData[courseId];
        if (!progress) return false;
        return Array.from(progress.values()).some(isDueForReview);
    };

    const handleDeleteClick = (e: React.MouseEvent, courseId: string) => {
        e.stopPropagation();
        handleDeleteCourse(courseId);
        setActiveMenu(null);
    };

    const handleRename = (folder: Folder) => {
        setIsEditingName(folder.id);
        setNewFolderName(folder.name);
    };
    
    const handleRenameSubmit = (folderId: string) => {
        if (newFolderName.trim()) {
            handleUpdateFolderName(folderId, newFolderName.trim());
        }
        setIsEditingName(null);
        setNewFolderName('');
    };
    
    const allCourseIdsInFolders = folders.flatMap(f => f.courseIds);
    const uncategorizedCourses = courses.filter(c => !allCourseIdsInFolders.includes(c.id));
    const coursesById = new Map(courses.map(c => [c.id, c]));

    const renderCourseCard = (course: Course, currentFolderId: string | null) => {
        const progress = calculateProgress(course);
        const isForReview = hasReviewableLessons(course.id);
        const reviewClasses = isForReview ? 'ring-2 ring-yellow-400/80 shadow-yellow-400/20' : 'hover:border-green-400';
        
        const isMenuOpen = activeMenu === course.id;

        return (
            <div
                key={course.id}
                onClick={() => onSelectCourse(course.id)}
                className={`bg-white rounded-xl p-5 border border-gray-200 ${reviewClasses} transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl hover:shadow-green-500/10 flex flex-col justify-between relative w-72 h-48`}
            >
                <div className="flex-grow">
                    {isForReview && <span className="absolute top-3 left-3" title="Lessons due for review"><ClockIcon className="w-5 h-5 text-yellow-500 animate-pulse" /></span>}
                    <h3 className="font-bold text-lg text-slate-800 mb-2 pr-8">{course.title}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description}</p>
                </div>
                <div className="flex-shrink-0">
                    <ProgressBar progress={progress} />
                    <p className="text-xs text-gray-500 mt-1 text-right">{Math.round(progress)}% Complete</p>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); setActiveMenu(isMenuOpen ? null : course.id); }}
                    className="absolute top-2 right-2 p-1.5 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                    title="Topic options"
                >
                    <EllipsisVerticalIcon className="w-5 h-5" />
                </button>
                {isMenuOpen && (
                    <div ref={menuRef} onClick={e => e.stopPropagation()} className="absolute top-10 right-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10 py-1">
                        <div className="px-3 py-1 text-xs text-gray-400">Move to</div>
                        {folders.filter(f => f.id !== currentFolderId).map(f => (
                            <button key={f.id} onClick={() => { handleMoveCourseToFolder(course.id, f.id); setActiveMenu(null); }} className="w-full text-left block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">{f.name}</button>
                        ))}
                        {currentFolderId !== null && (
                            <button onClick={() => { handleMoveCourseToFolder(course.id, null); setActiveMenu(null); }} className="w-full text-left block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Uncategorized</button>
                        )}
                        <div className="border-t my-1 border-gray-200"></div>
                        <button onClick={(e) => handleDeleteClick(e, course.id)} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                            <TrashIcon className="w-4 h-4"/> Delete
                        </button>
                    </div>
                )}
            </div>
        )
    };
    
    const renderFolderSection = (folder: Folder | null, courseList: Course[]) => {
        const isUncategorized = folder === null;
        const title = isUncategorized ? "Uncategorized Topics" : folder.name;
        
        if (isUncategorized && courseList.length === 0) return null;

        return (
            <section key={isUncategorized ? 'uncategorized' : folder.id} className="mb-12">
                 <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-200">
                    <div className="flex items-center gap-3 w-full">
                        {!isUncategorized && <FolderIcon className="w-6 h-6 text-gray-400" />}
                        {isEditingName === folder?.id ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                onBlur={() => handleRenameSubmit(folder.id)}
                                onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(folder.id)}
                                className="text-xl font-bold text-slate-700 bg-transparent border-b-2 border-green-500 focus:outline-none"
                            />
                        ) : (
                             <h2 className="text-xl font-bold text-slate-700">{title}</h2>
                        )}

                    </div>
                    {!isUncategorized && folder && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                             <button onClick={() => handleRename(folder)} className="p-1.5 text-gray-400 hover:text-green-600 rounded-full hover:bg-gray-200 transition-colors" title="Rename folder"><PencilIcon className="w-5 h-5" /></button>
                             <button onClick={() => handleDeleteFolder(folder.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-200 transition-colors" title="Delete folder"><TrashIcon className="w-5 h-5" /></button>
                        </div>
                    )}
                </div>
                {courseList.length > 0 ? (
                     <div className="flex flex-wrap justify-start gap-8">
                        {courseList.map(course => renderCourseCard(course, folder?.id ?? null))}
                    </div>
                ) : (
                    <div className="text-left py-4 px-3 text-gray-500">This folder is empty.</div>
                )}
            </section>
        )
    }

    return (
        <div className="w-full max-w-6xl animate-fade-in">
            <header className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <LogoIcon className="w-8 h-8 text-green-500"/>
                    My Topics
                </h2>
                <div className="flex gap-2 flex-wrap justify-end">
                     <button
                        onClick={onViewProjects}
                        className="flex items-center gap-2 px-3 py-2 bg-white text-slate-700 font-semibold rounded-lg hover:bg-gray-100 border border-gray-300 transition-all text-sm"
                    >
                        <WrenchScrewdriverIcon className="w-5 h-5"/>
                        Projects
                    </button>
                    <button
                        onClick={onCodeSnippets}
                        className="flex items-center gap-2 px-3 py-2 bg-white text-slate-700 font-semibold rounded-lg hover:bg-gray-100 border border-gray-300 transition-all text-sm"
                    >
                        <CommandLineIcon className="w-5 h-5"/>
                        Code Snippets
                    </button>
                     <button
                        onClick={onTestSkills}
                        className="flex items-center gap-2 px-3 py-2 bg-white text-slate-700 font-semibold rounded-lg hover:bg-gray-100 border border-gray-300 transition-all text-sm"
                    >
                        <ClipboardDocumentCheckIcon className="w-5 h-5"/>
                        Skill Tests
                    </button>
                     <button
                        onClick={() => handleCreateFolder(`New Folder ${folders.length + 1}`)}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-slate-700 font-semibold rounded-lg hover:bg-gray-200 transition-all text-sm"
                    >
                        <FolderPlusIcon className="w-5 h-5"/>
                        New Folder
                    </button>
                    <button
                        onClick={onCreateNew}
                        className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 focus:ring-green-500 transition-all duration-300 shadow-lg hover:shadow-green-500/30 text-sm"
                    >
                        + New Topic
                    </button>
                </div>
            </header>

            {lastActiveCourse && (
                <section className="mb-12">
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 shadow-lg hover:shadow-green-500/20 transition-shadow">
                        <div className="flex justify-between items-start">
                             <h2 className="text-xl font-bold text-green-800 mb-4">Jump Back In</h2>
                             <button
                                onClick={() => onSelectCourse(lastActiveCourse.id)}
                                className="flex sm:hidden items-center justify-center p-2 bg-green-600 text-white font-bold rounded-full hover:bg-green-500 transition-all shadow-md"
                                title="Continue Learning"
                            >
                                <ArrowUturnLeftIcon className="w-5 h-5"/>
                            </button>
                        </div>
                        <div className="flex gap-6 items-center">
                            <div className="flex-grow">
                                <h3 className="font-bold text-xl text-slate-800 mb-1">{lastActiveCourse.title}</h3>
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{lastActiveCourse.description}</p>
                                <ProgressBar progress={calculateProgress(lastActiveCourse)} />
                                <p className="text-xs text-gray-500 mt-1 text-right">{Math.round(calculateProgress(lastActiveCourse))}% Complete</p>
                            </div>
                            <div className="flex-shrink-0 hidden sm:block">
                                <button
                                    onClick={() => onSelectCourse(lastActiveCourse.id)}
                                    className="flex items-center justify-center gap-2 w-48 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-all shadow-md transform hover:-translate-y-0.5"
                                >
                                    <ArrowUturnLeftIcon className="w-5 h-5"/>
                                    Continue Learning
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {courses.length === 0 && folders.length === 0 ? (
                <div className="text-center py-16 px-6 bg-white border-2 border-dashed border-gray-300 rounded-xl">
                    <h3 className="text-xl font-semibold text-slate-700">Your learning canvas is blank</h3>
                    <p className="text-gray-500 mt-2 mb-6">Create a folder or start a new topic to begin.</p>
                </div>
            ) : (
                <>
                    {folders.map(folder => renderFolderSection(folder, folder.courseIds.map(id => coursesById.get(id)!).filter(Boolean)))}
                    {renderFolderSection(null, uncategorizedCourses)}
                </>
            )}
        </div>
    );
};

export default Dashboard;
