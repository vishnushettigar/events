import React, { useState } from 'react'

const contacts = [
  { name: 'Shravan Shetigar', phone: '7760147446' },
  { name: 'Praveen Shettigar', phone: '9686924426' },
  { name: 'Sudhakar Shettigar', phone: '9964070119' },
  { name: 'Rajnikanth Shettigar', phone: '9663610534' },
];

const Contacts = () => {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyPhoneNumber = async (phone, index) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy phone number:', err);
    }
  };

  return (
    <section className="w-[90%] mx-auto pb-10">
      <div className="text-center mb-8 ">
        <h2 className="text-4xl font-extrabold text-[#2A2A2A] mb-2 drop-shadow">Contact Us</h2>
        <p className="text-lg text-[#2A2A2A]">For any queries, reach out to our event coordinators</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {contacts.map((c, idx) => (
          <div key={idx} className="flex flex-col items-center bg-[#E0E0E0] rounded-2xl shadow-lg p-6 transition-transform hover:scale-105">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#F8DFBE] mb-3">
              <svg className="w-8 h-8 text-[#2A2A2A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.05 5.05a7 7 0 01-9.9 9.9l2.12-2.12a5 5 0 007.07-7.07l2.12-2.12z" /></svg>
            </span>
            <h3 className="text-lg font-bold text-[#2A2A2A] mb-1">{c.name}</h3>
            <div className="flex items-center gap-2">
              <a href={`tel:${c.phone}`} className="text-[#2A2A2A] text-md font-semibold hover:underline">{c.phone}</a>
              <button
                onClick={() => copyPhoneNumber(c.phone, idx)}
                className="p-1 rounded-full hover:bg-[#F8DFBE] transition-colors"
                title="Copy phone number"
              >
                {copiedIndex === idx ? (
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-[#2A2A2A]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Contacts;