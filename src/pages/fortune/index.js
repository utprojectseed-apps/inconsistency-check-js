import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import FortuneGame from "./fortunegame";

const Navigation = () => (
    <nav>
      <ul>
        <li><NavLink to='/'>Home</NavLink></li>
        <li><NavLink to='./survey'>Survey</NavLink></li>
        <li><NavLink to='./fortunegame'>Games</NavLink></li>
      </ul>
    </nav>
  );

export default function FortuneHome() {
    const location = useLocation();
    const hideNavigation = location.pathname !== '/fortune';

    return (
        <>

            {!hideNavigation && <h1>Fortune Game</h1>}
            {!hideNavigation && <Navigation />}
            <Routes>
              <Route path='fortunegame' element={<FortuneGame />}></Route>
            </Routes>
        </>
    )
}