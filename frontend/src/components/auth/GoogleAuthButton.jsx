import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const GoogleAuthButton = ({ text = "Sign in with Google", role }) => {
    const { googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleSuccess = async (credentialResponse) => {
        try {
            await googleLogin(credentialResponse.credential, role);
            navigate('/');
        } catch (error) {
            console.error("Google Login Failed", error);
            // Error handling is done in AuthContext usually, but we can alert here
        }
    };

    return (
        <div className="w-full flex justify-center">
            <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => {
                    console.log('Login Failed');
                }}
                useOneTap
                theme="filled_black"
                shape="rectangular"
                text={text === "Sign up with Google" ? "signup_with" : "signin_with"}
                width="350" // Attempt to match input width approx
            />
        </div>
    );
};

export default GoogleAuthButton;
