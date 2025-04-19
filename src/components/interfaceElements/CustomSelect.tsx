import { useState, useRef, useEffect } from "react";

interface CustomSelectProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
}

export default function CustomSelect({ options, value, onChange }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative w-full max-w-xs">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2 text-left rounded-lg border-2 border-yellow-400 bg-[#1a1a1a] text-white font-semibold hover:bg-[#222] transition"
      >
        {value}
        <span className="float-right text-yellow-400">&#9662;</span>
      </button>
      {open && (
        <ul
          className="absolute z-50 w-full mt-2 bg-[#1a1a1a] border-2 border-yellow-400 rounded-lg overflow-hidden max-h-60 overflow-y-auto"
          style={{ top: 'calc(100% + 8px)' }} // немного отступа снизу
        >
          {options.map((option) => (
            <li
              key={option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={`px-4 py-2 cursor-pointer hover:bg-yellow-500 hover:text-black transition ${
                value === option ? "bg-yellow-700 text-black" : ""
              }`}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
