import React from 'react';
import { motion } from 'framer-motion';

export default function Skeleton({ className = "" }) {
    return (
        <motion.div 
            className={`bg-gray-200 dark:bg-slate-700/50 rounded-xl overflow-hidden ${className}`}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{
                repeat: Infinity,
                repeatType: "reverse",
                duration: 1.2,
                ease: "easeInOut"
            }}
        >
            {/* Shimmer effect overlay */}
            <motion.div
                className="w-full h-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent absolute"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "linear"
                }}
            />
        </motion.div>
    );
}

export function SkeletonTable({ rows = 5, columns = 3 }) {
    return (
        <div className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50 overflow-hidden">
            <div className="flex bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700/50 p-4 gap-4">
                {Array(columns).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-4 flex-1" />
                ))}
            </div>
            <div className="divide-y divide-gray-50 dark:divide-slate-700/30">
                {Array(rows).fill(0).map((_, rowIndex) => (
                    <div key={rowIndex} className="flex p-4 gap-4">
                        {Array(columns).fill(0).map((_, colIndex) => (
                            <Skeleton key={colIndex} className="h-4 flex-1 bg-gray-100 dark:bg-slate-700/30" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function SkeletonCard() {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700/50">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/3 mb-6" />
            <Skeleton className="h-10 w-full mt-4 rounded-lg" />
        </div>
    );
}
