import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Home from './Pages/Home.jsx';
import SignInForm from './components/SignInForm.jsx';
import Register from './components/Register.jsx';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Templeparticipants from './components/Templeparticipants.jsx';
import Myevents from './components/Myevents.jsx';
import GroupEvents from './components/GroupEvents.jsx';
import Events from './components/Events.jsx';
import Alltemplereports from './Pages/Alltemplereports.jsx';
import Templedetailedreports from './Pages/Templedetailedreports.jsx';
import Participantslist from './Pages/Participantslist.jsx';

// routing configurations//
 const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Home />
      },
      {
        path: "/login",
        element: <SignInForm />
      },
      {
        path: "/register",
        element: <Register />
      },
      {
        path: "/myevents",
        element: <Myevents />,
        children: [
          {
            index: true,
            element: <Events />
          },
          {
            path: "templeparticipants",
            element: <Templeparticipants />
          },
          {
            path: "groupevents",
            element: <GroupEvents />
          }
        ]
      },
<<<<<<< HEAD
         {
        path: "Alltemplereports",
        element: <Alltemplereports />
      }
   
=======
      {
        path: "/Alltemplereports",
        element: <Alltemplereports />
      },
      {
        path: "/templedetailedreport",
        element: <Templedetailedreports />
      },
      {
        path: "/participantslist",
        element: <Participantslist />
      }
      // {
      //   path: "/participantslist",
      //   element: <Participantslist />
        
      // }
>>>>>>> e74805e0536ffa22e685d9644b23b09f38c1d6c4
    ],
    errorElement: <Error />
  }
  
 ]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={appRouter}/>
  </StrictMode>
)
