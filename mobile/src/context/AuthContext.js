import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../config/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      console.log('API Response:', JSON.stringify(response.data, null, 2));

      // Backend sends: { success: true, data: { token, name, email ... } }
      const resData = response.data; 
      
      const { token, ...userData } = resData.data || {};
      const user = userData;
          
      if (token) {
          console.log('Login Success! Token:', token);
          setUserToken(token);
          setUserInfo(user);
          // Set Axios Default Header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          await SecureStore.setItemAsync('userToken', token);
          if (user) {
            await SecureStore.setItemAsync('userInfo', JSON.stringify(user));
          }
      }
      return response.data;
    } catch (error) {
       console.log("Login Error", error);
       // Pass error up
       throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setUserToken(null);
    setUserInfo(null);
    delete api.defaults.headers.common['Authorization'];
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userInfo');
    setIsLoading(false);
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      let token = await SecureStore.getItemAsync('userToken');
      let user = await SecureStore.getItemAsync('userInfo');
      
      if (token) {
          setUserToken(token);
          setUserInfo(user ? JSON.parse(user) : null);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      console.log(`isLoggedIn error ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{ login, logout, isLoading, userToken, userInfo }}>
      {children}
    </AuthContext.Provider>
  );
};
