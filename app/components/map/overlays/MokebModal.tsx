'use client';

import { X, User, Clock, Eye } from 'lucide-react';

interface MokebData {
    id: string;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    categoryName: string;
    categoryColor?: string;
    submittedByName?: string;
    submittedAt?: string;
    visitCount?: number;
}

interface MokebModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: MokebData | null;
}

function formatDate(dateStr?: string) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return dateStr;
    }
}

export default function MokebModal({ isOpen, onClose, data }: MokebModalProps) {
    if (!isOpen || !data) return null;

    return (
        <div
            className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-md mx-auto p-5 animate-fadeIn"
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        {data.categoryColor && (
                            <span
                                className="w-3 h-3 rounded-full inline-block"
                                style={{ backgroundColor: data.categoryColor }}
                            />
                        )}
                        <h2 className="text-lg font-bold text-gray-800">{data.title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                    <p className="text-gray-700 leading-relaxed">{data.description}</p>

                    <div>
                        <span className="font-medium text-gray-800">دسته: </span>
                        <span className="text-gray-600">{data.categoryName}</span>
                    </div>

               

                 
                </div>
            </div>
        </div>
    );
}
