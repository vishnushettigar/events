import React, { useState } from 'react'
import CollapsibleList from './CollapsibleList'

const Templeparticipants = () => {
    // Define event titles as an object
    const eventTitles = {
        "50 meters": "50 meters",
        "100 meters": "100 meters",
        "200 meter": "200 meters",
        "400 meter": "400 meters",
        "800 meter": "800 meters",
        "long jump": "long jump",
        "shotput": "shotput",
        "running 25 meters": "running 25 meters",
        "lucky circle": "lucky circle",
        "ball passing": "ball passing",
        "frog jump 25 meter": "frog jump 25 meters",
        "frog jump 15 meter": "frog jump 15 meters"
    };

    const [selectedAge, setSelectedAge] = useState('');

    const shouldHideGender = () => {
        return selectedAge === '0-5' || selectedAge === '61-90';
    };

    return (
        <section className="p-6  bg-gray-100 min-h-screen">
            <div className="w-[80%] mx-auto bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4">Temple Participants</h2>

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    {/* Age Filter */}
                    <div className="flex flex-col w-full md:w-1/2">
                        <label className="mb-1 text-gray-700 font-medium">Filter by Age</label>
                        <select 
                            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedAge}
                            onChange={(e) => setSelectedAge(e.target.value)}
                        >
                            <option value="">Select Age Group</option>
                            <option>0-5</option>
                            <option>6-10</option>
                            <option>11-14</option>
                            <option>15-18</option>
                            <option>19-24</option>
                            <option>25-35</option>
                            <option>36-48</option>
                            <option>49-60</option>
                            <option>61-90</option>
                        </select>
                    </div>

                    {/* Gender Filter - Only show if age is not 0-5 or 61-90 */}
                    {!shouldHideGender() && (
                        <div className="flex flex-col w-full md:w-1/2">
                            <label className="mb-1 text-gray-700 font-medium">Filter by Gender</label>
                            <select className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Select Gender</option>
                                <option>Male</option>
                                <option>Female</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className="text-gray-600 mx-auto mt-10">
                    {selectedAge === '0-5'
                      ? [
                          'running 25 meters',
                          'frog jump 15 meters'
                        ].map((title) => (
                          <CollapsibleList key={title} title={title} />
                        ))
                      : selectedAge === '6-10'
                      ? [
                          '50 meters',
                          'frog jump 25 meters'
                        ].map((title) => (
                          <CollapsibleList key={title} title={title} />
                        ))
                      : selectedAge === '11-14'
                      ? [
                          '50 meters',
                          '100 meters',
                          'long jump',
                          'shotput'
                        ].map((title) => (
                          <CollapsibleList key={title} title={title} />
                        ))
                      : selectedAge === '15-18'
                      ? [
                          '100 meters',
                          '200 meters',
                          '400 meters',
                          '800 meters',
                          'long jump',
                          'shotput'
                        ].map((title) => (
                          <CollapsibleList key={title} title={title} />
                        ))
                      : selectedAge === '19-24'
                      ? [
                          '100 meters',
                          '200 meters',
                          '400 meters',
                          '800 meters',
                          'long jump',
                          'shotput'
                        ].map((title) => (
                          <CollapsibleList key={title} title={title} />
                        ))
                      : selectedAge === '25-35'
                      ? [
                          '100 meters',
                          '200 meters',
                          '400 meters',
                          'long jump',
                          'shotput'
                        ].map((title) => (
                          <CollapsibleList key={title} title={title} />
                        ))
                      : selectedAge === '36-48'
                      ? [
                          '100 meters',
                          '200 meters',
                          'shotput'
                        ].map((title) => (
                          <CollapsibleList key={title} title={title} />
                        ))
                      : selectedAge === '49-60'
                      ? [
                          '50 meters',
                          '100 meters',
                          'shotput'
                        ].map((title) => (
                          <CollapsibleList key={title} title={title} />
                        ))
                      : selectedAge === '61-90'
                      ? [
                          'lucky circle',
                          'ball passing'                         
                        ].map((title) => (
                          <CollapsibleList key={title} title={title} />
                        ))
                      : Object.entries(eventTitles).map(([key, title]) => (
                          <CollapsibleList key={key} title={title} />
                        ))}
                </div>
            </div>
        </section>
    )
}

export default Templeparticipants;