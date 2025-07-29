import React, { useState, useEffect } from 'react';
import { KnowledgeLevel, ChatMessage, Flashcard, RelatedTopic } from './types';
import { useAppContext } from './context/AppContext';

import LoadingDisplay from './components/common/LoadingDisplay';
import CourseDetail from './components/course/CourseDetail';
import Dashboard from './components/dashboard/Dashboard';
import FlashcardModal from './components/modals/FlashcardModal';
import SocraticModal from './components/modals/SocraticModal';
import AssessmentPage from './components/assessment/AssessmentPage';
import ProjectsPage from './components/project/ProjectsPage';
import ProjectDetail from './components/project/ProjectDetail';
import CreateCourseModal from './components/modals/CreateCourseModal';
import ExploreModal from './components/modals/ExploreModal';
import CodeGeneratorModal from './components/modals/CodeGeneratorModal';

export type View = 'generating' | 'canvas' | 'courseDetail' | 'assessment' | 'projects' | 'projectDetail';

interface SocraticState {
  isOpen: boolean;
  originalText: string;
  history: ChatMessage[];
  isLoading: boolean;
}

declare global {
  interface Window {
      mermaid: any;
  }
}

function App() {
  const [view, setView] = useState<View>('canvas');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCodeGeneratorOpen, setIsCodeGeneratorOpen] = useState(false);
  
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
  const [showFlashcards, setShowFlashcards] = useState<boolean>(false);
  
  const [socraticState, setSocraticState] = useState<SocraticState>({
    isOpen: false,
    originalText: '',
    history: [],
    isLoading: false
  });

  const {
      activeCourse,
      activeProject,
      error,
      topic,
      funFacts,
      exploreModalState,
      handleGenerateCourse,
      handleCreateProject,
      handleCloseSocraticModal,
      handleSendSocraticMessage,
      handleSelectCourse,
      handleSelectProject,
      handleTestCourseConcepts,
      handleExploreTopics,
      closeExploreModal,
      setActiveCourse,
      setActiveProject
  } = useAppContext();

  useEffect(() => {
    if (window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        fontFamily: 'inherit',
        flowchart: {
          htmlLabels: true,
        },
        gantt: {
          axisFormat: '%Y-%m-%d',
        },
      });
    }
  }, []);

  const handleBackToCanvas = () => {
    setActiveCourse(null);
    setView('canvas');
  };
  
  const generateCourseFromRecommendation = (topic: string, level: KnowledgeLevel) => {
    closeExploreModal();
    handleGenerateCourse(topic, level, null, () => setView('courseDetail'), () => setView('generating'), () => setView('canvas'));
  }

  const renderContent = () => {
    switch (view) {
      case 'generating':
        return <LoadingDisplay topic={topic} funFacts={funFacts} />;
      case 'courseDetail':
        if (activeCourse) {
          return <CourseDetail
            course={activeCourse}
            onBackToCanvas={handleBackToCanvas}
            onViewFlashcards={(cards) => { setFlashcards(cards); setShowFlashcards(true); }}
            onStartSocraticDialogue={(text) => setSocraticState({ isOpen: true, originalText: text, history: [], isLoading: false})}
            onTestConcepts={() => handleTestCourseConcepts(activeCourse, () => setView('assessment'))}
            onExploreMore={() => handleExploreTopics(activeCourse)}
          />;
        }
        setView('canvas'); 
        return null;
       case 'assessment':
        return <AssessmentPage 
            onBackToDashboard={() => setView('canvas')} 
            onGenerateCourse={(level, topic) => handleGenerateCourse(topic, level, null, () => setView('courseDetail'), () => setView('generating'), () => setView('canvas'))}
        />;
       case 'projects':
        return <ProjectsPage 
          onSelectProject={(projectId) => { handleSelectProject(projectId); setView('projectDetail'); }}
          onCreateProject={(topic) => handleCreateProject(topic, () => setView('projectDetail'), () => setView('generating'), () => setView('projects'))}
          onBackToDashboard={() => setView('canvas')} 
        />;
      case 'projectDetail':
        if (activeProject) {
            return <ProjectDetail
              project={activeProject}
              onBackToProjects={() => { setActiveProject(null); setView('projects'); }}
            />
        }
        setView('projects');
        return null;
      case 'canvas':
      default:
        return <Dashboard 
            onSelectCourse={(courseId) => { handleSelectCourse(courseId); setView('courseDetail'); }} 
            onCreateNew={() => setIsCreateModalOpen(true)} 
            onTestSkills={() => setView('assessment')}
            onViewProjects={() => setView('projects')}
            onCodeSnippets={() => setIsCodeGeneratorOpen(true)}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <main className="w-full h-full flex-grow flex flex-col items-center justify-center">
        {renderContent()}
      </main>
      <CreateCourseModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGenerate={(topic, level, folderId) => {
          setIsCreateModalOpen(false);
          handleGenerateCourse(topic, level, folderId, () => setView('courseDetail'), () => setView('generating'), () => setView('canvas'));
        }}
        error={error}
      />
       <ExploreModal
          isOpen={exploreModalState.isOpen}
          isLoading={exploreModalState.isLoading}
          onClose={closeExploreModal}
          courseTitle={exploreModalState.courseTitle}
          relatedTopics={exploreModalState.topics}
          onGenerateCourse={generateCourseFromRecommendation}
      />
      <CodeGeneratorModal
        isOpen={isCodeGeneratorOpen}
        onClose={() => setIsCodeGeneratorOpen(false)}
      />
      {showFlashcards && flashcards && (
        <FlashcardModal flashcards={flashcards} onClose={() => setShowFlashcards(false)} />
      )}
      {socraticState.isOpen && (
        <SocraticModal
          isOpen={socraticState.isOpen}
          onClose={() => handleCloseSocraticModal(setSocraticState)}
          originalText={socraticState.originalText}
          chatHistory={socraticState.history}
          isLoading={socraticState.isLoading}
          onSendMessage={(message) => handleSendSocraticMessage(message, socraticState, setSocraticState)}
        />
      )}
      <footer className="w-full max-w-4xl text-center mt-12 text-gray-500 text-xs">
        <p>LearnAI | AI-Powered Learning | Progress is saved in your browser.</p>
      </footer>
    </div>
  );
}

export default App;