import React, { useState } from 'react'

// Example data for demonstration. Replace with real data or fetch from API/props.
const participantsList = [
  { name: 'Ranjan Shettigar', age_category: '0-5', aadhar_number: '556881336776', date_of_birth: '2017/01/11', gender: 'MALE', phone_number: '9880202394' },
  { name: 'Hithesh Shettigar', age_category: '6-10', aadhar_number: '798735833254', date_of_birth: '2012/11/05', gender: 'MALE', phone_number: '9449645847' },
  { name: 'Lathish Shettigar', age_category: '6-10', aadhar_number: '235881599165', date_of_birth: '2012/02/01', gender: 'MALE', phone_number: '9449438006' },
  { name: 'Likhith S Shettigar', age_category: '6-10', aadhar_number: '745043785856', date_of_birth: '2012/01/04', gender: 'MALE', phone_number: '9008842363' },
  { name: 'Pavan Kumar', age_category: '6-10', aadhar_number: '777973279768', date_of_birth: '2012/05/02', gender: 'MALE', phone_number: '8722843339' },
  { name: 'Vikram Shettigar', age_category: '6-10', aadhar_number: '657474776841', date_of_birth: '2012/01/07', gender: 'MALE', phone_number: '9880937978' },
  { name: 'Vithesh Shettigar', age_category: '6-10', aadhar_number: '299785029521', date_of_birth: '2013/11/19', gender: 'MALE', phone_number: '9449438006' },
  { name: 'Hardik S Shettigar', age_category: '6-10', aadhar_number: '266407899590', date_of_birth: '2014/05/06', gender: 'FEMALE', phone_number: '9481228725' },
  { name: 'Kirthi Shettigar', age_category: '6-10', aadhar_number: '958966581451', date_of_birth: '2015/02/27', gender: 'FEMALE', phone_number: '8722843339' },
  { name: 'Manvi P Shettigar', age_category: '6-10', aadhar_number: '422943989194', date_of_birth: '2016/10/25', gender: 'FEMALE', phone_number: '9731780418' },
  { name: 'Mohithashri Shettigar', age_category: '6-10', aadhar_number: '473032354113', date_of_birth: '2015/04/01', gender: 'FEMALE', phone_number: '9945836084' },
  { name: 'Prathiksha shettigar', age_category: '6-10', aadhar_number: '867306392022', date_of_birth: '2012/10/13', gender: 'FEMALE', phone_number: '9844247322' },
  { name: 'Deepi raj Shettigar', age_category: '11-14', aadhar_number: '664722764155', date_of_birth: '2009/04/22', gender: 'MALE', phone_number: '9449645847' },
  { name: 'Meghan Shettigar', age_category: '11-14', aadhar_number: '375209825136', date_of_birth: '2008/11/21', gender: 'MALE', phone_number: '9449586080' },
  { name: 'Nithesh Shettigsr', age_category: '11-14', aadhar_number: '697223732625', date_of_birth: '2010/03/06', gender: 'MALE', phone_number: '897143596' },
  { name: 'Sevith G.Padmashali', age_category: '11-14', aadhar_number: '800359357069', date_of_birth: '2008/11/08', gender: 'MALE', phone_number: '9353490741' },
  { name: 'UTTHAM -', age_category: '11-14', aadhar_number: '734458737515', date_of_birth: '2009/08/14', gender: 'MALE', phone_number: '9880937979' },
  { name: 'Yashas Krishna S Shettigar', age_category: '11-14', aadhar_number: '339680034875', date_of_birth: '2009/09/01', gender: 'MALE', phone_number: '9008842363' },
  { name: 'Deeksha Shettigar', age_category: '11-14', aadhar_number: '434226407760', date_of_birth: '2011/12/15', gender: 'FEMALE', phone_number: '9743527073' },
  { name: 'Mahimashri Shettigar', age_category: '11-14', aadhar_number: '485224215947', date_of_birth: '2010/04/23', gender: 'FEMALE', phone_number: '9945836084' },
  { name: 'Niveditha Shettigar', age_category: '11-14', aadhar_number: '595552587816', date_of_birth: '2008/06/17', gender: 'FEMALE', phone_number: '6361426743' },
  { name: 'Prapthi Shettigar', age_category: '11-14', aadhar_number: '589519564098', date_of_birth: '2008/07/10', gender: 'FEMALE', phone_number: '9686922948' },
  { name: 'Prathiksha Shettigar', age_category: '11-14', aadhar_number: '509781107499', date_of_birth: '2008/07/08', gender: 'FEMALE', phone_number: '8197357472' },
  { name: 'Rashmitha Shettigsr', age_category: '11-14', aadhar_number: '999167905261', date_of_birth: '2010/10/08', gender: 'FEMALE', phone_number: '9880202394' },
  { name: 'Charan Shettigar', age_category: '15-18', aadhar_number: '866851481153', date_of_birth: '2005/06/03', gender: 'MALE', phone_number: '9611453982' },
  { name: 'Dhanush Shettigar', age_category: '15-18', aadhar_number: '625206039341', date_of_birth: '2006/09/30', gender: 'MALE', phone_number: '9945904393' },
  { name: 'Gautham Shettigar', age_category: '15-18', aadhar_number: '547462077719', date_of_birth: '2004/03/18', gender: 'MALE', phone_number: '6361426743' },
  { name: 'Mithun Chandra', age_category: '15-18', aadhar_number: '703932842621', date_of_birth: '2004/12/04', gender: 'MALE', phone_number: '7760294044' },
  { name: 'Sathwik G Shettigar', age_category: '15-18', aadhar_number: '897814016579', date_of_birth: '2004/07/06', gender: 'MALE', phone_number: '9611321384' },
  { name: 'Shivaprasad Shettigar', age_category: '15-18', aadhar_number: '762004777903', date_of_birth: '2007/02/16', gender: 'MALE', phone_number: '8197834501' },
  { name: 'Chithra J', age_category: '15-18', aadhar_number: '217914935383', date_of_birth: '2004/08/20', gender: 'FEMALE', phone_number: '9844247322' },
  { name: 'Harshitha R shettigar', age_category: '15-18', aadhar_number: '914548846370', date_of_birth: '2005/02/20', gender: 'FEMALE', phone_number: '7975581997' },
  { name: 'Manasa Shettigar', age_category: '15-18', aadhar_number: '566659940229', date_of_birth: '2007/03/03', gender: 'FEMALE', phone_number: '9900829958' },
  { name: 'Pallavi J.S', age_category: '15-18', aadhar_number: '229197155907', date_of_birth: '2005/09/05', gender: 'FEMALE', phone_number: '9844247322' },
  { name: 'Sameeksha Shettigar', age_category: '15-18', aadhar_number: '347543802824', date_of_birth: '2007/11/19', gender: 'FEMALE', phone_number: '9741426497' },
  { name: 'Shilpa shettigar', age_category: '15-18', aadhar_number: '807297076062', date_of_birth: '2005/09/15', gender: 'FEMALE', phone_number: '9844247322' },
  { name: 'Thejashree Thejashree', age_category: '15-18', aadhar_number: '336744318416', date_of_birth: '2005/08/13', gender: 'FEMALE', phone_number: '7736897428' },
  { name: 'Vaishnavi Vaishnavi', age_category: '15-18', aadhar_number: '976430400322', date_of_birth: '2004/06/24', gender: 'FEMALE', phone_number: '08792875101' },
  { name: 'Vikhyathi Shettigar', age_category: '15-18', aadhar_number: '745192235391', date_of_birth: '2006/11/25', gender: 'FEMALE', phone_number: '9901320971' },
  { name: 'Chirag Shettigar', age_category: '19-24', aadhar_number: '844306486515', date_of_birth: '2001/07/13', gender: 'MALE', phone_number: '9686732745' },
  { name: 'Jayaraj Shettigar', age_category: '19-24', aadhar_number: '523946935944', date_of_birth: '2002/11/15', gender: 'MALE', phone_number: '7795113374' },
  { name: 'Pavan Shettigar', age_category: '19-24', aadhar_number: '290640416127', date_of_birth: '2003/11/19', gender: 'MALE', phone_number: '7619649839' },
  { name: 'Pradeep kumar Shettigar', age_category: '19-24', aadhar_number: '503688532269', date_of_birth: '2000/12/20', gender: 'MALE', phone_number: '9164841236' },
  { name: 'Thejesha Shettigar', age_category: '19-24', aadhar_number: '984689505069', date_of_birth: '2001/04/18', gender: 'MALE', phone_number: '7996855963' },
  { name: 'Uttam Shettigar', age_category: '19-24', aadhar_number: '774642957383', date_of_birth: '1999/06/12', gender: 'MALE', phone_number: '9741047829' },
  { name: 'varshith shettigar', age_category: '19-24', aadhar_number: '954004865516', date_of_birth: '1999/07/10', gender: 'MALE', phone_number: '9008984206' },
  { name: 'Akshatha .', age_category: '19-24', aadhar_number: '755609761713', date_of_birth: '1998/01/17', gender: 'FEMALE', phone_number: '9880965695' },
  { name: 'Deeksha Shettigar', age_category: '19-24', aadhar_number: '281990742703', date_of_birth: '2000/11/29', gender: 'FEMALE', phone_number: '9663206119' },
  { name: 'Deeksha Shettigar', age_category: '19-24', aadhar_number: '227965948898', date_of_birth: '1999/11/20', gender: 'FEMALE', phone_number: '9483919819' },
  { name: 'Dhanya Shree', age_category: '19-24', aadhar_number: '230584423576', date_of_birth: '2000/05/29', gender: 'FEMALE', phone_number: '9980277478' },
  { name: 'Keerthana Shettigsr', age_category: '19-24', aadhar_number: '919659670597', date_of_birth: '2003/05/05', gender: 'FEMALE', phone_number: '9110289364' },
  { name: 'Kiran K', age_category: '25-35', aadhar_number: '940941177949', date_of_birth: '1996/09/06', gender: 'MALE', phone_number: '7022055271' },
  { name: 'Prashanth Shettigar', age_category: '25-35', aadhar_number: '616090583280', date_of_birth: '1996/11/13', gender: 'MALE', phone_number: '7760822789' },
  { name: 'Sharath Kumar', age_category: '25-35', aadhar_number: '354027677613', date_of_birth: '1993/01/12', gender: 'MALE', phone_number: '9535268398' },
  { name: 'Shiva prasad', age_category: '25-35', aadhar_number: '435148153444', date_of_birth: '1987/12/25', gender: 'MALE', phone_number: '09844168072' },
  { name: 'Vasantha Shettigar', age_category: '25-35', aadhar_number: '961052919965', date_of_birth: '1996/11/16', gender: 'MALE', phone_number: '9611982315' },
  { name: 'Bhuvaneshwari Shettigar', age_category: '25-35', aadhar_number: '571370634073', date_of_birth: '1991/09/17', gender: 'FEMALE', phone_number: '9740794919' },
  { name: 'Lakshmi Shettigar', age_category: '25-35', aadhar_number: '516422146075', date_of_birth: '1996/06/21', gender: 'FEMALE', phone_number: '9686240449' },
  { name: 'Padmini Shettigar', age_category: '25-35', aadhar_number: '494513425561', date_of_birth: '1992/03/19', gender: 'FEMALE', phone_number: '8762156561' },
  { name: 'Yogeshwari Shettigar', age_category: '25-35', aadhar_number: '566888257416', date_of_birth: '1987/03/22', gender: 'FEMALE', phone_number: '9945836084' },
  { name: 'Padmaraja Shettigar', age_category: '36-48', aadhar_number: '232386760817', date_of_birth: '1985/12/06', gender: 'MALE', phone_number: '9980292848' },
  { name: 'Prakash Shettigar', age_category: '36-48', aadhar_number: '542321069037', date_of_birth: '1979/06/01', gender: 'MALE', phone_number: '97414 26497' },
  { name: 'Rajesh Shettigar', age_category: '36-48', aadhar_number: '581780317732', date_of_birth: '1984/10/11', gender: 'MALE', phone_number: '97411 05853' },
  { name: 'Mohini s', age_category: '36-48', aadhar_number: '587944567316', date_of_birth: '1981/09/15', gender: 'FEMALE', phone_number: '9844247322' },
  { name: 'Nayana k', age_category: '36-48', aadhar_number: '680600017899', date_of_birth: '1983/05/27', gender: 'FEMALE', phone_number: '9844247322' },
  { name: 'Srinivas Shettigar', age_category: '49-60', aadhar_number: '950778835948', date_of_birth: '1972/06/02', gender: 'MALE', phone_number: '9902798853' },
  { name: 'Surendra s', age_category: '49-60', aadhar_number: '288603711813', date_of_birth: '1972/07/24', gender: 'MALE', phone_number: '9844247322' },
];

