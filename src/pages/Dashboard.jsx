import { useEffect, useState } from "react";

function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [discharged, setDischarged] = useState([]);

  const loadData = () => {
    const api = JSON.parse(localStorage.getItem("apiPatients")) || [];
    const local = JSON.parse(localStorage.getItem("patients")) || [];
    const dis = JSON.parse(localStorage.getItem("discharged")) || [];

    setPatients([...api, ...local]);
    setDischarged(dis);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, []);

  const MAX = 100;
  const total = patients.length;
  const available = MAX - total;

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">

      <h2 className="text-2xl font-bold mb-2">Dashboard</h2>
      <p className="text-sm text-gray-500 mb-6">
        {new Date().toLocaleDateString()}
      </p>

      <div className="grid grid-cols-3 gap-6">

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <h3>Total Patients</h3>
          <p className="text-3xl font-bold">{total}</p>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <h3>Discharged</h3>
          <p className="text-3xl font-bold">{discharged.length}</p>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <h3>Available Slots</h3>
          <p className="text-3xl font-bold">
            {available} / {MAX}
          </p>
        </div>

      </div>

      <div className="mt-6">
        {available > 0 ? (
          <div className="bg-green-500 text-white p-3 rounded text-center">
            🟢 OPD Active
          </div>
        ) : (
          <div className="bg-red-500 text-white p-3 rounded text-center">
            🔴 OPD Full
          </div>
        )}
      </div>
      {available < 10 && available > 0 && (
        <div className="mt-4 bg-yellow-500 text-white p-3 rounded text-center">
          ⚠️ OPD Almost Full
        </div>
      )}

    </div>
  );
}

export default Dashboard;