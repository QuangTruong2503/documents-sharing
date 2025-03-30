import React, { useEffect, useState } from "react";
import { Dropdown, Accordion } from "flowbite-react";
import categoriesAPI from "../api/categoriesAPI";

export interface Category {
  category_id: number;
  name: string;
  description: string;
  parent_id: number | null;
}

const CategoriesComponent: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await categoriesAPI.getAll();
      setCategories(response?.data || []);
    };
    fetchData();
  }, []);

  const parentCategories = categories.filter((cat) => cat.parent_id === null);
  const getChildren = (parentId: number) =>
    categories.filter((cat) => cat.parent_id === parentId);

  return (
    <>
      {/* Desktop - Dropdown */}
      <div className="hidden font-semibold text-gray-500 sm:flex flex-row justify-center items-center gap-6 px-6 py-3 bg-white border-t border-gray-200">
        {parentCategories.map((parent) => {
          const children = getChildren(parent.category_id);
          return children.length > 0 ? (
            <Dropdown
              key={parent.category_id}
              label={parent.name}
              inline
              className="z-20"
            >
              <ul
                className={`grid ${
                  children.length > 10 ? "grid-cols-3" : "grid-cols-2"
                } py-3 px-6 gap-y-4 gap-x-6`}
              >
                {children.map((child) => (
                  <li>
                        <a
                        href="/"
                        key={child.category_id}
                        className="hover:text-cyan-500 cursor-pointer"
                    >
                        {child.name}
                    </a>
                  </li>
                ))}
              </ul>
            </Dropdown>
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
