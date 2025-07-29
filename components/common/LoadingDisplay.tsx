import React, { useState, useEffect } from 'react';
import { AnimatedLearnAIIcon, SparklesIcon } from './Icons';

interface LoadingDisplayProps {
    topic: string;
    funFacts: string[];
}

const LoadingDisplay: React.FC<LoadingDisplayProps> = ({ topic, funFacts }) => {
    const [currentFactIndex, setCurrentFactIndex] = useState(0);
    const [animationKey, setAnimationKey] = useState(0);

    useEffect(() => {
        if (funFacts.length > 0) {
            const interval = setInterval(() => {
                setAnimationKey(prevKey => prevKey + 1); // Trigger re-animation
                setCurrentFactIndex(prevIndex => (prevIndex + 1) % funFacts.length);
            }, 6000); // Change fact every 6 seconds

            return () => clearInterval(interval);
        }
    }, [funFacts]);


    return (
        <div className="flex flex-col items-center justify-center text-center p-8 animate-fade-in w-full max-w-2xl">
            <AnimatedLearnAIIcon className="h-24 w-24 text-green-500" />
            <h2 className="text-3xl font-bold mt-8 text-slate-700">Generating Your Course...</h2>
            <p className="text-lg text-gray-600 mt-2">
                Our AI is crafting a personalized course on <span className="font-semibold text-green-600">"{topic}"</span> for you.
            </p>
            <p className="text-sm text-gray-500 mt-1">This can take up to 60 seconds.</p>
            
            <div className="mt-12 w-full h-24">
                {funFacts.length > 0 && (
                    <div className="animate-fade-in-up">
                        <h3 className="flex items-center justify-center gap-2 text-md font-semibold text-gray-500 tracking-wider uppercase">
                            <SparklesIcon className="w-5 h-5 text-yellow-400" />
                            Did you know?
                        </h3>
                        <p 
                            key={animationKey} 
                            className="text-lg text-slate-600 mt-3 animate-fade-in-up-fast"
                        >
                            {funFacts[currentFactIndex]}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoadingDisplay;