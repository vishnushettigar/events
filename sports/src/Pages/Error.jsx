import React from "react";
import { Link } from "react-router-dom";
import errorImage from "../assets/404.png";

const Error = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary p-4">
      <img
        src={errorImage}
        alt="404 page not found"
        className="w-[16rem] mb-3"
      />
      <h1 className="text-2xl md:text-3xl  text-center font-bold text-primary mb-4">
        Oops! Something went wrong.
      </h1>
      <p className="text-base text-center text-secondary mb-6">
        Looks like you&apos;ve run off the track! This page doesn&apos;t seem to
        exist.
      </p>
      <Link
        to="/"
        className="px-4 py-2 rounded-lg text-center bg-accent text-primary bg-[#D35D38] font-medium text-md shadow-lg hover:bg-[#B84A2E] transition"
      >
        Go back to Home
      </Link>
    </div>
  );
};

export default Error;