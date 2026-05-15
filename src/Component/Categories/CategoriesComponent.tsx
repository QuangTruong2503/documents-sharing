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
      <nav className="hidden h-14 items-center justify-center gap-3 border-b border-line bg-surface/80 px-6 backdrop-blur sm:flex">
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
                  `rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                    isActive || index === openDropdown
                      ? "bg-primary-soft text-primary"
                      : "text-ink-secondary hover:bg-canvas hover:text-primary"
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
                      py-3 px-4 bg-surface rounded-lg shadow-lg border border-line
                      grid ${children.length > 10 ? "grid-cols-2" : "grid-cols-1"}
                      gap-3 max-h-[70vh] overflow-y-auto
                    `}
                  >
                    {children.map((child) => (
                      <li key={child.category_id}>
                        <NavLink
                          to={`/category/${child.category_id}`}
                          className={({ isActive }) =>
                            `block rounded-md px-2 py-1.5 text-sm transition-colors duration-200 ${
                              isActive ? "bg-primary-soft text-primary" : "text-ink-secondary hover:bg-canvas hover:text-primary"
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
      <div className="px-4 py-2 sm:hidden">
        <Accordion collapseAll className="border-none">
          {parentCategories.map((parent) => {
            const children = getChildren(parent.category_id);
            return (
              <Accordion.Panel key={parent.category_id}>
                <Accordion.Title className="bg-canvas text-ink-secondary hover:text-primary focus:shadow-focus focus:ring-0">
                  <NavLink
                    to={`/category/${parent.category_id}`}
                    className={({ isActive }) =>
                      `${isActive ? "text-primary" : ""}`
                    }
                  >
                    {parent.name}
                  </NavLink>
                </Accordion.Title>
                <Accordion.Content className="bg-surface">
                  {children.length > 0 ? (
                    <ul className="space-y-3 py-2 text-sm text-ink-secondary">
                      {children.map((child) => (
                        <li key={child.category_id}>
                          <NavLink
                            to={`/category/${child.category_id}`}
                            className={({ isActive }) =>
                              `block transition-colors duration-200 ${
                                isActive ? "text-primary" : "hover:text-primary"
                              }`
                            }
                          >
                            {child.name}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-2 text-sm text-neutral">
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
