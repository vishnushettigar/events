import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../utils/api";
import loginImg from "../assets/Login-Img.png";
import logo2 from "../assets/pmlogo.jpeg";

const SignInForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    aadhaar: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const aadhaar = formData.aadhaar.trim();
    const password = formData.password.trim();

    if (!aadhaar) {
      newErrors.aadhaar = "Aadhaar number is required";
    } else if (!/^[0-9]{12}$/.test(aadhaar)) {
      newErrors.aadhaar = "Please enter a valid 12-digit Aadhaar number";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const data = await authAPI.login({
        username: formData.aadhaar,
        password: formData.password,
      });

      // Store the token in localStorage
      localStorage.setItem("token", data.token);

      // Store user data if needed
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // Dispatch auth change event
      window.dispatchEvent(new Event("authChange"));

      // Reset form
      setFormData({ aadhaar: "", password: "" });
      setErrors({});

      // Check both role.id and role_id patterns
      const userRoleId =
        data.user?.profile?.role?.id || data.user?.profile?.role_id;

      if (userRoleId === 4) {
        // Viewer - redirect to viewer panel
        navigate("/viewer");
      } else if (userRoleId === 5) {
        // Admin panel - redirect to admin panel
        navigate("/admin");
      } else if (userRoleId === 3) {
        // Staff user - redirect to staff panel
        navigate("/staffpanel");
      } else {
        // Regular user - redirect to myevents page
        navigate("/myevents");
      }
    } catch (err) {
      setErrors({
        submit:
          err.message || "An error occurred during login. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <div className="relative min-h-screen lg:h-screen w-full flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden bg-white">
      {/* Brand Logo Overlay (Floating relative to screen) */}
      <Link
        to="/"
        className="absolute top-4 left-4 lg:top-6 lg:left-6 z-30 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 border border-slate-100 flex items-center justify-center"
        title="Go to Home"
      >
        <img
          src={logo2}
          alt="Brand Logo"
          className="w-16 md:w-26 object-contain"
        />
      </Link>

      {/* Column 1: Video (Fixed on desktop, 40% height on mobile/tablet) */}
      <div className="w-full h-[40vh] lg:w-1/2 lg:h-full relative select-none bg-slate-900 flex-shrink-0">
        {/* <video
          src="https://res.cloudinary.com/ddzrfwfsl/video/upload/q_auto,f_auto/v1787819468/Create_alternate_girl_athlete_il__202608271359_ikrebu.mp4"
          poster={loginImg}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        /> */}
        <img
          src={loginImg}
          alt="Sports Festival Login"
          className="w-full h-full object-cover opacity-85"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-8 text-white">
          <h2 className="hidden md:block text-2xl font-extrabold tracking-wide drop-shadow-md">
            Padmashil Kreedothsava
          </h2>
        </div>
      </div>

      {/* Column 2: Form (60% height on mobile/tablet, 50% split on desktop) */}
      <div className="w-full bg-white rounded-t-[32px] lg:rounded-none -mt-8 lg:mt-0 relative z-10 px-4 py-2 flex flex-col justify-start lg:justify-center items-center lg:w-1/2 lg:h-full lg:overflow-y-auto shadow-[0_-8px_30px_rgba(0,0,0,0.03)] lg:shadow-none">
        <div className="w-full max-w-md mx-auto  md:px-2 py-4 lg:py-8">
          {/* Header Section */}
          <div className="text-start mb-6 lg:mb-8">
            <h1 className="text-xl lg:text-4xl font-bold text-[#2A2A2A] mb-2 lg:mb-4">
              Welcome Back
            </h1>
            <p className="text-base lg:text-lg text-[#5A5A5A]">
              Sign in to your account
            </p>
          </div>

          {/* Sign In Form (No card borders/shadows/bg on mobile, clean styled layout) */}
          <div className="w-full  md:px-2">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {errors.submit}
                </div>
              )}

              {/* Aadhaar Number */}
              <div>
                <label
                  htmlFor="aadhaar"
                  className="block text-sm font-semibold text-[#2A2A2A] mb-2"
                >
                  Aadhaar Number *
                </label>
                <input
                  type="text"
                  id="aadhaar"
                  name="aadhaar"
                  value={formData.aadhaar}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent ${
                    errors.aadhaar ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter your 12-digit Aadhaar number"
                />
                {errors.aadhaar && (
                  <p className="text-red-500 text-sm mt-1">{errors.aadhaar}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-[#2A2A2A] mb-2"
                >
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent ${
                    errors.password ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: isSubmitting ? "#9CA3AF" : "#D35D38",
                  }}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-base shadow-md transition-all duration-200 cursor-pointer text-white active:scale-98 hover:brightness-95"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Signing In...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>

              {/* Register Link */}
              <div className="text-center pt-2">
                <p className="text-[#5A5A5A] text-sm">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="text-[#D35D38] font-semibold hover:underline"
                  >
                    Create Account
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInForm;
