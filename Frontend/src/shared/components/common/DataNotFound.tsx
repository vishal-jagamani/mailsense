'use client';

import React from 'react';

import { DataNotFoundProps } from '../../types/common.types';

const DataNotFound: React.FC<DataNotFoundProps> = ({ title, description, icon: Icon }) => {
    return (
        <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center p-12 text-center">
            {Icon && <Icon className="text-muted-foreground/60 mb-3 size-12 stroke-1" />}
            <p className="text-base font-semibold">{title}</p>
            {description && <p className="text-muted-foreground/80 mt-1 text-xs">{description}</p>}
        </div>
    );
};

export default DataNotFound;
