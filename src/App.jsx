import {
  Routes,
  Route,
  Outlet,
} from "react-router";

import Home from "./pages/Home/Home.jsx";
import Services from "./pages/Services/Services.jsx";
import Pricing from "./pages/Pricing/Pricing.jsx";
import HowItWorks from "./pages/HowItWorks/HowItWorks.jsx";
import Contact from "./pages/Contact/Contact.jsx";
import Login from "./pages/Auth/Login.jsx";
import SignUp from "./pages/Auth/SignUp.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";

import FloatingWhatsApp from "./components/FloatingWhatsApp.jsx";

function Placeholder({ title }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#020516",
        color: "white",
      }}
    >
      <h1>{title}</h1>
    </main>
  );
}

/*
 * هذا Layout خاص بصفحات الزوار فقط.
 * زر واتساب سيظهر في الصفحات الموجودة داخله.
 */
function VisitorLayout() {
  return (
    <>
      <Outlet />
      <FloatingWhatsApp />
    </>
  );
}

function App() {
  return (
    <Routes>
      {/* صفحات الزوار التي يظهر فيها زر واتساب */}
      <Route element={<VisitorLayout />}>
        <Route index element={<Home />} />

        <Route
          path="/services"
          element={<Services />}
        />

        <Route
          path="/pricing"
          element={<Pricing />}
        />

        <Route
          path="/how-it-works"
          element={<HowItWorks />}
        />

        <Route
          path="/faq"
          element={<Placeholder title="FAQ" />}
        />

        <Route
          path="/contact"
          element={<Contact />}
        />
      </Route>

      {/* صفحات الحساب بدون زر واتساب */}
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/sign-up"
        element={<SignUp />}
      />

      <Route
        path="/dashboard"
        element={<Dashboard />}
      />
    </Routes>
  );
}

export default App;