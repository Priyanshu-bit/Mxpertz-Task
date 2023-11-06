// jobSearchService.js
const axios = require('axios');

const options = {
  method: 'GET',
  url: 'https://jsearch.p.rapidapi.com/search',
  params: {
    query: 'Python developer in Texas, USA',
    page: '1',
    num_pages: '1'
  },
  headers: {
    'X-RapidAPI-Key': '47cf0ce129msh5ed8407b5cbfadbp1703efjsn6d6598d0806f',
    'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
  }
};

const fetchJobListings = async () => {
  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error('Error fetching job listings:', error);
    return null;
  }
};

module.exports = { fetchJobListings };
