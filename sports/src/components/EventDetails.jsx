import React from "react";
import dateIcon from "../assets/Date.svg";
import locationIcon from "../assets/location.svg";
import "./styles.css";
const EventDetails = () => {
  return (
    <div className="card px-[1rem] py-6 rounded-xl bg-[#e0e0e0] relative mt-4 mb-2">
      {/* <div className="flex-1 bg-[#e0e0e0] rounded-md"> */}
       <div className="flex flex-col gap-2 p-6">
        <div className="flex gap-2">
          <img
            className="flex-shrink-0"
            src={dateIcon}
            alt="calender"
            width={24}
          />
          <span className="text-[#2a2a2a]">21-12-2025</span>
        </div>
        <div className="flex gap-2">
          <img
            className="flex-shrink-0"
            src={locationIcon}
            alt="calender"
            width={24}
          />
          <span className="text-[#2a2a2a]">
            Sri Brahmalinga Veerabhadra Durgaparameshwari temple, Salikeri{" "}
          </span>
        </div>
      </div>
      {/* </div> */}
    </div>
  );
};

export default EventDetails;