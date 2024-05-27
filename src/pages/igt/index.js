import { NavLink } from "react-router-dom";

const Navigation = () => (
    <nav>
      <ul>
        <li><NavLink to='./survey'>Survey</NavLink></li>
        <li><NavLink to='./games'>Games</NavLink></li>
      </ul>
    </nav>
  );

export default function IowaGamblingPage() {
    return (
        <>
            <h1>Iowa</h1>
            <Navigation />
        </>
    )
}