import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';

const ForgotPassword = () => {
    const navigate = useNavigate();

    // Steps: 1 = Aadhaar & Email Verification/Addition, 2 = OTP Verification, 3 = New Password, 4 = Success
    const [step, setStep] = useState(1);

    // Form inputs
    const [aadhaar, setAadhaar] = useState('');
    const [email, setEmail] = useState('');
    const [newEmailToLink, setNewEmailToLink] = useState('');
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Account metadata fetched by Aadhaar
    const [accountInfo, setAccountInfo] = useState(null); // { name, templeName, hasEmail, maskedEmail }
    const [isCheckingAccount, setIsCheckingAccount] = useState(false);
    const [isAddingEmailMode, setIsAddingEmailMode] = useState(false);

    // UI state
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Countdown timers
    const [countdown, setCountdown] = useState(0);
    const [autoRedirectTimer, setAutoRedirectTimer] = useState(5);

    // Refs for 6-digit OTP input boxes
    const otpInputRefs = useRef([]);

    // Countdown effect for resend OTP
    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    // Countdown effect for redirect after success
    useEffect(() => {
        let redirectTimer;
        if (step === 4 && autoRedirectTimer > 0) {
            redirectTimer = setInterval(() => {
                setAutoRedirectTimer(prev => prev - 1);
            }, 1000);
        } else if (step === 4 && autoRedirectTimer === 0) {
            navigate('/login');
        }
        return () => clearInterval(redirectTimer);
    }, [step, autoRedirectTimer, navigate]);

    // Auto lookup account when 12 digits are entered
    useEffect(() => {
        const cleanAadhaar = aadhaar.replace(/[^0-9]/g, '');
        if (cleanAadhaar.length === 12 && (!accountInfo || accountInfo.aadhaar !== cleanAadhaar)) {
            lookupAadhaarAccount(cleanAadhaar);
        } else if (cleanAadhaar.length < 12 && accountInfo) {
            setAccountInfo(null);
            setIsAddingEmailMode(false);
        }
    }, [aadhaar]);

    // Look up account details by Aadhaar
    const lookupAadhaarAccount = async (cleanAadhaar) => {
        setIsCheckingAccount(true);
        setErrorMessage('');
        try {
            const data = await authAPI.checkAadhaarAccount(cleanAadhaar);
            setAccountInfo(data);
            
            // If user doesn't have an email, automatically activate "Add Email" mode
            if (!data.hasEmail) {
                setIsAddingEmailMode(true);
            } else {
                setIsAddingEmailMode(false);
            }
        } catch (err) {
            setAccountInfo(null);
            setIsAddingEmailMode(false);
            setErrorMessage(err.message || 'No registered account found with this Aadhaar number.');
        } finally {
            setIsCheckingAccount(false);
        }
    };

    // Calculate password strength
    const getPasswordStrength = (pass) => {
        if (!pass) return { score: 0, label: '', color: 'bg-gray-200', text: '' };
        let score = 0;
        if (pass.length >= 6) score += 1;
        if (pass.length >= 8) score += 1;
        if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;

        if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500', width: 'w-1/3', text: 'text-red-600' };
        if (score <= 4) return { score: 2, label: 'Medium', color: 'bg-amber-500', width: 'w-2/3', text: 'text-amber-600' };
        return { score: 3, label: 'Strong', color: 'bg-emerald-500', width: 'w-full', text: 'text-emerald-600' };
    };

    const passwordStrength = getPasswordStrength(newPassword);

    // Format Aadhaar display with spaces: XXXX XXXX XXXX
    const formatAadhaarDisplay = (val) => {
        const clean = (val || '').replace(/[^0-9]/g, '').slice(0, 12);
        const parts = [];
        for (let i = 0; i < clean.length; i += 4) {
            parts.push(clean.substring(i, i + 4));
        }
        return parts.join(' ');
    };

    // --- STEP 1: SEND OTP ---
    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        const cleanAadhaar = aadhaar.replace(/[^0-9]/g, '').trim();

        if (!cleanAadhaar || cleanAadhaar.length !== 12) {
            setErrorMessage('Please enter a valid 12-digit Aadhaar number.');
            return;
        }

        // Determine email based on mode
        const targetEmail = isAddingEmailMode ? newEmailToLink.trim() : email.trim();

        if (!targetEmail) {
            setErrorMessage(isAddingEmailMode ? 'Please enter the email address you wish to link.' : 'Please enter your registered email address.');
            return;
        }

        setIsLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const response = await authAPI.sendPasswordResetOtp({
                aadhaar: cleanAadhaar,
                email: targetEmail,
                isAddingEmail: isAddingEmailMode
            });
            
            setOtpDigits(['', '', '', '', '', '']);
            setSuccessMessage(response.message || 'Verification code sent to your email.');
            setStep(2);
            setCountdown(60); // 60s cooldown

            // Auto focus first OTP input after transition
            setTimeout(() => {
                if (otpInputRefs.current[0]) {
                    otpInputRefs.current[0].focus();
                }
            }, 100);
        } catch (err) {
            setErrorMessage(err.message || 'Failed to send verification code. Please check your details.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- STEP 2: VERIFY OTP ---
    const handleOtpChange = (index, value) => {
        if (value.length > 1) {
            const pastedDigits = value.replace(/[^0-9]/g, '').slice(0, 6).split('');
            const newDigits = [...otpDigits];
            pastedDigits.forEach((digit, i) => {
                if (index + i < 6) {
                    newDigits[index + i] = digit;
                }
            });
            setOtpDigits(newDigits);
            const nextIndex = Math.min(index + pastedDigits.length, 5);
            if (otpInputRefs.current[nextIndex]) {
                otpInputRefs.current[nextIndex].focus();
            }
            return;
        }

        const cleanChar = value.replace(/[^0-9]/g, '');
        const newDigits = [...otpDigits];
        newDigits[index] = cleanChar;
        setOtpDigits(newDigits);

        if (cleanChar && index < 5) {
            if (otpInputRefs.current[index + 1]) {
                otpInputRefs.current[index + 1].focus();
            }
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            if (otpInputRefs.current[index - 1]) {
                otpInputRefs.current[index - 1].focus();
            }
        }
    };

    const handleVerifyOtp = async (e) => {
        if (e) e.preventDefault();
        const fullOtp = otpDigits.join('');
        const cleanAadhaar = aadhaar.replace(/[^0-9]/g, '').trim();

        if (fullOtp.length !== 6) {
            setErrorMessage('Please enter the complete 6-digit verification code.');
            return;
        }

        setIsLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const response = await authAPI.verifyPasswordResetOtp({
                aadhaar: cleanAadhaar,
                otp: fullOtp
            });
            setResetToken(response.resetToken);
            setSuccessMessage(response.message || 'Code verified successfully! You can now set your new password.');
            setStep(3);
        } catch (err) {
            setErrorMessage(err.message || 'Invalid or expired verification code.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- STEP 3: RESET PASSWORD ---
    const handleResetPassword = async (e) => {
        if (e) e.preventDefault();
        const cleanAadhaar = aadhaar.replace(/[^0-9]/g, '').trim();

        if (!newPassword) {
            setErrorMessage('Please enter a new password.');
            return;
        }
        if (newPassword.length < 6) {
            setErrorMessage('Password must be at least 6 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setErrorMessage('Passwords do not match. Please re-check.');
            return;
        }

        setIsLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            await authAPI.resetPassword({
                aadhaar: cleanAadhaar,
                resetToken,
                newPassword
            });
            setStep(4);
            setAutoRedirectTimer(5);
        } catch (err) {
            setErrorMessage(err.message || 'Failed to update password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Reset account lookup
    const handleResetAccount = () => {
        setAccountInfo(null);
        setAadhaar('');
        setEmail('');
        setNewEmailToLink('');
        setIsAddingEmailMode(false);
        setErrorMessage('');
        setSuccessMessage('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#F7F7F8] to-[#EAEAEA] py-12 px-4 flex items-center justify-center">
            <div className="w-full max-w-lg">
                {/* Branding & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FFF2ED] text-[#D35D38] shadow-sm mb-4 border border-[#F8D5C8]">
                        {step === 1 && (
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        )}
                        {step === 2 && (
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        )}
                        {step === 3 && (
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        )}
                        {step === 4 && (
                            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                    <h1 className="text-3xl font-extrabold text-[#2A2A2A] tracking-tight">
                        {step === 1 && 'Account Verification'}
                        {step === 2 && 'Verify Security Code'}
                        {step === 3 && 'Set New Password'}
                        {step === 4 && 'Account Updated!'}
                    </h1>
                    <p className="text-sm md:text-base text-[#666666] mt-2 max-w-sm mx-auto">
                        {step === 1 && 'Verify your Aadhaar and email address to securely reset your password or link a new email.'}
                        {step === 2 && (
                            <>
                                Enter the 6-digit verification code sent to{' '}
                                <span className="font-semibold text-[#2A2A2A]">
                                    {isAddingEmailMode ? newEmailToLink : (accountInfo?.maskedEmail || email)}
                                </span>
                            </>
                        )}
                        {step === 3 && 'Choose a strong, secure new password for your account.'}
                        {step === 4 && 'Your password has been changed successfully. You can now log in.'}
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8">
                    {/* Stepper Indicator */}
                    {step < 4 && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between relative">
                                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 -z-0"></div>
                                <div 
                                    className="absolute top-1/2 left-0 h-1 bg-[#D35D38] -translate-y-1/2 transition-all duration-300 -z-0"
                                    style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
                                ></div>

                                {/* Step 1 Marker */}
                                <div className="flex flex-col items-center relative z-10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-200 ${
                                        step >= 1 ? 'bg-[#D35D38] text-white shadow-md' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                        1
                                    </div>
                                    <span className="text-[11px] font-semibold text-gray-500 mt-1">Identity</span>
                                </div>

                                {/* Step 2 Marker */}
                                <div className="flex flex-col items-center relative z-10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-200 ${
                                        step >= 2 ? 'bg-[#D35D38] text-white shadow-md' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                        2
                                    </div>
                                    <span className="text-[11px] font-semibold text-gray-500 mt-1">OTP</span>
                                </div>

                                {/* Step 3 Marker */}
                                <div className="flex flex-col items-center relative z-10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-200 ${
                                        step >= 3 ? 'bg-[#D35D38] text-white shadow-md' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                        3
                                    </div>
                                    <span className="text-[11px] font-semibold text-gray-500 mt-1">Password</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Alert */}
                    {errorMessage && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-start text-sm animate-shake">
                            <svg className="w-5 h-5 mr-2.5 flex-shrink-0 mt-0.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span className="flex-1 font-medium">{errorMessage}</span>
                        </div>
                    )}

                    {/* Success Alert */}
                    {successMessage && step < 4 && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl mb-6 flex items-start text-sm">
                            <svg className="w-5 h-5 mr-2.5 flex-shrink-0 mt-0.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="flex-1 font-medium">{successMessage}</span>
                        </div>
                    )}


                    {/* ================= STEP 1: AADHAAR LOOKUP + EMAIL VERIFICATION / ADD EMAIL ================= */}
                    {step === 1 && (
                        <form onSubmit={handleSendOtp} className="space-y-5">
                            {/* Aadhaar Number Input */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label htmlFor="aadhaar" className="block text-sm font-semibold text-[#2A2A2A]">
                                        Aadhaar Number <span className="text-red-500">*</span>
                                    </label>
                                    {accountInfo && (
                                        <button
                                            type="button"
                                            onClick={handleResetAccount}
                                            className="text-xs font-semibold text-[#D35D38] hover:underline cursor-pointer"
                                        >
                                            Change Aadhaar
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        id="aadhaar"
                                        name="aadhaar"
                                        maxLength={14}
                                        value={formatAadhaarDisplay(aadhaar)}
                                        onChange={(e) => setAadhaar(e.target.value.replace(/[^0-9]/g, ''))}
                                        placeholder="12-digit Aadhaar (e.g. 1234 1234 1234)"
                                        disabled={isCheckingAccount}
                                        className="w-full px-4 py-3.5 pl-11 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent text-[#2A2A2A] font-mono transition-all disabled:bg-gray-50"
                                        autoFocus
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                        </svg>
                                    </div>
                                    {isCheckingAccount && (
                                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                                            <svg className="animate-spin h-5 w-5 text-[#D35D38]" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Enter your 12-digit Aadhaar number to find your account details.
                                </p>
                            </div>

                            {/* Account Identity Card (Shows Name and Temple Name!) */}
                            {accountInfo && (
                                <div className="bg-gradient-to-r from-[#FFF6F2] to-[#FFF0E9] border border-[#FAD6C8] rounded-2xl p-4 shadow-sm animate-fade-in">
                                    <div className="text-xs uppercase tracking-wider font-bold text-[#D35D38] mb-2 flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                                        Verified Account Found
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-white">
                                            <span className="block text-[11px] font-semibold text-gray-500 uppercase">Participant Name</span>
                                            <span className="font-extrabold text-base text-[#2A2A2A] block truncate">{accountInfo.name}</span>
                                        </div>
                                        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-white">
                                            <span className="block text-[11px] font-semibold text-gray-500 uppercase">Temple Organization</span>
                                            <span className="font-extrabold text-base text-[#2A2A2A] block truncate">{accountInfo.templeName}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* CASE A: USER DOES NOT HAVE AN EMAIL LINKED */}
                            {accountInfo && !accountInfo.hasEmail && (
                                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 space-y-3">
                                    <div className="flex items-start">
                                        <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <p className="font-bold text-sm text-blue-950 mb-0.5">No Email Registered</p>
                                            <p className="text-blue-800 leading-relaxed">
                                                Hello <span className="font-semibold text-blue-950">{accountInfo.name}</span> ({accountInfo.templeName})! Your account currently has no email address. Please add an email address below to receive your OTP and link it for future account recovery.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* CASE B: USER ALREADY HAS AN EMAIL (Show Warning if adding/changing email) */}
                            {accountInfo && accountInfo.hasEmail && (
                                <div>
                                    {isAddingEmailMode ? (
                                        // Warning Banner when adding a new email to an account that already has one
                                        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mb-4 text-xs text-amber-950 shadow-sm animate-fade-in">
                                            <div className="flex items-start">
                                                <svg className="w-6 h-6 mr-3 flex-shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                <div className="space-y-1">
                                                    <p className="font-bold text-sm text-amber-900 uppercase tracking-wide">
                                                        ⚠️ Warning: Account Already Has An Email
                                                    </p>
                                                    <p className="leading-relaxed">
                                                        An email address is already registered for <span className="font-bold text-gray-950">{accountInfo.name}</span> ({accountInfo.templeName}): <span className="font-mono font-bold text-amber-900 bg-amber-100 px-1 py-0.5 rounded">{accountInfo.maskedEmail}</span>.
                                                    </p>
                                                    <p className="font-medium text-amber-800">
                                                        Adding or verifying a new email will <strong>replace and update</strong> your current email address for all future account notifications and logins.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-3 pt-2.5 border-t border-amber-200 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsAddingEmailMode(false)}
                                                    className="text-xs font-bold text-amber-900 hover:text-black underline cursor-pointer"
                                                >
                                                    Cancel & Use Registered Email ({accountInfo.maskedEmail})
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // Registered Email Info & Toggle to Add/Update Email
                                        <div className="flex items-center justify-between text-xs text-gray-600 px-1 mb-1">
                                            <span>Registered Email: <strong className="text-gray-900 font-mono">{accountInfo.maskedEmail}</strong></span>
                                            <button
                                                type="button"
                                                onClick={() => setIsAddingEmailMode(true)}
                                                className="text-[#D35D38] font-bold hover:underline cursor-pointer"
                                            >
                                                Add / Change Email
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Email Input Field */}
                            {accountInfo && (
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-[#2A2A2A] mb-1.5">
                                        {isAddingEmailMode ? (
                                            accountInfo.hasEmail ? 'New Email Address to Link *' : 'Add Your Email Address *'
                                        ) : (
                                            'Verify Registered Email Address *'
                                        )}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={isAddingEmailMode ? newEmailToLink : email}
                                            onChange={(e) => isAddingEmailMode ? setNewEmailToLink(e.target.value) : setEmail(e.target.value)}
                                            placeholder={isAddingEmailMode ? 'e.g. name@example.com' : `Enter matching email (${accountInfo.maskedEmail})`}
                                            className="w-full px-4 py-3.5 pl-11 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent text-[#2A2A2A] transition-all"
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {isAddingEmailMode 
                                            ? 'A verification code will be dispatched to this email to link it to your account.' 
                                            : 'Must match the email address registered with this Aadhaar account.'}
                                    </p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading || isCheckingAccount || !accountInfo}
                                className={`w-full py-4 px-6 rounded-xl font-bold text-base shadow-lg transition-all duration-200 ${
                                    isLoading || isCheckingAccount || !accountInfo
                                        ? 'bg-gray-400 cursor-not-allowed text-white'
                                        : 'bg-[#D35D38] hover:bg-[#B84A2E] text-white hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer'
                                }`}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sending Code...
                                    </span>
                                ) : !accountInfo ? (
                                    'Enter 12-Digit Aadhaar to Proceed'
                                ) : isAddingEmailMode ? (
                                    'Send Code & Link Email'
                                ) : (
                                    'Verify & Send Verification Code'
                                )}
                            </button>
                        </form>
                    )}

                    {/* ================= STEP 2: ENTER OTP ================= */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div>
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 text-xs space-y-1.5">
                                    <div className="flex justify-between items-center text-gray-700">
                                        <span>Account Holder:</span>
                                        <span className="font-bold text-gray-900">{accountInfo?.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-700">
                                        <span>Temple:</span>
                                        <span className="font-bold text-gray-900">{accountInfo?.templeName}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-700">
                                        <span>Aadhaar:</span>
                                        <span className="font-mono font-bold text-gray-900">{formatAadhaarDisplay(aadhaar)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-700 pt-1 border-t border-gray-200">
                                        <span>Destination Email:</span>
                                        <span className="font-semibold text-[#D35D38]">{isAddingEmailMode ? newEmailToLink : (accountInfo?.maskedEmail || email)}</span>
                                    </div>
                                    {isAddingEmailMode && (
                                        <div className="text-[11px] text-blue-700 bg-blue-50 p-2 rounded-lg mt-1 font-medium">
                                            ℹ️ Verifying this OTP will permanently link <strong className="text-blue-950">{newEmailToLink}</strong> to your account.
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-sm font-semibold text-[#2A2A2A]">
                                        Enter 6-Digit OTP <span className="text-red-500">*</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep(1);
                                            setErrorMessage('');
                                            setSuccessMessage('');
                                        }}
                                        className="text-xs font-semibold text-[#D35D38] hover:underline cursor-pointer"
                                    >
                                        Change Details
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mb-3">
                                    Please enter the 6-digit verification code sent to your email inbox.
                                </p>

                                {/* 6 Box OTP Inputs */}
                                <div className="grid grid-cols-6 gap-2 sm:gap-3 my-4">
                                    {otpDigits.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={el => otpInputRefs.current[index] = el}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            className={`w-full aspect-square text-center text-2xl font-extrabold rounded-xl border-2 transition-all ${
                                                digit 
                                                    ? 'border-[#D35D38] bg-[#FFF8F5] text-[#2A2A2A]' 
                                                    : 'border-gray-300 text-gray-700 focus:border-[#D35D38]'
                                            } focus:outline-none focus:ring-2 focus:ring-[#D35D38]`}
                                        />
                                    ))}
                                </div>

                                <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                                    <span>Didn't receive the email?</span>
                                    {countdown > 0 ? (
                                        <span className="font-semibold text-gray-400">
                                            Resend code in {countdown}s
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleSendOtp()}
                                            disabled={isLoading}
                                            className="font-bold text-[#D35D38] hover:underline cursor-pointer"
                                        >
                                            Resend Code
                                        </button>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || otpDigits.join('').length !== 6}
                                className={`w-full py-4 px-6 rounded-xl font-bold text-base shadow-lg transition-all duration-200 ${
                                    isLoading || otpDigits.join('').length !== 6
                                        ? 'bg-gray-400 cursor-not-allowed text-white'
                                        : 'bg-[#D35D38] hover:bg-[#B84A2E] text-white hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer'
                                }`}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Verifying Code...
                                    </span>
                                ) : (
                                    'Verify Code & Continue'
                                )}
                            </button>
                        </form>
                    )}

                    {/* ================= STEP 3: SET NEW PASSWORD ================= */}
                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="bg-[#FFF8F5] border border-[#FAD6C8] rounded-xl p-3.5 text-xs text-[#8A3D22] flex items-center justify-between">
                                <div>
                                    <span className="block font-semibold">Account: {accountInfo?.name}</span>
                                    <span className="block text-[11px] text-gray-600">Temple: {accountInfo?.templeName}</span>
                                </div>
                                <span className="font-mono font-bold text-sm text-[#2A2A2A]">{formatAadhaarDisplay(aadhaar)}</span>
                            </div>

                            {/* New Password */}
                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                                    New Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="newPassword"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Minimum 6 characters"
                                        className="w-full px-4 py-3.5 pr-12 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent text-[#2A2A2A] transition-all"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-700 cursor-pointer"
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

                                {/* Password Strength Meter */}
                                {newPassword && (
                                    <div className="mt-2.5">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-gray-500">Password Strength:</span>
                                            <span className={`font-semibold ${passwordStrength.text}`}>{passwordStrength.label}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                            <div className={`h-full ${passwordStrength.color} ${passwordStrength.width} transition-all duration-300`}></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                                    Confirm New Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter your new password"
                                        className={`w-full px-4 py-3.5 pr-12 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent text-[#2A2A2A] transition-all ${
                                            confirmPassword && newPassword !== confirmPassword 
                                                ? 'border-red-300' 
                                                : confirmPassword && newPassword === confirmPassword 
                                                ? 'border-emerald-400' 
                                                : 'border-gray-300'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-700 cursor-pointer"
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
                                {confirmPassword && newPassword === confirmPassword && (
                                    <p className="text-xs text-emerald-600 font-semibold mt-1.5 flex items-center">
                                        <svg className="w-4 h-4 mr-1 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Passwords match!
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-4 px-6 rounded-xl font-bold text-base shadow-lg transition-all duration-200 ${
                                    isLoading
                                        ? 'bg-gray-400 cursor-not-allowed text-white'
                                        : 'bg-[#D35D38] hover:bg-[#B84A2E] text-white hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer'
                                }`}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Updating Password...
                                    </span>
                                ) : (
                                    'Confirm & Reset Password'
                                )}
                            </button>
                        </form>
                    )}

                    {/* ================= STEP 4: SUCCESS ================= */}
                    {step === 4 && (
                        <div className="text-center py-4 space-y-6">
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-[#2A2A2A]">Account Updated Successfully!</h3>
                                <p className="text-sm text-gray-600 max-w-sm mx-auto">
                                    Your password has been changed securely for <span className="font-bold text-gray-900">{accountInfo?.name}</span> ({accountInfo?.templeName}).
                                </p>
                                <p className="text-xs text-gray-500">
                                    You will be redirected to the sign-in page in{' '}
                                    <span className="font-bold text-[#D35D38]">{autoRedirectTimer} seconds</span>.
                                </p>
                            </div>

                            <Link
                                to="/login"
                                className="inline-block w-full py-4 px-6 rounded-xl font-bold text-base bg-[#D35D38] hover:bg-[#B84A2E] text-white shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                                Sign In Now
                            </Link>
                        </div>
                    )}

                    {/* Back to Sign In Footer */}
                    {step < 4 && (
                        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                            <p className="text-sm text-gray-600">
                                Remembered your password?{' '}
                                <Link to="/login" className="text-[#D35D38] font-bold hover:underline">
                                    Back to Sign In
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
