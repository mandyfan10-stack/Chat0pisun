import React from 'react';

interface LinkifiedTextProps {
  text: string;
  isMine?: boolean;
}

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export const LinkifiedText: React.FC<LinkifiedTextProps> = ({ text, isMine }) => {
  const parts = text.split(URL_REGEX);

  return (
    <div className="whitespace-pre-wrap break-words text-sm leading-6">
      {parts.map((part, i) => {
        if (part.match(URL_REGEX)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline break-all ${
                isMine ? 'text-blue-100 hover:text-white' : 'text-blue-400 hover:text-blue-300'
              }`}
                        onClick={() => {
                // Future enhancement: show a "You are leaving Nextgram" modal
                // For now, standard safe link behavior
              }}
            >
              {part}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
};
