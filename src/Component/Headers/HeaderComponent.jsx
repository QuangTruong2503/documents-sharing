import React, { useState } from "react";
import config from "../../config/config";
import AccountComponent from "./AccountComponent.jsx";
import VerificationComponent from "./VerificationComponent.jsx";
import SearchBoxComponent from "./SearchBoxComponent.jsx";

function HeaderComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);


  return (
    <>
      <nav className="bg-white border-gray-200 dark:bg-gray-900">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          <a href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
            <img src={config.websiteLogo} className="h-8" alt="DocShare Logo" />
            <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
              DocShare
            </span>
          </a>

          <div className="flex md:order-2 space-x-3 rtl:space-x-reverse">
            <div className="hidden md:block">
              <AccountComponent />
            </div>
            <button
              data-collapse-toggle="navbar-cta"
              type="button"
              className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
              aria-controls="navbar-cta"
              aria-expanded={isOpen}
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
          
          <div
            className={`${isOpen ? "block" : "hidden"} w-full md:block md:w-2/3`}
            id="navbar-cta"
          >
            <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 md:justify-center border border-gray-100 rounded-lg bg-gray-50 md:block md:w-2/3 md:mt-0 md:border-0 md:bg-white">
              <li>
                  <SearchBoxComponent />
              </li>
              <li className="md:hidden text-center">
                <AccountComponent onClose={() => setIsOpen(false)} />
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <VerificationComponent />
    </>
  );
}

export default HeaderComponent;