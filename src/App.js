import "./CSS/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer, Zoom } from "react-toastify";

// Import các component
import Home from "./Pages/Home";
import HeaderComponent from "./Component/Headers/HeaderComponent.jsx";
import LoginPage from "./Pages/Login-Register/LoginPage.tsx";
import Register from "./Pages/Login-Register/Register.tsx";
import FooterComponent from "./Component/FooterComponent.js";
import ForgotPassword from "./Pages/Login-Register/ForgotPassword.js";
import ScrollToTopComponent from "./Component/ScrollToTopComponent.js";
import AccountPage from "./Pages/Account/AccountPage.js";
import UploadDocument from "./Pages/Documents/DocumentUpload/UploadDocument.tsx";
import MyDocuments from "./Pages/Documents/MyDocuments/MyDocuments.tsx";
import DocumentDetail from "./Pages/Documents/DocumentDetail/DocumentDetail.tsx";
import MyCollections from "./Pages/Collections/MyCollections.tsx";
import NotFound from "./Pages/NotFound.tsx";
import VerifyEmail from "./Pages/Verification/VerifyEmail.tsx";
import ChangePassword from "./Pages/Login-Register/ChangePassword.js";
import Search from "./Pages/Search/Search.tsx";

const queryClient = new QueryClient();

// Layout cho các trang có Header và Footer
const MainLayout = ({ children }) => (
  <>
    <HeaderComponent />
    <div className="md:max-w-screen-xl mx-auto md:p-4 min-h-screen">
      {children}
    </div>
    <ScrollToTopComponent />
    <FooterComponent />
  </>
);

// Layout cho các trang không có Header và Footer (chỉ có nội dung)
const AuthLayout = ({ children }) => (
  <div className="min-h-screen grid grid-cols-1 items-center bg-white">
    {children}
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Các trang không có Header/Footer */}
          <Route
            path="/login"
            element={
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            }
          />
          <Route
            path="/register"
            element={
              <AuthLayout>
                <Register />
              </AuthLayout>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <AuthLayout>
                <ForgotPassword />
              </AuthLayout>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <AuthLayout>
                <ChangePassword />
              </AuthLayout>
            }
          />

          {/* Các trang có Header/Footer */}
          <Route
            path="/*"
            element={
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="*" element={<NotFound />} />
                  {/* Verification */}
                  <Route path="/verify-email/:token" element={<VerifyEmail />} />
                  {/* Account */}
                  <Route path="/account/*" element={<AccountPage />} />
                  {/* Document */}
                  <Route path="/upload-document" element={<UploadDocument />} />
                  <Route path="/my-documents" element={<MyDocuments />} />
                  <Route path="/my-documents/page/:page" element={<MyDocuments />} />
                  <Route path="/document/:documentID" element={<DocumentDetail />} />
                  <Route path="/search/:search" element={<Search />}/>
                  {/* Collections */}
                  <Route path="/my-collections" element={<MyCollections />} />
                </Routes>
              </MainLayout>
            }
          />
        </Routes>
        {/* Toaster */}
        <ToastContainer transition={Zoom} position="top-center" autoClose={3000}/>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;