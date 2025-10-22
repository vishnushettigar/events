import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import authManager from '../utils/authManager';

const SignInForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        aadhaar: '',
        password: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const validateForm = () => {
        const newErrors = {};
        const aadhaar = formData.aadhaar.trim();
        const password = formData.password.trim();

        if (!aadhaar) {
            newErrors.aadhaar = 'Aadhaar number is required';
        } else if (!/^[0-9]{12}$/.test(aadhaar)) {
            newErrors.aadhaar = 'Please enter a valid 12-digit Aadhaar number';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!validateForm()) return;

        setIsSubmitting(true);
        // Clear any previous errors
        setErrors({});
        
        try {
            const data = await authAPI.login({
                    username: formData.aadhaar,
                    password: formData.password
            });

            // Store the token in localStorage
            localStorage.setItem('token', data.token);
            
            // Store user data if needed
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            // Notify auth manager of successful login
            authManager.handleLogin(data.user);

            // Dispatch auth change event
            window.dispatchEvent(new Event('authChange'));

            // Reset form
            setFormData({ aadhaar: '', password: '' });
            setErrors({});
            
            // Check both role.id and role_id patterns
            const userRoleId = data.user?.profile?.role?.id || data.user?.profile?.role_id;
            
            if (userRoleId === 4) {
                // Viewer - redirect to viewer panel
                navigate('/viewer');
            } else if (userRoleId === 5) {
                // Admin panel - redirect to admin panel
                navigate('/admin');
            } else if (userRoleId === 3) {
                // Staff user - redirect to staff panel
                navigate('/staffpanel');
            } else {
                // Regular user - redirect to myevents page
                navigate('/myevents');
            }
        } catch (err) {
            console.error('Login error:', err);
            setErrors({ 
                submit: err.message || 'An error occurred during login. Please try again.' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isAuthenticated = !!localStorage.getItem('token');

    return (
        <div className="min-h-screen bg-[#F0F0F0] py-12 px-4">
            <div className="max-w-md mx-auto">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#2A2A2A] mb-4">
                        Welcome Back
                    </h1>
                    <p className="text-lg text-[#5A5A5A]">
                        Sign in to your account
                    </p>
                </div>

                {/* Sign In Form */}
                <div className="">
                    <form onSubmit={handleSubmit} className="space-y-6">
                    {errors.submit && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    {errors.submit}
                                </div>
                            </div>
                    )}

                        {/* Aadhaar Number */}
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
                                placeholder="Enter your 12-digit Aadhaar number"
                            />
                            {errors.aadhaar && <p className="text-red-500 text-sm mt-1">{errors.aadhaar}</p>}
                        </div>

                        {/* Password */}
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
                                    autoComplete="off"
                                    className={`w-full px-4 py-3 pr-12 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent ${
                                        errors.password ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
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
                                        Signing In...
                                    </span>
                                ) : (
                                    'Sign In'
                                )}
                        </button>
                    </div>

                        {/* Register Link */}
                        <div className="text-center">
                            <p className="text-[#5A5A5A]">
                        Don't have an account?{' '}
                                <Link to="/register" className="text-[#D35D38] font-semibold hover:underline">
                                    Create Account
                        </Link>
                    </p>
                        </div>
                </form>
                </div>
            </div>
        </div>
    );
};

export default SignInForm;
