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

            {!hideNavigation && <h1>Cognitive Games</h1>}
            {!hideNavigation && <Navigation />}
            <Routes>
              <Route path='game' element={<CognitiveGame />}></Route>
              <Route path='highlight' element={<CognitiveHighlights />}></Route>
              <Route path='survey' element={<CognitiveSurveyDisplay />}></Route>
            </Routes>
        </>
    )
}