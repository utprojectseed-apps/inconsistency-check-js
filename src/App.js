import React from 'react';
import './App.css';
import { NavLink, Routes, Route, useLocation } from 'react-router-dom';
import Home from "./pages/home"
import About from "./pages/about"
import Contact from "./pages/contact"

const App = () => (
  <div className='app'>
    <h1>React Router Demo</h1>
    <Main />
  </div>
);

const Navigation = () => (
  <nav>
    <ul>
      <li><NavLink to='/'>Home</NavLink></li>
      <li><NavLink to='/about'>About</NavLink></li>
      <li><NavLink to='/contact'>Contact</NavLink></li>
    </ul>
  </nav>
);

const Main = () => {
  const location = useLocation();
  const hideNavigation = false
  // hideNavigation = location.pathname !== '/about'; // Define the condition to hide navigation

  return (
    <>
      {!hideNavigation && <Navigation />}
      <Routes>
        <Route path='/' element={<Home />}></Route>
        <Route path='/about' element={<About />}></Route>
        <Route path='/contact' element={<Contact />}></Route>
      </Routes>
    </>
);
}

export default App;

