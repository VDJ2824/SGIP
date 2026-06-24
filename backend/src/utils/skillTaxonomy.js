function entry(canonicalName, category, aliases = [], parentConcepts = [], relatedSkills = []) {
  return { canonicalName, category, aliases, parentConcepts, relatedSkills };
}

export const skillTaxonomy = [
  entry('Python', 'Programming', ['python']),
  entry('Java', 'Programming', ['java']),
  entry('C', 'Programming', ['c language']),
  entry('C++', 'Programming', ['cpp', 'c plus plus']),
  entry('JavaScript', 'Programming', ['javascript', 'js']),
  entry('SQL', 'Database', ['sql', 'structured query language'], ['database', 'relational database'], ['mysql', 'postgresql', 'sqlite', 'mariadb', 'sql server', 'oracle sql']),
  entry('HTML', 'Frontend', ['html', 'html5']),
  entry('CSS', 'Frontend', ['css', 'css3']),
  entry('React', 'Frontend', ['react', 'react.js', 'reactjs'], ['frontend']),
  entry('Tailwind CSS', 'Frontend', ['tailwind', 'tailwindcss', 'tailwind css'], ['css']),
  entry('Bootstrap', 'Frontend', ['bootstrap'], ['css']),
  entry('Node.js', 'Backend', ['node', 'nodejs', 'node.js'], ['backend', 'javascript']),
  entry('Express.js', 'Backend', ['express', 'expressjs', 'express.js'], ['backend framework', 'backend', 'node.js']),
  entry('Flask', 'Backend', ['flask'], ['backend framework', 'backend', 'python']),
  entry('Django', 'Backend', ['django'], ['backend framework', 'backend', 'python']),
  entry('REST API', 'Backend', ['rest api', 'rest apis', 'restful api', 'restful apis'], ['backend']),
  entry('Backend Framework', 'Backend', ['backend framework', 'web framework'], ['backend'], ['flask', 'django', 'express.js']),
  entry('MySQL', 'Database', ['mysql'], ['sql', 'database', 'relational database']),
  entry('PostgreSQL', 'Database', ['postgresql', 'postgres'], ['sql', 'database', 'relational database']),
  entry('MongoDB', 'Database', ['mongodb', 'mongo'], ['database']),
  entry('Firebase', 'Database', ['firebase'], ['database', 'cloud computing']),
  entry('SQLite', 'Database', ['sqlite', 'sqlite3'], ['sql', 'database', 'relational database']),
  entry('Cloud Computing', 'Cloud', ['cloud', 'cloud computing'], [], ['aws', 'azure', 'gcp', 'firebase']),
  entry('AWS', 'Cloud', ['aws', 'amazon web services'], ['cloud computing']),
  entry('Azure', 'Cloud', ['azure', 'microsoft azure'], ['cloud computing']),
  entry('GCP', 'Cloud', ['gcp', 'google cloud', 'google cloud platform'], ['cloud computing']),
  entry('Artificial Intelligence', 'Data/AI', ['ai', 'artificial intelligence']),
  entry('Machine Learning', 'Data/AI', ['ml', 'machine learning'], ['artificial intelligence', 'data science'], ['scikit-learn', 'tensorflow', 'pytorch', 'xgboost']),
  entry('Data Science', 'Data/AI', ['data science'], ['data analysis', 'artificial intelligence']),
  entry('Data Analysis', 'Data/AI', ['data analysis', 'data analytics'], ['data science']),
  entry('Data Visualization', 'Data/AI', ['data visualization', 'data visualisation', 'visualization', 'visualisation'], ['data analysis'], ['matplotlib', 'seaborn', 'tableau', 'power bi']),
  entry('NumPy', 'Data/AI', ['numpy'], ['data analysis', 'python']),
  entry('Pandas', 'Data/AI', ['pandas'], ['data analysis', 'python']),
  entry('Scikit-learn', 'Data/AI', ['scikit-learn', 'scikit learn', 'sklearn'], ['machine learning', 'data science']),
  entry('TensorFlow', 'Data/AI', ['tensorflow'], ['machine learning', 'artificial intelligence']),
  entry('PyTorch', 'Data/AI', ['pytorch'], ['machine learning', 'artificial intelligence']),
  entry('Matplotlib', 'Data/AI', ['matplotlib'], ['data visualization', 'data analysis']),
  entry('Seaborn', 'Data/AI', ['seaborn'], ['data visualization', 'data analysis']),
  entry('Power BI', 'Data/AI', ['power bi', 'powerbi'], ['data visualization', 'data analysis']),
  entry('Tableau', 'Data/AI', ['tableau'], ['data visualization', 'data analysis']),
  entry('NLP', 'Data/AI', ['nlp', 'natural language processing'], ['artificial intelligence', 'machine learning']),
  entry('Computer Vision', 'Data/AI', ['computer vision', 'cv'], ['artificial intelligence'], ['opencv', 'face recognition']),
  entry('Face Recognition', 'Data/AI', ['face recognition', 'facial recognition', 'face-recognition'], ['computer vision', 'artificial intelligence']),
  entry('Version Control', 'Tools', ['version control'], [], ['git', 'github']),
  entry('Git', 'Tools', ['git'], ['version control']),
  entry('GitHub', 'Tools', ['github'], ['version control', 'git']),
  entry('VS Code', 'Tools', ['vs code', 'visual studio code', 'vscode']),
  entry('Postman', 'Tools', ['postman'], ['api testing']),
  entry('Docker', 'Tools', ['docker'], ['containerization', 'devops']),
  entry('Resume Parsing', 'Application/Domain', ['resume parsing', 'resume parser'], ['nlp']),
  entry('Job Description Parsing', 'Application/Domain', ['job description parsing', 'jd parsing'], ['nlp']),
  entry('Skill Extraction', 'Application/Domain', ['skill extraction'], ['nlp']),
  entry('Skill Normalization', 'Application/Domain', ['skill normalization', 'skill normalisation']),
  entry('Gap Analysis', 'Application/Domain', ['gap analysis', 'skill gap analysis']),
  entry('Recommendation System', 'Application/Domain', ['recommendation system', 'recommender system']),
  entry('Email Alerts', 'Application/Domain', ['email alerts', 'email notifications']),
  entry('GUI', 'Application/Domain', ['gui', 'graphical user interface']),
  entry('Question Generation', 'Application/Domain', ['question generation']),
  entry('Answer Evaluation', 'Application/Domain', ['answer evaluation', 'answer assessment']),
  entry('Difficulty Adjustment', 'Application/Domain', ['difficulty adjustment', 'adaptive difficulty']),
];

export function taxonomyKey(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/c\+\+/g, 'cpp')
    .replace(/node\.?js/g, 'nodejs')
    .replace(/express\.?js/g, 'expressjs')
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .replace(/[\s-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const taxonomyByKey = new Map();
for (const item of skillTaxonomy) {
  const keys = [item.canonicalName, ...item.aliases];
  for (const key of keys) taxonomyByKey.set(taxonomyKey(key), item);
}

export function findTaxonomySkill(value = '') {
  return taxonomyByKey.get(taxonomyKey(value)) || null;
}

