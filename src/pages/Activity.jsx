import { useEffect, useState } from "react";

function Activity() {
  const [patients, setPatients] = useState([]);
  const [discharged, setDischarged] = useState([]);

  const loadData = () => {
    const local = JSON.parse(localStorage.getItem("patients")) || [];
    const dischargedData = JSON.parse(localStorage.getItem("discharged")) || [];

    setPatients(local);
    setDischarged(dischargedData);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("storage", loadData);

    return () => window.removeEventListener("storage", loadData);
  }, []);

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">

      <h2 className="text-2xl font-bold mb-4">Activity</h2>

      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6">
        <h3 className="font-semibold mb-3">Recently Added</h3>

        {patients.length === 0 ? (
          <p>No activity</p>
        ) : (
          patients.slice(-5).reverse().map(p => (
            <p key={p.id}>➕ {p.name} added</p>
          ))
        )}
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h3 className="font-semibold mb-3">Recently Discharged</h3>

        {discharged.length === 0 ? (
          <p>No discharge yet</p>
        ) : (
          discharged.slice(-5).reverse().map(p => (
            <p key={p.id}>🚪 {p.name} discharged</p>
          ))
        )}
      </div>

    </div>
  );
}

export default Activity;