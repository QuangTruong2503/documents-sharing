import "./CSS/App.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Pages/Home";
import HeaderComponent from "./Component/HeaderComponent";
import LoginPage from "./Pages/Login-Register/LoginPage.js";
import Register from "./Pages/Login-Register/Register.js";
import FooterComponent from "./Component/FooterComponent.js";
import ForgotPassword from "./Pages/Login-Register/ForgotPassword.js";
import ScrollToTopComponent from "./Component/ScrollToTopComponent.js";

function App() {
  return (
    <BrowserRouter>
      <HeaderComponent />
      <div className="max-w-screen-xl mx-auto p-4 min-h-screen">
      <Routes>
        <Route path="/" Component={Home} />
        
        {/* Login */}
        <Route path="/login" Component={LoginPage}/>
        <Route path="/register" Component={Register}/>
        <Route path="/forgot-password" Component={ForgotPassword}/>
      </Routes>
      </div>
      <ScrollToTopComponent />
      <FooterComponent />
    </BrowserRouter>
  );
}

export default App;
