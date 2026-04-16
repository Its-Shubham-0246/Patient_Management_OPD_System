import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AddPatient() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    age: "",
    disease: "",
    contact: "",
    doctor: "",
    date: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const api = JSON.parse(localStorage.getItem("apiPatients")) || [];
    const existing = JSON.parse(localStorage.getItem("patients")) || [];

    if (api.length + existing.length >= 100) {
      alert("❌ OPD Full!");
      return;
    }

    const newPatient = {
      id: Date.now(),
      ...form,
    };

    localStorage.setItem(
      "patients",
      JSON.stringify([...existing, newPatient])
    );

    window.dispatchEvent(new Event("storage"));
    navigate("/");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">

      <form className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow w-80" onSubmit={handleSubmit}>

        <h2 className="text-xl font-bold mb-4 text-center">Add Patient</h2>

        <input name="name" placeholder="Name" required onChange={handleChange}
          className="w-full p-2 border rounded-lg mb-3 bg-white dark:bg-gray-700 text-black dark:text-white" />

        <input name="age" type="number" placeholder="Age" required onChange={handleChange}
          className="w-full p-2 border rounded-lg mb-3 bg-white dark:bg-gray-700 text-black dark:text-white" />

        <input name="disease" placeholder="Disease" required onChange={handleChange}
          className="w-full p-2 border rounded-lg mb-3 bg-white dark:bg-gray-700 text-black dark:text-white" />

        <input name="contact" placeholder="+91..." required onChange={handleChange}
          className="w-full p-2 border rounded-lg mb-3 bg-white dark:bg-gray-700 text-black dark:text-white" />

        <select name="doctor" required onChange={handleChange}
          className="w-full p-2 border rounded-lg mb-3 bg-white dark:bg-gray-700 text-black dark:text-white">
          <option value="">Select Doctor</option>
          <option>General Physician</option>
          <option>Cardiologist</option>
          <option>Dermatologist</option>
          <option>Orthopedic</option>
        </select>

        <input name="date" type="date" required onChange={handleChange}
          className="w-full p-2 border rounded-lg mb-4 bg-white dark:bg-gray-700 text-black dark:text-white" />

        <button className="w-full bg-blue-500 text-white py-2 rounded-lg">
          Add Patient
        </button>

      </form>
    </div>
  );
}

export default AddPatient;