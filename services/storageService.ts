import { Course, Progress, Folder, TestResult, Project, ProjectProgress } from './types';

const COURSES_KEY = 'mindflow:courses';
const FOLDERS_KEY = 'mindflow:folders';
const PROJECTS_KEY = 'mindflow:projects';
const PROGRESS_KEY_PREFIX = 'mindflow:progress:';
const PROJECT_PROGRESS_KEY_PREFIX = 'mindflow:project_progress:';
const TEST_RESULTS_KEY = 'mindflow:test_results';

// --- Folder Management ---

export const getFolders = (): Folder[] => {
    try {
        const savedFolders = localStorage.getItem(FOLDERS_KEY);
        return savedFolders ? JSON.parse(savedFolders) : [];
    } catch (error) {
        console.error("Failed to load folders from localStorage", error);
        return [];
    }
};

export const saveFolders = (folders: Folder[]): void => {
    try {
        localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    } catch (error) {
        console.error("Failed to save folders to localStorage", error);
    }
};

// --- Course Management ---

export const getCourses = (): Course[] => {
    try {
        const savedCourses = localStorage.getItem(COURSES_KEY);
        return savedCourses ? JSON.parse(savedCourses) : [];
    } catch (error) {
        console.error("Failed to load courses from localStorage", error);
        return [];
    }
};

export const saveCourse = (course: Course): void => {
    const courses = getCourses();
    const updatedCourses = [course, ...courses.filter(c => c.id !== course.id)];
    try {
        localStorage.setItem(COURSES_KEY, JSON.stringify(updatedCourses));
    } catch (error) {
        console.error("Failed to save course to localStorage", error);
    }
};

export const updateCourse = (courseToUpdate: Course): void => {
    const courses = getCourses();
    const courseIndex = courses.findIndex(c => c.id === courseToUpdate.id);
    if (courseIndex > -1) {
        courses[courseIndex] = courseToUpdate;
        try {
            localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
        } catch (error) {
            console.error("Failed to update course in localStorage", error);
        }
    } else {
        // if course doesn't exist, treat it as a new save
        saveCourse(courseToUpdate);
    }
};

export const deleteCourse = (courseId: string): void => {
    // Delete course object
    const courses = getCourses();
    const updatedCourses = courses.filter(c => c.id !== courseId);
    try {
        localStorage.setItem(COURSES_KEY, JSON.stringify(updatedCourses));
         // Also remove from any folder it might be in
        const folders = getFolders();
        const updatedFolders = folders.map(folder => ({
            ...folder,
            courseIds: folder.courseIds.filter(id => id !== courseId)
        }));
        saveFolders(updatedFolders);
    } catch (error) {
        console.error("Failed to delete course from localStorage", error);
    }
};

// --- Progress Management ---

const getProgressKey = (courseId: string) => `${PROGRESS_KEY_PREFIX}${courseId}`;

export const getProgress = (courseId: string): Progress => {
    try {
        const savedProgress = localStorage.getItem(getProgressKey(courseId));
        return savedProgress ? new Map(JSON.parse(savedProgress)) : new Map();
    } catch (error) {
        console.error(`Failed to get progress for course ${courseId}`, error);
        return new Map();
    }
};

export const saveProgress = (courseId: string, progress: Progress): void => {
    try {
        localStorage.setItem(getProgressKey(courseId), JSON.stringify(Array.from(progress.entries())));
    } catch (error) {
        console.error(`Failed to save progress for course ${courseId}`, error);
    }
};

export const toggleLessonProgress = (courseId: string, lessonId: string): Progress => {
    const progress = getProgress(courseId);
    if (progress.has(lessonId)) {
        progress.delete(lessonId);
    } else {
        progress.set(lessonId, Date.now());
    }
    saveProgress(courseId, progress);
    return progress;
};

export const deleteProgress = (courseId: string): void => {
    try {
        localStorage.removeItem(getProgressKey(courseId));
    } catch (error) {
        console.error(`Failed to delete progress for course ${courseId}`, error);
    }
};

export const getAllProgress = (): Record<string, Progress> => {
    const courses = getCourses();
    const allProgress: Record<string, Progress> = {};
    courses.forEach(course => {
        allProgress[course.id] = getProgress(course.id);
    });
    return allProgress;
};

// --- Test Result Management ---

export const getTestResults = (): TestResult[] => {
    try {
        const savedResults = localStorage.getItem(TEST_RESULTS_KEY);
        return savedResults ? JSON.parse(savedResults) : [];
    } catch (error) {
        console.error("Failed to load test results from localStorage", error);
        return [];
    }
};

export const saveTestResult = (result: TestResult): void => {
    const results = getTestResults();
    const updatedResults = [result, ...results];
    try {
        localStorage.setItem(TEST_RESULTS_KEY, JSON.stringify(updatedResults));
    } catch (error) {
        console.error("Failed to save test result to localStorage", error);
    }
};

// --- Project Management ---

export const getProjects = (): Project[] => {
    try {
        const savedProjects = localStorage.getItem(PROJECTS_KEY);
        return savedProjects ? JSON.parse(savedProjects) : [];
    } catch (error) {
        console.error("Failed to load projects from localStorage", error);
        return [];
    }
};

export const saveProject = (project: Project): void => {
    const projects = getProjects();
    const updatedProjects = [project, ...projects.filter(p => p.id !== project.id)];
    try {
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));
    } catch (error) {
        console.error("Failed to save project to localStorage", error);
    }
};

export const deleteProject = (projectId: string): void => {
    const projects = getProjects();
    const updatedProjects = projects.filter(p => p.id !== projectId);
    try {
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));
    } catch (error) {
        console.error("Failed to delete project from localStorage", error);
    }
};

// --- Project Progress Management ---

const getProjectProgressKey = (projectId: string) => `${PROJECT_PROGRESS_KEY_PREFIX}${projectId}`;

export const getProjectProgress = (projectId: string): ProjectProgress => {
    try {
        const savedProgress = localStorage.getItem(getProjectProgressKey(projectId));
        return savedProgress ? new Map(JSON.parse(savedProgress)) : new Map();
    } catch (error) {
        console.error(`Failed to get progress for project ${projectId}`, error);
        return new Map();
    }
};

export const saveProjectProgress = (projectId: string, progress: ProjectProgress): void => {
    try {
        localStorage.setItem(getProjectProgressKey(projectId), JSON.stringify(Array.from(progress.entries())));
    } catch (error) {
        console.error(`Failed to save progress for project ${projectId}`, error);
    }
};

export const toggleProjectStepProgress = (projectId: string, stepId: string): ProjectProgress => {
    const progress = getProjectProgress(projectId);
    if (progress.has(stepId)) {
        progress.delete(stepId);
    } else {
        progress.set(stepId, true);
    }
    saveProjectProgress(projectId, progress);
    return progress;
};

export const deleteProjectProgress = (projectId: string): void => {
    try {
        localStorage.removeItem(getProjectProgressKey(projectId));
    } catch (error) {
        console.error(`Failed to delete progress for project ${projectId}`, error);
    }
};

export const getAllProjectProgress = (): Record<string, ProjectProgress> => {
    const projects = getProjects();
    const allProgress: Record<string, ProjectProgress> = {};
    projects.forEach(project => {
        allProgress[project.id] = getProjectProgress(project.id);
    });
    return allProgress;
};