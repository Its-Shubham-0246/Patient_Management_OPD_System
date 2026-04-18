const DISEASES  = ["Hypertension", "Diabetes", "Asthma", "Common Cold", "Influenza", "Gastritis", "Anemia", "Migraine", "Typhoid", "Dermatitis"];
const DOCTORS   = ["General Physician", "Cardiologist", "Dermatologist", "Orthopedic", "Neurologist", "Pediatrician", "ENT Specialist"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];

// Fallback if API is down
const FALLBACK_USERS = [
  { id: 1,  firstName: "Rahul",   lastName: "Sharma",  age: 34, gender: "male",   bloodGroup: "B+",  phone: "9876543210" },
  { id: 2,  firstName: "Priya",   lastName: "Verma",   age: 28, gender: "female", bloodGroup: "A+",  phone: "9812345678" },
  { id: 3,  firstName: "Amit",    lastName: "Kumar",   age: 45, gender: "male",   bloodGroup: "O+",  phone: "9823456789" },
  { id: 4,  firstName: "Sunita",  lastName: "Patel",   age: 52, gender: "female", bloodGroup: "AB+", phone: "9834567890" },
  { id: 5,  firstName: "Deepak",  lastName: "Singh",   age: 38, gender: "male",   bloodGroup: "B−",  phone: "9845678901" },
  { id: 6,  firstName: "Kavya",   lastName: "Nair",    age: 22, gender: "female", bloodGroup: "O−",  phone: "9856789012" },
  { id: 7,  firstName: "Rajesh",  lastName: "Gupta",   age: 60, gender: "male",   bloodGroup: "A−",  phone: "9867890123" },
  { id: 8,  firstName: "Ananya",  lastName: "Mishra",  age: 31, gender: "female", bloodGroup: "AB−", phone: "9878901234" },
  { id: 9,  firstName: "Vikram",  lastName: "Yadav",   age: 47, gender: "male",   bloodGroup: "B+",  phone: "9889012345" },
  { id: 10, firstName: "Meera",   lastName: "Joshi",   age: 26, gender: "female", bloodGroup: "A+",  phone: "9890123456" },
];

function mapUsers(users) {
  return users.map(u => ({
    id:       1000 + u.id,
    name:     `${u.firstName} ${u.lastName}`,
    age:      u.age,
    gender:   u.gender === "male" ? "Male" : "Female",
    blood:    u.bloodGroup || "O+",
    contact:  String(u.phone).replace(/[^\d]/g, "").slice(0, 10),
    disease:  DISEASES[Math.floor(Math.random() * DISEASES.length)],
    doctor:   DOCTORS[Math.floor(Math.random() * DOCTORS.length)],
    date:     new Date().toISOString().slice(0, 10),
    priority: PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)],
    notes:    "Fetched from external clinical registry.",
  }));
}

export const fetchApiPatients = async () => {
  try {
    // dummyjson returns name, age, gender, bloodGroup, phone — perfect for patients
    const res = await fetch("https://dummyjson.com/users?limit=10&select=id,firstName,lastName,age,gender,bloodGroup,phone");
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return mapUsers(data.users);
  } catch (err) {
    console.warn("API unavailable, using local fallback.", err.message);
    return mapUsers(FALLBACK_USERS);
  }
};
