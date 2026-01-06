import React from 'react';
import Editor from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';

const CodeEditor = ({ 
    language = 'javascript', 
    theme = 'vs-dark', 
    value, 
    onChange,
    readOnly = false
}) => {
    
    const handleEditorChange = (value, event) => {
        onChange(value);
    };

    return (
        <div className="h-full w-full border rounded-md overflow-hidden shadow-sm">
            <Editor
                height="100%"
                defaultLanguage={language}
                language={language}
                theme={theme}
                value={value}
                onChange={handleEditorChange}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    readOnly: readOnly,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 }
                }}
                loading={<div className="flex items-center justify-center h-full text-muted-foreground"><Loader2 className="animate-spin mr-2 h-4 w-4"/> Loading Editor...</div>}
            />
        </div>
    );
};

export default CodeEditor;
