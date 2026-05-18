import "styles/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer, Zoom } from "react-toastify";

// Import các component
import Home from "pages/Home";
import HeaderComponent from "components/Headers/HeaderComponent.jsx";
import LoginPage from "pages/Auth/LoginPage.tsx";
import Register from "pages/Auth/Register.tsx";
import FooterComponent from "components/FooterComponent.js";
import ForgotPassword from "pages/Auth/ForgotPassword.js";
import ScrollToTopComponent from "components/ScrollToTopComponent.tsx";
import AccountPage from "pages/Account/AccountPage.tsx";
import UploadDocument from "pages/Documents/DocumentUpload/UploadDocument.tsx";
import MyDocuments from "pages/Documents/MyDocuments/MyDocuments.tsx";
import DocumentDetail from "pages/Documents/DocumentDetail/DocumentDetail.tsx";
import MyCollections from "pages/Collections/MyCollections.tsx";
import CollectionDetail from "pages/Collections/CollectionDetail.tsx";
import NotFound from "pages/NotFound.tsx";
import VerifyEmail from "pages/Verification/VerifyEmail.tsx";
import ConfirmChangeEmail from "pages/Verification/ConfirmChangeEmail.tsx";
import ChangePassword from "pages/Auth/ChangePassword.js";
import Search from "pages/Search/Search.tsx";
import Categories from "pages/Categories.tsx";
import ChatBoxAI from "components/Chat/ChatBoxAI.tsx";
import { useState } from "react";
import Admin from "pages/Admin/Admin.tsx";
import MyReports from "pages/Reports/MyReports.tsx";
import ReportDetail from "pages/Reports/ReportDetail.tsx";
import PublicProfile from "pages/PublicProfile/PublicProfile.tsx";

const queryClient = new QueryClient();

// Layout cho các trang có Header và Footer
const MainLayout = ({ children }) => (
  <>
    <HeaderComponent />
    <main className="mx-auto min-h-screen w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-6 lg:py-8">
      {children}
    </main>
    <ScrollToTopComponent />
    <FooterComponent />
  </>
);

// Layout cho các trang không có Header và Footer (chỉ có nội dung)
const AuthLayout = ({ children }) => (
  <div className="min-h-screen grid grid-cols-1 items-center bg-canvas">
    {children}
  </div>
);

function App() {
  const [chatOpen, setChatOpen] = useState(false);
  
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
                  <Route path="/confirm-change-email" element={<ConfirmChangeEmail />} />
                  {/* Account */}
                  <Route path="/account/*" element={<AccountPage />} />
                  {/* Document */}
                  <Route path="/upload-document" element={<UploadDocument />} />
                  <Route path="/my-documents" element={<MyDocuments />} />
                  <Route path="/my-documents/page/:page" element={<MyDocuments />} />
                  <Route path="/document/:documentID" element={<DocumentDetail />} />
                  <Route path="/public-profile/:userID" element={<PublicProfile />} />
                  <Route path="/my-reports" element={<MyReports />} />
                  <Route path="/my-reports/:reportId" element={<ReportDetail />} />
                  <Route path="/search/:search" element={<Search />}/>
                  <Route path="/category/:id" element={<Categories />}/>
                  <Route path="/admin" element={<Admin />}/>
                  {/* Collections */}
                  <Route path="/my-collections" element={<MyCollections />} />
                  <Route path="/collection/:collectionId" element={<CollectionDetail />} />
                </Routes>
                {/* ChatBoxAI */}
                <ChatBoxAI
                  isOpenExternal={chatOpen}
                  onCloseExternal={() => setChatOpen(false)}
                />
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
