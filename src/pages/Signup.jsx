import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = (e) => {
    e.preventDefault();

    localStorage.setItem("user", JSON.stringify(form));
    alert("Signup successful!");
    navigate("/login");
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-cyan-900 via-teal-800 to-blue-900 dark:from-cyan-950 dark:via-teal-900 dark:to-blue-950 flex flex-col justify-between">

      <div className="text-center mt-10 px-4">
        <h1 className="text-3xl font-bold text-white">🏥 OPD Management System</h1>

        <p className="text-gray-200 mt-2">
          Register to manage OPD patients and hospital workflow easily.
        </p>
      </div>

      <div className="flex justify-center items-center flex-1">
        <form
          onSubmit={handleSignup}
          className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-80"
        >

          <h2 className="text-2xl font-bold mb-6 text-center">Signup</h2>

          <input
            name="name"
            placeholder="Full Name"
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-lg mb-4 bg-white dark:bg-gray-700 text-black dark:text-white"
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-lg mb-4 bg-white dark:bg-gray-700 text-black dark:text-white"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-lg mb-6 bg-white dark:bg-gray-700 text-black dark:text-white"
          />

          <button className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition">
            Signup
          </button>

          <p className="text-sm text-center mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-500">
              Login
            </Link>
          </p>

        </form>
      </div>

      <div className="text-center mb-6 text-sm text-gray-200 dark:text-gray-400">
        📞 Contact: +91 9876543210 | ✉️ support@opd.com
      </div>

    </div>
  );
}

export default Signup;