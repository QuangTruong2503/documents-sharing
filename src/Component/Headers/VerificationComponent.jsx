import React from 'react'
import Cookies from 'js-cookie'
import { useState, useEffect } from 'react'
import verificationsApi from '../../api/verificationsApi'

// VerificationComponent
const VerificationComponent = () => {
    const [isVerified, setIsVerified] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const token = Cookies.get("token");
    useEffect(() => {
      const checkVerification = async () => {
        try {
          const response = await verificationsApi.checkUserVerified();
          setIsVerified(response.data.is_verified);
        } catch (error) {
          console.error("Error checking verification status:", error);
        } finally {
          setIsLoading(false);
        }
      };
      if (token) {
        checkVerification();
      } else {
        setIsLoading(false);
      }
    }, [token]);
  
    if (isLoading || isVerified) {
      return null;
    }
  
    return (
      <div className="bg-yellow-100 border-b border-yellow-300 text-black px-4 py-3" role="alert">
        <p className="text-sm text-center">
          Tài khoản của bạn chưa tiến hành xác thực Email.{" "}
          <a href="/account/profile" className="underline font-semibold">
            Xác thực Email
          </a>
        </p>
      </div>
    );
  };

export default VerificationComponent