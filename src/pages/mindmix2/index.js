import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import MindMix2Game from "./mindmix2";
import Mindmix2SurveyDisplay from "./mix2surveydisplay";
import MindMix2Highlights from "./mix2highlights";


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

export default function MindMix2Page() {
  const location = useLocation();
  const hideNavigation = location.pathname !== "/mindmix2";

  return (
    <>
      {!hideNavigation && (
        <div>
          <h1>Mind Mix 2</h1>
          <Navigation />
          <p>
            Mind Mix 2 is Fortune Deck (days 1-7) and Brain Games (days 8-14).
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
        <Route path="game" element={<MindMix2Game />}></Route>
        <Route path="survey" element={<Mindmix2SurveyDisplay />}></Route>
        <Route path="highlight" element={<MindMix2Highlights />}></Route>
      </Routes>
    </>
  );
} // <Route path='survey' element={<CognitiveSurveyDisplay />}></Route>
