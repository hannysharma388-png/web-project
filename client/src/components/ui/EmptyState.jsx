import React from 'react';
import { motion } from 'framer-motion';

export default function EmptyState({ title, message, icon }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/50 rounded-2xl shadow-sm text-center"
        >
            <div className="w-20 h-20 bg-gray-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-6">
                <i className={`fas ${icon} text-3xl text-gray-400 dark:text-slate-500`}></i>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{title}</h3>
            <p className="text-gray-500 dark:text-slate-400 max-w-sm">{message}</p>
        </motion.div>
    );
}
