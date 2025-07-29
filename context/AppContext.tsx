import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import * as storageService from '../services/storageService';
import * as geminiService from '../services/geminiService';
import { Course, Folder, Project, Progress, ProjectProgress, KnowledgeLevel, ChatMessage, Lesson, RelatedTopic, QuizData } from '../types';

interface ExploreModalState {
    isOpen: boolean;
    isLoading: boolean;
    courseTitle: string;
    topics: RelatedTopic[];
}

interface PreloadedTestState {
    topic: string;
    difficulty: KnowledgeLevel;
    questions: QuizData[];
}

interface AppContextType {
    courses: Course[];
    folders: Folder[];
    projects: Project[];
    progressData: Record<string, Progress>;
    projectProgressData: Record<string, ProjectProgress>;
    activeCourse: Course | null;
    activeProject: Project | null;
    topic: string;
    error: string | null;
    funFacts: string[];
    generatingLessonFlashcardId: string | null;
    lastActiveCourseId: string | null;
    exploreModalState: ExploreModalState;
    preloadedTest: PreloadedTestState | null;
    
    setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
    setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    setActiveCourse: React.Dispatch<React.SetStateAction<Course | null>>;
    setActiveProject: React.Dispatch<React.SetStateAction<Project | null>>;
    clearPreloadedTest: () => void;

    handleGenerateCourse: (topic: string, level: KnowledgeLevel, folderId: string | null, setViewCourse: () => void, setViewGenerating: () => void, setViewCanvas: () => void) => void;
    handleSelectCourse: (courseId: string) => void;
    handleDeleteCourse: (courseId: string) => void;
    handleToggleLessonComplete: (courseId: string, lessonId: string) => void;
    
    handleCreateFolder: (name: string) => void;
    handleDeleteFolder: (folderId: string) => void;
    handleUpdateFolderName: (folderId: string, newName: string) => void;
    handleMoveCourseToFolder: (courseId: string, targetFolderId: string | null) => void;

    handleCreateProject: (projectTopic: string, setViewProject: () => void, setViewGenerating: () => void, setViewProjects: () => void) => void;
    handleSelectProject: (projectId: string) => void;
    handleDeleteProject: (projectId: string) => void;
    handleToggleProjectStepComplete: (projectId: string, stepId: string) => void;

    handleGenerateLessonFlashcards: (lessonId: string) => void;
    handleSaveNote: (courseId: string, lessonId: string, note: string) => void;
    handleCloseSocraticModal: (setSocraticState: React.Dispatch<React.SetStateAction<any>>) => void;
    handleSendSocraticMessage: (message: string, socraticState: any, setSocraticState: React.Dispatch<React.SetStateAction<any>>) => void;
    
    handleTestCourseConcepts: (course: Course, navigateToAssessment: () => void) => void;
    handleExploreTopics: (course: Course) => void;
    closeExploreModal: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [progressData, setProgressData] = useState<Record<string, Progress>>({});
    const [projectProgressData, setProjectProgressData] = useState<Record<string, ProjectProgress>>({});
    const [activeCourse, setActiveCourse] = useState<Course | null>(null);
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [topic, setTopic] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [funFacts, setFunFacts] = useState<string[]>([]);
    const [generatingLessonFlashcardId, setGeneratingLessonFlashcardId] = useState<string | null>(null);
    const [preloadedTest, setPreloadedTest] = useState<PreloadedTestState | null>(null);
    const [exploreModalState, setExploreModalState] = useState<ExploreModalState>({
        isOpen: false,
        isLoading: false,
        courseTitle: '',
        topics: [],
    });

    useEffect(() => {
        const savedCourses = storageService.getCourses();
        const savedFolders = storageService.getFolders();
        const savedProjects = storageService.getProjects();
        const savedProgress = storageService.getAllProgress();
        const savedProjectProgress = storageService.getAllProjectProgress();

        setCourses(savedCourses);
        setFolders(savedFolders);
        setProjects(savedProjects);
        setProgressData(savedProgress);
        setProjectProgressData(savedProjectProgress);
    }, []);

    const lastActiveCourseId = useMemo(() => {
        let lastTimestamp = 0;
        let lastCourseId: string | null = null;
        if (!progressData || Object.keys(progressData).length === 0) return null;
        for (const courseId in progressData) {
            const progressMap = progressData[courseId];
            if (progressMap) {
                for (const timestamp of progressMap.values()) {
                    if (timestamp > lastTimestamp) {
                        lastTimestamp = timestamp;
                        lastCourseId = courseId;
                    }
                }
            }
        }
        return lastCourseId;
    }, [progressData]);
    
    const clearPreloadedTest = useCallback(() => {
        setPreloadedTest(null);
    }, []);

