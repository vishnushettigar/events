import React from 'react'

const links = [
   {
     text: '16 temples',
     href: '',
   },
   {
     text: '70+ Events',
     href: '',
   },
   {
     text: '1000+ Participants',
     href: '',
   },
   {
     text: '200+ winners',
     href: '',
   },
 ];

 const clickCTA = (text) => {
   console.log(`Clicked: ${text}`);
   // Add event tracking or navigation logic if needed
 };

const Counts = () => {
  return (
    <div className="w-[80%] mx-auto my-10">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-blue-800 mb-2 drop-shadow">Event Highlights</h1>
        <p className="text-lg text-gray-600">Explore the highlights of the event</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {links.map((link, index) => (
          <button
            key={index}
            className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-2xl shadow-lg p-8 transition-transform transform hover:scale-105 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
            onClick={() => clickCTA(link.text)}
          >
            <span className="text-5xl font-bold mb-2">
              {link.text.match(/\d+\+?/)}
            </span>
            <span className="text-lg font-semibold tracking-wide">
              {link.text.replace(/\d+\s?\+?/, '').trim()}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Counts;