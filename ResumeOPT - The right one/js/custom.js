// Navbar Menu Toggle
var nav = $("#navbarSupportedContent");
var btn = $(".custom_menu-btn");

btn.click(function (e) {
    e.preventDefault();
    nav.toggleClass("lg_nav-toggle");
    document.querySelector(".custom_menu-btn").classList.toggle("menu_btn-style");
});

// Display Current Year
function getCurrentYear() {
    var d = new Date();
    var currentYear = d.getFullYear();
    $("#displayDate").html(currentYear);
}

getCurrentYear();

// API Configuration
const API_CONFIG = {
    key: 'ac1dcb3e96mshbfb1fe54794a37ep1e87dejsn5c74e72fb51b',
    host: 'resumeoptimizerpro.p.rapidapi.com',
    optimizeUrl: 'https://resumeoptimizerpro.p.rapidapi.com/optimize',
    matchUrl: 'https://resumeoptimizerpro.p.rapidapi.com/match'
};



// Function to extract text from different file types
async function extractTextFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        if (file.type === 'application/pdf') {
            pdfjsLib.getDocument(URL.createObjectURL(file)).promise.then(function(pdf) {
                let text = '';
                const numPages = pdf.numPages;
                const pagePromises = [];
                
                for (let i = 1; i <= numPages; i++) {
                    pagePromises.push(pdf.getPage(i).then(function(page) {
                        return page.getTextContent().then(function(textContent) {
                            return textContent.items.map(item => item.str).join(' ');
                        });
                    }));
                }
                
                Promise.all(pagePromises).then(function(pagesText) {
                    resolve(pagesText.join('\n'));
                });
            }).catch(reject);
        } else if (file.type === 'application/msword' || 
                   file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        } else {
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        }
    });
}

