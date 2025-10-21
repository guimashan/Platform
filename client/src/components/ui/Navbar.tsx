import { Link, useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "首頁" },
    { path: "/checkin", label: "奉香簽到" },
    { path: "/service", label: "神務服務" },
    { path: "/schedule", label: "志工排班" },
  ];

  return (
    <div className="navbar bg-base-100 shadow-lg sticky top-0 z-50">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden" data-testid="button-menu">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
          >
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={location.pathname === item.path ? "active" : ""}
                  data-testid={`link-${item.label}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <Link to="/" className="btn btn-ghost text-xl" data-testid="link-home">
          🏯 龜馬山
        </Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={location.pathname === item.path ? "active" : ""}
                data-testid={`link-${item.label}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="navbar-end">
        <ThemeToggle />
      </div>
    </div>
  );
}
