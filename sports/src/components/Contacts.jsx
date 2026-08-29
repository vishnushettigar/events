import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import {
  mahasabhaContacts,
  mahasabhaContactskannada,
  templeContacts,
  templeContactsKannada,
} from "../constants/constants";
import { FaPhoneAlt, FaCopy, FaCheck } from "react-icons/fa";

const Contacts = () => {
  const { isEnglish } = useLanguage();

  const mahasabhaContactsToDisplay = isEnglish
    ? mahasabhaContacts
    : mahasabhaContactskannada;
  const templeContactsToDisplay = isEnglish
    ? templeContacts
    : templeContactsKannada;

  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyPhoneNumber = async (phone, index) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy phone number:", err);
    }
  };

  return (
    <section className="w-[90%] mx-auto pb-14">
      {/* Title block matching other sections */}
      <div className="text-left md:text-center mb-10">
        <h2 className="text-2xl text-left md:text-center md:text-4xl font-bold text-[#2A2A2A] mb-2">
          {isEnglish ? (
            <>
              Contact <span className="text-[#D35D38]">Us</span>
            </>
          ) : (
            <>
              ನಮ್ಮ ಕ್ರೀಡಾ <span className="text-[#D35D38]">ವಾಣಿ</span>
            </>
          )}
        </h2>
        <p className="text-base text-left md:text-center md:text-lg text-[#5A5A5A] font-medium">
          {isEnglish
            ? "For any queries, reach out to our event coordinators"
            : "ಹೆಚ್ಚಿನ ಮಾಹಿತಿಗಾಗಿ ಸಂಪರ್ಕಿಸಿ"}
        </p>
      </div>

      {/* Main Container Card */}
      <div className="bg-white border border-gray-100 rounded-3xl p-4 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_45px_rgba(0,0,0,0.05)] transition-all duration-300 relative overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row gap-4 md:gap-10 w-full">
          {/* Mahasabha Contacts Column */}
          <div className="w-full md:w-1/2 space-y-4">
            <h3 className="text-lg font-extrabold text-[#2A2A2A] ">
              {isEnglish ? "Mahasabha Coordinators" : "ಮಹಾಸಭಾ ಸಂಘಟಕರು"}
            </h3>
            <div className="space-y-3">
              {mahasabhaContactsToDisplay.map((c, idx) => (
                <div
                  key={`mahasabha-${idx}`}
                  className="p-3.5 bg-slate-50/60 border border-slate-100/80 rounded-2xl flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors duration-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-800 truncate">
                        {c.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <a
                          href={`tel:${c.phone}`}
                          className="text-xs sm:text-sm text-slate-500 font-bold hover:text-[#D35D38] transition-colors"
                        >
                          {c.phone}
                        </a>
                        <button
                          onClick={() =>
                            copyPhoneNumber(c.phone, `mahasabha-${idx}`)
                          }
                          className="hidden sm:inline-flex text-slate-400 hover:text-[#D35D38] transition-colors cursor-pointer p-0.5 rounded hover:bg-slate-100/50"
                          title={isEnglish ? "Copy" : "ನಕಲಿಸಿ"}
                        >
                          {copiedIndex === `mahasabha-${idx}` ? (
                            <FaCheck className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <FaCopy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center flex-shrink-0">
                    {/* Direct Call Button */}
                    <a
                      href={`tel:${c.phone}`}
                      className="p-2 rounded-lg bg-[#D35D38] text-white hover:bg-[#B84A2E] active:scale-95 transition-all duration-200 cursor-pointer shadow-sm shadow-[#D35D38]/10"
                      title={isEnglish ? "Call now" : "ಕರೆ ಮಾಡಿ"}
                    >
                      <FaPhoneAlt className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subtle Separator Line */}
          <div className="hidden md:block w-px bg-slate-300 self-stretch my-2"></div>
          <div className="block md:hidden h-px bg-slate-300 w-full my-1"></div>

          {/* Temple Contacts Column */}
          <div className="w-full md:w-1/2 space-y-4">
            <h3 className="text-lg font-extrabold text-[#2A2A2A] ">
              {isEnglish ? "Temple Coordinators" : "ದೇವಸ್ಥಾನದ ಸಂಘಟಕರು"}
            </h3>
            <div className="space-y-3">
              {templeContactsToDisplay.map((c, idx) => (
                <div
                  key={`temple-${idx}`}
                  className="p-3.5 bg-slate-50/60 border border-slate-100/80 rounded-2xl flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors duration-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-800 truncate">
                        {c.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <a
                          href={`tel:${c.phone}`}
                          className="text-xs sm:text-sm text-slate-500 font-bold hover:text-[#D35D38] transition-colors"
                        >
                          {c.phone}
                        </a>
                        <button
                          onClick={() =>
                            copyPhoneNumber(c.phone, `temple-${idx}`)
                          }
                          className="hidden sm:inline-flex text-slate-400 hover:text-[#D35D38] transition-colors cursor-pointer p-0.5 rounded hover:bg-slate-100/50"
                          title={isEnglish ? "Copy" : "ನಕಲಿಸಿ"}
                        >
                          {copiedIndex === `temple-${idx}` ? (
                            <FaCheck className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <FaCopy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center flex-shrink-0">
                    {/* Direct Call Button */}
                    <a
                      href={`tel:${c.phone}`}
                      className="p-2 rounded-lg bg-[#D35D38] text-white hover:bg-[#B84A2E] active:scale-95 transition-all duration-200 cursor-pointer shadow-sm shadow-[#D35D38]/10"
                      title={isEnglish ? "Call now" : "ಕರೆ ಮಾಡಿ"}
                    >
                      <FaPhoneAlt className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default Contacts;
