import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import FortuneGame from "./fortunegame";

const Navigation = () => (
    <nav>
      <ul>
        <li><NavLink to={process.env.PUBLIC_URL}>Home</NavLink></li>
        <li><NavLink to='./survey'>Survey</NavLink></li>
        <li><NavLink to='./game'>Games</NavLink></li>
      </ul>
    </nav>
  );

export default function FortuneHome() {
    const location = useLocation();
    const hideNavigation = location.pathname !== process.env.PUBLIC_URL + '/fortune';

    return (
        <>

            {!hideNavigation && <h1>Fortune Game</h1>}
            {!hideNavigation && <Navigation />}
            <Routes>
              <Route path='game' element={<FortuneGame />}></Route>
            </Routes>
        </>
    )
}