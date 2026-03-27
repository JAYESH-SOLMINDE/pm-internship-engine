/**
 * Resume Parser Utility — PM Internship Scheme
 * utils/resumeParser.js
 *
 * Uses pdf-parse to extract text from PDF resumes,
 * then applies keyword-based NLP to detect skills.
 */

const pdfParse = require('pdf-parse');
const fs = require('fs');

// ─── Skill Keywords Dictionary ────────────────────────────────────────────────
// Covers tech, business, and vocational domains relevant to PM Internship sectors

const SKILL_KEYWORDS = {
  // Programming & Tech
  'Python': ['python'],
  'Java': ['java'],
  'JavaScript': ['javascript', 'js'],
  'TypeScript': ['typescript'],
  'C++': ['c++', 'cpp'],
  'C': [' c ', 'c programming'],
  'SQL': ['sql', 'mysql', 'postgresql', 'sqlite'],
  'MongoDB': ['mongodb', 'nosql'],
  'React': ['react', 'reactjs', 'react.js'],
  'Node.js': ['node.js', 'nodejs', 'node js'],
  'HTML/CSS': ['html', 'css'],
  'Git': ['git', 'github', 'version control'],
  'Linux': ['linux', 'unix', 'bash', 'shell scripting'],
  'AWS': ['aws', 'amazon web services', 'ec2', 's3'],
  'Docker': ['docker', 'containerization'],
  'Machine Learning': ['machine learning', 'ml', 'sklearn', 'scikit'],
  'Deep Learning': ['deep learning', 'neural network', 'tensorflow', 'pytorch'],
  'Data Analysis': ['data analysis', 'data analytics', 'pandas', 'numpy'],
  'Power BI': ['power bi', 'powerbi', 'tableau', 'data visualization'],
  'Excel': ['excel', 'spreadsheet', 'vlookup', 'pivot table'],

  // Finance & Business
  'Accounting': ['accounting', 'tally', 'bookkeeping', 'gst', 'taxation'],
  'Financial Modeling': ['financial modeling', 'financial analysis', 'dcf', 'valuation'],
  'Tally': ['tally', 'tally erp'],
  'MS Office': ['ms office', 'microsoft office', 'word', 'powerpoint', 'outlook'],
  'SAP': ['sap', 'sap erp', 'sap hana'],

  // Engineering & Manufacturing
  'AutoCAD': ['autocad', 'cad', 'solidworks', 'catia'],
  'MATLAB': ['matlab', 'simulink'],
  'Circuit Design': ['circuit design', 'pcb', 'vhdl', 'embedded systems'],
  'Quality Control': ['quality control', 'qc', 'six sigma', 'lean manufacturing', 'iso'],
  'Project Management': ['project management', 'pmp', 'agile', 'scrum', 'kanban'],

  // Soft Skills
  'Communication': ['communication', 'presentation', 'public speaking'],
  'Leadership': ['leadership', 'team lead', 'managed a team'],
  'Research': ['research', 'literature review', 'survey'],
  'Problem Solving': ['problem solving', 'analytical thinking', 'critical thinking'],

  // Languages
  'English': ['english'],
  'Hindi': ['hindi'],

  // Government/Policy
  'Policy Analysis': ['policy', 'governance', 'public policy', 'regulatory'],
  'GIS': ['gis', 'geographic information', 'mapping', 'qgis'],
};

// ─── Core Parser Function ─────────────────────────────────────────────────────

/**
 * parseResume — Extracts text from PDF and detects skill keywords.
 *
 * @param {string} filePath — Absolute path to the uploaded PDF
 * @returns {Object} { text, detectedSkills, wordCount }
 */
const parseResume = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    const rawText = data.text.toLowerCase();
    const detectedSkills = [];

    // ── Keyword Matching ───────────────────────────────────────────
    for (const [skillName, keywords] of Object.entries(SKILL_KEYWORDS)) {
      const matched = keywords.some(kw => rawText.includes(kw));
      if (matched && !detectedSkills.includes(skillName)) {
        detectedSkills.push(skillName);
      }
    }

    // ── Deduplicate ────────────────────────────────────────────────
    const uniqueSkills = [...new Set(detectedSkills)];

    return {
      success: true,
      text: data.text.substring(0, 500), // Return snippet for debugging
      detectedSkills: uniqueSkills,
      wordCount: rawText.split(/\s+/).length,
      pageCount: data.numpages,
    };
  } catch (err) {
    console.error('Resume parsing error:', err.message);
    return {
      success: false,
      detectedSkills: [],
      error: err.message,
    };
  }
};

module.exports = { parseResume };
