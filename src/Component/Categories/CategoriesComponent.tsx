import React, { useEffect, useState, useCallback } from "react";
import { Accordion } from "flowbite-react";
import categoriesAPI from "../../api/categoriesAPI";
import { NavLink } from "react-router-dom";

export interface Category {
  category_id: string;
  name: string;
  description: string;
  parent_id: string | null;
}

const CategoriesComponent: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  // Memoized fetch function
  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response?.data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const parentCategories = categories.filter((cat) => !cat.parent_id);
  const getChildren = useCallback(
    (parentId: string) => categories.filter((cat) => cat.parent_id === parentId),
    [categories]
  );
  return (
    <>
      {/* Desktop - Hover Dropdown */}
      <nav className="hidden sm:flex justify-center items-center gap-8 px-8 py-4 bg-white border-t border-gray-100 shadow-sm">
        {parentCategories.map((parent, index) => {
          const children = getChildren(parent.category_id);
          return (
            <div
              key={parent.category_id}
              className="relative group"
              onMouseEnter={() => setOpenDropdown(index)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <NavLink
                to={`/category/${parent.category_id}`}
                className={({ isActive }) =>
                  `font-medium text-gray-700 transition-colors duration-200 whitespace-nowrap ${
                    isActive || index === openDropdown
                      ? "text-blue-600"
                      : "hover:text-blue-500"
                  }`
                }
              >
                {parent.name}
              </NavLink>
              {children.length > 0 && openDropdown === index && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 min-w-[240px] z-20">
                  <span className="opacity-0 p-1"></span>
                  <ul
                    className={`
                      py-3 px-4 bg-white rounded-lg shadow-xl border border-gray-100
                      grid ${children.length > 10 ? "grid-cols-2" : "grid-cols-1"}
                      gap-3 max-h-[70vh] overflow-y-auto
                    `}
                  >
                    {children.map((child) => (
                      <li key={child.category_id}>
                        <NavLink
                          to={`/category/${child.category_id}`}
                          className={({ isActive }) =>
                            `block text-sm text-gray-600 transition-colors duration-200 ${
                              isActive ? "text-blue-600" : "hover:text-blue-500"
                            }`
                          }
                        >
                          {child.name}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Mobile - Accordion */}
      <div className="sm:hidden px-4 py-2">
        <Accordion collapseAll className="border-none">
          {parentCategories.map((parent) => {
            const children = getChildren(parent.category_id);
            return (
              <Accordion.Panel key={parent.category_id}>
                <Accordion.Title className="text-gray-700 hover:text-blue-500 focus:ring-2 focus:ring-blue-200 bg-gray-50">
                  <NavLink
                    to={`/category/${parent.category_id}`}
                    className={({ isActive }) =>
                      `${isActive ? "text-blue-600" : ""}`
                    }
                  >
                    {parent.name}
                  </NavLink>
                </Accordion.Title>
                <Accordion.Content className="bg-white">
                  {children.length > 0 ? (
                    <ul className="space-y-3 py-2 text-sm text-gray-600">
                      {children.map((child) => (
                        <li key={child.category_id}>
                          <NavLink
                            to={`/category/${child.category_id}`}
                            className={({ isActive }) =>
                              `block transition-colors duration-200 ${
                                isActive ? "text-blue-600" : "hover:text-blue-500"
                              }`
                            }
                          >
                            {child.name}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 py-2">
                      No subcategories available
                    </p>
                  )}
                </Accordion.Content>
              </Accordion.Panel>
            );
          })}
        </Accordion>
      </div>
    </>
  );
};

export default React.memo(CategoriesComponent);