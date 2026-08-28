import React, { useState, useEffect } from "react";

import Sponsors from "../components/Sponsers";
import Rules from "../components/Rules";
import Counts from "../components/Counts";
import Location from "../components/Location";
import Contacts from "../components/Contacts";
import EventDetails from "../components/EventDetails";
import SportsHistoryHome from "../components/SportsHistoryHome";
import Hero from "../components/Hero.jsx";

const Home = () => {
  return (
    <>
      {/* Hero Section Redesigned */}
      <Hero />
      <div className="bg-[#F0F0F0] pt-6 md:pt-12 pb-4">
        <div>
          {" "}
          <Counts />
        </div>
        <div>
          <Sponsors />
        </div>
        <div>
          <Rules />
        </div>
        {/* Sports History Section */}
        <div>
          <SportsHistoryHome />
        </div>
        <div>
          <Location />
        </div>
        <div>
          <Contacts />
        </div>
      </div>
    </>
  );
};

export default Home;
