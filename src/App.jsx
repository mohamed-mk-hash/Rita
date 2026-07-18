import { Routes, Route } from "react-router";

import Home from "./pages/Home/Home.jsx";
import Services from "./pages/Services/Services.jsx";
import Pricing from "./pages/Pricing/Pricing.jsx";
import HowItWorks from "./pages/HowItWorks/HowItWorks.jsx";
import Contact from "./pages/Contact/Contact.jsx";
import Login from "./pages/Auth/Login.jsx";
import SignUp from "./pages/Auth/SignUp.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";

function Placeholder({ title }) {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#020516", color: "white" }}>
      <h1>{title}</h1>
    </main>
  );
}

function App() {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="/services" element={<Services />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/faq" element={<Placeholder title="FAQ" />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/sign-up" element={<SignUp />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
