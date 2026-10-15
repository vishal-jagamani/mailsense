'use client';

import React from 'react';

import { ComposeEmailRequestBody, SearchOtherContactsResponse } from '@mailsense/types';

interface SearchToEmailPopupProps {
    data: SearchOtherContactsResponse[];
    setComposeEmailBody: React.Dispatch<React.SetStateAction<ComposeEmailRequestBody>>;
    onSelect?: () => void;
}

const SearchToEmailPopup: React.FC<SearchToEmailPopupProps> = ({ data, setComposeEmailBody, onSelect }) => {
    if (!data.length) return null;

    return (
        <div className="bg-secondary absolute top-9 left-3 z-10 flex max-h-52 flex-col overflow-auto rounded-lg shadow-md">
            {data.map((contact) => (
                <div
                    key={contact.email}
                    className="hover:bg-opacity-20 flex cursor-pointer flex-col p-2"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                        setComposeEmailBody((prev) => {
                            if (!prev.to.includes(contact.email)) {
                                return { ...prev, to: [...prev.to, contact.email] };
                            }
                            return prev;
                        });
                        if (onSelect) onSelect();
                    }}
                >
                    <p className="text-sm font-semibold">{contact.name}</p>
                    <p className="text-muted-foreground text-xs">{contact.email}</p>
                </div>
            ))}
        </div>
    );
};

export default SearchToEmailPopup;