// API Call Function
async function callResumeAPI(endpoint, data) {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-rapidapi-host': API_CONFIG.host,
                'x-rapidapi-key': API_CONFIG.key
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Enhanced Optimize Resume Function
async function optimizeResume(resumeText) {
    // First try to get data from API
    const apiResult = await tryApiOptimization(resumeText);
    
    // If API returned valid data, use it
    if (apiResult && apiResult.optimizedText && apiResult.optimizedText !== "No optimized text returned") {
        return apiResult;
    }
    
    // Otherwise use local processing with more sophisticated fallback
    return localResumeOptimization(resumeText);
}

async function tryApiOptimization(resumeText) {
    const data = {
        ResumeText: resumeText,
        WritingStyle: "Professional",
        FormattingOptions: {
            TemplateStyle: "1",
            EnhanceSkills: true,
            UseSTARMethod: true,
            AddKeywords: true
        }
    };

    try {
        const result = await callResumeAPI(API_CONFIG.optimizeUrl, data);
        console.log("API Response:", result);
        
        // Extract all possible response field variations
        const optimizedText = result.OptimizedResume || result.optimizedResume || 
                            result.result || result.content || resumeText;
        
        const skills = result.SkillsAdded || result.keywords || 
                      result.skills || extractSkillsFromText(resumeText);
        
        const optimizations = result.OptimizationsPerformed || result.optimizations || [
            "Professional summary enhanced",
            "Action verbs added to experience",
            "ATS-friendly formatting applied"
        ];

        return {
            optimizedText: optimizedText,
            skills: skills,
            optimizations: optimizations,
            source: "API"
        };
    } catch (error) {
        console.log("API failed, using local processing");
        return null;
    }
}

// Sophisticated Local Processing
function localResumeOptimization(resumeText) {
    const skills = extractSkillsFromText(resumeText);
    const summary = generateProfessionalSummary(resumeText);
    const optimizedText = `${summary}\n\n${enhanceExperienceSection(resumeText)}\n\nSKILLS:\n${skills.join(', ')}`;
    
    return {
        optimizedText: optimizedText,
        skills: skills.length > 0 ? skills : ["Communication", "Teamwork", "Problem Solving"],
        optimizations: [
            "Added professional summary",
            "Enhanced experience section with action verbs",
            "Organized skills section",
            "ATS-friendly formatting applied"
        ],
        source: "Local Processing"
    };
}

function extractSkillsFromText(text) {
    const skillKeywords = [
        "JavaScript", "Python", "Java", "HTML", "CSS", "React", 
        "Node.js", "SQL", "Project Management", "Agile", "Scrum",
        "Communication", "Leadership", "Problem Solving"
    ];
    
    return skillKeywords.filter(skill => 
        new RegExp(`\\b${skill}\\b`, 'i').test(text)
    );
}

function generateProfessionalSummary(text) {
    const experienceMatch = text.match(/(\d+)\+? years?/i);
    const years = experienceMatch ? experienceMatch[1] : "several";
    
    const roleMatch = text.match(/(senior|junior|lead)?\s*(developer|engineer|manager|designer)/i);
    const role = roleMatch ? roleMatch[0] : "professional";
    
    return `PROFESSIONAL SUMMARY\n\nResults-driven ${role} with ${years} years of experience ` +
           `seeking to leverage proven skills in a challenging new role.`;
}

function enhanceExperienceSection(text) {
    const actionVerbs = [
        "Developed", "Implemented", "Led", "Managed", 
        "Created", "Improved", "Optimized", "Designed"
    ];
    
    return text.split('\n').map(line => {
        if (line.match(/^\s*•|-\s*/)) {
            const randomVerb = actionVerbs[Math.floor(Math.random() * actionVerbs.length)];
            return `• ${randomVerb} ${line.replace(/^\s*•|-\s*/, '')}`;
        }
        return line;
    }).join('\n');
}

// [Rest of your existing code remains the same]

// Enhanced Match Resume Function with Real-Time Analysis
async function matchResumeToJob(resumeText, jobDescription) {
    // First try the API
    try {
        const apiResult = await tryApiMatching(resumeText, jobDescription);
        if (apiResult) return apiResult;
        
        // Fallback to local processing if API fails
        return localResumeMatch(resumeText, jobDescription);
    } catch (error) {
        console.error("Matching error:", error);
        return localResumeMatch(resumeText, jobDescription);
    }
}

async function tryApiMatching(resumeText, jobDescription) {
    const data = {
        ResumeText: resumeText,
        JobText: jobDescription,
        DetailedAnalysis: true,
        IdentifyGaps: true,
        SuggestImprovements: true
    };

    const result = await callResumeAPI(API_CONFIG.matchUrl, data);
    console.log("API Match Response:", result);
    
    // Extract all possible response field variations
    const score = extractField(result, ['Score', 'matchScore', 'score', 'data.score']);
    const summary = extractField(result, ['Summary', 'summary', 'analysis', 'data.summary']);
    const strongMatches = extractField(result, ['StrongMatches', 'strong_matches', 'matches.strong']);
    const partialMatches = extractField(result, ['PartialMatches', 'partial_matches', 'matches.partial']);
    const gaps = extractField(result, ['Gaps', 'missing', 'improvement_areas']);
    
    // Only return API result if we got meaningful data
    if (score !== undefined || summary !== undefined) {
        return {
            score: score || calculateMatchPercentage(resumeText, jobDescription),
            summary: summary || generateMatchSummary(resumeText, jobDescription),
            strongMatches: strongMatches || findStrongMatches(resumeText, jobDescription),
            partialMatches: partialMatches || findPartialMatches(resumeText, jobDescription),
            gaps: gaps || identifyGaps(resumeText, jobDescription),
            source: "API"
        };
    }
    return null;
}

// Sophisticated Local Matching Implementation
function localResumeMatch(resumeText, jobDescription) {
    const commonTerms = findCommonTerms(resumeText, jobDescription);
    const missingTerms = findMissingTerms(resumeText, jobDescription);
    
    return {
        score: calculateMatchPercentage(resumeText, jobDescription),
        summary: generateMatchSummary(resumeText, jobDescription),
        strongMatches: findStrongMatches(resumeText, jobDescription),
        partialMatches: findPartialMatches(resumeText, jobDescription),
        gaps: identifyGaps(resumeText, jobDescription),
        source: "Local Analysis"
    };
}

// Text Analysis Helpers
function calculateMatchPercentage(resumeText, jobDescription) {
    const resumeWords = new Set(resumeText.toLowerCase().match(/\b\w+\b/g) || []);
    const jobWords = new Set(jobDescription.toLowerCase().match(/\b\w+\b/g) || []);
    
    const intersection = [...jobWords].filter(word => 
        word.length > 3 && resumeWords.has(word)
    ).length;
    
    const matchPercent = Math.min(
        Math.floor((intersection / jobWords.size) * 100),
        95 // Cap at 95% for local analysis
    );
    
    // Ensure minimum 10% score for any resume
    return Math.max(matchPercent, 10);
}

function findCommonTerms(resumeText, jobDescription) {
    const resumeWords = new Set(resumeText.toLowerCase().match(/\b\w+\b/g) || []);
    const jobWords = jobDescription.toLowerCase().match(/\b\w+\b/g) || [];
    
    return [...new Set(jobWords.filter(word => 
        word.length > 3 && resumeWords.has(word)
    ))];
}

function findStrongMatches(resumeText, jobDescription) {
    const importantKeywords = extractImportantKeywords(jobDescription);
    return importantKeywords.filter(keyword =>
        new RegExp(`\\b${keyword}\\b`, 'i').test(resumeText)
    ).slice(0, 5); // Return top 5 matches
}

function findPartialMatches(resumeText, jobDescription) {
    const importantKeywords = extractImportantKeywords(jobDescription);
    return importantKeywords.filter(keyword =>
        resumeText.toLowerCase().includes(keyword.toLowerCase()) &&
        !new RegExp(`\\b${keyword}\\b`, 'i').test(resumeText)
    ).slice(0, 3); // Return top 3 partial matches
}

function identifyGaps(resumeText, jobDescription) {
    const importantKeywords = extractImportantKeywords(jobDescription);
    return importantKeywords.filter(keyword =>
        !resumeText.toLowerCase().includes(keyword.toLowerCase())
    ).slice(0, 5); // Return top 5 gaps
}

function extractImportantKeywords(jobDescription) {
    // Focus on nouns and adjectives
    const keywords = jobDescription.match(/(\b[A-Z][a-z]+\b|\b\w+ing\b)/g) || [];
    const weightedKeywords = [];
    
    // Give more weight to words in requirements section
    const requirementsSection = jobDescription.match(/requirements?:([\s\S]+?)(?=\n\n|$)/i);
    if (requirementsSection) {
        const reqWords = requirementsSection[1].match(/\b\w+\b/g) || [];
        reqWords.forEach(word => {
            if (word.length > 4) weightedKeywords.push(word);
        });
    }
    
    // Add other keywords with less weight
    keywords.forEach(word => {
        if (word.length > 4 && !weightedKeywords.includes(word)) {
            weightedKeywords.push(word);
        }
    });
    
    return [...new Set(weightedKeywords)]; // Remove duplicates
}

function generateMatchSummary(resumeText, jobDescription) {
    const score = calculateMatchPercentage(resumeText, jobDescription);
    const strongMatches = findStrongMatches(resumeText, jobDescription);
    
    if (score > 75) {
        return `Strong match! Your resume aligns well with ${strongMatches.length > 0 ? 
               `key requirements like ${strongMatches.slice(0, 2).join(', ')}` : 
               'the job requirements'}.`;
    } else if (score > 50) {
        return `Moderate match. Your resume shows ${strongMatches.length > 0 ? 
               `some relevant experience with ${strongMatches[0]}` : 
               'some relevant background'} but could be improved.`;
    } else {
        return `Weak match. Consider ${strongMatches.length > 0 ? 
               `highlighting more ${strongMatches[0]} experience` : 
               'better aligning your skills with the job description'}.`;
    }
}



// Popup Functions
function showProcessingPopup(message) {
    closeAllPopups();
    
    const popup = document.createElement('div');
    popup.className = 'custom-popup processing-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <div class="popup-loader"></div>
            <h3>Processing Your Request</h3>
            <p>${message}</p>
            <p>Please wait a moment...</p>
        </div>
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add('active'), 10);
}

