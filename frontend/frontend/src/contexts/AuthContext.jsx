import axios from "axios";
import { useNavigate } from "react-router-dom";
import { createContext, useContext, useState } from "react";
import { StatusCodes } from "http-status-codes";
import React from "react";



export const AuthContext = createContext({});
const client = axios.create({
    baseURL: "http://localhost:8000/api/v1/users"
})
export const AuthProvider = ({ children }) => {
    const authContext = useContext(AuthContext);
    const [userData, setUserData] = useState(authContext);
    const handleRegister = async (name, username, email, password) => {
        try {
            let request = await client.post("/register", {
                name: name,
                username: username.trim(),
                email: email,
                password: password
            })
            if (request.status === StatusCodes.CREATED) {
                return request.data.message;
            }
        } catch (err) {
            console.log(err.response);
            throw err;
        }
    }

    const handlelogin = async (username, password) => {
        try {
            let request = await client.post("/login", {
                username: username,
                password: password
            });
            if (request.status === StatusCodes.OK) {
                localStorage.setItem("token", request.data.token);
                router("/home");
            }
        } catch (err) {
            console.log(err.response);
            throw err;
        }
    }

    const router = useNavigate();
    const handleLogout = () => {
        localStorage.removeItem("token");
        setUserData({});
        router("/auth");
    };


    const getHistoryOfUser = async () => {
        try {
            let request = await client.get("/get_all_activity", {
                params: {
                    token: localStorage.getItem("token")
                }
            });
            return request.data
        } catch
        (err) {
            throw err;
        }

    }
    const addToUserHistory = async (meetingCode) => {
        try {
            let request = await client.post("/add_to_activity", {
                token: localStorage.getItem("token"),
                meeting_code: meetingCode
            });
            return request
        } catch (e) {
            throw e;
        }
    }
    const data = {
        userData, setUserData, handleRegister, handleLogin: handlelogin, handleLogout, getHistoryOfUser, addToUserHistory
    }
    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )
}