import React from 'react'
import { rules } from '../constants/constants';
import { rulesKannada } from '../constants/constants';
import { useLanguage } from '../contexts/LanguageContext';




const Rules = () => {
    const { isEnglish } = useLanguage();

    const rulesToDisplay = isEnglish ? rules : rulesKannada;

    return (
        <section className="w-[90%] mx-auto my-10">
            <div className="text-left md:text-center mb-8">
                <h2 className="text-2xl text-left md:text-center md:text-4xl font-bold text-[#2A2A2A] mb-2 ">{isEnglish ? "Rules" : "ನಿಯಮಗಳು"}</h2>
                <p className="text-base text-left md:text-center md:text-lg text-[#5A5A5A]">{isEnglish ? "Rules for the competitions" : "ಸ್ಪರ್ಧೆಗಳಿಗಾಗಿ ಪಾಲಿಸಬೇಕಾದ ಮುಖ್ಯ ನಿಯಮಗಳು"}</p>
            </div>
            <div className="bg-[#E0E0E0] rounded-2xl shadow-lg p-4 md:p-8">
                <ol className="space-y-6 list-decimal list-inside">
                    {rulesToDisplay.map((rule, idx) => (
                        <li key={idx} className="flex items-start gap-2 mb-3">
                            <span className="inline-block mt-0 text-[#2A2A2A] text-2xl">•</span>
                            <span className="text-base mt-1 md:text-lg text-[#5A5A5A] md:text-[#2A2A2A] leading-relaxed">{rule}</span>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    )
}

export default Rules