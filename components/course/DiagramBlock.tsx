import React, { useEffect, useRef } from 'react';

declare global {
    interface Window {
        mermaid: any;
    }
}

interface DiagramBlockProps {
    mermaidString: string;
}

const DiagramBlock: React.FC<DiagramBlockProps> = ({ mermaidString }) => {
    const ref = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (ref.current && window.mermaid) {
            // To prevent mermaid from mutating the string and causing React issues
            ref.current.innerHTML = mermaidString;
            
            // Remove any previously rendered SVG to avoid duplicates on re-render
            const existingSvg = ref.current.querySelector('svg');
            if (existingSvg) {
                existingSvg.remove();
            }

            try {
                 window.mermaid.run({
                    nodes: [ref.current]
                 });
            } catch(e) {
                console.error("Mermaid run error: ", e);
                ref.current.innerHTML = `<p class="text-red-500">Error rendering diagram.</p>`;
            }
        }
    }, [mermaidString]);

    return (
        <div className="mermaid flex justify-center p-4 bg-white w-full" ref={ref}>
            {/* The mermaid string is injected via useEffect to avoid React/Mermaid DOM conflicts */}
        </div>
    );
};

export default DiagramBlock;