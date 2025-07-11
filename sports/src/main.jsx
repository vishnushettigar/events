import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Home from './Pages/Home.jsx';
import SignInForm from './Pages/SignInForm.jsx';
import Register from './Pages/Register.jsx';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import TempleParticipants from './components/Templeparticipants.jsx';
import Myevents from './components/Myevents.jsx';
import TeamEvents from './components/TeamEvents.jsx';
import Events from './components/Events.jsx';
import Alltemplereports from './Pages/Alltemplereports.jsx';
import Templedetailedreports from './Pages/Templedetailedreports.jsx';
import Participantslist from './Pages/Participantslist.jsx';
import Error from './Pages/Error.jsx';
import AvailableEvents from './components/AvailableEvents.jsx';
import StaffPanel from './staff/StaffPanel.jsx';
import AdminPanel from './admin/AdminPanel.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

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
        path: "/staffpanel",
        element: <StaffPanel />
      },
      {
        path: "/admin",
        element: <ProtectedRoute requiredRole="SUPER_USER"><AdminPanel /></ProtectedRoute>
      },
      {
        path: "/myevents",
        element: <Myevents />,
        children: [
          {
            index: true,
            element: <AvailableEvents />
          },
          {
            path: "templeparticipants",
            element: <TempleParticipants />
          },
          {
            path: "groupevents",
            element: <TeamEvents />
          },
          {
            path: "Participantslist",
            element: <Participantslist />
          }
        ]
      },
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
      
    ],
    errorElement: <Error />
  }
  
 ]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={appRouter}/>
  </StrictMode>
)
