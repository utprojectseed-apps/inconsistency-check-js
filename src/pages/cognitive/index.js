import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import CognitiveGame from "./cognitivegame";

const Navigation = () => (
    <nav>
      <ul>
        <li><NavLink to={process.env.PUBLIC_URL}>Home</NavLink></li>
        <li><NavLink to='./survey'>Survey</NavLink></li>
        <li><NavLink to='./game'>Games</NavLink></li>
      </ul>
    </nav>
  );

export default function CognitivePage() {
    const location = useLocation();
    const hideNavigation = location.pathname !== process.env.PUBLIC_URL + '/cognitive';

    return (
        <>

            {!hideNavigation && <h1>Cognitive Games</h1>}
            {!hideNavigation && <Navigation />}
            <Routes>
              <Route path='game' element={<CognitiveGame />}></Route>
            </Routes>
        </>
    )
}