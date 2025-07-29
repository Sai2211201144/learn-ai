import React from 'react';
import { Flashcard } from '../../types';

interface FlashcardProps {
    flashcard: Flashcard;
    isFlipped: boolean;
    onFlip: () => void;
}

const SingleFlashcard: React.FC<FlashcardProps> = ({ flashcard, isFlipped, onFlip }) => {
    return (
        <div
            className="w-full h-80 cursor-pointer group"
            onClick={onFlip}
            style={{ transformStyle: 'preserve-3d', transition: 'transform 0.6s' }}
        >
            <div 
                className={`relative w-full h-full duration-500`}
                style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
                {/* Front of Card */}
                <div className="absolute w-full h-full bg-white border-2 border-green-500 rounded-xl shadow-xl p-6 flex flex-col justify-center items-center text-center" style={{ backfaceVisibility: 'hidden' }}>
                    <p className="text-xs text-green-600 font-bold tracking-widest uppercase">Question</p>
                    <p className="text-2xl font-bold text-slate-800 mt-4">{flashcard.question}</p>
                </div>

                {/* Back of Card */}
                <div className="absolute w-full h-full bg-gray-100 border-2 border-gray-300 rounded-xl shadow-xl p-6 flex flex-col justify-center items-center text-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                    <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">Answer</p>
                    <p className="text-xl font-medium text-slate-700 mt-4 leading-relaxed">{flashcard.answer}</p>
                </div>
            </div>
        </div>
    );
};

export default SingleFlashcard;