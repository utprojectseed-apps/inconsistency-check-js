import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import CognitiveGame from "./cognitivegame";
import CognitiveHighlights from "./cognitivehighlights";
import CognitiveSurveyDisplay from "./cognitivesurveydisplay";

const Navigation = () => (
    <nav>
      <ul>
        <li><NavLink to='/'>Home</NavLink></li>
        <li><NavLink to='./survey'>Survey</NavLink></li>
        <li><NavLink to='./game'>Games</NavLink></li>
        <li><NavLink to='./highlight'>Highlights</NavLink></li>
      </ul>
    </nav>
  );

export default function CognitivePage() {
    const location = useLocation();
    const hideNavigation = location.pathname !== '/cognitive';

    return (
        <>
            {!hideNavigation && <div>
              <h1>Cognitive Game</h1>
              <Navigation />
              <p>Remember to complete the highlight if it is Monday.</p>
              {new Date().getDay() === 1 && <p style={{color: "red"}}><b>It is Monday!</b></p>}
            </div>}
            <Routes>
              <Route path='game' element={<CognitiveGame />}></Route>
              <Route path='highlight' element={<CognitiveHighlights />}></Route>
              <Route path='survey' element={<CognitiveSurveyDisplay />}></Route>
            </Routes>
        </>
    )
}