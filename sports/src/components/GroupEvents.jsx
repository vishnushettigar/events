import React, { useState } from 'react';

const CollapsibleList = ({ title, children }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="mb-6 border rounded shadow">
            <button
                className="w-full text-left px-4 py-3 bg-blue-100 hover:bg-blue-200 font-semibold text-lg rounded-t focus:outline-none flex justify-between items-center"
                onClick={() => setOpen((prev) => !prev)}
            >
                {title}
                <span>{open ? '-' : '+'}</span>
            </button>
            {open && <div className="p-4 bg-white rounded-b">{children}</div>}
        </div>
    );
};

const GroupEvents = () => {
    return (
        <section className="p-6 bg-gray-100 min-h-screen">
            <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6">Group Events Registration</h2>
                <p className='font-extrabold text-red-500 pb-4'>**Participants in team events must register before the temple admin adds their names.**</p>

                {/* Men's Section */}
                <div className="mb-10">
                    <h3 className="text-xl font-semibold mb-4 text-blue-700">Men's Events</h3>
                    <div className="space-y-6">
                        <CollapsibleList title="Volleyball (10 Players)">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <span className="w-8 text-right">{i + 1}.</span>
                                        <input type="text" placeholder="Aadhaar Number" className="w-1/2 p-2 border rounded" />
                                        <input type="text" placeholder="Name" className="w-1/2 p-2 border rounded" />
                                    </div>
                                ))}
                            </div>
                            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Submit Volleyball Team</button>
                        </CollapsibleList>
                        <CollapsibleList title="Tug-of-war (12 Players)">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <span className="w-8 text-right">{i + 1}.</span>
                                        <input type="text" placeholder="Aadhaar Number" className="w-1/2 p-2 border rounded" />
                                        <input type="text" placeholder="Name" className="w-1/2 p-2 border rounded" />
                                    </div>
                                ))}
                            </div>
                            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Submit Tug-of-war Team</button>
                        </CollapsibleList>
                        <CollapsibleList title="4x100 Relay (4 Players)">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <span className="w-8 text-right">{i + 1}.</span>
                                        <input type="text" placeholder="Aadhaar Number" className="w-1/2 p-2 border rounded" />
                                        <input type="text" placeholder="Name" className="w-1/2 p-2 border rounded" />
                                    </div>
                                ))}
                            </div>
                            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Submit Relay Team</button>
                        </CollapsibleList>
                    </div>
                </div>

                {/* Women's Section */}
                <div>
                    <h3 className="text-xl font-semibold mb-4 text-pink-700">Women's Events</h3>
                    <div className="space-y-6">
                        <CollapsibleList title="Throwball (10 Players)">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <span className="w-8 text-right">{i + 1}.</span>
                                        <input type="text" placeholder="Aadhaar Number" className="w-1/2 p-2 border rounded" />
                                        <input type="text" placeholder="Name" className="w-1/2 p-2 border rounded" />
                                    </div>
                                ))}
                            </div>
                            <button className="mt-4 px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700">Submit Throwball Team</button>
                        </CollapsibleList>
                        <CollapsibleList title="Tug-of-war (12 Players)">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <span className="w-8 text-right">{i + 1}.</span>
                                        <input type="text" placeholder="Aadhaar Number" className="w-1/2 p-2 border rounded" />
                                        <input type="text" placeholder="Name" className="w-1/2 p-2 border rounded" />
                                    </div>
                                ))}
                            </div>
                            <button className="mt-4 px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700">Submit Tug-of-war Team</button>
                        </CollapsibleList>
                        <CollapsibleList title="4x100 Relay (4 Players)">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <span className="w-8 text-right">{i + 1}.</span>
                                        <input type="text" placeholder="Aadhaar Number" className="w-1/2 p-2 border rounded" />
                                        <input type="text" placeholder="Name" className="w-1/2 p-2 border rounded" />
                                    </div>
                                ))}
                            </div>
                            <button className="mt-4 px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700">Submit Relay Team</button>
                        </CollapsibleList>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default GroupEvents;
// This code defines a React component for a group events registration form.