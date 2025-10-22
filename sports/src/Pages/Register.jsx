import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTempleNames } from '../utils/templeUtils';
import { authAPI } from '../utils/api';
import { rules, rulesKannada } from '../constants/constants';
import { useLanguage } from '../contexts/LanguageContext';
import Toggle from '../components/Toggle';

const Register = () => {
    const { isEnglish } = useLanguage();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        mobile: '',
        gender: '',
        temple: '',
        dob: '',
        aadhaar: '',
        confirmAadhaar: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [temples, setTemples] = useState([]);
    const [isLoadingTemples, setIsLoadingTemples] = useState(true);
    const [showRulesModal, setShowRulesModal] = useState(false);
    const [acceptRules, setAcceptRules] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Fetch temples from backend on component mount
    useEffect(() => {
        const fetchTemples = async () => {
            try {
                console.log('🔍 Fetching temples from backend...');
                const templeNames = await getTempleNames();
                console.log('🔍 Temples fetched from backend:', templeNames);
                setTemples(templeNames);
            } catch (error) {
                console.error('❌ Failed to fetch temples:', error);
                // Fallback to hardcoded list if API fails
                const fallbackTemples = [
                    'BARKUR', 'HALEYANGADI', 'HOSADURGA', 'KALYANPURA', 'KAPU', 'KARKALA',
                    'KINNIMULKI', 'MANGALORE', 'MANJESHWARA', 'MULKI', 'PADUBIDRI',
                    'SALIKERI', 'SIDDAKATTE', 'SURATHKAL', 'ULLALA', 'YERMAL'
                ];
                console.log('🔍 Using fallback temples:', fallbackTemples);
                setTemples(fallbackTemples);
            } finally {
                setIsLoadingTemples(false);
            }
        };

        fetchTemples();
    }, []);


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        console.log(`🔍 Form field changed - ${name}:`, value);
        setFormData((prevState) => {
            const newState = {
                ...prevState,
                [name]: type === 'checkbox' ? checked : value,
            };
            console.log('🔍 Updated form data:', newState);
            return newState;
        });
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const validateForm = async () => {
        const newErrors = {};
        setIsValidating(true);
        

        // Basic validation
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.mobile.trim()) {
            newErrors.mobile = 'Mobile number is required';
        } else if (!/^[0-9]{10}$/.test(formData.mobile)) {
            newErrors.mobile = 'Please enter a valid 10-digit mobile number';
        }
        if (!formData.gender) newErrors.gender = 'Please select a gender';
        if (!formData.temple) newErrors.temple = 'Please select a temple';
        if (!formData.dob) newErrors.dob = 'Date of birth is required';
        if (!formData.aadhaar.trim()) {
            newErrors.aadhaar = 'Aadhaar number is required';
        } else if (!/^[0-9]{12}$/.test(formData.aadhaar)) {
            newErrors.aadhaar = 'Please enter a valid 12-digit Aadhaar number';
        }
        if (formData.aadhaar !== formData.confirmAadhaar) {
            newErrors.confirmAadhaar = 'Aadhaar numbers do not match';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters long';
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        // If there are basic validation errors, don't proceed with duplicate checks
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsValidating(false);
            return false;
        }

        // Check for duplicate Aadhaar number if Aadhaar is valid
        if (formData.aadhaar.trim() && /^[0-9]{12}$/.test(formData.aadhaar)) {
            try {
                const data = await authAPI.checkAadhaar(formData.aadhaar);
                
                if (data.exists) {
                    newErrors.aadhaar = 'This Aadhaar number is already registered. Please use a different Aadhaar number or try logging in.';
                }
            } catch (error) {
                console.error('❌ Error checking Aadhaar:', error);
                // Don't block form submission if Aadhaar check fails
            }
        }

        // Check for duplicate email if email is valid
        if (formData.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            try {
                const data = await authAPI.checkEmail(formData.email);
                
                if (data.exists) {
                    newErrors.email = 'This email address is already registered. Please use a different email address or try logging in.';
                }
            } catch (error) {
                console.error('❌ Error checking email:', error);
                // Don't block form submission if email check fails
            }
        }

        setErrors(newErrors);
        setIsValidating(false);
        const hasErrors = Object.keys(newErrors).length > 0;
        return !hasErrors;
    };

    const handleContinue = async (e) => {
        e.preventDefault();
        
        const isValid = await validateForm();
        
        if (isValid) {
            // Clear any existing errors when opening the modal
            setErrors({});
            setShowRulesModal(true);
        }
    };

    const handleRegister = async () => {
        if (!acceptRules) {
            setErrors(prev => ({
                ...prev,
                rules: 'Please accept the rules and terms to continue'
            }));
            return;
        }

        setIsSubmitting(true);
        try {
            const requestData = {
                username: formData.aadhaar,
                password: formData.password,
                email: formData.email,
                first_name: formData.firstName,
                last_name: formData.lastName,
                phone: formData.mobile,
                aadhar_number: formData.aadhaar,
                dob: formData.dob,
                gender: formData.gender.toUpperCase(),
                temple_name: formData.temple
            };
            
            console.log('🔍 Registration Request Data:', requestData);
            console.log('🔍 Form Data State:', formData);
            console.log('🔍 Temple Selection:', formData.temple);
            console.log('🔍 Gender Selection:', formData.gender);
            
            const data = await authAPI.register(requestData);

            // Store the JWT token
            localStorage.setItem('token', data.token);
            
            // Redirect to MyEvents page
            window.location.href = '/myevents';
        } catch (error) {
            console.error('❌ Registration error:', error);
            console.error('❌ Error details:', {
                message: error.message,
                errors: error.errors,
                response: error.response?.data,
                status: error.response?.status
            });
            
            // Handle different types of errors
            let errorMessage = 'Registration failed. Please try again.';
            
            if (error.message) {
                errorMessage = error.message;
            } else if (error.errors && Array.isArray(error.errors)) {
                // Handle validation errors from backend
                errorMessage = error.errors.map(err => err.msg).join(', ');
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            
            console.log('🔍 Final error message:', errorMessage);
            
            setErrors(prev => ({
                ...prev,
                submit: errorMessage
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F0F0F0] py-6 sm:py-12 px-2 sm:px-4">
            <div className="max-w-2xl mx-auto w-full">
                {/* Header Section */}
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#2A2A2A] mb-3 sm:mb-4">
                        Create Your Account
                    </h1>
                    <p className="text-base sm:text-lg text-[#5A5A5A]">
                        Join the Padmashali Annual Sports Meet
                    </p>
                </div>

                {/* Registration Form */}
                <div className="w-full">
                    <form onSubmit={handleContinue} className="space-y-4 sm:space-y-6 w-full">
                    {errors.submit && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {errors.submit}
                        </div>
                    )}

                        {/* Name Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                                    First Name as in aaadhar *
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent text-base ${
                                        errors.firstName ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter your first name"
                                />
                                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                            </div>

                            <div>
                                <label htmlFor="lastName" className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                                    Last Name as in aaadhar
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent text-base ${
                                        errors.lastName ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter your last name"
                                />
                                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                            </div>
                    </div>

                        {/* Mobile Number */}
                        <div>
                            <label htmlFor="mobile" className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                                Mobile Number *
                            </label>
                        <input
                                type="tel"
                            id="mobile"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleChange}
                                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent text-base ${
                                    errors.mobile ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Enter your 10-digit mobile number"
                            />
                            {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>}
                    </div>

                        {/* Gender Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-[#2A2A2A] mb-3">
                                Gender *
                            </label>
                            <div className="flex gap-6">
                                {['MALE', 'FEMALE'].map((gender) => (
                                    <label key={gender} className="flex items-center">
                                <input
                                    type="radio"
                                    name="gender"
                                            value={gender}
                                            checked={formData.gender === gender}
                                    onChange={handleChange}
                                            className="w-4 h-4 text-[#D35D38] border-gray-300 focus:ring-[#D35D38]"
                                />
                                        <span className="ml-2 text-[#2A2A2A]">
                                            {gender === 'MALE' ? 'Male' : 'Female'}
                                        </span>
                            </label>
                        ))}
                            </div>
                            {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
                    </div>

                        {/* Temple Selection */}
                        <div>
                            <label htmlFor="temple" className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                                Temple *
                            </label>
                        <select
                                id="temple"
                            name="temple"
                            value={formData.temple}
                            onChange={handleChange}
                                disabled={isLoadingTemples}
                                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent text-base ${
                                    errors.temple ? 'border-red-300' : 'border-gray-300'
                                } ${isLoadingTemples ? 'opacity-50' : ''}`}
                        >
                                <option value="">
                                    {isLoadingTemples ? 'Loading temples...' : 'Select your temple'}
                                </option>
                            {temples.map((temple, index) => (
                                <option key={index} value={temple}>{temple}</option>
                            ))}
                        </select>
                            {errors.temple && <p className="text-red-500 text-sm mt-1">{errors.temple}</p>}
                    </div>

                        {/* Date of Birth */}
                        <div>
                            <label htmlFor="dob" className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                                Date of Birth *
                            </label>
                        <input
                                type="date"
                            id="dob"
                            name="dob"
                            value={formData.dob}
                            onChange={handleChange}
                                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent text-base ${
                                    errors.dob ? 'border-red-300' : 'border-gray-300'
                                }`}
                            />
                            {errors.dob && <p className="text-red-500 text-sm mt-1">{errors.dob}</p>}
                    </div>

                        {/* Aadhaar Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div>
                                <label htmlFor="aadhaar" className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                                    Aadhaar Number *
                                </label>
                                <input
                                    type="text"
                                    id="aadhaar"
                                    name="aadhaar"
                                    value={formData.aadhaar}
                                    onChange={handleChange}
                                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent text-base ${
                                        errors.aadhaar ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter 12-digit Aadhaar number"
                                />
                                {errors.aadhaar && <p className="text-red-500 text-sm mt-1">{errors.aadhaar}</p>}
                            </div>

                            <div>
                                <label htmlFor="confirmAadhaar" className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                                    Confirm Aadhaar *
                                </label>
                                <input
                                    type="text"
                                    id="confirmAadhaar"
                                    name="confirmAadhaar"
                                    value={formData.confirmAadhaar}
                                    onChange={handleChange}
                                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent text-base ${
                                        errors.confirmAadhaar ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Confirm your Aadhaar number"
                                />
                                {errors.confirmAadhaar && <p className="text-red-500 text-sm mt-1">{errors.confirmAadhaar}</p>}
                            </div>
                    </div>

                    {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                                Email Address *
                            </label>
                        <input
                                type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent text-base ${
                                    errors.email ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Enter your email address"
                            />
                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                        {/* Password Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                                    Password *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent text-base ${
                                            errors.password ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="Create a password (min 6 characters)"
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                                    Confirm Password *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent text-base ${
                                            errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="Confirm your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={toggleConfirmPasswordVisibility}
                                        className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                                    >
                                        {showConfirmPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                            </div>
                    </div>

                        {/* Validation Error Messages - Only show if modal is not open */}
                        {!showRulesModal && Object.keys(errors).length > 0 && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <h3 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h3>
                                        <ul className="text-sm text-red-700 space-y-1">
                                            {Object.entries(errors).map(([field, message]) => (
                                                <li key={field} className="flex items-start">
                                                    <span className="mr-1">•</span>
                                                    <span>{message}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Continue Button */}
                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting || isValidating}
                                className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-bold text-base sm:text-lg shadow-lg transition-all duration-200 ${
                                isSubmitting || isValidating
                                        ? 'bg-gray-400 cursor-not-allowed text-white'
                                        : 'bg-[#D35D38] hover:bg-[#B84A2E] text-white transform hover:scale-105'
                                }`}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </span>
                                ) : isValidating ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Validating...
                                    </span>
                                ) : (
                                    'Continue'
                                )}
                        </button>
                    </div>

                        {/* Login Link */}
                        <div className="text-center">
                            <p className="text-[#5A5A5A]">
                        Already have an account?{' '}
                                <Link to="/login" className="text-[#D35D38] font-semibold hover:underline">
                                    Sign In
                        </Link>
                    </p>
                        </div>
                </form>
                </div>
            </div>

            {/* Rules Modal */}
            {showRulesModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-[#D35D38] text-white p-4 sm:p-6 flex-shrink-0">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg sm:text-2xl font-bold pr-2">
                                    {isEnglish ? "Rules & Terms" : "ನಿಯಮಗಳು ಮತ್ತು ನಿಬಂಧನೆಗಳು"}
                                </h2>
                                <div className="flex items-center gap-2 sm:gap-3">
                                    {/* Language Toggle */}
                                    <div className="scale-75 sm:scale-100">
                                        <Toggle />
                                    </div>
                                    {/* Close Button */}
                                    <button
                                        onClick={() => setShowRulesModal(false)}
                                        className="text-white hover:text-gray-200 text-xl sm:text-2xl font-bold flex-shrink-0"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-4 sm:p-6 flex-1 overflow-y-auto min-h-0">
                            <div className="space-y-4 sm:space-y-6">
                                {(isEnglish ? rules : rulesKannada).map((rule, idx) => {
                                    // Check if the rule contains table HTML
                                    if (typeof rule === 'string' && rule.includes('<table')) {
                                        return (
                                            <div key={idx} className="mb-6">
                                                <div className="text-base text-[#2A2A2A] leading-relaxed mb-4">
                                                    {rule.split('<table')[0].trim()}
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full border-collapse border border-gray-400 bg-white rounded-lg shadow-sm text-xs sm:text-sm">
                                                        <thead>
                                                            <tr className="bg-[#D35D38] text-white">
                                                                <th className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold">
                                                                    {isEnglish ? "Event" : "ಸ್ಪರ್ಧೆ"}
                                                                </th>
                                                                <th className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold">
                                                                    {isEnglish ? "1st" : "ಪ್ರಥಮ"}
                                                                </th>
                                                                <th className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold">
                                                                    {isEnglish ? "2nd" : "ದ್ವಿತೀಯ"}
                                                                </th>
                                                                <th className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold">
                                                                    {isEnglish ? "3rd" : "ತೃತೀಯ"}
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr className="hover:bg-gray-50">
                                                                <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 font-medium text-xs sm:text-sm">
                                                                    {isEnglish ? "Individual Events" : "ವೈಯಕ್ತಿಕ ಸ್ಪರ್ಧೆಗಳು"}
                                                                </td>
                                                                <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-green-600 text-xs sm:text-sm">5</td>
                                                                <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-blue-600 text-xs sm:text-sm">3</td>
                                                                <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-orange-600 text-xs sm:text-sm">1</td>
                                                            </tr>
                                                            <tr className="hover:bg-gray-50">
                                                                <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 font-medium text-xs sm:text-sm">
                                                                    {isEnglish ? "Couple Relay" : "ದಂಪತಿ ರಿಲೇ"}
                                                                </td>
                                                                <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-green-600 text-xs sm:text-sm">5</td>
                                                                <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-blue-600 text-xs sm:text-sm">3</td>
                                                                <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-orange-600 text-xs sm:text-sm">1</td>
                                                            </tr>
                                                            <tr className="hover:bg-gray-50">
                                                                <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 font-medium text-xs sm:text-sm">
                                                                    {isEnglish ? "4x100 Relay" : "4x100 ರಿಲೇ"}
                                                                </td>
                                                                <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-green-600 text-xs sm:text-sm">10</td>
                                                                <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-blue-600 text-xs sm:text-sm">6</td>
                                                                <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-orange-600 text-xs sm:text-sm">3</td>
                                                            </tr>
                                                            <tr className="hover:bg-gray-50">
                                                                <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 font-medium text-xs sm:text-sm">
                                                                    {isEnglish ? "Volleyball (Men)" : "ವಾಲಿಬಾಲ್ (ಪುರುಷರು)"}
                                                                </td>
                                                                <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-green-600 text-xs sm:text-sm">10</td>
                                                                <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-blue-600 text-xs sm:text-sm">5</td>
                                                                <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-gray-400 text-xs sm:text-sm">–</td>
                                                            </tr>
                                                            <tr className="hover:bg-gray-50">
                                                                <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 font-medium text-xs sm:text-sm">
                                                                    {isEnglish ? "Throwball (Women)" : "ಥ್ರೋಬಾಲ್ (ಮಹಿಳೆಯರು)"}
                                                                </td>
                                                                <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-green-600 text-xs sm:text-sm">10</td>
                                                                <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-blue-600 text-xs sm:text-sm">5</td>
                                                                <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-gray-400 text-xs sm:text-sm">–</td>
                                                            </tr>
                                                            <tr className="hover:bg-gray-50">
                                                                <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 font-medium text-xs sm:text-sm">
                                                                    {isEnglish ? "Tug of War" : "ಹಗ್ಗಜಗ್ಗಾಟ"}
                                                                </td>
                                                                <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-green-600 text-xs sm:text-sm">10</td>
                                                                <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-blue-600 text-xs sm:text-sm">5</td>
                                                                <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-gray-400 text-xs sm:text-sm">–</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        );
                                    }
                                    
                                    // Regular rule display
                                    return (
                                        <div key={idx} className="flex items-start gap-3">
                                            <span className="inline-block mt-1 text-[#D35D38] text-xl font-bold">•</span>
                                            <span className="text-base text-[#2A2A2A] leading-relaxed">{rule}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 p-4 sm:p-6 border-t flex-shrink-0">
                            <div className="space-y-3 sm:space-y-4">
                                {/* Accept Rules Checkbox */}
                                <div className="flex items-start gap-2 sm:gap-3">
                                    <input
                                        type="checkbox"
                                        id="acceptRules"
                                        checked={acceptRules}
                                        onChange={(e) => setAcceptRules(e.target.checked)}
                                        className="mt-1 w-4 h-4 sm:w-5 sm:h-5 text-[#D35D38] border-gray-300 rounded focus:ring-[#D35D38] flex-shrink-0"
                                    />
                                    <label htmlFor="acceptRules" className="text-xs sm:text-sm text-[#2A2A2A] leading-relaxed">
                                        {isEnglish 
                                            ? "I accept the rules & terms and agree to participate in the Padmashali Annual Sports Meet 2025."
                                            : "ನಾನು ನಿಯಮಗಳು ಮತ್ತು ನಿಬಂಧನೆಗಳನ್ನು ಸ್ವೀಕರಿಸುತ್ತೇನೆ ಮತ್ತು 2025ರ ಪದ್ಮಶಾಲಿ ವಾರ್ಷಿಕ ಕ್ರೀಡೋತ್ಸವದಲ್ಲಿ ಭಾಗವಹಿಸಲು ಒಪ್ಪುತ್ತೇನೆ."
                                        }
                                    </label>
                                </div>
                                {errors.rules && <p className="text-red-500 text-xs sm:text-sm">{errors.rules}</p>}

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                                    <button
                                        onClick={() => setShowRulesModal(false)}
                                        className="w-full sm:flex-1 py-3 px-4 sm:px-6 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors text-sm sm:text-base"
                                    >
                                        {isEnglish ? "Cancel" : "ರದ್ದುಗೊಳಿಸಿ"}
                                    </button>
                                    <button
                                        onClick={handleRegister}
                                        disabled={isSubmitting || !acceptRules}
                                        className={`w-full sm:flex-1 py-3 px-4 sm:px-6 rounded-lg font-bold transition-all duration-200 text-sm sm:text-base ${
                                            isSubmitting || !acceptRules
                                                ? 'bg-gray-400 cursor-not-allowed text-white'
                                                : 'bg-[#D35D38] hover:bg-[#B84A2E] text-white transform hover:scale-105'
                                        }`}
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center justify-center">
                                                <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                {isEnglish ? "Registering..." : "ನೋಂದಾಯಿಸಲಾಗುತ್ತಿದೆ..."}
                                            </span>
                                        ) : (
                                            isEnglish ? "Register" : "ನೋಂದಾಯಿಸಿ"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Register;
