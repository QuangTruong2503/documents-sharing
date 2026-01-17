import { ChevronDown, ChevronRight, X } from "lucide-react";
import { useState } from "react";

interface Category {
  category_id: string;
  name: string;
  children?: Category[];
}

interface Props {
  categories: Category[];
  selected: string[];
  onToggle: (id: string) => void;
}

export default function CategorySelector({
  categories,
  selected,
  onToggle,
}: Props) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");

  const toggleExpand = (id: string) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filterTree = (nodes: Category[]): Category[] =>
    nodes
      .map((node) => ({
        ...node,
        children: node.children
          ? filterTree(node.children)
          : undefined,
      }))
      .filter(
        (node) =>
          node.name.toLowerCase().includes(keyword.toLowerCase()) ||
          node.children?.length
      );

  const renderTree = (nodes: Category[]) => (
    <ul className="space-y-1">
      {nodes.map((cat) => {
        const isExpanded = expanded.includes(cat.category_id);
        const isSelected = selected.includes(cat.category_id);

        return (
          <li key={cat.category_id}>
            <div className="flex items-center gap-1">
              {cat.children?.length ? (
                <button
                type="button"
                  onClick={() => toggleExpand(cat.category_id)}
                  className="text-gray-500"
                >
                  {isExpanded ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
              ) : (
                <span className="w-4" />
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(cat.category_id)}
                  className="rounded text-blue-600"
                />
                <span className="text-sm">{cat.name}</span>
              </label>
            </div>

            {isExpanded && cat.children && (
              <div className="ml-6">{renderTree(cat.children)}</div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="space-y-3">
      {/* Search */}
      <input
        type="text"
        placeholder="🔍 Tìm category..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
      />

      {/* Tree */}
      <div className="max-h-64 overflow-auto rounded-lg border p-3">
        {renderTree(filterTree(categories))}
      </div>

      {/* Selected */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((id) => (
            <span
              key={id}
              className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700"
            >
              {id}
              <button type="button" onClick={() => onToggle(id)}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
