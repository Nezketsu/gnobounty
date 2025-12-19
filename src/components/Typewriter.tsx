"use client";
import { useState, useEffect } from "react";

export type TypewriterSegment = {
    text: string;
    className?: string;
};

export default function Typewriter({ segments, speed = 30, className = "" }: { segments: TypewriterSegment[], speed?: number, className?: string }) {
    const [displayedSegments, setDisplayedSegments] = useState<TypewriterSegment[]>([]);
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (currentSegmentIndex >= segments.length) {
            setIsComplete(true);
            return;
        }

        const currentSegment = segments[currentSegmentIndex];

        const timeout = setTimeout(() => {
            if (currentCharIndex < currentSegment.text.length) {
                setDisplayedSegments(prev => {
                    const newSegments = [...prev];
                    // Ensure the segment object exists in the array
                    if (!newSegments[currentSegmentIndex]) {
                        newSegments[currentSegmentIndex] = { ...currentSegment, text: "" };
                    }
                    // Append the next character
                    newSegments[currentSegmentIndex].text = currentSegment.text.slice(0, currentCharIndex + 1);
                    return newSegments;
                });
                setCurrentCharIndex(prev => prev + 1);
            } else {
                // Move to next segment
                setCurrentSegmentIndex(prev => prev + 1);
                setCurrentCharIndex(0);
            }
        }, speed);

        return () => clearTimeout(timeout);
    }, [currentSegmentIndex, currentCharIndex, segments, speed]);

    return (
        <p className={className}>
            {displayedSegments.map((seg, i) => (
                <span key={i} className={seg.className}>{seg.text}</span>
            ))}
            <span className={`text-cyan-500 ${isComplete ? "animate-pulse" : ""}`}>_</span>
        </p>
    );
}
