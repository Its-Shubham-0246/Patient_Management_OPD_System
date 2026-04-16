import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

function PatientDetails() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    const api = JSON.parse(localStorage.getItem("apiPatients")) || [];
    const local = JSON.parse(localStorage.getItem("patients")) || [];

    const found = [...api, ...local].find(p => p.id === Number(id));
    setPatient(found);
  }, [id]);

  if (!patient) return <div className="p-6">Not found</div>;

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">

      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow max-w-md mx-auto">

        <h2 className="text-xl font-bold mb-4">Patient Details</h2>

        <p><b>Name:</b> {patient.name}</p>
        <p><b>Age:</b> {patient.age}</p>
        <p><b>Disease:</b> {patient.disease}</p>
        <p><b>Doctor:</b> {patient.doctor}</p>
        <p><b>Date:</b> {patient.date}</p>
        <p><b>Contact:</b> {patient.contact}</p>

      </div>

    </div>
  );
}

export default PatientDetails;