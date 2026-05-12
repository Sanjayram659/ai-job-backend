const axios = require("axios");

// Basic version (extend later)
async function searchJobs({ role, location }) {
  // Placeholder (replace with API or scraping later)
  return [
    {
      title: role,
      company: "Sample Company",
      link: "https://example.com/job"
    }
  ];
}

module.exports = { searchJobs };