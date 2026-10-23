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
          <span className="text-[#2a2a2a] w-32 flex-shrink-0 mt-1">27-12-2026</span>
        </div>
        <div className="flex gap-2 items-start">
          <img
            className="flex-shrink-0 mt-1"
            src={locationIcon}
            alt="calender"
            width={24}
          />
          <span className="mt-1 text-[#2a2a2a] flex-1 leading-tight min-h-[3rem] min-w-0 break-words block sm:min-w-[45ch] sm:max-w-[45h]">
            {isEnglish
              ? "Mahatma Gandhi District Stadium, Ajjarkaad Udupi"
              : "ಮಹಾತ್ಮ ಗಾಂಧಿ ಕ್ರೀಡಾಂಗಣ, ಅಜ್ಜರಕಾಡು ಉಡುಪಿ"
            }
          </span>
        </div>
      </div>
      {/* </div> */}
    </div>
  );
};

export default EventDetails;