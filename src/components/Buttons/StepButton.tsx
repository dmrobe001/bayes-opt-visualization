import React from 'react';

interface StepButtonProps {
    onClick: () => void;
    label: string;
}

const StepButton: React.FC<StepButtonProps> = ({ onClick, label }) => {
    return (
        <button onClick={onClick} className="step-button">
            {label}
        </button>
    );
};

export default StepButton;