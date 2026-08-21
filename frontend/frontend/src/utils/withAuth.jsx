import React from "react";
import { Navigate } from "react-router-dom";

const withAuth = (Component) => {
    return function AuthenticatedComponent(props) {
        const token = localStorage.getItem("token");

        if (!token) {
            return <Navigate to="/auth" replace />;
        }

        return <Component {...props} />;
    };
};

export default withAuth;
