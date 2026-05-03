// storage.js - Saving and exporting data
let savedJobs = [];

function saveJob(job) {
  savedJobs.push(job);
  localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
}

function loadSavedJobs() {
  savedJobs = JSON.parse(localStorage.getItem('savedJobs')) || [];
}

export { saveJob, loadSavedJobs };
