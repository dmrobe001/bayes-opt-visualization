import React from 'react';

interface DropdownProps {
    options: string[];
    selectedOption: string;
    onSelect: (option: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({ options, selectedOption, onSelect }) => {
    return (
        <div className="dropdown">
            <select
                value={selectedOption}
                onChange={(e) => onSelect(e.target.value)}
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default Dropdown;