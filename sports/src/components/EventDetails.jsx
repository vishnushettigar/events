import React from "react";
import dateIcon from "../assets/Date.svg";
import locationIcon from "../assets/location.svg";
import "./styles.css";
import { useLanguage } from "../contexts/LanguageContext";

const EventDetails = () => {
  const { isEnglish } = useLanguage();

  return (
    <div 
      className="card px-[1rem] py-6 rounded-xl bg-[#e0e0e0] relative mt-4 mb-2"
      style={{
        '--card-title': isEnglish ? '"Event Details"' : '"ವಿವರಗಳು"'
      }}
    >
      {/* <div className="flex-1 bg-[#e0e0e0] rounded-md"> */}
       <div className="flex flex-col gap-2 p-6">
        <div className="flex gap-2 items-start">
          <img
            className="flex-shrink-0 mt-1"
            src={dateIcon}
            alt="calender"
            width={24}
          />
          <span className="text-[#2a2a2a] w-32 flex-shrink-0">21-12-2025</span>
        </div>
        <div className="flex gap-2 items-start">
          <img
            className="flex-shrink-0 mt-1"
            src={locationIcon}
            alt="calender"
            width={24}
          />
          <span className="text-[#2a2a2a] flex-1 leading-tight min-h-[3rem]">
            {isEnglish 
              ? "Government Junior College, Karnad, Mulki, Karnataka 574154"
              : "ಸರ್ಕಾರಿ ಪದವಿ ಪೂರ್ವ ಕಾಲೇಜು, ಕರ್ನಾಡ್, ಮುಲ್ಕಿ, ಕರ್ನಾಟಕ 574154"
            }
          </span>
        </div>
      </div>
      {/* </div> */}
    </div>
  );
};

export default EventDetails;