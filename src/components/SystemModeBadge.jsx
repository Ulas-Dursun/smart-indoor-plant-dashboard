import React from 'react';

export default function SystemModeBadge({ mode }) {
    // Mode "AUTO" mu kontrol ediyoruz (Büyük harf uyumu)
    const isAuto = mode === 'AUTO';

    return (
        <div className={`inline-flex items-center px-3 py-1 rounded-full border ${
            isAuto
                ? "bg-purple-100 border-purple-200 text-purple-700"
                : "bg-gray-100 border-gray-200 text-gray-600"
        }`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${isAuto ? "bg-purple-600 animate-pulse" : "bg-gray-400"}`}></span>
            <span className="text-xs font-bold tracking-wider">
        {isAuto ? "AI AUTO MODE" : "MANUAL MODE"}
      </span>
        </div>
    );
}