import React, { useState } from "react";
import config from "../../config/config";
import AccountComponent from "./AccountComponent.jsx";
import VerificationComponent from "./VerificationComponent.jsx";
import SearchBoxComponent from "./SearchBoxComponent.jsx";
import CategoriesComponent from "../Categories/CategoriesComponent.tsx";
import { Drawer } from "flowbite-react";
import { Menu } from "lucide-react";

function HeaderComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1280px] flex-wrap items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <a
            href="/"
            className="flex items-center gap-3"
          >
            <img src={config.websiteLogo} className="h-8" alt="DocShare Logo" />
            <span className="font-display text-2xl font-bold tracking-[-0.03em] text-ink">
              DocShare
            </span>
          </a>
          <div className="hidden w-2/5 md:block">
            <SearchBoxComponent />
          </div>
          {/* Desktop Account */}
          <div className="flex md:order-2">
            <div className="hidden md:block">
              <AccountComponent />
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-secondary transition hover:bg-canvas hover:text-primary focus:outline-none focus:shadow-focus md:hidden"
              onClick={toggleMenu}
              title="Mở menu"
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <Drawer className="block md:hidden" open={isOpen} onClose={closeMenu} position="left">
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
