import React, { useState } from 'react';
import { CloseIcon, CommandLineIcon, LoadingSpinnerIcon } from '../common/Icons';
import * as geminiService from '../../services/geminiService';
import CodeBlock from '../course/CodeBlock';

interface CodeGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LANGUAGES = ['JavaScript', 'Python', 'TypeScript', 'HTML', 'CSS', 'SQL', 'Go', 'Java', 'C#'];

const CodeGeneratorModal: React.FC<CodeGeneratorModalProps> = ({ isOpen, onClose }) => {
    const [prompt, setPrompt] = useState('');
    const [language, setLanguage] = useState('JavaScript');
    const [generatedCode, setGeneratedCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a description of the code you want.');
            return;
        }
        setError('');
        setIsLoading(true);
        setGeneratedCode('');
        try {
            const code = await geminiService.generateCodeSnippet(prompt, language);
            setGeneratedCode(code);
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'Failed to generate code snippet.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-modal-bg" 
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
             <div
                className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl border border-gray-200 animate-modal-content flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-4 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                            <CommandLineIcon className="w-7 h-7 text-green-500" />
                            Code Snippet Generator
                        </h2>
                        <p className="text-gray-500 mt-1">Describe what you want to build, and the AI will generate it for you.</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-700 transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow flex flex-col gap-4 min-h-0">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-grow">
                             <label htmlFor="code-prompt" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <input
                                id="code-prompt"
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                placeholder="e.g., 'a button with a hover effect'"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="language-select" className="block text-sm font-medium text-slate-700 mb-1">Language</label>
                            <select
                                id="language-select"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full sm:w-48 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 px-5 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 disabled:bg-gray-400"
                    >
                        {isLoading ? <><LoadingSpinnerIcon className="w-5 h-5"/> Generating...</> : 'Generate Code'}
                    </button>
                    
                    <div className="flex-grow min-h-0 overflow-y-auto bg-slate-900 rounded-lg">
                        {generatedCode ? (
                            <CodeBlock code={generatedCode} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500">
                                {isLoading ? "..." : "Your generated code will appear here."}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeGeneratorModal;