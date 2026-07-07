'use client';

import { X, Pencil, Check } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

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

export default function MokebModal({ isOpen, onClose, data }: MokebModalProps) {
    const [isMobile, setIsMobile] = useState(false);
    const [edits, setEdits] = useState<Record<string, string>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState('');
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const editToken = useRef<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setIsMobile(/Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get('mode');
        const token = params.get('edit_token');
        if (mode === 'edit' && token) {
            setEditMode(true);
            editToken.current = token;
        }
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setIsEditing(false);
            return;
        }
        setIsEditing(false);
        fetch('/api/mokeb-edits')
            .then(res => res.json())
            .then((data: Record<string, { id: string; description: string }>) => {
                const map: Record<string, string> = {};
                for (const key of Object.keys(data)) {
                    map[key] = data[key].description;
                }
                setEdits(map);
            })
            .catch(() => {});
    }, [isOpen]);

    const displayDescription = data && edits[data.id] ? edits[data.id] : data?.description || '';

    const handleStartEdit = () => {
        setEditText(displayDescription);
        setIsEditing(true);
        setTimeout(() => textareaRef.current?.focus(), 100);
    };

    const handleSave = async () => {
        if (!data) return;
        setSaving(true);
        try {
            const res = await fetch('/api/mokeb-edits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: data.id,
                    description: editText,
                    edit_token: editToken.current,
                }),
            });
            const result = await res.json();
            if (result.success) {
                setEdits(prev => ({ ...prev, [data.id]: editText }));
                setIsEditing(false);
            } else {
                alert('خطا در ذخیره: ' + (result.error || ''));
            }
        } catch {
            alert('خطا در ارتباط با سرور');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !data) return null;

    const lat = data.latitude;
    const lng = data.longitude;

    const baladUrl = `https://balad.ir/#16/${lat}/${lng}`;
    const neshanUrl = `https://neshan.org/maps#c${lat}-${lng}-16z-0p`;

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
                    {isEditing ? (
                        <div>
                            <textarea
                                ref={textareaRef}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl p-3 text-sm text-gray-700 resize-none focus:outline-none focus:border-blue-400 transition-colors"
                                rows={4}
                            />
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    <Check size={16} />
                                    {saving ? 'در حال ذخیره...' : 'ذخیره'}
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                >
                                    انصراف
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{displayDescription}</p>

                            <div>
                                <span className="font-medium text-gray-800">دسته: </span>
                                <span className="text-gray-600">{data.categoryName}</span>
                            </div>

                            {editMode && (
                                <button
                                    onClick={handleStartEdit}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200"
                                >
                                    <Pencil size={15} />
                                    ویرایش
                                </button>
                            )}
                        </>
                    )}
                </div>

                <div className="flex gap-3 mt-5">
                    <a
                        href={baladUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-center text-white
                            bg-[#28a745] hover:bg-[#218838] transition-colors no-underline inline-block"
                            style={{color: 'white'}}
                    >
                        مسیریابی در بلد
                    </a>
                    <a
                        href={neshanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-center text-white
                            bg-[#FF5722] hover:bg-[#e64a19] transition-colors no-underline inline-block"
                            style={{color: 'white'}}

                    >
                        مسیریابی در نشان
                    </a>
                </div>
            </div>
        </div>
    );
}
