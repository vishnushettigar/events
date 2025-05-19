import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Myevents = () => {
  return (
    <section className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <div className='bg-blue-600 rounded-br-md rounded-bl-md'>
          <div className='flex flex-col height-[100vh] w-[80%] mx-auto text-white items-start justify-center p-6'>
            <div className='flex flex-row items-center justify-center'>
              <h1 className='text-2xl'>Templeparticipants Name</h1>
              <h3 className='text-xl ml-6 pl-6 border-l-2 border-gray-400'>Temple Name</h3>
            </div>
            <div className='flex flex-row gap-4 pt-6'>
              <h2>point of contact for templeName :</h2>
              <h2>templeAdminName</h2>
              <h2>templeAdminNumber</h2>
            </div>
          </div>
        </div>
        <Outlet />
      </div>
    </section>
  );
};

export default Myevents;