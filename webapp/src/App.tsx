import './App.css';

import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {createBrowserRouter, Outlet, RouterProvider} from 'react-router-dom';
import Navbar from './components/navbar/Navbar';
import {useSession} from "@inrupt/solid-ui-react";


import Home from './pages/home/Home';
import Login from './pages/login/Login';
import AddLandmark from './pages/addLandmark/AddLandmark';
import Profile from './pages/profile/Profile';
import Users from './pages/users/Users';


import LeftBar from './components/leftBar/LeftBar';
import Friends from './pages/friends/Friends';
import LandmarkFriend from './pages/otherUsersLandmark/LandmarkFriend';
import { makeRequest } from './axios';

function App(): JSX.Element {

  //With this we can control the login status for solid

  const queryClient = new QueryClient();
  const {session} = useSession();
  
  function Layout (): JSX.Element{return (
    <QueryClientProvider client={queryClient} >
      <div style = {{backgroundImage:'url(/brussels1.png)'}}>
      <div style = {{backgroundColor:"rgba(71, 64, 64, 0.678)"}}>
      <Navbar />
      <div style={{ display: "flex" }}>
            <LeftBar />
            <div style={{ flex: 6}}>
              <Outlet />
            </div>

          </div>
        </div>
        </div>
    </QueryClientProvider>
  );
  };


  const ProtectedRoute = ({children}:any) => {
    //Descomentar cuando funcione el inicio de sesión
    // console.log(session.info);
    // if (!session.info.isLoggedIn) {
    //  return <Navigate to="/login" />;
    // }
   
    return children;
  };

  const router = createBrowserRouter([
    {
      path: "/main",
      element: (
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      ),
      children: [
        {
          path: "/main/",
          element: <Home />,
        },
        {
          path: "/main/profile/:id",
          element: <Profile />,
        },
        {
          path: "/main/friends/:id",
          element: <Friends />,
        },
        {
          path: "/main/landmarks/add",
          element: <AddLandmark />,
        },
        {
          path: "/main/landmarks/filter/:id",
          element: <LandmarkFriend />,
        },
        {
          path: "/main/users/:text",
          element: <Users />,
        },

      ],
    },
    {
      path: "/",
      element: <Login />,
    },
  ]);

  return (
    <div className='mainContainer'>
      <RouterProvider router={router} />
    </div>
  );

  };


export default App;
