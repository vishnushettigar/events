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
                <div className="space-y-6">
                    {rulesToDisplay.map((rule, idx) => {
                        // Check if the rule contains table HTML
                        if (typeof rule === 'string' && rule.includes('<table')) {
                            return (
                                <div key={idx} className="mb-6">
                                    <div className="text-base mt-1 md:text-lg text-[#5A5A5A] md:text-[#2A2A2A] leading-relaxed mb-4">
                                        {rule.split('<table')[0].trim()}
                                    </div>
                                    <div className="overflow-x-auto rounded-2xl">
                                        <table className="w-full border-collapse border border-gray-400 bg-white rounded-lg shadow-sm table-fixed">
                                            <thead>
                                                <tr className="bg-[#D35D38] text-white">
                                                    <th className="text-start border border-gray-400 px-4 py-3 text-left font-medium w-1/4">
                                                        {isEnglish ? "Event" : "ಸ್ಪರ್ಧೆ"}
                                                    </th>
                                                    <th className="border border-gray-400 px-4 py-3 text-center md:text-start font-medium w-1/6">
                                                        {isEnglish ? "1st Place" : "ಪ್ರಥಮ"}
                                                    </th>
                                                    <th className="border border-gray-400 px-4 py-3 text-center md:text-start font-medium w-1/6">
                                                        {isEnglish ? "2nd Place" : "ದ್ವಿತೀಯ"}
                                                    </th>
                                                    <th className="text-start border border-gray-400 px-4 py-3 text-center md:text-start font-medium w-1/6">
                                                        {isEnglish ? "3rd Place" : "ತೃತೀಯ"}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="border border-gray-400 px-4 py-3 font-medium">
                                                        {isEnglish ? "Individual Events" : "ವೈಯಕ್ತಿಕ ಸ್ಪರ್ಧೆಗಳು"}
                                                    </td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-green-600">5</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-blue-600">3</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-orange-600">1</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="border border-gray-400 px-4 py-3 font-medium">
                                                        {isEnglish ? "Couple Relay" : "ದಂಪತಿ ರಿಲೇ"}
                                                    </td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-green-600">5</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-blue-600">3</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-orange-600">1</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="border border-gray-400 px-4 py-3 font-medium">
                                                        {isEnglish ? "4x100 Relay" : "4x100 ರಿಲೇ"}
                                                    </td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-green-600">10</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-blue-600">6</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-orange-600">3</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="border border-gray-400 px-4 py-3 font-medium">
                                                        {isEnglish ? "Volleyball (Men)" : "ವಾಲಿಬಾಲ್ (ಪುರುಷರು)"}
                                                    </td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-green-600">10</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-blue-600">5</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-gray-400">–</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="border border-gray-400 px-4 py-3 font-medium">
                                                        {isEnglish ? "Throwball (Women)" : "ತ್ರೋಬಾಲ್ (ಮಹಿಳೆಯರು)"}
                                                    </td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-green-600">10</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-blue-600">5</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-gray-400">–</td>
                                                </tr>
                                                <tr className="hover:bg-gray-50">
                                                    <td className="border border-gray-400 px-4 py-3 font-medium">
                                                        {isEnglish ? "Tug of War" : "ಹಗ್ಗಜಗ್ಗಾಟ"}
                                                    </td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-green-600">10</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-blue-600">5</td>
                                                    <td className="border border-gray-400 px-4 py-3 text-center font-bold text-gray-400">–</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        }
                        
                        // Regular rule display
                        return (
                            <div key={idx} className="flex items-start gap-2 mb-3">
                                <span className="inline-block mt-0 text-[#2A2A2A] text-2xl">•</span>
                                <span className="text-base mt-1 md:text-lg text-[#5A5A5A] md:text-[#2A2A2A] leading-relaxed">{rule}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    )
}

export default Rules
