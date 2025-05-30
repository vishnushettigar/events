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

            // Redirect to myevents page
            navigate('/myevents');
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
        <div className="pt-16 ">
            <div
                style={{ animation: 'slideInFromLeft 1s ease-out' }}
                className=" mx-auto max-w-md w-full bg-gradient-to-r from-blue-800 to-purple-600 rounded-xl shadow-2xl overflow-hidden p-8 space-y-8"
            >
                <h2 className="text-center text-4xl font-extrabold text-white">Sign In</h2>
                <p className="text-center text-gray-200">Login to your account</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {errors.submit && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                            {errors.submit}
                        </div>
                    )}

                    <div className="relative">
                        <input
                            placeholder="Aadhaar Number"
                            className={`peer h-10 w-full border-b-2 ${
                                errors.aadhaar ? 'border-red-500' : 'border-gray-300'
                            } text-white bg-transparent placeholder-transparent focus:outline-none focus:border-purple-500`}
                            required
                            id="aadhaar"
                            name="aadhaar"
                            type="text"
                            value={formData.aadhaar}
                            onChange={handleChange}
                        />
                        <label
                            htmlFor="aadhaar"
                            className="absolute left-0 -top-3.5 text-gray-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-purple-500"
                        >
                            Aadhaar Number
                        </label>
                        {errors.aadhaar && (
                            <span className="text-red-500 text-sm">{errors.aadhaar}</span>
                        )}
                    </div>

                    <div className="relative">
                        <input
                            placeholder="Password"
                            className={`peer h-10 w-full border-b-2 ${
                                errors.password ? 'border-red-500' : 'border-gray-300'
                            } text-white bg-transparent placeholder-transparent focus:outline-none focus:border-purple-500`}
                            required
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <label
                            htmlFor="password"
                            className="absolute left-0 -top-3.5 text-gray-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-purple-500"
                        >
                            Password
                        </label>
                        {errors.password && (
                            <span className="text-red-500 text-sm">{errors.password}</span>
                        )}
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-2 px-4 ${
                                isSubmitting
                                    ? 'bg-gray-500 cursor-not-allowed'
                                    : 'bg-purple-700 hover:bg-purple-800'
                            } text-white font-semibold rounded-lg shadow-md focus:outline-none`}
                        >
                            {isSubmitting ? 'Signing In...' : 'Sign In'}
                        </button>
                    </div>

                    <p className="text-center text-sm text-white">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-blue-200 hover:underline">
                            Register
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default SignInForm;
