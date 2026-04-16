import { useEffect, useState } from "react";

function Discharged() {
  const [data, setData] = useState([]);

  const load = () => {
    const d = JSON.parse(localStorage.getItem("discharged")) || [];
    setData(d);
  };

  useEffect(() => {
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">

      <h2 className="text-2xl mb-4">Discharged Patients</h2>

      {data.length === 0 ? (
        <p>No patients</p>
      ) : (
        data.map(p => (
          <div key={p.id} className="bg-white dark:bg-gray-800 p-4 mb-3 rounded shadow">
            <h3>{p.name}</h3>
            <p>{p.disease}</p>
            <p className="text-red-500">{p.status}</p>
          </div>
        ))
      )}

    </div>
  );
}

export default Discharged;