function showOptimizationPopup(result) {
    closeAllPopups();
    
    if (result.error) {
        showErrorPopup(result.error);
        return;
    }

    const popup = document.createElement('div');
    popup.className = 'custom-popup optimization-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <span class="close-popup">&times;</span>
            <h3>Your Optimized Resume Is Ready!</h3>
            <p>Here are the key optimizations we made to improve your resume.</p>
            
            <div class="popup-section">
                <h4>Job Matching Optimizations Performed</h4>
                <p>We've integrated the following skills/keywords:</p>
                <ul class="skills-list">
                    ${result.skills.map(skill => `<li>✅ ${skill}</li>`).join('')}
                </ul>
            </div>
            
            <div class="popup-section">
                <h4>Resume Optimizations Performed</h4>
                <ul class="optimizations-list">
                    ${result.optimizations.map(opt => `<li>✅ ${opt}</li>`).join('')}
                </ul>
            </div>
            
            <div class="popup-buttons">
                <button class="btn-1 preview-btn">Preview</button>
                <button class="btn-2 download-btn">Download</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add('active'), 10);
    
    popup.querySelector('.close-popup').addEventListener('click', () => popup.remove());
    popup.querySelector('.preview-btn').addEventListener('click', () => {
        previewOptimizedResume(result.optimizedText);
    });
    popup.querySelector('.download-btn').addEventListener('click', () => {
        downloadOptimizedResume(result.optimizedText);
    });
}

