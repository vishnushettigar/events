import React, { useState } from 'react';
import { Link } from 'react-router-dom';

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

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const validateForm = () => {
        const newErrors = {};

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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            setIsSubmitting(true);
            try {
                const response = await fetch('http://localhost:4000/api/users/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: formData.aadhaar,
                        password: formData.password,
                        email: formData.email,
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        phone: formData.mobile,
                        aadhar_number: formData.aadhaar,
                        dob: formData.dob,
                        gender: formData.gender.toUpperCase(),
                        temple_id: temples.indexOf(formData.temple) + 1
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Registration failed');
                }

                // Registration successful
                console.log('Registration successful:', data);
                // Redirect to login page
                window.location.href = '/login';
            } catch (error) {
                console.error('Registration error:', error);
                setErrors(prev => ({
                    ...prev,
                    submit: error.message || 'Registration failed. Please try again.'
                }));
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const temples = [
        'BARKUR', 'HALEYANGADI', 'HOSADURGA', 'KALYANPURA', 'KAPU', 'KARKALA',
        'KINNIMULKI', 'MANGALORE', 'MANJESHWARA', 'MULKI', 'PADUBIDRI',
        'SALIKERI', 'SIDDAKATTE', 'SURATHKAL', 'ULLALA', 'YERMAL'
    ];

    return (
        <div className="pt-4 pb-4">
            <div
                style={{ animation: 'slideInFromLeft 1s ease-out' }}
                className="mx-auto max-w-xl w-full bg-gradient-to-r from-blue-800 to-purple-600 rounded-xl shadow-2xl overflow-hidden p-8 space-y-6"
            >
                <h2 className="text-center text-4xl font-extrabold text-white">Register</h2>
                <p className="text-center text-gray-200">Create your account</p>
                <form onSubmit={handleSubmit} className="space-y-5">
                    {errors.submit && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                            {errors.submit}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['firstName', 'lastName'].map((field, index) => (
                            <div className="relative" key={index}>
                                <input
                                    placeholder={field === 'firstName' ? 'First Name' : 'Last Name'}
                                    className="peer h-10 w-full border-b-2 border-gray-300 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-purple-500"
                                    required
                                    id={field}
                                    name={field}
                                    type="text"
                                    value={formData[field]}
                                    onChange={handleChange}
                                />
                                <label
                                    htmlFor={field}
                                    className="absolute left-0 -top-3.5 text-gray-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-purple-500"
                                >
                                    {field === 'firstName' ? 'First Name' : 'Last Name'}
                                </label>
                                {errors[field] && <span className="text-red-500 text-sm">{errors[field]}</span>}
                            </div>
                        ))}
                    </div>

                    <div className="relative">
                        <input
                            placeholder="Mobile Number"
                            className="peer h-10 w-full border-b-2 border-gray-300 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-purple-500"
                            required
                            id="mobile"
                            name="mobile"
                            type="tel"
                            value={formData.mobile}
                            onChange={handleChange}
                        />
                        <label
                            htmlFor="mobile"
                            className="absolute left-0 -top-3.5 text-gray-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-purple-500"
                        >
                            Mobile Number
                        </label>
                        {errors.mobile && <span className="text-red-500 text-sm">{errors.mobile}</span>}
                    </div>

                    <div className="flex gap-6 items-center text-white">
                        <span>Gender:</span>
                        {['Male', 'Female'].map((g) => (
                            <label key={g}>
                                <input
                                    type="radio"
                                    name="gender"
                                    value={g}
                                    checked={formData.gender === g}
                                    onChange={handleChange}
                                    className="mr-1"
                                />
                                {g}
                            </label>
                        ))}
                        {errors.gender && <span className="text-red-500 text-sm">{errors.gender}</span>}
                    </div>

                    <div className="relative">
                        <select
                            required
                            name="temple"
                            id="temple"
                            value={formData.temple}
                            onChange={handleChange}
                            className="w-full bg-transparent text-white border-b-2 border-gray-300 focus:outline-none focus:border-purple-500"
                        >
                            <option value="">Select Your Temple</option>
                            {temples.map((temple, index) => (
                                <option key={index} value={temple}>{temple}</option>
                            ))}
                        </select>
                        {errors.temple && <span className="text-red-500 text-sm">{errors.temple}</span>}
                    </div>

                    <div className="relative">
                        <input
                            className="peer h-10 w-full border-b-2 border-gray-300 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-purple-500"
                            required
                            id="dob"
                            name="dob"
                            type="date"
                            value={formData.dob}
                            onChange={handleChange}
                        />
                        <label
                            htmlFor="dob"
                            className="absolute left-0 -top-3.5 text-gray-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-purple-500"
                        >
                            Date of Birth
                        </label>
                        {errors.dob && <span className="text-red-500 text-sm">{errors.dob}</span>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['aadhaar', 'confirmAadhaar'].map((field, index) => (
                            <div className="relative" key={index}>
                                <input
                                    placeholder={field === 'aadhaar' ? 'Aadhaar Number' : 'Confirm Aadhaar'}
                                    className="peer h-10 w-full border-b-2 border-gray-300 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-purple-500"
                                    required
                                    id={field}
                                    name={field}
                                    type="text"
                                    value={formData[field]}
                                    onChange={handleChange}
                                />
                                <label
                                    htmlFor={field}
                                    className="absolute left-0 -top-3.5 text-gray-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-purple-500"
                                >
                                    {field === 'aadhaar' ? 'Aadhaar Number' : 'Confirm Aadhaar'}
                                </label>
                                {errors[field] && <span className="text-red-500 text-sm">{errors[field]}</span>}
                            </div>
                        ))}
                    </div>

                    {/* Email */}
                    <div className="relative">
                        <input
                            placeholder="Email"
                            className="peer h-10 w-full border-b-2 border-gray-300 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-purple-500"
                            required
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        <label
                            htmlFor="email"
                            className="absolute left-0 -top-3.5 text-gray-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-purple-500"
                        >
                            Email
                        </label>
                        {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
                    </div>

                    {/* Password and Confirm Password */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['password', 'confirmPassword'].map((field, index) => (
                            <div className="relative" key={index}>
                                <input
                                    placeholder={field === 'password' ? 'Password' : 'Confirm Password'}
                                    className="peer h-10 w-full border-b-2 border-gray-300 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-purple-500"
                                    required
                                    id={field}
                                    name={field}
                                    type="password"
                                    value={formData[field]}
                                    onChange={handleChange}
                                />
                                <label
                                    htmlFor={field}
                                    className="absolute left-0 -top-3.5 text-gray-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-purple-500"
                                >
                                    {field === 'password' ? 'Password' : 'Confirm Password'}
                                </label>
                                {errors[field] && <span className="text-red-500 text-sm">{errors[field]}</span>}
                            </div>
                        ))}
                    </div>

                    {/* Terms and Submit */}
                    <div className="text-white">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="terms"
                                checked={formData.terms}
                                onChange={handleChange}
                                className="mr-2"
                            />
                            I accept the terms and conditions
                        </label>
                        {errors.terms && <span className="text-red-500 text-sm block">{errors.terms}</span>}
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
                            {isSubmitting ? 'Registering...' : 'Register'}
                        </button>
                    </div>
                    <p className="text-center text-sm text-white">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-200 hover:underline">
                            Login
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Register;
