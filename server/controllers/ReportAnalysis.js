const axios = require('axios');
const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const User = require("../models/User");
require('dotenv').config();

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(`${process.env.GEMINI_API_KEY}`);
const model = genAI.getGenerativeModel({model: "gemini-2.0-flash"});

// Prompt template for medical report analysis
const prompt = `Analyze the given medical report and identify any potential health issues, diseases, or risks associated with the patient. Present only the detected health issues in a structured tabular format with the following columns: Disease/Risk, Severity (Mild/Moderate/Severe), Possible Causes, and Suggested Precautions/Treatment.
If no health issues are detected, do not extract any data from the report.
At the end, provide a concise summary of the patient's current health status in simple and understandable language, offering a quick review of their overall condition.

Also, provide an overall health status assessment (Good, Fair, or Poor) based on the findings.

Format the response as a JSON object with the following structure:
{
  "healthIssues": [
    {
      "disease": "Disease name",
      "severity": "Mild/Moderate/Severe",
      "causes": "Possible causes",
      "treatment": "Suggested precautions/treatment"
    }
  ],
  "summary": "Concise summary of health status",
  "healthStatus": "Good/Fair/Poor"
}`;

// Function to check if a URL points to a PDF file
function isPdfUrl(url) {
    return url.toLowerCase().endsWith('.pdf');
}

// Function to extract text from PDF documents
async function extractTextFromPdf(pdfUrl) {
    try {
        const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
        const data = await pdf(response.data);
        return data.text;
    } catch (error) {
        // console.error("Error in PDF parsing:", error);
        return "";
    }
}

// Function to analyze medical reports using Google's Generative AI
async function analyzeReports(pdfUrls) {
    try {
        let fullPrompt = prompt;

        // Process each PDF and add its text to the prompt only if it's a PDF
        for (let i = 0; i < pdfUrls.length; i++) {
            const url = pdfUrls[i];
            console.log("url given :",url);
            
            if (isPdfUrl(url)) {
                try {
                    const text = await extractTextFromPdf(url);
                    if (text) {
                        fullPrompt += `\n\nFile ${i + 1}:\n${text}\n`;
                    }
                    console.log("random  : ",text);
                    
                } catch (error) {
                    console.error(`Error processing PDF ${i + 1}:`, error);
                }
            } else {
                console.log(`Skipped non-PDF file: ${url}`);
            }
        }

        // Generate analysis using Google's Generative AI
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: fullPrompt }] }]
        });

        const responseText = result.response.text();

        // Try to parse the response as JSON
        try {
            // Extract JSON from the response (in case there's additional text)
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonStr = jsonMatch[0];
                return JSON.parse(jsonStr);
            }

            // If no JSON format is found, create a structured response
            return {
                summary: responseText,
                healthStatus: "Unknown",
                healthIssues: []
            };
        } catch (parseError) {
            // console.error("Error parsing AI response as JSON:", parseError);

            // Return a basic structure with the full text as summary
            return {
                summary: responseText,
                healthStatus: "Unknown",
                healthIssues: []
            };
        }
    } catch (error) {
        // console.error("Error in Gemini AI analysis:", error);
        throw error;
    }
}

// Controller function to get report summary for a user
exports.getReportSummary = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Verify user exists and matches the authenticated user
        if (req.user.id !== userId && req.user.accountType !== 'Doctor') {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to access this user's reports"
            });
        }

        // Get user with their documents
        const user = await User.findById(userId);


        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"                                               
            });
        }

        // Filter for medical reports and lab results
        const medicalDocuments = user.documents.filter(doc =>
            doc.category === 'medical_report' || doc.category === 'lab_result' || doc.category === 'prescription'
        ).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)).slice(0, 10);


        if (!medicalDocuments || medicalDocuments.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No medical reports found for analysis"
            });
        }

        // Extract document URLs for analysis
        const documentUrls = medicalDocuments.map(doc => doc.fileUrl);

        console.log("4 hello",documentUrls)

        // Analyze the reports
        const analysis = await analyzeReports(documentUrls);

        return res.status(200).json({
            success: true,
            message: "Report analysis completed successfully",
            summary: analysis
        });
    } catch (error) {
        // console.error("Error in getReportSummary:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to analyze reports",
            error: error.message
        });
    }
};