import { useEffect, useState } from "react";

function Reports() {
  const [patients, setPatients] = useState([]);

  const loadData = () => {
    const api = JSON.parse(localStorage.getItem("apiPatients")) || [];
    const local = JSON.parse(localStorage.getItem("patients")) || [];

    setPatients([...api, ...local]);
  };

  useEffect(() => {
    loadData();

    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, []);

  const diseaseCount = {};

  patients.forEach((p) => {
    diseaseCount[p.disease] = (diseaseCount[p.disease] || 0) + 1;
  });

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">

      <h2 className="text-2xl font-bold mb-6">Reports</h2>

      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">

        {patients.length === 0 ? (
          <p>No data available</p>
        ) : (
          Object.entries(diseaseCount).map(([disease, count]) => (
            <p key={disease} className="mb-2">
              {disease}: <b>{count}</b> patients
            </p>
          ))
        )}

      </div>

    </div>
  );
}

export default Reports;