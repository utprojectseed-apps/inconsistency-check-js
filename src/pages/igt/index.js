import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import IowaGames from "./games";

const Navigation = () => (
    <nav>
      <ul>
        <li><NavLink to='/'>Home</NavLink></li>
        <li><NavLink to='./survey'>Survey</NavLink></li>
        <li><NavLink to='./games'>Games</NavLink></li>
      </ul>
    </nav>
  );

export default function IowaGamblingPage() {
    const location = useLocation();
    const hideNavigation = location.pathname !== '/igt';

    return (
        <>

            {!hideNavigation && <h1>Iowa</h1>}
            {!hideNavigation && <Navigation />}
            <Routes>
              <Route path='games' element={<IowaGames />}></Route>
            </Routes>
        </>
    )
}