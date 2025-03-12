import "./CSS/App.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import Home from "./Pages/Home";
import HeaderComponent from "./Component/Headers/HeaderComponent.jsx";
import LoginPage from "./Pages/Login-Register/LoginPage.tsx";
import Register from "./Pages/Login-Register/Register.tsx";
import FooterComponent from "./Component/FooterComponent.js";
import ForgotPassword from "./Pages/Login-Register/ForgotPassword.js";
import ScrollToTopComponent from "./Component/ScrollToTopComponent.js";
import { ToastContainer } from "react-toastify";
import AccountPage from "./Pages/Account/AccountPage.js";
import UploadDocument from "./Pages/Documents/UploadDocument.tsx";
import MyDocuments from "./Pages/Documents/MyDocuments.tsx";

const queryClient = new QueryClient();

function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
      <HeaderComponent />
      <div className="max-w-screen-xl mx-auto p-4 min-h-screen">
        <Routes>
          <Route path="/" Component={Home} />

          {/* Login */}
          <Route path="/login" Component={LoginPage} />
          <Route path="/register" Component={Register} />
          <Route path="/forgot-password" Component={ForgotPassword} />

          {/* Account */}
          <Route path="/account/*" Component={AccountPage} />

          {/* Document */}
          <Route path="/upload-document" Component={UploadDocument}/>
          <Route path="/my-documents" Component={MyDocuments}/>
        </Routes>
      </div>
      <ScrollToTopComponent />
      <FooterComponent />
      {/* Toaster */}
      <ToastContainer />
    </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
