import React, { useState, useRef, useEffect } from 'react';
import * as geminiService from '../../services/geminiService';
import { ClipboardIcon, CheckIcon, SparklesIcon, CloseIcon, LoadingSpinnerIcon } from '../common/Icons';

interface CodeBlockProps {
    code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => {
    const [copied, setCopied] = useState(false);
    const [explainer, setExplainer] = useState({
        visible: false,
        content: '',
        isLoading: false,
        top: 0,
        left: 0,
    });
    const preRef = useRef<HTMLPreElement>(null);
    const explainerRef = useRef<HTMLDivElement>(null);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const closeExplainer = () => {
        setExplainer(prev => ({ ...prev, visible: false }));
    };

    const handleMouseUp = async (event: React.MouseEvent) => {
        // Don't trigger if we are clicking inside the explainer popover
        if (explainerRef.current?.contains(event.target as Node)) {
            return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 0)); // let selection update
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();

        if (selection && selectedText && preRef.current?.contains(selection.anchorNode)) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const preRect = preRef.current.getBoundingClientRect();

            const top = rect.bottom - preRect.top;
            const left = rect.left - preRect.left + rect.width / 2;

            setExplainer({
                visible: true,
                isLoading: true,
                content: '',
                top: top + 10,
                left: left,
            });

            try {
                const explanation = await geminiService.explainCodeSnippet(selectedText, code);
                setExplainer(prev => ({ ...prev, isLoading: false, content: explanation }));
            } catch (error) {
                console.error("Failed to explain code snippet", error);
                setExplainer(prev => ({
                    ...prev,
                    isLoading: false,
                    content: "Sorry, I had trouble explaining that. Please try again."
                }));
            }

        } else if (explainer.visible) {
            closeExplainer();
        }
    };

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (explainerRef.current && !explainerRef.current.contains(event.target as Node) && preRef.current && !preRef.current.contains(event.target as Node)) {
                closeExplainer();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="bg-slate-800 rounded-lg relative group">
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 bg-slate-700 rounded-md text-slate-400 hover:text-white hover:bg-slate-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all z-20"
                aria-label="Copy code"
            >
                {copied ? <CheckIcon className="h-5 w-5 text-green-400" /> : <ClipboardIcon className="h-5 w-5" />}
            </button>
            <pre ref={preRef} onMouseUp={handleMouseUp} className="p-4 text-sm text-slate-300 overflow-x-auto select-text">
                <code>{code}</code>
            </pre>
            {explainer.visible && (
                <div
                    ref={explainerRef}
                    style={{ top: `${explainer.top}px`, left: `${explainer.left}px`, transform: 'translateX(-50%)'}}
                    className="absolute z-30 w-80 max-w-sm p-4 bg-white rounded-xl shadow-2xl border border-gray-200 animate-fade-in-up"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-start mb-2">
                         <h4 className="font-bold text-green-600 flex items-center gap-2 text-base">
                            <SparklesIcon className="w-5 h-5"/>
                            Code Explainer
                        </h4>
                        <button onClick={closeExplainer} className="p-1 -mr-2 -mt-2 text-gray-400 hover:text-gray-800 rounded-full">
                            <CloseIcon className="w-5 h-5"/>
                        </button>
                    </div>
                     {explainer.isLoading ? (
                        <div className="flex items-center justify-center h-24">
                            <LoadingSpinnerIcon className="w-6 h-6 text-green-500" />
                        </div>
                    ) : (
                        <p className="text-sm text-slate-600 leading-relaxed max-h-60 overflow-y-auto">{explainer.content}</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default CodeBlock;
