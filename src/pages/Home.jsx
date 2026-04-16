import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const diseaseDoctorMap = {
  Cold: "General Physician",
  Fever: "General Physician",
  Fracture: "Orthopedic",
  "Skin Allergy": "Dermatologist",
  "Heart Pain": "Cardiologist",
};

const diseases = Object.keys(diseaseDoctorMap);

const getIndianNumber = () => {
  return "+91 " + Math.floor(9000000000 + Math.random() * 1000000000);
};

function Home() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");

  const [doctorFilter, setDoctorFilter] = useState("");
  const [diseaseFilter, setDiseaseFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const loadData = async () => {
    try {
      const stored = JSON.parse(localStorage.getItem("apiPatients"));

      let apiPatients = [];

      if (stored && stored.length > 0) {
        apiPatients = stored; 
      } else {
        const res = await fetch("https://jsonplaceholder.typicode.com/users");
        const data = await res.json();

        apiPatients = data.map((user) => {
          const disease =
            diseases[Math.floor(Math.random() * diseases.length)];

          return {
            id: user.id,
            name: user.name,
            disease: disease,
            doctor: diseaseDoctorMap[disease], 
            contact: getIndianNumber(), 
            date: new Date().toISOString().split("T")[0],
          };
        });

        localStorage.setItem("apiPatients", JSON.stringify(apiPatients));
      }

      const local =
        JSON.parse(localStorage.getItem("patients")) || [];

      setPatients([...apiPatients, ...local]);

    } catch (err) {
      console.log("API error", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = patients.filter((p) => {
    return (
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.disease.toLowerCase().includes(search.toLowerCase()) ||
        p.doctor.toLowerCase().includes(search.toLowerCase())) &&

      (doctorFilter ? p.doctor === doctorFilter : true) &&
      (diseaseFilter
        ? p.disease.toLowerCase().includes(diseaseFilter.toLowerCase())
        : true) &&
      (dateFilter ? p.date === dateFilter : true)
    );
  });

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">

      <h2 className="text-2xl font-bold mb-6">
        Patients ({patients.length})
      </h2>

      <input
        placeholder="Search by name / disease / doctor..."
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 border rounded-lg mb-4 bg-white dark:bg-gray-800 text-black dark:text-white"
      />

      <div className="grid grid-cols-3 gap-4 mb-6">

        <select
          onChange={(e) => setDoctorFilter(e.target.value)}
          className="p-2 border rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white"
        >
          <option value="">All Doctors</option>
          <option>General Physician</option>
          <option>Cardiologist</option>
          <option>Dermatologist</option>
          <option>Orthopedic</option>
        </select>

        <input
          placeholder="Filter by disease"
          onChange={(e) => setDiseaseFilter(e.target.value)}
          className="p-2 border rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white"
        />

        <input
          type="date"
          onChange={(e) => setDateFilter(e.target.value)}
          className="p-2 border rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white"
        />

      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          🚫 No patients found
        </p>
      ) : (
        filtered.map((p) => (
          <div
            key={p.id}
            className="bg-white dark:bg-gray-800 p-5 mb-4 rounded-xl shadow hover:shadow-lg transition"
          >
            <div className="flex justify-between items-center">

              <div>
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  {p.disease} • {p.doctor}
                </p>
                <p className="text-xs text-gray-400">{p.date}</p>
                <p className="text-sm mt-1">📞 {p.contact}</p>
              </div>

              <div className="space-x-2">
                <Link
                  to={`/patient/${p.id}`}
                  className="px-3 py-1 bg-blue-500 text-white rounded"
                >
                  View
                </Link>

                <Link
                  to={`/leave/${p.id}`}
                  className="px-3 py-1 bg-red-500 text-white rounded"
                >
                  Discharge
                </Link>
              </div>

            </div>
          </div>
        ))
      )}

    </div>
  );
}

export default Home;