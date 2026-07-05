'use client';

import { X } from 'lucide-react';

interface MokebData {
    name: string;
    description: string;
    address: string;
    capacity?: string;
    services?: string;
}

interface MokebModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: MokebData | null;
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
                    <h2 className="text-lg font-bold text-gray-800">{data.name}</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                    <p>{data.description}</p>

                    {data.address && (
                        <div>
                            <span className="font-medium text-gray-800">آدرس: </span>
                            <span>{data.address}</span>
                        </div>
                    )}

                    {data.capacity && (
                        <div>
                            <span className="font-medium text-gray-800">ظرفیت: </span>
                            <span>{data.capacity}</span>
                        </div>
                    )}

                    {data.services && (
                        <div>
                            <span className="font-medium text-gray-800">خدمات: </span>
                            <span>{data.services}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
