import React from 'react';

const Layout: React.FC = ({ children }) => {
    return (
        <div className="layout">
            <header>
                <h1>Bayesian Optimization Visualization</h1>
            </header>
            <main>{children}</main>
            <footer>
                {/*<p>&copy; {new Date().getFullYear()} Bayesian Optimization Team</p> */}
            </footer>
        </div>
    );
};

export default Layout;