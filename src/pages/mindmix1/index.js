import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import MindMix1Game from "./mindmix1";
import Mindmix1SurveyDisplay from "./mix1surveydisplay";
import MindMix1Highlights from "./mix1highlights";


const Navigation = () => (
  <nav>
    <ul>
      <li>
        <NavLink to="/">Home</NavLink>
      </li>
      <li>
        <NavLink to="./survey">Survey</NavLink>
      </li>
      <li>
        <NavLink to="./game">Games</NavLink>
      </li>
      <li>
        <NavLink to="./highlight">Highlights</NavLink>
      </li>
    </ul>
  </nav>
);

export default function MindMix1Page() {
  const location = useLocation();
  const hideNavigation = location.pathname !== "/mindmix1";

  return (
    <>
      {!hideNavigation && (
        <div>
          <h1>Mind Mix 1</h1>
          <Navigation />
          <p>
            Mind Mix 1 is Brain Games (days 1-7) and Fortune Deck (days 8-14).
          </p>
          <p>
            Reminder that when inputing the CSVs it is in order: BDS, Simon,
            Color-Shape, and Fortune (top to bottom)!{" "}
          </p>
          {new Date().getDay() === 1 && (
            <p style={{ color: "red" }}>
              <b>It is Monday!</b>
            </p>
          )}
        </div>
      )}
      <Routes>
        <Route path="game" element={<MindMix1Game />}></Route>
        <Route path="survey" element={<Mindmix1SurveyDisplay />}></Route>
        <Route path="highlight" element={<MindMix1Highlights />}></Route>
      </Routes>
    </>
  );
} // <Route path='survey' element={<CognitiveSurveyDisplay />}></Route>
