import React from 'react';

const ControlPanel = ({ onSamplingChange, onSampleCountChange, onMarkCoordinatesChange }) => {
    return (
        <div className="control-panel">
            <h2>Control Panel</h2>
            <div className="control-group">
                <label htmlFor="sampling-method">Sampling Method:</label>
                <select id="sampling-method" onChange={onSamplingChange}>
                    <option value="factorial">Factorial</option>
                    <option value="random">Random</option>
                    <option value="minimax">Minimax</option>
                    <option value="latin-hypercube">Latin Hypercube</option>
                </select>
            </div>
            <div className="control-group">
                <label htmlFor="sample-count">Number of Samples:</label>
                <input
                    type="range"
                    id="sample-count"
                    min="1"
                    max="100"
                    onChange={onSampleCountChange}
                />
            </div>
            <div className="control-group">
                <label htmlFor="mark-coordinates">Mark Coordinates:</label>
                <input
                    type="checkbox"
                    id="mark-coordinates"
                    onChange={onMarkCoordinatesChange}
                />
            </div>
        </div>
    );
};

export default ControlPanel;