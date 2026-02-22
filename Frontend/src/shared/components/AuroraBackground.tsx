'use client';

import { motion } from 'motion/react';
import React from 'react';
import { AuroraBackground } from '@shared/ui/aurora-background';

export function AuroraBackgroundDemo() {
    return (
        <AuroraBackground className="absolute inset-0">
            <motion.div
                initial={{ opacity: 0.0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                    delay: 0.3,
                    duration: 0.8,
                    ease: 'easeInOut',
                }}
                className="relative flex flex-col items-center justify-center gap-4 px-4"
            ></motion.div>
        </AuroraBackground>
    );
}
