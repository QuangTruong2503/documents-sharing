import React, { useEffect, useState } from "react";
import { Accordion } from "flowbite-react";
import categoriesAPI from "../api/categoriesAPI";
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

  useEffect(() => {
    const fetchData = async () => {
      const response = await categoriesAPI.getAll();
      setCategories(response?.data || []);
    };
    fetchData();
  }, []);

  const parentCategories = categories.filter((cat) => cat.parent_id === null);
  const getChildren = (parentId: string) =>
    categories.filter((cat) => cat.parent_id === parentId);

  return (
    <>
      {/* Desktop - Hover Dropdown */}
      <div className="hidden font-semibold text-gray-500 sm:flex flex-row justify-center items-center gap-6 px-6 py-3 bg-white border-t border-gray-200">
        {parentCategories.map((parent, index) => {
          const children = getChildren(parent.category_id);
          return children.length > 0 ? (
            <div
              key={index}
              className="relative"
              onMouseEnter={() => setOpenDropdown(index)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                className={`text-gray-800 font-semibold whitespace-nowrap ${
                  index === openDropdown ? "text-cyan-500" : ""
                }`}
              >
                {parent.name}
              </button>
              {openDropdown === index && (
                <div className="absolute top-full left-0 min-w-[300px] z-20">
                  <span className="opacity-0 p-2"></span>
                  <ul
                    className={`grid ${
                      children.length > 10 ? "grid-cols-3" : "grid-cols-2"
                    } py-3 px-6 gap-y-4 gap-x-6 bg-white shadow-lg border rounded-md`}
                  >
                    {children.map((child) => (
                      <li key={child.category_id}>
                        <NavLink
                          to={`/category/${child.category_id}`}
                          className="hover:text-cyan-500 cursor-pointer block"
                        >
                          {child.name}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <span
              key={parent.category_id}
              className="text-gray-800 font-semibold whitespace-nowrap"
            >
              {parent.name}
            </span>
          );
        })}
      </div>

      {/* Mobile - Accordion */}
      <div className="block sm:hidden">
        <Accordion collapseAll>
          {parentCategories.map((parent) => {
            const children = getChildren(parent.category_id);
            return (
              <Accordion.Panel key={parent.category_id}>
                <Accordion.Title>{parent.name}</Accordion.Title>
                <Accordion.Content>
                  {children.length > 0 ? (
                    <ul className="space-y-1 ps-2 text-sm text-gray-700">
                      {children.map((child) => (
                        <li
                          key={child.category_id}
                          className="hover:text-cyan-500 cursor-pointer"
                        >
                          {child.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Không có danh mục con.
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

export default CategoriesComponent;