    const handleGenerateCourse = useCallback(async (topic: string, level: KnowledgeLevel, folderId: string | null, setViewCourse: () => void, setViewGenerating: () => void, setViewCanvas: () => void) => {
        setTopic(topic);
        setViewGenerating();
        setError(null);
        setFunFacts([]);

        geminiService.generateFunFacts(topic)
            .then(setFunFacts)
            .catch(e => console.error("Failed to fetch fun facts for loading screen:", e));

        try {
            const generatedCourse = await geminiService.generateCourse(topic, level);
            storageService.saveCourse(generatedCourse);

            if (folderId) {
                const updatedFolders = folders.map(f =>
                    f.id === folderId ? { ...f, courseIds: [...f.courseIds, generatedCourse.id] } : f
                );
                setFolders(updatedFolders);
                storageService.saveFolders(updatedFolders);
            }

            setCourses(prev => [generatedCourse, ...prev]);
            setActiveCourse(generatedCourse);
            setViewCourse();
        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to generate the course. ${errorMessage}. Please try again.`);
            setViewCanvas();
        }
    }, [folders]);

    const handleSelectCourse = (courseId: string) => {
        const course = courses.find(c => c.id === courseId);
        if (course) setActiveCourse(course);
    };

    const handleDeleteCourse = (courseId: string) => {
        const remainingCourses = courses.filter(c => c.id !== courseId);
        const updatedFolders = folders.map(f => ({ ...f, courseIds: f.courseIds.filter(id => id !== courseId) }));
        setCourses(remainingCourses);
        setFolders(updatedFolders);
        setProgressData(prev => { const newProgress = { ...prev }; delete newProgress[courseId]; return newProgress; });
        storageService.deleteCourse(courseId);
        storageService.deleteProgress(courseId);
    };

    const handleToggleLessonComplete = (courseId: string, lessonId: string) => {
        const newProgress = storageService.toggleLessonProgress(courseId, lessonId);
        setProgressData(prev => ({ ...prev, [courseId]: newProgress }));
    };

    const handleCreateFolder = (name: string) => {
        const newFolder: Folder = { id: `folder_${Date.now()}`, name, courseIds: [] };
        const updatedFolders = [...folders, newFolder];
        setFolders(updatedFolders);
        storageService.saveFolders(updatedFolders);
    };

    const handleDeleteFolder = (folderId: string) => {
        const updatedFolders = folders.filter(f => f.id !== folderId);
        setFolders(updatedFolders);
        storageService.saveFolders(updatedFolders);
    };

    const handleUpdateFolderName = (folderId: string, newName: string) => {
        const updatedFolders = folders.map(f => (f.id === folderId ? { ...f, name: newName } : f));
        setFolders(updatedFolders);
        storageService.saveFolders(updatedFolders);
    };

    const handleMoveCourseToFolder = (courseId: string, targetFolderId: string | null) => {
        let updatedFolders = folders.map(f => ({ ...f, courseIds: f.courseIds.filter(id => id !== courseId) }));
        if (targetFolderId) {
            const folderIndex = updatedFolders.findIndex(f => f.id === targetFolderId);
            if (folderIndex !== -1) updatedFolders[folderIndex].courseIds.push(courseId);
        }
        setFolders(updatedFolders);
        storageService.saveFolders(updatedFolders);
    };

    const handleGenerateLessonFlashcards = useCallback(async (lessonId: string) => {
        if (!activeCourse) return;
        setGeneratingLessonFlashcardId(lessonId);
        try {
            const lesson = activeCourse.modules.flatMap(m => m.lessons).find(l => l.id === lessonId);
            if (!lesson) throw new Error("Lesson not found");
            const generatedCards = await geminiService.generateLessonFlashcards(lesson);
            const updatedCourse = { ...activeCourse, modules: activeCourse.modules.map(m => ({ ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, flashcards: generatedCards } : l) })) };
            storageService.updateCourse(updatedCourse);
            setActiveCourse(updatedCourse);
            setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
        } catch (e) {
            console.error("Failed to generate lesson flashcards", e);
        } finally {
            setGeneratingLessonFlashcardId(null);
        }
    }, [activeCourse]);

    const handleSaveNote = useCallback((courseId: string, lessonId: string, note: string) => {
        const courseToUpdate = courses.find(c => c.id === courseId);
        if (!courseToUpdate) return;
        const updatedCourse = { ...courseToUpdate, modules: courseToUpdate.modules.map(m => ({ ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, notes: note } : l) })) };
        storageService.updateCourse(updatedCourse);
        setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
        if (activeCourse?.id === courseId) setActiveCourse(updatedCourse);
    }, [courses, activeCourse]);
    
    const handleCloseSocraticModal = (setSocraticState: React.Dispatch<React.SetStateAction<any>>) => {
        setSocraticState({ isOpen: false, originalText: '', history: [], isLoading: false });
    };

    const handleSendSocraticMessage = useCallback(async (message: string, socraticState: any, setSocraticState: React.Dispatch<React.SetStateAction<any>>) => {
        const newHistory: ChatMessage[] = [...socraticState.history, { role: 'user', content: message }];
        setSocraticState(prev => ({ ...prev, history: newHistory, isLoading: true }));
        try {
            const aiResponse = await geminiService.continueSocraticDialogue(socraticState.originalText, newHistory);
            setSocraticState(prev => ({ ...prev, history: [...newHistory, { role: 'model', content: aiResponse }], isLoading: false }));
        } catch (e) {
            console.error("Failed to get Socratic response", e);
            setSocraticState(prev => ({ ...prev, history: [...newHistory, { role: 'model', content: "I'm having trouble thinking. Please try again." }], isLoading: false }));
        }
    }, []);
    
    const handleCreateProject = useCallback(async (projectTopic: string, setViewProject: () => void, setViewGenerating: () => void, setViewProjects: () => void) => {
        setTopic(projectTopic);
        setViewGenerating();
        setError(null);
        setFunFacts([]);
        geminiService.generateFunFacts(projectTopic).then(setFunFacts).catch(e => console.error("Failed to fetch fun facts for project:", e));
        try {
            const generatedProject = await geminiService.generateProjectScaffold(projectTopic);
            storageService.saveProject(generatedProject);
            setProjects(prev => [generatedProject, ...prev]);
            setActiveProject(generatedProject);
            setViewProject();
        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to generate the project. ${errorMessage}. Please try again.`);
            setViewProjects();
        }
    }, []);

    const handleSelectProject = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (project) setActiveProject(project);
    };

    const handleDeleteProject = (projectId: string) => {
        const remainingProjects = projects.filter(p => p.id !== projectId);
        setProjects(remainingProjects);
        storageService.deleteProject(projectId);
        storageService.deleteProjectProgress(projectId);
        setProjectProgressData(prev => { const newProgress = { ...prev }; delete newProgress[projectId]; return newProgress; });
    };

    const handleToggleProjectStepComplete = (projectId: string, stepId: string) => {
        const newProgress = storageService.toggleProjectStepProgress(projectId, stepId);
        setProjectProgressData(prev => ({ ...prev, [projectId]: newProgress }));
    };

    const handleTestCourseConcepts = useCallback(async (course: Course, navigateToAssessment: () => void) => {
        try {
            const questions = await geminiService.generateTestFromCourse(course);
            setPreloadedTest({
                questions,
                topic: course.title,
                difficulty: course.knowledgeLevel,
            });
            navigateToAssessment();
        } catch(e) {
            console.error("Failed to generate test from course", e);
            setError(e instanceof Error ? e.message : "Could not generate the test for this course.");
        }
    }, []);

    const handleExploreTopics = useCallback(async (course: Course) => {
        setExploreModalState({
            isOpen: true,
            isLoading: true,
            courseTitle: course.title,
            topics: [],
        });
        try {
            const topics = await geminiService.generateRelatedTopics(course);
            setExploreModalState(prev => ({ ...prev, topics, isLoading: false }));
        } catch(e) {
            console.error("Failed to generate related topics", e);
            setExploreModalState(prev => ({ ...prev, isLoading: false })); // Still show modal but empty
        }
    }, []);
    
    const closeExploreModal = useCallback(() => {
        setExploreModalState({ isOpen: false, isLoading: false, courseTitle: '', topics: [] });
    }, []);

    const value = {
        courses, setCourses,
        folders, setFolders,
        projects, setProjects,
        progressData,
        projectProgressData,
        activeCourse, setActiveCourse,
        activeProject, setActiveProject,
        topic,
        error,
        funFacts,
        generatingLessonFlashcardId,
        lastActiveCourseId,
        exploreModalState,
        preloadedTest,
        clearPreloadedTest,
        handleGenerateCourse,
        handleSelectCourse,
        handleDeleteCourse,
        handleToggleLessonComplete,
        handleCreateFolder,
        handleDeleteFolder,
        handleUpdateFolderName,
        handleMoveCourseToFolder,
        handleCreateProject,
        handleSelectProject,
        handleDeleteProject,
        handleToggleProjectStepComplete,
        handleGenerateLessonFlashcards,
        handleSaveNote,
        handleCloseSocraticModal,
        handleSendSocraticMessage,
        handleTestCourseConcepts,
        handleExploreTopics,
        closeExploreModal,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};