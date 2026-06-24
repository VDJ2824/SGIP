const resourceCatalog = {
  sql: ['SQLBolt', 'PostgreSQL Tutorial', 'W3Schools SQL'],
  python: ['Official Python Documentation', 'Real Python'],
  docker: ['Docker Documentation', 'Docker Getting Started'],
  'machine_learning': ['Scikit-learn User Guide', 'Google Machine Learning Crash Course'],
  'power_bi': ['Microsoft Learn Power BI', 'Power BI Guided Learning'],
  aws: ['AWS Skill Builder', 'AWS Documentation'],
  default: ['Official documentation', 'freeCodeCamp', 'Coursera guided project'],
};

const projectCatalog = {
  sql: ['Mini Library Database'],
  python: ['Automation CLI or data analysis notebook'],
  docker: ['Containerize and deploy a web API'],
  'machine_learning': ['House Price Prediction'],
  'power_bi': ['Sales Dashboard'],
  aws: ['Deploy a Flask Application'],
  default: ['Build one portfolio-ready mini project'],
};

function key(skill = '') {
  return String(skill).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function resourcesFor(skill) {
  return resourceCatalog[key(skill)] || resourceCatalog.default;
}

export function projectsFor(skill) {
  return projectCatalog[key(skill)] || projectCatalog.default;
}
