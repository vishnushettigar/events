import React, { useState } from "react";
import callIcon from "../assets/call.svg";
import { useLanguage } from "../contexts/LanguageContext";
import {mahasabhaContacts, mahasabhaContactskannada, templeContacts, templeContactsKannada} from "../constants/constants";

const Contacts = () => {
  const { isEnglish } = useLanguage();

  const mahasabhaContactsToDisplay = isEnglish ? mahasabhaContacts : mahasabhaContactskannada;
  const templeContactsToDisplay = isEnglish ? templeContacts : templeContactsKannada;

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
    <section className="w-[90%] mx-auto pb-10">
      <div className="text-center mb-4 md:mb-6 ">
        <h2 className="text-2xl text-left md:text-center md:text-4xl font-bold text-[#2A2A2A] mb-2  ">
          {isEnglish ? "Contact Us" : "ನಮ್ಮ ಕ್ರೀಡಾ ವಾಣಿ"}
        </h2>
        <p className="text-base text-left md:text-center md:text-lg text-[#5A5A5A]">
          {isEnglish ? "For any queries, reach out to our event coordinators" : "ಹೆಚ್ಚಿನ ಮಾಹಿತಿಗಾಗಿ  ಸಂಪರ್ಕಿಸಿ"}
        </p>
      </div>
      {/* Contact Sections Container */}
      <div className="flex flex-col md:flex-row lg:flex-row gap-6 md:gap-8 lg:gap-12 items-start justify-center w-full">
        
        {/* Mahasabha Contacts Section */}
        <div className="w-full lg:flex-1 lg:max-w-lg">
          <h3 className="text-xl font-bold text-[#2A2A2A] mb-4 text-left md:text-center">
            {isEnglish ? "Mahasabha Contacts" : "ಮಹಾಸಭಾ ಸಂಪರ್ಕ"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-0">
            {mahasabhaContactsToDisplay.map((c, idx) => (
              <div key={`mahasabha-${idx}`} className="flex items-center justify-center">
                <div className="flex items-center gap-3 py-4 px-4 w-full">
                  <img src={callIcon} alt="Call" className="hidden sm:block w-6 h-6 flex-shrink-0" />
                  <div className="flex flex-col gap-1 flex-grow">
                    <h4 className="text-l  text-[#2A2A2A]">
                      {c.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${c.phone}`}
                        className="text-[#5A5A5A] text-base font-medium hover:underline hover:text-[#D35D38] transition-colors"
                      >
                        {c.phone}
                      </a>
                      <button
                        onClick={() => copyPhoneNumber(c.phone, `mahasabha-${idx}`)}
                        className="hidden sm:block p-1 rounded-full hover:bg-[#E0E0E0] transition-colors"
                        title="Copy phone number"
                      >
                        {copiedIndex === `mahasabha-${idx}` ? (
                          <svg
                            className="w-4 h-4 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4 text-[#2A2A2A]"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                {/* Vertical dotted line separator - hidden on last item */}
                {idx < mahasabhaContactsToDisplay.length - 1 && (
                  <div className="hidden sm:block lg:hidden xl:block h-20 border-l-2 border-dotted border-[#C0C0C0]"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Temple Contacts Section */}
        <div className="w-full lg:flex-1 lg:max-w-lg">
          <h3 className="text-xl font-bold text-[#2A2A2A] mb-4 text-left md:text-center">
            {isEnglish ? "Temple Contacts" : "ದೇವಸ್ಥಾನದ ಸಂಪರ್ಕ"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2  lg:grid-cols-1 xl:grid-cols-2 gap-0">
            {templeContactsToDisplay.map((c, idx) => (
              <div key={`temple-${idx}`} className="flex items-center justify-center">
                <div className="flex items-center gap-3 py-4 px-4 w-full">
                  <img src={callIcon} alt="Call" className="hidden sm:block w-6 h-6 flex-shrink-0" />
                  <div className="flex flex-col gap-1 flex-grow">
                    <h4 className="text-l  text-[#2A2A2A]">
                {c.name}
                    </h4>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${c.phone}`}
                        className="text-[#5A5A5A] text-base font-medium hover:underline hover:text-[#D35D38] transition-colors"
                >
                  {c.phone}
                </a>
                <button
                        onClick={() => copyPhoneNumber(c.phone, `temple-${idx}`)}
                        className="hidden sm:block p-1 rounded-full hover:bg-[#E0E0E0] transition-colors"
                  title="Copy phone number"
                >
                        {copiedIndex === `temple-${idx}` ? (
                    <svg
                            className="w-4 h-4 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                            className="w-4 h-4 text-[#2A2A2A]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
                </div>
                {/* Vertical dotted line separator - hidden on last item */}
                {idx < templeContactsToDisplay.length - 1 && (
                  <div className="hidden sm:block lg:hidden xl:block h-20 border-l-2 border-dotted border-[#C0C0C0]"></div>
                )}
          </div>
        ))}
          </div>
        </div>
        
      </div>
    </section>
  );
};

export default Contacts;