import React, { useState, useEffect, useMemo } from 'react';
import * as geminiService from '../../services/geminiService';
import * as storageService from '../../services/storageService';
import { KnowledgeLevel, QuizData, TestResult, Recommendation } from '../../types';
import { LogoIcon, ClipboardDocumentCheckIcon, ChevronLeftIcon, LoadingSpinnerIcon, SparklesIcon } from '../common/Icons';
import { useAppContext } from '../../context/AppContext';

interface AssessmentPageProps {
    onBackToDashboard: () => void;
    onGenerateCourse: (level: KnowledgeLevel, topic: string) => void;
}

type AssessmentView = 'home' | 'selecting_difficulty' | 'taking_test' | 'submitting' | 'results';

const TEST_QUESTION_COUNT = 10;

const AssessmentPage: React.FC<AssessmentPageProps> = ({ onBackToDashboard, onGenerateCourse }) => {
    const { preloadedTest, clearPreloadedTest } = useAppContext();
    const [view, setView] = useState<AssessmentView>('home');
    const [allTestResults, setAllTestResults] = useState<TestResult[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState<KnowledgeLevel>('beginner');
    const [testQuestions, setTestQuestions] = useState<QuizData[]>([]);
    const [userAnswers, setUserAnswers] = useState<Map<number, number>>(new Map());
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [latestResult, setLatestResult] = useState<TestResult | null>(null);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [customTopic, setCustomTopic] = useState('');

    useEffect(() => {
        setAllTestResults(storageService.getTestResults());
    }, []);

    useEffect(() => {
        if (preloadedTest) {
            setTestQuestions(preloadedTest.questions);
            setSelectedTopic(preloadedTest.topic);
            setSelectedDifficulty(preloadedTest.difficulty);
            setCurrentQuestionIndex(0);
            setUserAnswers(new Map());
            setView('taking_test');
            clearPreloadedTest();
        }
    }, [preloadedTest, clearPreloadedTest]);

    const testResultsByTopic = useMemo(() => {
        return allTestResults.reduce((acc, result) => {
            if (!acc[result.topic] || acc[result.topic].timestamp < result.timestamp) {
                acc[result.topic] = result;
            }
            return acc;
        }, {} as Record<string, TestResult>);
    }, [allTestResults]);
    
    const uniqueTestHistoryTopics = useMemo(() => {
        return Object.keys(testResultsByTopic).sort((a,b) => testResultsByTopic[b].timestamp - testResultsByTopic[a].timestamp);
    }, [testResultsByTopic]);

    const handleStartTest = async (difficulty: KnowledgeLevel) => {
        if (!selectedTopic) return;
        setSelectedDifficulty(difficulty);
        setIsLoading(true);
        setError(null);
        setView('taking_test');

        try {
            const questions = await geminiService.generateAssessmentQuiz(selectedTopic, difficulty, TEST_QUESTION_COUNT);
            setTestQuestions(questions);
            setCurrentQuestionIndex(0);
            setUserAnswers(new Map());
        } catch (e) {
            console.error("Failed to generate assessment quiz", e);
            setError("Sorry, we couldn't create the test. Please try again.");
            setView('home');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
        setUserAnswers(prev => new Map(prev).set(questionIndex, answerIndex));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < testQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handleFinishTest = async () => {
        if (!selectedTopic) return;
        setView('submitting');
        setIsLoading(true);

        let correctCount = 0;
        for (const [qIndex, userAnswer] of userAnswers.entries()) {
            if (testQuestions[qIndex].answer === userAnswer) {
                correctCount++;
            }
        }
        
        const score = testQuestions.length > 0 ? correctCount / testQuestions.length : 0;
        const newResult: TestResult = {
            id: `test_${Date.now()}`,
            topic: selectedTopic,
            difficulty: selectedDifficulty,
            score,
            questionCount: testQuestions.length,
            timestamp: Date.now(),
        };

        storageService.saveTestResult(newResult);
        const updatedResults = [newResult, ...storageService.getTestResults()];
        setAllTestResults(updatedResults);
        setLatestResult(newResult);

        try {
            const topicResults = updatedResults.filter(r => r.topic === selectedTopic);
            const recommendations = await geminiService.generateRecommendations(selectedTopic, topicResults);
            setRecommendations(recommendations);
        } catch(e) {
            console.error("Failed to generate recommendations", e);
            setRecommendations([]);
        }

        setIsLoading(false);
        setView('results');
    };

    const handleStartCustomTest = () => {
        if (customTopic.trim()) {
            setSelectedTopic(customTopic.trim());
            setView('selecting_difficulty');
        }
    };

    const renderHome = () => (
        <div className="w-full max-w-4xl">
            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3 mb-2">
                <ClipboardDocumentCheckIcon className="w-8 h-8 text-green-500" />
                Skill Assessment
            </h2>
            <p className="text-gray-500 mb-8">Test your knowledge on any topic and get smart recommendations on what to learn next.</p>
            {error && <p className="mb-4 text-red-500">{error}</p>}
            
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md mb-8">
                 <h3 className="font-bold text-xl text-slate-800 mb-4">Test a New Topic</h3>
                 <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={customTopic}
                        onChange={e => setCustomTopic(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleStartCustomTest()}
                        placeholder="e.g., 'Advanced CSS Selectors'"
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-slate-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button 
                        onClick={handleStartCustomTest} 
                        disabled={!customTopic.trim()}
                        className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 disabled:bg-gray-300 transition-colors"
                    >
                        Start Test
                    </button>
                 </div>
            </div>
            
            {uniqueTestHistoryTopics.length > 0 && (
                <div>
                    <h3 className="text-2xl font-bold text-slate-700 mb-4">Test History</h3>
                    <div className="space-y-4">
                        {uniqueTestHistoryTopics.map(topic => {
                            const latestResult = testResultsByTopic[topic];
                            return (
                                <div key={topic} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-lg text-slate-800">{topic}</h3>
                                        {latestResult && (
                                            <div className="text-sm flex gap-4">
                                                <p className="text-gray-600">Last Score: <span className="font-bold text-green-600">{Math.round(latestResult.score * 100)}%</span></p>
                                                <p className="text-gray-500">Difficulty: <span className="capitalize">{latestResult.difficulty}</span></p>
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => { setSelectedTopic(topic); setView('selecting_difficulty'); }} className="w-full sm:w-auto flex-shrink-0 px-4 py-2 bg-gray-100 text-slate-700 font-bold rounded-lg hover:bg-gray-200 border border-gray-300 transition-colors">
                                        Test Again
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );

    const renderSelectDifficulty = () => (
        <div className="w-full max-w-lg text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Test Your Knowledge: {selectedTopic}</h2>
            <p className="text-gray-500 mb-6">Choose a difficulty level for your {TEST_QUESTION_COUNT}-question quiz.</p>
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 space-y-3">
                {(['beginner', 'intermediate', 'advanced'] as KnowledgeLevel[]).map(level => (
                    <button
                        key={level}
                        onClick={() => handleStartTest(level)}
                        className="w-full text-left p-4 bg-white rounded-lg border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all duration-200"
                    >
                        <p className="font-bold text-green-600 capitalize">{level}</p>
                    </button>
                ))}
            </div>
            <button onClick={() => setView('home')} className="mt-6 text-sm text-gray-500 hover:text-green-600">&larr; Back to Topics</button>
        </div>
    );

    const renderTakingTest = () => {
        if (isLoading || testQuestions.length === 0) {
            return (
                 <div className="flex flex-col items-center justify-center text-center p-8">
                    <LoadingSpinnerIcon className="h-12 w-12 text-green-500" />
                    <h2 className="text-2xl font-bold mt-6 text-slate-700">Generating Your Test...</h2>
                    <p className="text-lg text-gray-600 mt-2">The AI is preparing your questions.</p>
                </div>
            )
        }
        
        const currentQuestion = testQuestions[currentQuestionIndex];
        if (!currentQuestion) return renderHome(); // Safety check
        const selectedAnswer = userAnswers.get(currentQuestionIndex);

        return (
            <div className="w-full max-w-3xl">
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-600">Question {currentQuestionIndex + 1} of {testQuestions.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                       <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: `${((currentQuestionIndex + 1) / testQuestions.length) * 100}%` }}></div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-8">
                    <p className="font-semibold text-xl text-slate-700 mb-6">{currentQuestion.q}</p>
                    <div className="space-y-3">
                        {currentQuestion.options.map((option, index) => (
                            <div
                                key={index}
                                onClick={() => handleAnswerSelect(currentQuestionIndex, index)}
                                className={`flex items-center p-4 rounded-lg border-2 transition-all cursor-pointer ${selectedAnswer === index ? 'bg-green-100 border-green-500' : 'bg-white border-gray-300 hover:border-green-400'}`}
                            >
                                <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mr-4 ${selectedAnswer === index ? 'bg-green-500 border-green-500' : 'border-gray-400'}`}></span>
                                <span className="text-slate-700">{option}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    {currentQuestionIndex < testQuestions.length - 1 ? (
                        <button onClick={handleNextQuestion} disabled={selectedAnswer === undefined} className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 disabled:bg-gray-300">Next Question</button>
                    ) : (
                        <button onClick={handleFinishTest} disabled={selectedAnswer === undefined} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 disabled:bg-gray-300">Finish Test</button>
                    )}
                </div>
            </div>
        )
    };
    
    const renderSubmitting = () => (
        <div className="flex flex-col items-center justify-center text-center p-8">
            <LoadingSpinnerIcon className="h-12 w-12 text-green-500" />
            <h2 className="text-2xl font-bold mt-6 text-slate-700">Calculating Results...</h2>
            <p className="text-lg text-gray-600 mt-2">The AI is analyzing your performance to give you smart recommendations.</p>
        </div>
    );
    
    const renderResults = () => {
        if (!latestResult) return null;
        const scorePercentage = Math.round(latestResult.score * 100);

        return (
            <div className="w-full max-w-3xl text-center">
                <h2 className="text-4xl font-extrabold text-slate-800">Test Complete!</h2>
                <div className="mt-6 bg-white border border-gray-200 rounded-xl shadow-xl p-8">
                    <p className="text-lg text-gray-600">Your score for the <span className="font-bold text-slate-700">{latestResult.topic}</span> ({latestResult.difficulty}) test:</p>
                    <p className={`text-7xl font-bold my-4 ${scorePercentage > 70 ? 'text-green-500' : 'text-amber-500'}`}>{scorePercentage}%</p>
                    <p className="text-lg text-gray-600">You answered {latestResult.score * latestResult.questionCount} out of {latestResult.questionCount} questions correctly.</p>
                </div>

                <div className="mt-8 text-left bg-blue-50 border border-blue-200 rounded-xl p-8">
                    <h3 className="text-2xl font-bold text-blue-800 flex items-center gap-3 mb-4">
                        <SparklesIcon className="w-7 h-7" />
                        Next Steps & Recommendations
                    </h3>
                    {isLoading ? (
                         <LoadingSpinnerIcon className="h-6 w-6 text-blue-600" />
                    ) : recommendations.length > 0 ? (
                        <div className="space-y-4">
                            {recommendations.map((rec, index) => (
                                <div key={index} className="bg-white p-4 rounded-lg border border-blue-200">
                                    <p className="font-bold text-lg text-slate-800">{rec.topic}</p>
                                    <p className="text-sm text-gray-600 mb-3 italic">"{rec.reason}"</p>
                                    <button onClick={() => onGenerateCourse(latestResult.difficulty, rec.topic)} className="px-4 py-1.5 bg-green-600 text-white font-semibold rounded-md hover:bg-green-500 text-sm">
                                        Generate Course on this Topic
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-blue-700">Great job! We couldn't find specific recommendations right now, but feel free to try another test to gauge your skills.</p>
                    )}
                </div>

                <div className="mt-8 flex justify-center gap-4">
                     <button onClick={() => setView('home')} className="px-6 py-3 bg-gray-100 text-slate-700 font-bold rounded-lg hover:bg-gray-200 border border-gray-300">Test Another Topic</button>
                     <button onClick={onBackToDashboard} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500">Back to Dashboard</button>
                </div>
            </div>
        )
    };

    const renderContent = () => {
        switch (view) {
            case 'home': return renderHome();
            case 'selecting_difficulty': return renderSelectDifficulty();
            case 'taking_test': return renderTakingTest();
            case 'submitting': return renderSubmitting();
            case 'results': return renderResults();
            default: return renderHome();
        }
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center animate-fade-in">
            {view !== 'home' && view !== 'taking_test' && (
                <button onClick={onBackToDashboard} className="absolute top-6 left-6 flex items-center text-sm text-gray-500 hover:text-green-600 transition-colors" title="Back to My Topics">
                    <ChevronLeftIcon className="h-4 w-4 mr-1" />
                    Back to Dashboard
                </button>
            )}
            {renderContent()}
        </div>
    );
};

export default AssessmentPage;