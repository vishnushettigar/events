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
            <div className="bg-[#E0E0E0] rounded-2xl  p-4 md:p-8">
                <ol className="space-y-6 list-decimal list-inside">
                    {rulesToDisplay.map((rule, idx) => {
                        // Check if the rule contains table HTML
                        if (typeof rule === 'string' && rule.includes('<table')) {
                            return (
                                <li key={idx} className="mb-6">
                                    <div className="text-base mt-1 md:text-lg text-[#5A5A5A] md:text-[#2A2A2A] leading-relaxed mb-4">
                                        {rule.split('<table')[0].trim()}
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse border border-gray-400 bg-white rounded-lg shadow-sm">
                                            <thead>
                                                <tr className="bg-[#D35D38] text-white">
                                                    <th className="border border-gray-400 px-4 py-3 text-left font-semibold">Event</th>
                                                    <th className="border border-gray-400 px-4 py-3 text-center font-semibold">1st Place</th>
                                                    <th className="border border-gray-400 px-4 py-3 text-center font-semibold">2nd Place</th>
                                                    <th className="border border-gray-400 px-4 py-3 text-center font-semibold">3rd Place</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="border border-gray-400 px-4 py-3 font-medium">Individual Events</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-green-600">5</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-blue-600">3</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-orange-600">1</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="border border-gray-400 px-4 py-3 font-medium">Couple Relay</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-green-600">5</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-blue-600">3</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-orange-600">1</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="border border-gray-400 px-4 py-3 font-medium">4x100 Relay</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-green-600">10</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-blue-600">6</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-orange-600">3</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="border border-gray-400 px-4 py-3 font-medium">Volleyball (Men)</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-green-600">10</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-blue-600">5</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-gray-400">–</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="border border-gray-400 px-4 py-3 font-medium">Throwball (Women)</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-green-600">10</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-blue-600">5</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-gray-400">–</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="border border-gray-400 px-4 py-3 font-medium">Tug of War</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-green-600">10</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-blue-600">5</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-gray-400">–</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </li>
                            );
                        }
                        
                        // Regular rule display
                        return (
                            <li key={idx} className="flex items-start gap-2 mb-3">
                                <span className="inline-block mt-0 text-[#2A2A2A] text-2xl">•</span>
                                <span className="text-base mt-1 md:text-lg text-[#5A5A5A] md:text-[#2A2A2A] leading-relaxed">{rule}</span>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </section>
    )
}

export default Rules
