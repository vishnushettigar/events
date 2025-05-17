import React from 'react';
import InstagramButton from './InstagramButton';


const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-800 to-purple-600 z-20">
      <div className= 'flex flex-row items-center justify-between w-[90%] mx-auto p-6'>
          <div className='flex flex-row'>
            <div className=' text-white '>
              <div className='copyright'>© Copyright Presento. All Rights Reserved</div>
              <div className='credits'>Designed by 
                <a className='hover:text-pink-500' href="https://www.instagram.com/friends_club_salikeri/" target="_blank">
                 Friends Club Salikeri
                </a>
              </div>
            </div>
            <div className='logo pl-2'>
              <a href="https://www.instagram.com/friends_club_salikeri/" target="_blank" >
                 <img className='w-12' src="http://localhost:8000/static/img/SFC_new.png" alt="SFC_logo" />
              </a>
              
            </div>

          </div>
          
           <div className='flex flex-col text-white  '> 
              <div>
                 <a href="https://www.instagram.com/friends_club_salikeri/" target="_blank" rel="noopener noreferrer"><InstagramButton /></a>
              </div>
              
           </div>
      </div>
       
    </footer>
    
  )
}

export default Footer;