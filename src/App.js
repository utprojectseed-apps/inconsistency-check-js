import React from 'react';
import './App.css';
import { NavLink, Routes, Route, useLocation } from 'react-router-dom';
import FortuneHome from './pages/fortune';
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
      <li><NavLink to={'cognitive'}>Cognitive Games</NavLink></li>
      <li><NavLink to={'fortune'}>Fortune Task</NavLink></li>
    </ul>
  </nav>
);

const Main = () => {
  const location = useLocation();
  const hideNavigation = location.pathname !== "/"
  console.log(location.pathname)
  return (
    <>
      {!hideNavigation && <h1>Choose Application v0.0.2</h1>}
      {!hideNavigation && <Navigation />}
      <Routes>
        <Route path={"/"} element={<Home />}></Route>
        <Route path={'/cognitive/*'} element={<CognitivePage />}></Route>
        <Route path={'/fortune/*'} element={<FortuneHome />}></Route>
      </Routes>
    </>
);
}

export default App;

