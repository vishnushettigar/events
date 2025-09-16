// src/components/Sponsors.js
import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, A11y, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import './styles.css'; // Optional for custom styles
import { sponsors } from '../constants/constants.jsx';
import { sponsorsKannada } from '../constants/constants.jsx';
import { useLanguage } from '../contexts/LanguageContext';

const Sponsors = () => {
  const { isEnglish } = useLanguage();

  const sponsorsToDisplay = isEnglish ? sponsors : sponsorsKannada;

  const [swiper, setSwiper] = useState(null);
  const [isAutoplayActive, setIsAutoplayActive] = useState(true);

  const handleSwiperClick = () => {
    if (swiper && isAutoplayActive) {
      swiper.autoplay.stop();
      setIsAutoplayActive(false);
    }
  };

  const handleOutsideClick = (e) => {
    // Check if click is outside the swiper
    if (swiper && !e.target.closest('.testimonials-slider') && !isAutoplayActive) {
      swiper.autoplay.start();
      setIsAutoplayActive(true);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [swiper, isAutoplayActive]);

  return (
    <section id="testimonials" className="w-[90%] mx-auto my-12 ">
      <div className="text-left md:text-center mb-8">
        <h2 className="text-2xl text-left md:text-center md:text-4xl font-bold text-[#2A2A2A] mb-2 ">{isEnglish ? "Sponsors" : "ಪ್ರಾಯೋಜಕರು"}</h2>
        <p className="text-base text-left md:text-center md:text-lg text-[#5A5A5A]">{isEnglish ? "We thank our sponsors for their generous support!" : "ನಮ್ಮ ಪ್ರಾಯೋಜಕರಿಗೆ ಧನ್ಯವಾದಗಳು!"}</p>
      </div>
      <Swiper
        modules={[Pagination, A11y, Autoplay]}
        spaceBetween={10}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 }
        }}
        pagination={{ clickable: true }}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        loop={true}
        onSwiper={setSwiper}
        onClick={handleSwiperClick}
        className="testimonials-slider"
      >
        {sponsorsToDisplay.map((s, idx) => (
          <SwiperSlide key={idx} className='h-[200px] pt-4 pb-12'>
            <div className="flex flex-col items-center justify-center bg-[#ccc] rounded-2xl h-[160px] p-4 mx-2 transition-transform hover:scale-105">
              {/* <img src={s.logo} alt={s.name} className="w-20 h-20 mb-4 rounded-full shadow border-4 border-white bg-white" /> */}
              <h3 className="text-lg md:text-xl font-bold text-[#2A2A2A] text-center break-words leading-tight mb-2">
                {s.name}
              </h3>
              <h4 className="text-sm md:text-base text-[#2A2A2A] text-center">
                {s.location}
              </h4>
              {/* <p className="text-[#2A2A2A] text-center text-xs md:text-sm h-[80px] flex items-center justify-center leading-tight px-2">
                {s.desc}
              </p> */}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default Sponsors;
