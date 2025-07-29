import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../../types';
import { CloseIcon, LogoIcon, LoadingSpinnerIcon } from '../common/Icons';

interface SocraticModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  chatHistory: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
}

const SocraticModal: React.FC<SocraticModalProps> = ({
  isOpen,
  onClose,
  originalText,
  chatHistory,
  isLoading,
  onSendMessage,
}) => {
  const [userMessage, setUserMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = () => {
    if (userMessage.trim() && !isLoading) {
      onSendMessage(userMessage);
      setUserMessage('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl h-[90vh] max-h-[700px] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <LogoIcon className="h-6 w-6 text-green-500" />
            <h2 className="text-lg font-bold text-slate-800">Deep Dive with AI Tutor</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-800 rounded-full transition-colors"
            aria-label="Close dialogue"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
            <div className="bg-white p-3 rounded-lg mb-4 border border-gray-200">
                <p className="text-sm font-semibold text-gray-500 mb-1">Original Concept:</p>
                <p className="text-sm text-gray-700 italic">"{originalText}"</p>
            </div>

            <div className="space-y-4">
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"><LogoIcon className="w-5 h-5 text-green-500"/></div>}
                        <div className={`max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-green-600 text-white' : 'bg-white text-slate-700 border border-gray-200'}`}>
                           {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-3">
                         <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"><LogoIcon className="w-5 h-5 text-green-500"/></div>
                         <div className="max-w-md p-3 rounded-lg bg-white border border-gray-200 flex items-center">
                            <LoadingSpinnerIcon className="w-5 h-5 text-slate-500" />
                         </div>
                    </div>
                )}
                 <div ref={chatEndRef} />
            </div>
        </div>

        <footer className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex gap-3">
            <textarea
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question or respond..."
              className="flex-grow bg-gray-100 border-2 border-gray-300 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !userMessage.trim()}
              className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors self-end"
            >
              Send
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SocraticModal;