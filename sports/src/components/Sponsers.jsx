// src/components/Sponsors.js
import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, A11y, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/autoplay";
import "./styles.css"; // Optional for custom styles
import { sponsors } from "../constants/constants.jsx";
import { sponsorsKannada } from "../constants/constants.jsx";
import { useLanguage } from "../contexts/LanguageContext";
import { FaAward, FaMapMarkerAlt } from "react-icons/fa";

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
    if (
      swiper &&
      !e.target.closest(".testimonials-slider") &&
      !isAutoplayActive
    ) {
      swiper.autoplay.start();
      setIsAutoplayActive(true);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [swiper, isAutoplayActive]);

  const cardThemes = [
    {
      gradient: "from-[#FFE3C6] to-[#FFD0A1]", // Rich Amber
      border: "border-amber-200/80",
      badgeText: "text-amber-800",
      badgeBg: "bg-amber-100",
      iconColor: "text-amber-700",
      glowColor: "bg-amber-500/10",
    },
    {
      gradient: "from-[#CFE2FE] to-[#AECDFE]", // Rich Blue
      border: "border-blue-200/80",
      badgeText: "text-blue-800",
      badgeBg: "bg-blue-100",
      iconColor: "text-blue-700",
      glowColor: "bg-blue-500/10",
    },
    {
      gradient: "from-[#C2F7DC] to-[#99F3C1]", // Rich Emerald
      border: "border-emerald-200/80",
      badgeText: "text-emerald-800",
      badgeBg: "bg-emerald-100",
      iconColor: "text-emerald-700",
      glowColor: "bg-emerald-500/10",
    },
    {
      gradient: "from-[#EFE5FF] to-[#DFCAFF]", // Rich Purple
      border: "border-purple-200/80",
      badgeText: "text-purple-800",
      badgeBg: "bg-purple-100",
      iconColor: "text-purple-700",
      glowColor: "bg-purple-500/10",
    },
    {
      gradient: "from-[#FEE2E2] to-[#FECACA]", // Rich Rose
      border: "border-rose-200/80",
      badgeText: "text-rose-800",
      badgeBg: "bg-rose-100",
      iconColor: "text-rose-700",
      glowColor: "bg-rose-500/10",
    },
  ];

  return (
    <section id="testimonials" className="w-[90%] mx-auto my-22 ">
      <div className="text-left md:text-center mb-8">
        <h2 className="text-2xl text-left md:text-center md:text-4xl font-bold text-[#2A2A2A] mb-2 ">
          {isEnglish ? "Sponsors" : "ಪ್ರಾಯೋಜಕರು"}
        </h2>
        <p className="text-base text-left md:text-center md:text-lg text-[#5A5A5A]">
          {isEnglish
            ? "We thank our sponsors for their generous support!"
            : "ನಮ್ಮ ಪ್ರಾಯೋಜಕರಿಗೆ ಧನ್ಯವಾದಗಳು!"}
        </p>
      </div>
      <Swiper
        modules={[Pagination, A11y, Autoplay]}
        spaceBetween={10}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
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
        {sponsorsToDisplay.map((s, idx) => {
          const theme = cardThemes[idx % cardThemes.length];

          return (
            <SwiperSlide key={idx} className="h-[210px] pt-4 pb-12">
              <div
                className={`relative flex flex-col items-center justify-center bg-gradient-to-br ${theme.gradient} border ${theme.border} rounded-3xl h-[160px] p-5 mx-2 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_45px_rgba(0,0,0,0.06)]  hover:scale-[1.02] transition-all duration-300 overflow-hidden cursor-pointer`}
              >
                {/* Subtle grid pattern background */}
                <div
                  className="absolute inset-0 opacity-25 pointer-events-none z-0"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(0, 0, 0, 0.08) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(0, 0, 0, 0.08) 1px, transparent 1px)
                    `,
                    backgroundSize: "16px 16px",
                  }}
                />

                {/* Decorative glows */}
                <div
                  className={`absolute -bottom-6 -right-6 w-16 h-16 ${theme.glowColor} rounded-full blur-xl pointer-events-none z-0`}
                ></div>
                <div
                  className={`absolute -top-6 -left-6 w-12 h-12 ${theme.glowColor} rounded-full blur-lg pointer-events-none z-0`}
                ></div>

                {/* Sponsor badge */}
                <span
                  className={`text-[9px] font-semibold tracking-widest uppercase ${theme.badgeBg} ${theme.badgeText} flex items-center px-2.5 py-0.5 rounded-tl-md   absolute bottom-0 right-0  gap-1 z-10  shadow-sm border border-black/5`}
                >
                  <FaAward className="w-2.5 h-2.5" />
                  {isEnglish ? "Official Sponsor" : "ಅಧಿಕೃತ ಪ್ರಾಯೋಜಕರು"}
                </span>

                {/* Sponsor Name */}
                <h3 className="text-sm md:text-base font-extrabold text-slate-900 text-center leading-snug px-1 max-w-full line-clamp-2 z-10 relative">
                  {s.name}
                </h3>

                {/* Sponsor Location */}
                {s.location ? (
                  <span className="flex items-center gap-1 text-xs text-slate-700 font-bold mt-2 z-10 relative">
                    <FaMapMarkerAlt className={`w-3 h-3 ${theme.iconColor}`} />
                    {s.location}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-slate-500 font-semibold mt-2 italic z-10 relative">
                    {isEnglish ? "Karnataka" : "ಕರ್ನಾಟಕ"}
                  </span>
                )}
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
};

export default Sponsors;
