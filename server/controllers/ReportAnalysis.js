const axios = require('axios');
const pdf = require('pdf-parse');
const Tesseract = require('tesseract.js');
const canvas = require('canvas');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const User = require("../models/User");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const prompt = `
Analyze the given medical report and identify any potential health issues, diseases, or risks. 
Present only detected health issues in JSON format:
{
  "healthIssues": [
    {
      "disease": "",
      "severity": "",
      "causes": "",
      "treatment": ""
    }
  ],
  "summary": "",
  "healthStatus": ""
}`;

function isPdfUrl(url) {
    const lower = url.toLowerCase();

    return (
        lower.endsWith(".pdf") ||               // Normal PDF
        lower.includes("/raw/upload/") ||       // Cloudinary raw resource type
        lower.includes("application/pdf")       // Rare cases with direct MIME indication
    );
}

async function extractTextFromPdf(pdfUrl) {
    try {
        console.log("I'm getting url : ",pdfUrl);
        
        const response = await axios.get(pdfUrl, {
            responseType: 'arraybuffer',
            timeout: 15000,
            maxContentLength: 50 * 1024 * 1024
        });
        // console.log("here is the response : ",response);
        

        const contentType = (response.headers?.['content-type'] || '').toLowerCase();
        
        
        const buffer = Buffer.from(response.data);
        const data = await pdf(buffer);
        console.log("response.data here ",data);

        if (data?.text?.trim()) return data.text;

        const loadingTask = pdfjsLib.getDocument({ data: buffer });
        const pdfDoc = await loadingTask.promise;

        let ocrText = '';
        const pagesToProcess = Math.min(2, pdfDoc.numPages);

        for (let p = 1; p <= pagesToProcess; p++) {
            try {
                const page = await pdfDoc.getPage(p);
                const viewport = page.getViewport({ scale: 1.5 });
                const renderCanvas = canvas.createCanvas(viewport.width, viewport.height);
                const renderContext = {
                    canvasContext: renderCanvas.getContext('2d'),
                    viewport
                };

                await page.render(renderContext).promise;
                const pngBuffer = renderCanvas.toBuffer('image/png');

                const { data: { text } } = await Tesseract.recognize(pngBuffer, 'eng');
                if (text?.trim()) ocrText += text.trim() + "\n";
            } catch {}
        }

        return ocrText.trim();
    } catch {
        return '';
    }
}

async function analyzeReports(pdfUrls) {
    try {
        
        
        let fullPrompt = prompt;
        let extractedAny = false;
        
        for (let i = 0; i < pdfUrls.length; i++) {
            const url = pdfUrls[i];
            

            if (!isPdfUrl(url)) continue;

            const text = await extractTextFromPdf(url);
            if (text?.trim()) {
                extractedAny = true;
                fullPrompt += `\n\nReport ${i + 1}:\n${text}\n`;
            }
        }

        if (!extractedAny) {
            return {
                summary: '',
                healthStatus: 'Unknown',
                healthIssues: [],
                note: 'No text extracted from provided PDF files.'
            };
        }

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: fullPrompt }] }]
        });

        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch {
                return {
                    summary: responseText,
                    healthStatus: "Unknown",
                    healthIssues: []
                };
            }
        }

        return {
            summary: responseText,
            healthStatus: "Unknown",
            healthIssues: []
        };
    } catch (error) {
        throw error;
    }
}

exports.getReportSummary = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (req.user.id !== userId) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to access this user's reports"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const medicalDocuments = user.documents
            .filter(doc => 
                doc.category === 'medical_report' ||
                doc.category === 'lab_result' ||
                doc.category === 'prescription'
            )
            .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
            .slice(0, 10);

        if (!medicalDocuments.length) {
            return res.status(404).json({
                success: false,
                message: "No medical reports found for analysis"
            });
        }

        const documentUrls = medicalDocuments.map(doc => doc.fileUrl);
        const analysis = await analyzeReports(documentUrls);

        return res.status(200).json({
            success: true,
            message: "Report analysis completed successfully",
            summary: analysis
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to analyze reports",
            error: error.message
        });
    }
};
