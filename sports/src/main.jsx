import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Home from './components/Home.jsx';
import SignInForm from './components/SignInForm.jsx';
import Register from './components/Register.jsx';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Templeparticipants from './components/Templeparticipants.jsx';
import Myevents from './components/Myevents.jsx';
import GroupEvents from './components/GroupEvents.jsx';
import Events from './components/Events.jsx';

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