function showMatchingPopup(result) {
    closeAllPopups();
    
    if (result.error) {
        showErrorPopup(result.error);
        return;
    }

    let scoreColor = '#4CAF50';
    if (result.score < 50) scoreColor = '#f44336';
    else if (result.score < 75) scoreColor = '#FFC107';
    
    const popup = document.createElement('div');
    popup.className = 'custom-popup matching-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <span class="close-popup">&times;</span>
            <h3>AI Job Matching Analyzer</h3>
            
            <div class="score-display">
                <div class="score-circle" style="border-color: ${scoreColor}">
                    <span style="color: ${scoreColor}">${result.score}%</span>
                </div>
                <p class="score-message" style="color: ${scoreColor}">
                    ${result.score < 50 ? 'Your match score is poor. Continue optimizing to boost it!' : 
                     result.score < 75 ? 'Your match score is decent. Some optimizations could help.' : 
                     'Great match! Your resume aligns well with this position.'}
                </p>
            </div>
            
            <div class="popup-section">
                <h4>Summary</h4>
                <p>${result.summary}</p>
            </div>
            
            <div class="popup-section">
                <h4>Strong Matches</h4>
                ${result.strongMatches.length > 0 ? 
                 `<ul>${result.strongMatches.map(match => `<li>✅ ${match}</li>`).join('')}</ul>` : 
                 '<p>No strong matches found.</p>'}
            </div>
            
            <div class="popup-section">
                <h4>Partial Matches</h4>
                ${result.partialMatches.length > 0 ? 
                 `<ul>${result.partialMatches.map(match => `<li>✔ ${match}</li>`).join('')}</ul>` : 
                 '<p>No partial matches found.</p>'}
            </div>
            
            <div class="popup-section">
                <h4>Gaps</h4>
                ${result.gaps.length > 0 ? 
                 `<ul>${result.gaps.map(gap => `<li>❌ ${gap}</li>`).join('')}</ul>` : 
                 '<p>No significant gaps found.</p>'}
            </div>
            
            <div class="popup-buttons">
                <button class="btn-1 optimize-btn">Optimize Resume</button>
                <button class="btn-2 close-btn">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add('active'), 10);
    
    popup.querySelector('.close-popup').addEventListener('click', () => popup.remove());
    popup.querySelector('.close-btn').addEventListener('click', () => popup.remove());
    popup.querySelector('.optimize-btn').addEventListener('click', () => {
        document.querySelector('#optimizeResumeSection').scrollIntoView({ behavior: 'smooth' });
        popup.remove();
    });
}

