// src/components/Sponsors.js
import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import './styles.css'; // Optional for custom styles

const sponsors = [
  {
    name: 'Harsh Foundation',
    location: 'Salikeri',
    logo: 'https://img.icons8.com/color/96/000000/medal2.png',
    desc: 'Supporting community growth and sports.'
  },
  {
    name: 'Seva Samithi',
    location: 'Salikeri',
    logo: 'https://img.icons8.com/color/96/000000/handshake.png',
    desc: 'Empowering youth through service.'
  },
  {
    name: 'Sri Brahmalinga Veerabhadra Durgaparameshwari Temple',
    location: 'Salikeri',
    logo: 'https://img.icons8.com/color/96/000000/temple.png',
    desc: 'Blessings and support for the event.'
  }
];

const Sponsors = () => {
  return (
    <section id="testimonials" className="w-[90%] mx-auto my-12 min-h-[320px]">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-extrabold text-blue-800 mb-2 drop-shadow">Sponsors</h2>
        <p className="text-lg text-gray-600">We thank our sponsors for their generous support!</p>
      </div>
      <Swiper
        modules={[Pagination, A11y]}
        spaceBetween={30}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 }
        }}
        pagination={{ clickable: true }}
        className="testimonials-slider"
      >
        {sponsors.map((s, idx) => (
          <SwiperSlide key={idx}>
            <div className="flex flex-col items-center bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl shadow-lg p-8 mx-2 h-full min-h-[320px] transition-transform hover:scale-105">
              <img src={s.logo} alt={s.name} className="w-20 h-20 mb-4 rounded-full shadow border-4 border-white bg-white" />
              <h3 className="text-xl font-bold text-blue-900 mb-1 text-center break-words min-h-[56px] flex items-center justify-center">{s.name}</h3>
              <h4 className="text-md text-blue-600 mb-2">{s.location}</h4>
              <p className="text-gray-700 text-center text-sm min-h-[40px] flex items-center justify-center">{s.desc}</p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default Sponsors;
