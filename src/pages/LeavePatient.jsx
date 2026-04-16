import { useParams, useNavigate } from "react-router-dom";

function LeavePatient() {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleDischarge = () => {
    let api = JSON.parse(localStorage.getItem("apiPatients")) || [];
    let local = JSON.parse(localStorage.getItem("patients")) || [];
    let discharged = JSON.parse(localStorage.getItem("discharged")) || [];

    let patient = null;

    if (api.find(p => p.id === Number(id))) {
      patient = api.find(p => p.id === Number(id));

      api = api.filter(p => p.id !== Number(id));
      localStorage.setItem("apiPatients", JSON.stringify(api));
    } 
    else if (local.find(p => p.id === Number(id))) {
      patient = local.find(p => p.id === Number(id));

      local = local.filter(p => p.id !== Number(id));
      localStorage.setItem("patients", JSON.stringify(local));
    }

    if (!patient) {
      alert("Patient not found");
      return;
    }

    discharged.push({
      ...patient,
      status: "Discharged",
    });

    localStorage.setItem("discharged", JSON.stringify(discharged));

    window.dispatchEvent(new Event("storage"));

    navigate("/discharged");
  };

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">

      <h2 className="text-xl mb-4">Confirm Discharge</h2>

      <button
        onClick={handleDischarge}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Confirm Discharge
      </button>

    </div>
  );
}

export default LeavePatient;