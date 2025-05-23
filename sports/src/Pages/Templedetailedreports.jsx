import React from 'react'

// Example data for demonstration. Replace with real data or fetch from API/props.
const individualEvents = [
  { event: 'Running - 25 mts - MALE', age: '0 - 5', gender: 'MALE', first: '', second: 'Ranjan Shettigar', third: '', points: 3 },
  { event: 'Frog Jump - 15 mts - MALE', age: '0 - 5', gender: 'MALE', first: '', second: 'Ranjan Shettigar', third: '', points: 3 },
  { event: 'Running - 50 mts - MALE', age: '6 - 10', gender: 'MALE', first: 'Vikram Shettigar', second: '', third: '', points: 5 },
  { event: 'Frog Jump - 25 mts - MALE', age: '6 - 10', gender: 'MALE', first: 'Lathish Shettigar', second: '', third: 'Likhith S Shettigar', points: 6 },
  { event: 'SHOT PUT - MALE', age: '11 - 14', gender: 'MALE', first: 'UTTHAM -', second: '', third: '', points: 5 },
  { event: 'Long jump - FEMALE', age: '11 - 14', gender: 'FEMALE', first: 'Rashmitha Shettigsr', second: '', third: '', points: 5 },
  { event: 'Running - 800 mts - MALE', age: '15 - 18', gender: 'MALE', first: '', second: 'Gautham Shettigar', third: '', points: 3 },
  { event: 'SHOT PUT - FEMALE', age: '15 - 18', gender: 'FEMALE', first: '', second: 'Vaishnavi Vaishnavi', third: 'Shilpa shettigar', points: 4 },
  { event: 'Running - 100 mts - FEMALE', age: '15 - 18', gender: 'FEMALE', first: '', second: 'Pallavi J.S', third: '', points: 3 },
  { event: 'Running - 200 mts - FEMALE', age: '15 - 18', gender: 'FEMALE', first: 'Pallavi J.S', second: '', third: '', points: 5 },
  { event: 'Long jump - FEMALE', age: '15 - 18', gender: 'FEMALE', first: 'Pallavi J.S', second: '', third: '', points: 5 },
  { event: 'Running - 100 mts - FEMALE', age: '19 - 24', gender: 'FEMALE', first: '', second: 'Deeksha Shettigar', third: 'Akshatha .', points: 4 },
  { event: 'Running - 200 mts - MALE', age: '19 - 24', gender: 'MALE', first: 'Uttam Shettigar', second: '', third: '', points: 5 },
  { event: 'Running - 200 mts - FEMALE', age: '19 - 24', gender: 'FEMALE', first: '', second: 'Akshatha .', third: 'Deeksha Shettigar', points: 4 },
  { event: 'Long jump - MALE', age: '19 - 24', gender: 'MALE', first: '', second: 'Jayaraj Shettigar', third: 'Chirag Shettigar', points: 4 },
  { event: 'SHOT PUT - FEMALE', age: '19 - 24', gender: 'FEMALE', first: '', second: '', third: 'Deeksha Shettigar', points: 1 },
  { event: 'Running - 400 mts - FEMALE', age: '19 - 24', gender: 'FEMALE', first: '', second: 'Akshatha .', third: '', points: 3 },
  { event: 'Running - 800 mts - FEMALE', age: '19 - 24', gender: 'FEMALE', first: 'Keerthana Shettigsr', second: '', third: '', points: 5 },
  { event: 'SHOT PUT - MALE', age: '19 - 24', gender: 'MALE', first: 'Uttam Shettigar', second: '', third: '', points: 5 },
  { event: 'Running - 100 mts - MALE', age: '19 - 24', gender: 'MALE', first: 'Uttam Shettigar', second: '', third: '', points: 5 },
  { event: 'Long jump - MALE', age: '25 - 35', gender: 'MALE', first: '', second: 'Kiran K', third: '', points: 3 },
  { event: 'Running - 200 mts - MALE', age: '25 - 35', gender: 'MALE', first: 'Kiran K', second: '', third: '', points: 5 },
  { event: 'Running - 100 mts - MALE', age: '25 - 35', gender: 'MALE', first: '', second: 'Kiran K', third: '', points: 3 },
  { event: 'Running - 400 mts - MALE', age: '25 - 35', gender: 'MALE', first: 'Shiva prasad', second: '', third: '', points: 5 },
  { event: 'Long jump - FEMALE', age: '25 - 35', gender: 'FEMALE', first: '', second: '', third: 'Yogeshwari Shettigar', points: 1 },
  { event: 'Running - 100 mts - FEMALE', age: '36 - 48', gender: 'FEMALE', first: '', second: 'Mohini s', third: '', points: 3 },
  { event: 'Running - 200 mts - FEMALE', age: '36 - 48', gender: 'FEMALE', first: '', second: 'Mohini s', third: '', points: 3 },
  { event: 'Running - 50 mts - MALE', age: '49 - 60', gender: 'MALE', first: '', second: 'Surendra s', third: '', points: 3 },
  { event: 'Running - 100 mts - MALE', age: '49 - 60', gender: 'MALE', first: '', second: 'Surendra s', third: '', points: 3 },
];

