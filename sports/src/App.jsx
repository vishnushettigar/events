import Home from './Pages/Home';
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  const location = useLocation();
  
  // Hide footer when on Myevents page (where BottomBar appears)
  const shouldHideFooter = location.pathname.startsWith('/myevents')|| 
  location.pathname.startsWith('/staffpanel');

  return (
    <LanguageProvider>
       <Navbar />
       {/* <Home />    */}
       <div className="min-h-screen flex flex-col">
      {/* Main Content Area */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer - conditionally rendered */}
      <div className={shouldHideFooter ? 'hidden md:block' : ''}>
        <Footer />
      </div>
    </div>
       {/* <SignInForm /> */}
       {/* <Register /> */}
       {/* <Templeparticipants /> */}
       {/* <Myevents /> */}
       {/* <Error /> */}
       {/* <SignInForm /> */}
       {/* <Register /> */}
       {/* <Templeparticipants /> */}
       {/* <Myevents /> */}
       {/* <Error /> */}

    </LanguageProvider>
  )
}

export default App
