import React from 'react'

import Sponsors from '../components/Sponsers';
import Rules from '../components/Rules';
import Counts from '../components/Counts';
import Location from '../components/Location';
import './styles.css'; // Create this file for styling
import {Link} from 'react-router-dom';
import Contacts from '../components/Contacts';

const Home = () => {
  return (
    <>
      {/* Hero Section Redesigned */}
      <section className="relative pt-[2px] min-h-[80vh] flex items-center justify-center bg-[#F0F0F0] overflow-hidden">
        {/* Foreground Content */}
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-center px-4 py-4 max-w-7xl mx-auto">
          {/* Left Side - Charaka Image */}
          <div className="flex-1 flex justify-center md:justify-start mb-8 md:mb-0">
            <img 
              src="/src/assets/charaka.png" 
              alt="Charaka" 
              className="max-w-xs md:max-w-md lg:max-w-lg h-auto drop-shadow-2xl"
            />
          </div>
          
          {/* Right Side - Content */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
            <h1 className="text-5xl md:text-6xl font-extrabold text-[#2A2A2A] drop-shadow mb-4">Padmashali Annual Sports Meet</h1>
            <p className="text-[20px] md:text-[20px] text-[#5A5A5A] mb-6">Hosted by Sri Brahmalinga Veerabhadra Durgaparameshwari temple, Salikeri</p>
            <div className="flex flex-row sm:flex-row gap-4 sm:gap-6 mt-4">
              <a href="/login" className="px-8 py-3 rounded-lg bg-white text-[#D35D38] border-2 border-[#D35D38] font-bold text-lg shadow-lg hover:bg-[#D35D38] hover:text-white transition">Login</a>
              <a href="/register" className="px-8 py-3 rounded-lg bg-[#D35D38] text-white font-bold text-lg shadow-lg hover:bg-[#B84A2E] transition">Register</a>
            </div>
          </div>
        </div>
      </section>
      <div className='bg-[#F0F0F0]'>
        <div> <Counts /></div>
        <div><Sponsors /></div>
        <div><Rules /></div>
        <div><Location /></div>
        <div><Contacts /></div>
      </div>

      
    </>
  );
};

export default Home;
