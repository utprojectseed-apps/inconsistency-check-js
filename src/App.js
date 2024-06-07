import React from 'react';
import './App.css';
import { NavLink, Routes, Route, useLocation } from 'react-router-dom';
import IowaGamblingPage from './pages/igt';
import CognitivePage from './pages/cognitive';
import Home from './pages/home';

const App = () => (
  <div className='app'>
    <Main />
  </div>
);

const Navigation = () => (
  <nav>
    <ul>
      <li><NavLink to='/cognitive'>Cogntive Games</NavLink></li>
      <li><NavLink to='/igt'>Iowa Gambling Task</NavLink></li>
    </ul>
  </nav>
);

const Main = () => {
  const location = useLocation();
  const hideNavigation = location.pathname !== '/';

  return (
    <>
      {!hideNavigation && <h1>Choose Application</h1>}
      {!hideNavigation && <Navigation />}
      <Routes>
        <Route path='/' element={<Home />}></Route>
        <Route path='/cognitive/*' element={<CognitivePage />}></Route>
        <Route path='/igt/*' element={<IowaGamblingPage />}></Route>
      </Routes>
    </>
);
}

export default App;

