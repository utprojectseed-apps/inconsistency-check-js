import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import FortuneGame from "./fortunegame";
import FortuneSurveyDisplay from "./fortunesurveydisplay";
import FortuneHighlights from "./fortunehighlights";
import FortuneGraph from "./fortunegraph";

const Navigation = () => (
    <nav>
      <ul>
        <li><NavLink to='/'>Home</NavLink></li>
        <li><NavLink to='./survey'>Survey</NavLink></li>
        <li><NavLink to='./game'>Games</NavLink></li>
        <li><NavLink to='./highlight'>Highlights</NavLink></li>
        <li><NavLink to='./graph'>Graph</NavLink></li>
      </ul>
    </nav>
  );

export default function FortuneHome() {
    const location = useLocation();
    const hideNavigation = location.pathname !== '/fortune';

    return (
        <>
            {!hideNavigation && <div>
              <h1>Fortune Game</h1>
              <Navigation />
              <p>Remember to complete the highlight if it is Monday.</p>
              {new Date().getDay() === 1 && <p style={{color: "red"}}><b>It is Monday!</b></p>}
            </div>}
            <Routes>
              <Route path='game' element={<FortuneGame />}></Route>
              <Route path='survey' element={<FortuneSurveyDisplay />}></Route>
              <Route path='highlight' element={<FortuneHighlights />}></Route>
              <Route path='graph' element={<FortuneGraph />}></Route>
            </Routes>
        </>
    )
}