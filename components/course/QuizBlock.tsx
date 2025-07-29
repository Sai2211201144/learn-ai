import React, { useState } from 'react';
import { QuizData } from '../../types';
import { CheckCircleIcon, XCircleIcon } from '../common/Icons';

interface QuizBlockProps {
    quizData: QuizData;
}

const QuizBlock: React.FC<QuizBlockProps> = ({ quizData }) => {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState<boolean>(false);

    const handleSelectOption = (index: number) => {
        if (!isAnswered) {
            setSelectedOption(index);
        }
    };

    const getOptionClass = (index: number) => {
        if (!isAnswered) {
            return `cursor-pointer ${selectedOption === index ? 'bg-green-600 text-white ring-2 ring-green-500' : 'bg-gray-100 hover:bg-gray-200'}`;
        }
        
        // After answer is revealed
        if (index === quizData.answer) {
            return 'bg-green-100 text-green-800 ring-2 ring-green-500 pointer-events-none'; // Correct answer
        }
        if (index === selectedOption) {
            return 'bg-red-100 text-red-800 ring-2 ring-red-500 pointer-events-none'; // Incorrectly selected answer
        }
        return 'bg-gray-100 opacity-60 pointer-events-none'; // Other options
    };
    
    return (
        <div className="w-full">
            <p className="font-semibold text-slate-700 mb-3">{quizData.q}</p>
            <div className="space-y-2">
                {quizData.options.map((option, index) => (
                    <div
                        key={index}
                        onClick={() => handleSelectOption(index)}
                        className={`flex items-center p-3 rounded-md transition-all duration-200 text-slate-700 ${getOptionClass(index)}`}
                    >
                        {isAnswered && (
                            <div className="mr-3 w-5 h-5">
                                {index === quizData.answer && <CheckCircleIcon className="text-green-500" />}
                                {index !== quizData.answer && index === selectedOption && <XCircleIcon className="text-red-500" />}
                            </div>
                        )}
                        <span className="flex-grow">{option}</span>
                    </div>
                ))}
            </div>
            {!isAnswered && (
                <button
                    onClick={() => setIsAnswered(true)}
                    disabled={selectedOption === null}
                    className="mt-4 px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                    Check Answer
                </button>
            )}
        </div>
    );
};

export default QuizBlock;