import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import FortuneGame from "./fortunegame";
import FortuneSurveyDisplay from "./fortunesurveydisplay";

const Navigation = () => (
    <nav>
      <ul>
        <li><NavLink to='/'>Home</NavLink></li>
        <li><NavLink to='./survey'>Survey</NavLink></li>
        <li><NavLink to='./game'>Games</NavLink></li>
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
              <Route path='game' element={<FortuneGame />}></Route>
              <Route path='survey' element={<FortuneSurveyDisplay />}></Route>
            </Routes>
        </>
    )
}