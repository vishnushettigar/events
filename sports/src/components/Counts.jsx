import React from 'react'

const links = [
   {
     text: '16 temples',
     href: '',
     image: '/src/assets/temples.png'
   },
   {
     text: '70+ Events',
     href: '',
     image: '/src/assets/events.png'
   },
   {
     text: '1000+ Participants',
     href: '',
     image: '/src/assets/participants.png'
   },
   {
     text: '200+ winners',
     href: '',
     image: '/src/assets/winners.png'
   },
 ];

 const clickCTA = (text) => {
   console.log(`Clicked: ${text}`);
   // Add event tracking or navigation logic if needed
 };

const Counts = () => {
  return (
    <div className="w-[90%] mx-auto mb-10 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-[#2A2A2A] mb-2 drop-shadow">Event Highlights</h1>
        <p className="text-lg text-[#2A2A2A]">Explore the highlights of the event</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 h-[200px] ">
        {links.map((link, index) => (
          <button
            key={index}
            className="relative flex flex-col bg-[#F8DFBE] text-[#2A2A2A] rounded-2xl shadow-xl transition-transform transform hover:scale-105 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-[#D35D38] overflow-hidden"
            onClick={() => clickCTA(link.text)}
          >
            {/* Text at top left */}
            <div className="text-left mb-4 p-4">
              <span className="text-6xl font-bold block">
                {link.text.match(/\d+\+?/)}
              </span>
              <span className="text-[#5A5A5A] text-xl tracking-wide">
                {link.text.replace(/\d+\s?\+?/, '').trim()}
              </span>
            </div>
            
            {/* Image at bottom left */}
            <div className="absolute top-10 left-46">
              <img 
                src={link.image} 
                alt={link.text}
                className="w-56 h-56 object-contain"
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Counts;