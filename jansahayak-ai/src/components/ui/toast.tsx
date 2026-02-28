import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
    id: string;
    type: ToastType;
    message: string;
    onClose: (id: string) => void;
    duration?: number;
}

const icons = {
    success: <CheckCircle className="h-5 w-5 text-success" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-accent" />,
    info: <Info className="h-5 w-5 text-primary" />,
};

export const Toast: React.FC<ToastProps> = ({ id, type, message, onClose, duration = 3000 }) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => onClose(id), duration);
            return () => clearTimeout(timer);
        }
    }, [id, duration, onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
            className="mb-3 flex w-[350px] items-center justify-between rounded-lg bg-white p-4 shadow-lg border border-gray-100"
        >
            <div className="flex items-center gap-3">
                {icons[type]}
                <p className="text-sm font-medium text-gray-900">{message}</p>
            </div>
            <button onClick={() => onClose(id)} className="text-gray-400 hover:text-gray-900">
                <X className="h-4 w-4" />
            </button>
        </motion.div>
    );
};
