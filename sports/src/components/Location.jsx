import React from 'react';



const Location = () => {
  return (
    <section className="w-[90%] mx-auto my-12">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-extrabold text-blue-800 mb-2 drop-shadow">Location</h2>
        <p className="text-lg text-gray-600">Join us at our event venue</p>
      </div>
      <div className="flex flex-col md:flex-row gap-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl shadow-lg p-8 items-center">
        <div className="w-full md:w-1/2 flex justify-center">
          <iframe
            className="rounded-xl border-4 border-blue-200 shadow-lg"
            width="100%"
            height="320"
            frameBorder="0"
            scrolling="no"
            marginHeight="0"
            marginWidth="0"
            title="Google Map"
            src="https://maps.google.com/maps?width=400&amp;height=300&amp;hl=en&amp;q=SMS ground Brahmavara&amp;t=&amp;z=14&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
            allowFullScreen
          ></iframe>
        </div>
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-4">
          <div className="flex flex-col items-center gap-4">
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-200 mb-2">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </span>
            <h3 className="text-2xl font-bold text-blue-900 mb-1">Venue</h3>
            <p className="text-lg text-gray-700 text-center font-semibold">SMS Pre-University College, Brahmavara</p>
            <p className="text-gray-600 text-center">CPHR+JH2, Varamballi, Karnataka 576213</p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=SMS+ground+Brahmavara"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block px-6 py-2 bg-blue-700 text-white rounded-lg shadow hover:bg-blue-900 transition"
            >
              Open in Google Maps
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Location;