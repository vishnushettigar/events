import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SignInForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        aadhaar: '',
        password: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('http://localhost:4000/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.aadhaar,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Login failed');
            }

            // Store the token in localStorage
            localStorage.setItem('token', data.token);
            
            // Store user data if needed
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            // Dispatch auth change event
            window.dispatchEvent(new Event('authChange'));

            // Reset form
            setFormData({ aadhaar: '', password: '' });
            setErrors({});

            // Check user role and redirect accordingly
            if (data.user && data.user.profile && data.user.profile.role_id === 3) {
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
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                {errors.submit}
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
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent ${
                                    errors.password ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Enter your password"
                            />
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
