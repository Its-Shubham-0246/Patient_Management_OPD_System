# Patient Management OPD System

This is a complete Patient Management System focusing on the Outpatient Department (OPD). The current implementation covers core patient lifecycle management features, allowing seamless tracking from admission to discharge.

## Features

- **Add / Edit Patient:** A smart two-step registration process. Before adding a new profile, the system features a **Patient Lookup** based on name and mobile number. If the patient already exists, it auto-fills their history so you can edit and update their records. If they are new, you can add them by filling out their personal details (Age, Blood Group, Contact, etc.) and medical information (Diagnosis, Assigned Doctor, Priority, and Clinical Notes). It also includes capacity limits to prevent overcrowding (max 100 patients).
- **Leave & Discharge Management:** A comprehensive discharge workflow (`LeavePatient.jsx` & `Discharged.jsx`) that allows you to confidently discharge patients. During discharge, you can record vital signs (BP, Temp, Pulse, Weight), select a disease to auto-fill a prescription, and add doctor's notes. Upon confirmation, the patient is securely moved out of the active list and saved in the Discharged records along with a generated discharge date. From here, you can seamlessly review discharged patients and generate an instant, print-ready Discharge Summary.
- **API Data Integration:** The application dynamically fetches initial patient records via a mock API service wrapper. This data is intelligently cached locally (using `localStorage`) to provide a seamless, persistent experience while demonstrating real-world asynchronous API data fetching and state management.

## Project Setup

To get the project up and running locally:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
