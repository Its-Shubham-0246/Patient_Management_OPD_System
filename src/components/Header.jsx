import { Link, useNavigate, useLocation } from "react-router-dom";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem("auth");
    window.dispatchEvent(new Event("storage"));
    navigate("/login");
  };

  const linkStyle = (path) =>
    `cursor-pointer ${location.pathname === path
      ? "text-blue-500 font-bold"
      : "hover:text-blue-500"
    }`;

  return (
    <nav className="bg-white dark:bg-gray-900 shadow px-6 py-3 flex justify-between items-center">

      {/* LOGO */}
      <h2
        className="font-bold text-lg cursor-pointer"
        onClick={() => navigate("/")}
      >
        🏥 OPD System
      </h2>

      {/* NAV LINKS */}
      <div className="flex items-center space-x-5 text-sm">
        <Link to="/about" className={linkStyle("/about")}>
          About
        </Link>

        <Link to="/contact" className={linkStyle("/contact")}>
          Contact
        </Link>

        <Link to="/" className={linkStyle("/")}>
          Home
        </Link>

        <Link to="/add" className={linkStyle("/add")}>
          Add Patient
        </Link>

        <Link to="/discharged" className={linkStyle("/discharged")}>
          Discharged
        </Link>

        {/* LOGOUT */}
        <button
          onClick={logout}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
        >
          Logout
        </button>

      </div>

    </nav>
  );
}

export default Header;