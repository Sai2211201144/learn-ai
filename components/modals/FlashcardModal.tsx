import React, { useState, useEffect, useCallback } from 'react';
import { Flashcard } from '../../types';
import SingleFlashcard from './Flashcard';
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon } from '../common/Icons';

interface FlashcardModalProps {
    flashcards: Flashcard[];
    onClose: () => void;
}

const FlashcardModal: React.FC<FlashcardModalProps> = ({ flashcards, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const handleNext = useCallback(() => {
        if (currentIndex < flashcards.length - 1) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(currentIndex + 1), 150);
        }
    }, [currentIndex, flashcards.length]);

    const handlePrev = () => {
        if (currentIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(currentIndex - 1), 150);
        }
    };
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === ' ') {
                e.preventDefault(); // prevent scrolling
                setIsFlipped(f => !f);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, handleNext, handlePrev]);

    return (
        <div 
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
            aria-modal="true"
            role="dialog"
        >
            <div className="relative w-full max-w-2xl p-4">
                <button
                    onClick={onClose}
                    className="absolute -top-10 right-0 sm:top-0 sm:-right-14 text-gray-300 hover:text-white transition-colors"
                    aria-label="Close flashcards"
                >
                    <CloseIcon className="w-8 h-8" />
                </button>
                
                <div style={{ perspective: '1000px' }}>
                    <SingleFlashcard 
                        flashcard={flashcards[currentIndex]}
                        isFlipped={isFlipped}
                        onFlip={() => setIsFlipped(!isFlipped)}
                    />
                </div>

                <div className="flex items-center justify-between mt-6">
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-md hover:bg-gray-200 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Previous card"
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                        Prev
                    </button>
                    <p className="text-gray-200 font-semibold">
                        Card {currentIndex + 1} of {flashcards.length}
                    </p>
                    <button
                        onClick={handleNext}
                        disabled={currentIndex === flashcards.length - 1}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-md hover:bg-gray-200 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Next card"
                    >
                        Next
                        <ChevronRightIcon className="w-5 h-5" />
                    </button>
                </div>
                 <p className="text-center text-gray-400 text-sm mt-4">
                    Tip: Use <kbd className="p-1 rounded bg-gray-700 text-gray-200">Spacebar</kbd> to flip and <kbd className="p-1 rounded bg-gray-700 text-gray-200">←</kbd> <kbd className="p-1 rounded bg-gray-700 text-gray-200">→</kbd> keys to navigate.
                </p>
            </div>
        </div>
    );
};

export default FlashcardModal;