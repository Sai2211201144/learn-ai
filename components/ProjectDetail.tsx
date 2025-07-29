import React, { useState } from 'react';
import { Project } from '../../types';
import { useAppContext } from '../../context/AppContext';
import CodeBlock from '../course/CodeBlock';
import ProgressBar from '../common/ProgressBar';
import { ChevronLeftIcon, WrenchScrewdriverIcon, CheckIcon } from '../common/Icons';

interface ProjectDetailProps {
    project: Project;
    onBackToProjects: () => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBackToProjects }) => {
    const { projectProgressData, handleToggleProjectStepComplete } = useAppContext();
    const progress = projectProgressData[project.id] || new Map();

    const [activeStepId, setActiveStepId] = useState(project.steps[0]?.id || '');

    const activeStep = project.steps.find(step => step.id === activeStepId);
    
    const projectProgress = (progress.size / project.steps.length) * 100;

    return (
        <div className="w-full h-full max-w-7xl animate-fade-in-up flex flex-col">
            <header className="mb-6 flex-shrink-0">
                 <button
                    onClick={onBackToProjects}
                    className="flex items-center text-sm text-gray-500 hover:text-green-600 transition-colors mb-4"
                    title="Back to Projects"
                >
                    <ChevronLeftIcon className="h-4 w-4 mr-1" />
                    Back to Projects
                </button>
                <div className="flex items-center mb-2">
                    <WrenchScrewdriverIcon className="h-8 w-8 mr-3 text-green-500 flex-shrink-0" />
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-800">{project.title}</h1>
                        <p className="text-gray-500 text-sm">{project.description}</p>
                    </div>
                </div>
                 <div className="mt-4">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-600">Project Progress</span>
                        <span className="text-sm font-medium text-green-600">{progress.size} / {project.steps.length} Steps Complete</span>
                    </div>
                    <ProgressBar progress={projectProgress} />
                </div>
            </header>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
                {/* Steps Column */}
                <aside className="lg:col-span-4 h-full overflow-y-auto pr-4">
                    <div className="space-y-2">
                        {project.steps.map((step, index) => {
                            const isComplete = progress.has(step.id);
                            const isActive = step.id === activeStepId;
                            return (
                                <button
                                    key={step.id}
                                    onClick={() => setActiveStepId(step.id)}
                                    className={`w-full text-left p-4 rounded-lg border-2 flex items-start gap-4 transition-all ${
                                        isActive ? 'bg-green-50 border-green-500' : 
                                        isComplete ? 'bg-gray-100 border-gray-200 opacity-70' : 
                                        'bg-white border-gray-200 hover:border-green-400'
                                    }`}
                                >
                                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${isComplete ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                        {isComplete ? <CheckIcon className="w-4 h-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{step.title}</h3>
                                        {isActive && <p className="text-sm text-gray-600 mt-1">Now viewing</p>}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </aside>

                {/* Content Column */}
                <main className="lg:col-span-8 h-full overflow-y-auto bg-white border border-gray-200 rounded-xl">
                    {activeStep ? (
                        <div className="p-6 md:p-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">{activeStep.title}</h2>
                            <p className="text-gray-700 leading-relaxed mb-6">{activeStep.description}</p>
                            
                            <h3 className="font-semibold text-lg text-slate-700 mb-2">Code Stub</h3>
                            <CodeBlock code={activeStep.codeStub} />

                            <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
                                 <h3 className="font-semibold text-lg text-yellow-800 mb-2">Your Challenge</h3>
                                 <p className="text-yellow-900">{activeStep.challenge}</p>
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <button
                                    onClick={() => handleToggleProjectStepComplete(project.id, activeStep.id)}
                                    className={`w-full max-w-xs flex items-center justify-center gap-2 px-6 py-3 text-white font-bold rounded-lg transition-colors ${progress.has(activeStep.id) ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-600 hover:bg-green-500'}`}
                                >
                                    <div className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${progress.has(activeStep.id) ? 'bg-white' : ''}`}>
                                       {progress.has(activeStep.id) && <CheckIcon className="w-4 h-4 text-gray-500"/>}
                                    </div>
                                    {progress.has(activeStep.id) ? 'Mark as Incomplete' : 'Mark Step as Complete'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">Select a step to begin.</div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ProjectDetail;