const teamEvents = [
  { event: 'Relay - 100 X 4 - MALE', gender: 'MALE', result: 'THIRD', points: 3 },
  { event: 'Relay - 100 X 4 - FEMALE', gender: 'FEMALE', result: 'FIRST', points: 10 },
];

const totalPoints = { individual: 112, team: 13, total: 125 };

const Templedetailedreports = () => {
  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-blue-800 mb-4">Individual Events</h2>
        <div className="overflow-x-auto rounded-xl shadow bg-white">
          <table className="min-w-full divide-y divide-blue-200">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
              <tr>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">SL.NO</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Event</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Age Category</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Gender</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">First</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Second</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Third</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Points</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-blue-100">
              {individualEvents.map((row, idx) => (
                <tr key={idx} className="hover:bg-blue-50 transition">
                  <td className="px-4 py-2 font-semibold text-blue-900">{idx + 1}</td>
                  <td className="px-4 py-2">{row.event}</td>
                  <td className="px-4 py-2">{row.age}</td>
                  <td className="px-4 py-2">{row.gender}</td>
                  <td className="px-4 py-2">{row.first}</td>
                  <td className="px-4 py-2">{row.second}</td>
                  <td className="px-4 py-2">{row.third}</td>
                  <td className="px-4 py-2 font-bold text-purple-700">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-blue-800 mb-4">Team Events</h2>
        <div className="overflow-x-auto rounded-xl shadow bg-white">
          <table className="min-w-full divide-y divide-blue-200">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
              <tr>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">SL.NO</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Event</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Gender</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Result</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Points</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-blue-100">
              {teamEvents.map((row, idx) => (
                <tr key={idx} className="hover:bg-blue-50 transition">
                  <td className="px-4 py-2 font-semibold text-blue-900">{idx + 1}</td>
                  <td className="px-4 py-2">{row.event}</td>
                  <td className="px-4 py-2">{row.gender}</td>
                  <td className="px-4 py-2">{row.result}</td>
                  <td className="px-4 py-2 font-bold text-purple-700">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-blue-800 mb-4">Total Points</h2>
        <div className="overflow-x-auto rounded-xl shadow bg-white max-w-md mx-auto">
          <table className="min-w-full divide-y divide-blue-200">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
              <tr>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Individual Event Points</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Team Event Points</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Total Points</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-blue-100">
              <tr>
                <td className="px-4 py-2 font-bold text-blue-700">{totalPoints.individual}</td>
                <td className="px-4 py-2 font-bold text-purple-700">{totalPoints.team}</td>
                <td className="px-4 py-2 font-bold text-green-700">{totalPoints.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Templedetailedreports