import React, { useState } from "react";
import config from "../../config/config";
import AccountComponent from "./AccountComponent.jsx";
import VerificationComponent from "./VerificationComponent.jsx";
import SearchBoxComponent from "./SearchBoxComponent.jsx";
import CategoriesComponent from "../Categories/CategoriesComponent.tsx";
import { Drawer } from "flowbite-react";

function HeaderComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <nav className="bg-white border-gray-200 dark:bg-gray-900">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          {/* Logo */}
          <a
            href="/"
            className="flex items-center space-x-3 rtl:space-x-reverse"
          >
            <img src={config.websiteLogo} className="h-8" alt="DocShare Logo" />
            <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
              DocShare
            </span>
          </a>
          <div className="hidden md:block w-2/5">
            <SearchBoxComponent />
          </div>
          {/* Desktop Account */}
          <div className="flex md:order-2 space-x-3 rtl:space-x-reverse">
            <div className="hidden md:block">
              <AccountComponent />
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
              onClick={toggleMenu}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="w-5 h-5"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 17 14"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M1 1h15M1 7h15M1 13h15"
                />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <Drawer className="md:hidden block" open={isOpen} onClose={closeMenu} position="left">
        <Drawer.Header title="Menu" />
        <Drawer.Items>
          <div className="space-y-4">
            <CategoriesComponent />
            <AccountComponent onClose={closeMenu} />
            <hr />
            <SearchBoxComponent />
          </div>
        </Drawer.Items>
      </Drawer>

      {/* Category + Verification */}
      <div className="hidden md:block">
        <CategoriesComponent />
      </div>
      <VerificationComponent />
    </>
  );
}

export default HeaderComponent;
