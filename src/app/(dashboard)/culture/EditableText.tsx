"use client";

import React, { useState, useEffect } from "react";
import { useCulture } from "@/components/culture/CultureProvider";

export default function EditableText({ id, defaultText, className = "", multiline = false }: { id: string, defaultText: string, className?: string, multiline?: boolean }) {
    const { content, updateContent, isEditMode } = useCulture();
    // Default text is only used if not existing
    const [localText, setLocalText] = useState("");

    useEffect(() => {
        setLocalText(content[id] ?? defaultText);
    }, [content, id, defaultText]);

    const handleChange = (e: any) => {
        setLocalText(e.target.value);
    };

    const handleBlur = () => {
        updateContent(id, localText);
    };

    if (!isEditMode) {
        if (!content[id] && !defaultText) return null;
        if (multiline) {
            return (
                <span className={className}>
                    {(content[id] ?? defaultText).toString().split('\n').map((line: string, i: number) => (
                        <React.Fragment key={i}>
                            {line}
                            <br />
                        </React.Fragment>
                    ))}
                </span>
            );
        }
        return <span className={className}>{content[id] ?? defaultText}</span>;
    }

    if (multiline) {
        return (
            <textarea
                className={`w-full min-h-[80px] bg-sky-50 outline-none border border-sky-300 rounded focus:ring-2 focus:ring-sky-500 overflow-hidden resize-y px-2 py-1 text-slate-800 ${className}`}
                value={localText}
                onChange={handleChange}
                onBlur={handleBlur}
            />
        );
    }

    return (
        <input
            type="text"
            className={`w-full bg-sky-50 outline-none border border-sky-300 rounded focus:ring-2 focus:ring-sky-500 px-2 text-slate-800 ${className}`}
            value={localText}
            onChange={handleChange}
            onBlur={handleBlur}
        />
    );
}
