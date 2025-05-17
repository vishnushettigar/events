import React from 'react'

const contacts = [
  { name: 'Shravan Shetigar', phone: '7760147446' },
  { name: 'Praveen Shettigar', phone: '9686924426' },
  { name: 'Sudhakar Shettigar', phone: '9964070119' },
  { name: 'Rajnikanth Shettigar', phone: '9663610534' },
];

const Contacts = () => {
  return (
    <section className="w-[90%] mx-auto my-12">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-extrabold text-blue-800 mb-2 drop-shadow">Contact Us</h2>
        <p className="text-lg text-gray-600">For any queries, reach out to our event coordinators</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {contacts.map((c, idx) => (
          <div key={idx} className="flex flex-col items-center bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl shadow-lg p-6 transition-transform hover:scale-105">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-200 mb-3">
              <svg className="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.05 5.05a7 7 0 01-9.9 9.9l2.12-2.12a5 5 0 007.07-7.07l2.12-2.12z" /></svg>
            </span>
            <h3 className="text-lg font-bold text-blue-900 mb-1">{c.name}</h3>
            <a href={`tel:${c.phone}`} className="text-blue-700 text-md font-semibold hover:underline">{c.phone}</a>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Contacts;