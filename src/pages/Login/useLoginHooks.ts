import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useToastMessages } from '../../components/ToastMessages/useToastMessages';
import { getSSLogin, getRegister } from '../../services/SuperSalesAction';
import { resetSSLogin } from '../../services/CSuperSales';
import type { RootState } from '../../services/Store';
import { DEFAULT_REGISTER_PASSWORD } from './Constants';
import {message} from 'antd';

export const useLogin = () => {
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState(DEFAULT_REGISTER_PASSWORD);
  
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { messages: toastMessages, showSuccess, showError, hideToast } = useToastMessages();

  // Refs to track if messages have been shown
  const loginMessageShown = useRef(false);
  const registerMessageShown = useRef(false);

  // Get state from Redux
  const { loading, SSLoginData, RegisterData, apiStatus } = useSelector((state: RootState) => state.superSales);

  // Handle login response
  useEffect(() => {
    if (apiStatus.SSLoginData.success && SSLoginData && !loginMessageShown.current) {
      loginMessageShown.current = true;
      message.success('Login Successfully');
      navigate('/dashboard');
      dispatch(resetSSLogin());
      loginMessageShown.current = false;
    }

    if (apiStatus.SSLoginData.error && !loginMessageShown.current) {
      loginMessageShown.current = true;
      showError(apiStatus.SSLoginData.error);
      dispatch(resetSSLogin());
      loginMessageShown.current = false;
    }
  }, [apiStatus.SSLoginData.success, apiStatus.SSLoginData.error, SSLoginData, navigate, dispatch, showSuccess, showError]);

  // Handle register response
  useEffect(() => {
    if (apiStatus.RegisterData.success && RegisterData && !registerMessageShown.current) {
      registerMessageShown.current = true;
      
      showSuccess('Registration successful! Please login with your credentials.');
      
      // Switch back to login mode and pre-fill email/password
      setIsRegisterMode(false);
      setEmail(registerEmail);
      setPassword(registerPassword);
      
      // Clear register fields
      setFirstName('');
      setLastName('');
      setRegisterEmail('');
      setRegisterPassword(DEFAULT_REGISTER_PASSWORD);
      dispatch(resetSSLogin());
      registerMessageShown.current = false;
    }

    if (apiStatus.RegisterData.error && !registerMessageShown.current) {
      registerMessageShown.current = true;
      showError(apiStatus.RegisterData.error);
      dispatch(resetSSLogin());
      registerMessageShown.current = false;
    }
  }, [apiStatus.RegisterData.success, apiStatus.RegisterData.error, RegisterData, dispatch, registerEmail, registerPassword, showSuccess, showError]);

  const handleLogin = () => {
    loginMessageShown.current = false;
    
    if (!email.trim()) {
      showError('Please input your email!');
      return;
    }
    if (!password.trim()) {
      showError('Please input your password!');
      return;
    }

    dispatch(getSSLogin({ email, password }) as any);
  };

  const handleRegister = () => {
    registerMessageShown.current = false;
    
    if (!firstName.trim()) {
      showError('Please input your first name!');
      return;
    }
    if (!lastName.trim()) {
      showError('Please input your last name!');
      return;
    }
    if (!registerEmail.trim()) {
      showError('Please input your email!');
      return;
    }
    if (!registerPassword.trim()) {
      showError('Please input your password!');
      return;
    }
    if (registerPassword.length < 6) {
      showError('Password must be at least 6 characters!');
      return;
    }

    dispatch(getRegister({
      firstName,
      lastName,
      phoneNumber: '',
      email: registerEmail,
      password: registerPassword
    }) as any);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isRegisterMode) {
        handleRegister();
      } else {
        handleLogin();
      }
    }
  };

  const toggleMode = () => {
    const nextRegisterMode = !isRegisterMode;
    setIsRegisterMode(nextRegisterMode);
    if (nextRegisterMode) {
      setRegisterPassword(DEFAULT_REGISTER_PASSWORD);
    }
    loginMessageShown.current = false;
    registerMessageShown.current = false;
    dispatch(resetSSLogin());
  };

  return {
    // Login state
    email,
    setEmail,
    password,
    setPassword,
    
    // Register state
    firstName,
    setFirstName,
    lastName,
    setLastName,
    registerEmail,
    setRegisterEmail,
    registerPassword,
    setRegisterPassword,
    
    // Mode
    isRegisterMode,
    
    // Loading state
    loading,
    
    // Handlers
    handleLogin,
    handleRegister,
    handleKeyPress,
    toggleMode,

    // Toast
    toastMessages,
    hideToast,
  };
};