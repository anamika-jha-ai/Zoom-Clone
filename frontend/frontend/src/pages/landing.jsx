import React from 'react'
import "../App.css";
import { Link } from "react-router-dom";
export default function landing() {
    return (
        <div className='landingPageContainer'>
            <nav>
                <div className='navHeader'>
                    <h2>VideoCall</h2>
                </div>
                <div className="navlist">
                    <p>Join as guest</p>
                    <p>Register</p>
                    <p>login</p>
                </div>
            </nav>

            <div className="landingMainContainer">
                <div>
                    <h1><span style={{ color: "#EC4899" }}>Connect</span> with you loved ones</h1>
                    <p>Cover a distance by Video call</p>
                    <div role='button'>
                        <Link to={"/auth"}>Get Started </Link>
                    </div>

                </div>
                <div>
                    <div className="imageContainer">
                        <img src="/mobile.png" alt="mobile" />
                    </div>                </div>
            </div>
        </div>


    )
}