const Participantslist = () => {
  const [selectedAgeCategory, setSelectedAgeCategory] = useState('');
  const [selectedGender, setSelectedGender] = useState('');

  const filteredParticipants = participantsList.filter(participant => {
    return (selectedAgeCategory === '' || participant.age_category === selectedAgeCategory) &&
           (selectedGender === '' || participant.gender === selectedGender);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h4 className="text-center text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-blue-800">30ನೇ ಪದ್ಮಶಾಲಿ ಕ್ರೀಡೋತ್ಸವ , 2022</h4>
        <div className="mb-6 sm:mb-10">
          <h4 className="text-center text-lg sm:text-xl font-semibold mb-4 text-purple-700">templename</h4>
          
          {/* Filters Section */}
          <div className="mb-4 flex flex-col sm:flex-row gap-4 sm:space-x-4">
            <select
              value={selectedAgeCategory}
              onChange={(e) => setSelectedAgeCategory(e.target.value)}
              className="w-full sm:w-auto p-2 border rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            >
              <option value="">All Age Categories</option>
              <option value="0-5">0-5</option>
              <option value="6-10">6-10</option>
              <option value="11-14">11-14</option>
              <option value="15-18">15-18</option>
              <option value="19-24">19-24</option>
              <option value="25-35">25-35</option>
              <option value="36-48">36-48</option>
              <option value="49-60">49-60</option>
              <option value="61-90">61-90</option>
            </select>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full sm:w-auto p-2 border rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            >
              <option value="">All Genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>

          {/* Table Section */}
          <div className="w-full overflow-x-auto rounded-xl shadow-lg bg-white">
            <div className="min-w-full inline-block align-middle">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-blue-200">
                  <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <tr>
                      <th scope="col" className="px-3 sm:px-4 py-2 text-xs font-bold text-white uppercase tracking-wider">SL.NO</th>
                      <th scope="col" className="px-3 sm:px-4 py-2 text-xs font-bold text-white uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-3 sm:px-4 py-2 text-xs font-bold text-white uppercase tracking-wider">Category</th>
                      <th scope="col" className="px-3 sm:px-4 py-2 text-xs font-bold text-white uppercase tracking-wider">Aadhar No</th>
                      <th scope="col" className="px-3 sm:px-4 py-2 text-xs font-bold text-white uppercase tracking-wider">DOB</th>
                      <th scope="col" className="px-3 sm:px-4 py-2 text-xs font-bold text-white uppercase tracking-wider">Gender</th>
                      <th scope="col" className="px-3 sm:px-4 py-2 text-xs font-bold text-white uppercase tracking-wider">Phone No</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-blue-100">
                    {filteredParticipants.map((participant, idx) => (
                      <tr key={idx} className="hover:bg-blue-50 transition">
                        <td className="px-3 sm:px-4 py-2 whitespace-nowrap text-sm font-semibold text-blue-900">{idx + 1}</td>
                        <td className="px-3 sm:px-4 py-2 whitespace-nowrap text-sm text-gray-900">{participant.name}</td>
                        <td className="px-3 sm:px-4 py-2 whitespace-nowrap text-sm text-gray-900">{participant.age_category}</td>
                        <td className="px-3 sm:px-4 py-2 whitespace-nowrap text-sm text-gray-900">{participant.aadhar_number}</td>
                        <td className="px-3 sm:px-4 py-2 whitespace-nowrap text-sm text-gray-900">{participant.date_of_birth}</td>
                        <td className="px-3 sm:px-4 py-2 whitespace-nowrap text-sm text-gray-900">{participant.gender}</td>
                        <td className="px-3 sm:px-4 py-2 whitespace-nowrap text-sm text-gray-900">{participant.phone_number}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Participantslist