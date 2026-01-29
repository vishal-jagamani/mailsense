import { redirect } from 'next/navigation';
import React from 'react';

const page: React.FC = () => {
    redirect('/inbox');
};

export default page;
