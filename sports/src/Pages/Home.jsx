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
      <section className="relative pt-[84px] min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
        {/* Blurred Background Image */}
        <div className="absolute inset-0 bg-[url('./assets/Padmashali_bg.jpg')] bg-cover bg-center blur-[3px] opacity-60"></div>
        {/* Foreground Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-16">
          <h1 className="text-5xl md:text-6xl font-extrabold text-blue-900 drop-shadow mb-4">Padmashali Kreedothsava</h1>
          <p className="text-2xl md:text-3xl text-blue-700 font-semibold mb-6">Welcome to the Grand Sports Event!</p>
          <div className="flex flex-row gap-6 mt-4">
            <a href="/login" className="px-8 py-3 rounded-lg bg-blue-700 text-white font-bold text-lg shadow-lg hover:bg-blue-900 transition">Login</a>
            <a href="/register" className="px-8 py-3 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 text-white font-bold text-lg shadow-lg hover:from-purple-800 hover:to-blue-700 transition">Register</a>
          </div>
        </div>
      </section>
      <div>
       <Counts />
      </div>
      <div><Sponsors /></div>
      <div><Rules /></div>
      <div><Location /></div>
      <div><Contacts /></div>
    </>
  );
};

export default Home;
