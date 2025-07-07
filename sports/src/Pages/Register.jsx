import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTempleNames } from '../utils/templeUtils';

const Register = () => {
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
        terms: false,
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [temples, setTemples] = useState([]);
    const [isLoadingTemples, setIsLoadingTemples] = useState(true);

    // Fetch temples from backend on component mount
    useEffect(() => {
        const fetchTemples = async () => {
            try {
                const templeNames = await getTempleNames();
                setTemples(templeNames);
            } catch (error) {
                console.error('Failed to fetch temples:', error);
                // Fallback to hardcoded list if API fails
                setTemples([
                    'BARKUR', 'HALEYANGADI', 'HOSADURGA', 'KALYANPURA', 'KAPU', 'KARKALA',
                    'KINNIMULKI', 'MANGALORE', 'MANJESHWARA', 'MULKI', 'PADUBIDRI',
                    'SALIKERI', 'SIDDAKATTE', 'SURATHKAL', 'ULLALA', 'YERMAL'
                ]);
            } finally {
                setIsLoadingTemples(false);
            }
        };

        fetchTemples();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        
        console.log('Validating form data:', formData);

        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
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
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters long';
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        if (!formData.terms) {
            newErrors.terms = 'You must accept the terms and conditions';
        }

        console.log('Validation errors:', newErrors);
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Form submission started');
        
        if (validateForm()) {
            console.log('Form validation passed, starting registration');
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
                
                console.log('Sending registration request:', requestData);
                
                const response = await fetch('http://localhost:4000/api/users/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData),
                });

                console.log('Response status:', response.status);
                const data = await response.json();
                console.log('Response data:', data);

                if (!response.ok) {
                    // Check for duplicate username error
                    if (data.error?.code === 'P2002' && data.error?.meta?.target?.includes('username')) {
                        throw new Error('This Aadhaar number is already registered. Please use a different Aadhaar number or try logging in.');
                    }
                    
                    // Handle validation errors
                    if (data.errors && Array.isArray(data.errors)) {
                        const validationErrors = data.errors.map(err => err.msg).join(', ');
                        throw new Error(validationErrors);
                    }
                    
                    // Handle other error types
                    if (data.error) {
                        throw new Error(data.error);
                    }
                    
                    throw new Error('Registration failed');
                }

                // Store the JWT token
                localStorage.setItem('token', data.token);
                
                // Registration successful
                console.log('Registration successful:', data);
                // Redirect to MyEvents page
                window.location.href = '/myevents';
            } catch (error) {
                console.error('Registration error:', error);
                
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
                
                setErrors(prev => ({
                    ...prev,
                    submit: errorMessage
                }));
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#F0F0F0] py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#2A2A2A] mb-4">
                        Create Your Account
                    </h1>
                    <p className="text-lg text-[#5A5A5A]">
                        Join the Padmashali Annual Sports Meet
                    </p>
                </div>

                {/* Registration Form */}
                <div className="">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                {errors.submit}
                            </div>
                        )}

                        {/* Name Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent ${
                                        errors.firstName ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter your first name"
                                />
                                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                            </div>

                            <div>
                                <label htmlFor="lastName" className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent ${
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
                                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent ${
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
                                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent ${
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
                                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent ${
                                    errors.dob ? 'border-red-300' : 'border-gray-300'
                                }`}
                            />
                            {errors.dob && <p className="text-red-500 text-sm mt-1">{errors.dob}</p>}
                        </div>

                        {/* Aadhaar Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent ${
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
                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent ${
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
                                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent ${
                                    errors.email ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Enter your email address"
                            />
                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                        </div>

                        {/* Password Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent ${
                                        errors.password ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Create a password (min 8 characters)"
                                />
                                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                                    Confirm Password *
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent ${
                                        errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Confirm your password"
                                />
                                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                            </div>
                        </div>

                        {/* Terms and Conditions */}
                        <div>
                            <label className="flex items-start">
                                <input
                                    type="checkbox"
                                    name="terms"
                                    checked={formData.terms}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-[#D35D38] border-gray-300 rounded focus:ring-[#D35D38] mt-1"
                                />
                                <span className="ml-3 text-sm text-[#2A2A2A]">
                                    I accept the <span className="text-[#D35D38] font-semibold">terms and conditions</span> *
                                </span>
                            </label>
                            {errors.terms && <p className="text-red-500 text-sm mt-1">{errors.terms}</p>}
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full py-4 px-6 rounded-lg font-bold text-lg shadow-lg transition-all duration-200 ${
                                    isSubmitting
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
                                        Creating Account...
                                    </span>
                                ) : (
                                    'Create Account'
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
        </div>
    );
};

export default Register;