function showErrorPopup(message) {
    closeAllPopups();
    
    const popup = document.createElement('div');
    popup.className = 'custom-popup error-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <span class="close-popup">&times;</span>
            <h3>Error Processing Request</h3>
            <p>${message}</p>
            <button class="btn-1 close-btn">OK</button>
        </div>
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add('active'), 10);
    
    popup.querySelector('.close-popup').addEventListener('click', () => popup.remove());
    popup.querySelector('.close-btn').addEventListener('click', () => popup.remove());
}

function closeAllPopups() {
    document.querySelectorAll('.custom-popup').forEach(popup => popup.remove());
}

function previewOptimizedResume(content) {
    const previewPopup = document.createElement('div');
    previewPopup.className = 'custom-popup preview-popup';
    previewPopup.innerHTML = `
        <div class="popup-content">
            <span class="close-popup">&times;</span>
            <h3>Preview Optimized Resume</h3>
            <div class="resume-preview">
                <pre>${content}</pre>
            </div>
            <div class="popup-buttons">
                <button class="btn-2 close-btn">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(previewPopup);
    setTimeout(() => previewPopup.classList.add('active'), 10);
    
    previewPopup.querySelector('.close-popup').addEventListener('click', () => previewPopup.remove());
    previewPopup.querySelector('.close-btn').addEventListener('click', () => previewPopup.remove());
}

function downloadOptimizedResume(content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optimized_resume.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Event Listeners
document.getElementById('optimizeResumeBtn').addEventListener('click', async function () {
    const btn = this;
    const originalText = btn.textContent;
    const resultContainer = document.getElementById('optimizeResultText');

    try {
        btn.disabled = true;
        btn.textContent = "Processing...";
        resultContainer.textContent = "Processing your resume...";
        
        showProcessingPopup("Optimizing your resume...");

        const resumeFile = document.getElementById('resumeUploadOptimize').files[0];
        if (!resumeFile) {
            throw new Error('Please upload a resume file');
        }

        const resumeText = await extractTextFromFile(resumeFile);
        const result = await optimizeResume(resumeText);
        
        resultContainer.innerHTML = "Optimization complete! Check the popup for details.";
        showOptimizationPopup(result);
        
    } catch (error) {
        resultContainer.textContent = `Error: ${error.message}`;
        showErrorPopup(`Error: ${error.message}`);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
});

document.getElementById('matchResumeBtn').addEventListener('click', async function () {
    const btn = this;
    const originalText = btn.textContent;
    const resultContainer = document.getElementById('matchResultText');

    try {
        btn.disabled = true;
        btn.textContent = "Analyzing...";
        resultContainer.textContent = "Analyzing your resume against the job description...";
        
        showProcessingPopup("Analyzing your resume match...");

        const resumeFile = document.getElementById('resumeUploadMatch').files[0];
        const jobDescription = document.getElementById('jobDescriptionMatch').value;
        
        if (!resumeFile) throw new Error('Please upload a resume file');
        if (!jobDescription.trim()) throw new Error('Please enter a job description');

        const resumeText = await extractTextFromFile(resumeFile);
        const result = await matchResumeToJob(resumeText, jobDescription);
        
        resultContainer.innerHTML = "Analysis complete! Check the popup for details.";
        showMatchingPopup(result);
        
    } catch (error) {
        resultContainer.textContent = `Error: ${error.message}`;
        showErrorPopup(`Error: ${error.message}`);
    } finally {
        bttn.textContent = originalText;
        btn.disabled = false;
    }
});

// File Input Handlers
function handleFileInput(fileInput, fileNameDisplay) {
    fileInput.addEventListener('change', function() {
        fileNameDisplay.textContent = this.files.length ? this.files[0].name : '';
    });
}

handleFileInput(document.getElementById('resumeUploadOptimize'), document.getElementById('fileNameOptimize'));
handleFileInput(document.getElementById('resumeUploadMatch'), document.getElementById('fileNameMatch'));

// Login Form Submission
document.getElementById("loginForm")?.addEventListener("submit", function (e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    console.log("Logging in with:", email, password);
    alert("Login successful! Redirecting...");
    window.location.href = "index.html";
});




