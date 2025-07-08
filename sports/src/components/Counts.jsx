import React from 'react'

const clickCTA = (text) => {
  console.log(`Clicked: ${text}`);
  // Add event tracking or navigation logic if needed
};

const Counts = () => {
  return (
    <div className="w-[90%] mx-auto mb-10 px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-4xl font-extrabold text-[#2A2A2A] mb-2 drop-shadow">Event Highlights</h1>
        <p className="text-base md:text-lg text-[#2A2A2A]">Explore the highlights of the event</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* 16 Temples */}
        <button
          className="relative flex flex-col bg-[#F8DFBE] text-[#2A2A2A] rounded-xl md:rounded-2xl shadow-lg md:shadow-xl transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#D35D38] overflow-hidden h-32 sm:h-40 md:h-48 lg:h-52"
          onClick={() => clickCTA('16 temples')}
        >
          {/* Text at top left */}
          <div className="text-left p-3 md:p-4 z-10 relative">
            <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold block">
              16
            </span>
            <span className="text-[#5A5A5A] text-sm sm:text-base md:text-lg lg:text-xl tracking-wide">
              temples
            </span>
          </div>
          
          {/* Image at bottom right */}
          <div className="absolute top-[50px] right-0 w-24 h-24 sm:w-32 md:top-[56px] sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 p-2 lg:top-[44px]">
            <img 
              src="/src/assets/temples.png" 
              alt="16 temples"
              className="w-full h-full object-contain"
            />
          </div>
        </button>

        {/* 70+ Events */}
        <button
          className="relative flex flex-col bg-[#F8DFBE] text-[#2A2A2A] rounded-xl md:rounded-2xl shadow-lg md:shadow-xl transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#D35D38] overflow-hidden h-32 sm:h-40 md:h-48 lg:h-52"
          onClick={() => clickCTA('70+ Events')}
        >
          {/* Text at top left */}
          <div className="text-left p-3 md:p-4 z-10 relative">
            <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold block">
              70+
            </span>
            <span className="text-[#5A5A5A] text-sm sm:text-base md:text-lg lg:text-xl tracking-wide">
              Events
            </span>
          </div>
          
          {/* Image at bottom right */}
          <div className="absolute top-[50px] right-0 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 p-2 lg:top-[44px]">
            <img 
              src="/src/assets/events.png" 
              alt="70+ Events"
              className="w-full h-full object-contain"
            />
          </div>
        </button>

        {/* 1000+ Participants */}
        <button
          className="relative flex flex-col bg-[#F8DFBE] text-[#2A2A2A] rounded-xl md:rounded-2xl shadow-lg md:shadow-xl transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#D35D38] overflow-hidden h-32 sm:h-40 md:h-48 lg:h-52"
          onClick={() => clickCTA('1000+ Participants')}
        >
          {/* Text at top left */}
          <div className="text-left p-3 md:p-4 z-10 relative">
            <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold block">
              1000+
            </span>
            <span className="text-[#5A5A5A] text-sm sm:text-base md:text-lg lg:text-xl tracking-wide">
              Participants
            </span>
          </div>
          
          {/* Image at bottom right */}
          <div className="absolute bottom-0 right-0 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 p-2">
            <img 
              src="/src/assets/participants.png" 
              alt="1000+ Participants"
              className="w-full h-full object-contain"
            />
          </div>
        </button>

        {/* 200+ Winners */}
        <button
          className="relative flex flex-col bg-[#F8DFBE] text-[#2A2A2A] rounded-xl md:rounded-2xl shadow-lg md:shadow-xl transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#D35D38] overflow-hidden h-32 sm:h-40 md:h-48 lg:h-52"
          onClick={() => clickCTA('200+ winners')}
        >
          {/* Text at top left */}
          <div className="text-left p-3 md:p-4 z-10 relative">
            <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold block">
              200+
            </span>
            <span className="text-[#5A5A5A] text-sm sm:text-base md:text-lg lg:text-xl tracking-wide">
              winners
            </span>
          </div>
          
          {/* Image at bottom right */}
          <div className="absolute bottom-0 right-0 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 p-2">
            <img 
              src="/src/assets/winners.png" 
              alt="200+ winners"
              className="w-full h-full object-contain"
            />
          </div>
        </button>
      </div>
    </div>
  );
}

export default Counts;