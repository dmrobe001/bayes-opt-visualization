import React from 'react';

const Legend: React.FC = () => {
    return (
        <div className="legend">
            <h3>Legend</h3>
            <ul>
                <li><span className="sample-point" style={{ backgroundColor: 'black' }}></span> Sample Points</li>
                <li><span className="gpr-mean" style={{ backgroundColor: 'blue' }}></span> GPR Mean</li>
                <li><span className="gpr-variance" style={{ backgroundColor: 'lightblue' }}></span> GPR Variance</li>
                <li><span className="expected-improvement" style={{ backgroundColor: 'green' }}></span> Expected Improvement</li>
                <li><span className="linear-interpolation" style={{ backgroundColor: 'orange' }}></span> Linear Interpolation</li>
            </ul>
        </div>
    );
};

export default Legend;