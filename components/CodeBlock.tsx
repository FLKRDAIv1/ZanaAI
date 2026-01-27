import React, { useState } from 'react';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';

interface CodeBlockProps {
  className?: string;
  children?: React.ReactNode;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ className, children }) => {
  const [isCopied, setIsCopied] = useState(false);
  const language = className?.replace('language-', '');
  const code = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-lg bg-surface dark:bg-dark-surface">
      <div className="flex items-center justify-between px-4 py-2 bg-overlay dark:bg-dark-overlay rounded-t-lg">
        <span className="text-xs font-sans text-muted dark:text-dark-muted">{language || 'کۆد'}</span>
        <button onClick={handleCopy} className="flex items-center text-xs text-subtle dark:text-dark-subtle hover:text-primary dark:hover:text-dark-primary">
          {isCopied ? (
            <>
              <CheckIcon className="h-4 w-4 mr-1 text-highlight dark:text-dark-highlight" />
              کۆپی کرا!
            </>
          ) : (
            <>
              <CopyIcon className="h-4 w-4 mr-1" />
              کۆپیکردن
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className={`language-${language}`}>{children}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;