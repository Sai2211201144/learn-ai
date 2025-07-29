import React, { useState } from 'react';
import { TriageChallengeData } from '../../types';
import DiagramBlock from './DiagramBlock';
import { CheckCircleIcon, XCircleIcon, LightBulbIcon } from '../common/Icons';

interface TriageChallengeBlockProps {
    challengeData: TriageChallengeData;
}

const TriageChallengeBlock: React.FC<TriageChallengeBlockProps> = ({ challengeData }) => {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState<boolean>(false);

    const handleSelectOption = (index: number) => {
        if (!isAnswered) {
            setSelectedOption(index);
        }
    };

    const handleSubmit = () => {
        if (selectedOption !== null) {
            setIsAnswered(true);
        }
    };

    const getOptionClass = (index: number) => {
        if (!isAnswered) {
            return `cursor-pointer ${selectedOption === index ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-500' : 'bg-white border-gray-300 hover:border-blue-400'}`;
        }
        
        // After answer is revealed
        if (index === challengeData.correctOptionIndex) {
            return 'bg-green-100 border-green-500 ring-2 ring-green-500 pointer-events-none';
        }
        if (index === selectedOption) {
            return 'bg-red-100 border-red-500 ring-2 ring-red-500 pointer-events-none';
        }
        return 'bg-gray-100 border-gray-300 opacity-60 pointer-events-none';
    };

    return (
        <div className="w-full">
            <h4 className="font-bold text-lg text-slate-800 mb-2">Triage Challenge</h4>
            <p className="text-slate-700 mb-4">{challengeData.scenario}</p>

            <div className="mb-4 border rounded-lg p-2 bg-gray-50">
                <h5 className="text-sm font-semibold text-gray-600 mb-2 text-center">Evidence</h5>
                <DiagramBlock mermaidString={challengeData.evidence} />
            </div>

            <div className="space-y-3">
                {challengeData.options.map((option, index) => (
                    <div
                        key={index}
                        onClick={() => handleSelectOption(index)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 ${getOptionClass(index)}`}
                    >
                        <div className="flex items-start">
                             {isAnswered && (
                                <div className="mr-3 w-5 h-5 flex-shrink-0 mt-1">
                                    {index === challengeData.correctOptionIndex && <CheckCircleIcon className="text-green-500" />}
                                    {index !== challengeData.correctOptionIndex && index === selectedOption && <XCircleIcon className="text-red-500" />}
                                </div>
                            )}
                            <div>
                                <p className="font-semibold text-slate-800">{option.title}</p>
                                <p className="text-sm text-gray-600">{option.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {!isAnswered ? (
                <button
                    onClick={handleSubmit}
                    disabled={selectedOption === null}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                    Submit Diagnosis
                </button>
            ) : (
                <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg animate-fade-in">
                    <h5 className="font-bold text-yellow-800 flex items-center gap-2 mb-2"><LightBulbIcon className="w-5 h-5"/> Explanation</h5>
                    <p className="text-sm text-yellow-900 leading-relaxed">{challengeData.explanation}</p>
                </div>
            )}
        </div>
    );
};

export default TriageChallengeBlock;
