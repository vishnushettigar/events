import React, { useState } from "react";
import callIcon from "../assets/call.svg";
import { contacts } from "../constants/constants";

const Contacts = () => {
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
      <div className="text-center mb-6 ">
        <h2 className="text-2xl text-left md:text-center md:text-4xl font-bold text-[#2A2A2A] mb-2 ">
          Contact Us
        </h2>
        <p className="text-base text-left md:text-center md:text-lg text-[#5A5A5A]">
          For any queries, reach out to our event coordinators
        </p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))]  gap-4 ">
        {contacts.map((c, idx) => (
          <div
            key={idx}
            className="flex  items-center gap-3 bg-[#E0E0E0] rounded-xl  px-6 py-2  hover:bg-[#d5d5d5] transition"
          >
            {/* <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#F8DFBE] mb-3">
              <svg
                className="w-8 h-8 flex-shrink-0 text-[#2A2A2A]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.05 5.05a7 7 0 01-9.9 9.9l2.12-2.12a5 5 0 007.07-7.07l2.12-2.12z"
                />
              </svg>
            </span> */}
            <img src={callIcon} alt="Call" />
            <div className="flex flex-col gap-1">
              <h3 className="text-md font-semibold text-[#2A2A2A] ">
                {c.name}
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${c.phone}`}
                  className="text-[#5A5A5A] text-base font-medium hover:underline underline-accent active:text-[#D35D38]"
                >
                  {c.phone}
                </a>
                <button
                  onClick={() => copyPhoneNumber(c.phone, idx)}
                  className="p-1 rounded-full hover:bg-[#c0c0c0] transition-colors "
                  title="Copy phone number"
                >
                  {copiedIndex === idx ? (
                    <svg
                      className="w-4 h-4 text-green-600 hidden sm:block"
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
                      className="w-4 h-4 text-[#2A2A2A] hidden sm:block"
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
        ))}
      </div>
    </section>
  );
};

export default Contacts;