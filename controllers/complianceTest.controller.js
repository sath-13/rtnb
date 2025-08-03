import * as driveService from '../service/googleDrive.service.js';
import * as geminiService from '../service/gemini.service.js';
import * as testService from '../service/complianceTest.service.js';
import ComplianceTest from '../models/ComplianceTest.js';
import ComplianceResponse from '../models/ComplianceResponse.js';
import User from '../models/user-model.js';
import Admin from '../models/SuperAdmin-model.js';
import mongoose from 'mongoose';

export const generateComplianceTest = async (req, res) => {
  try {
    const { numQuestions, topic, driveFileNames } = req.body;
    let fileContent = '';

    // Step 1: Call the Drive service if file names are provided.
    if (driveFileNames && driveFileNames.length > 0 && driveFileNames[0] !== '') {
      fileContent = await driveService.extractTextFromFiles(driveFileNames);
    }

    // Step 2: Call the Gemini service with the results. The service now handles all the logic.
    const questions = await geminiService.generateComplianceQuestions({
      numQuestions,
      topic,
      fileContent,
    });

    // Step 3: Send the response.
    res.json({ questions });

  } catch (err) {
    console.error("Error in generateComplianceTest controller:", err.message);
    res.status(500).json({ error: "Failed to generate questions." });
  }
};

export const saveTest = async (req, res) => {
    try {
        const { test, questions, workspacename } = req.body;
        if (!test || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ error: "Test data and questions are required." });
        }
        const newTest = await testService.saveNewTest(test, questions, workspacename);
        res.status(201).json({ message: "Compliance test created", sid: newTest.sid });
    } catch (err) {
        console.error("Error saving test:", err.message);
        res.status(500).json({ error: "Failed to save test." });
    }
};

export const getTest = async (req, res) => {
    try {
        const { testId } = req.params;
        const questions = await testService.getTestForUser(testId);
        res.json({ questions });
    } catch (err) {
        console.error("Error getting test:", err.message);
        res.status(404).json({ error: err.message });
    }
};

export const submitTest = async (req, res) => {
    try {
        console.log('submitTest called with body:', req.body);
        const { employeeId, testId, answers, timeSpent } = req.body;
        
        // Validate required fields
        if (!employeeId) {
            console.log('Missing employeeId');
            return res.status(400).json({ error: "Employee ID is required" });
        }
        if (!testId) {
            console.log('Missing testId');
            return res.status(400).json({ error: "Test ID is required" });
        }
        if (!answers || typeof answers !== 'object') {
            console.log('Invalid answers:', answers);
            return res.status(400).json({ error: "Valid answers object is required" });
        }
        
        console.log('Calling gradeUserAnswers...');
        const result = await testService.gradeUserAnswers(employeeId, testId, answers, timeSpent);
        console.log('gradeUserAnswers result:', result);
        res.json(result);
    } catch (err) {
        console.error("Error submitting test:", err.message);
        console.error("Full error:", err);
        res.status(500).json({ error: "Failed to submit test." });
    }
};

// Get all compliance surveys
export const getAllComplianceSurveys = async (req, res) => {
    try {
        const { workspacename } = req.query; // Get workspace filter from query params
        
        // Build query object with workspace filter
        let query = {};
        if (workspacename) {
            query.workspacename = workspacename;
        }
        
        const surveys = await ComplianceTest.find(query)
            .select('sid test questions createdAt workspacename')
            .sort({ createdAt: -1 });
        
        const surveysWithStats = await Promise.all(surveys.map(async (survey) => {
            const responses = await ComplianceResponse.find({ testId: survey.sid });
            const totalResponses = responses.length;
            const completedResponses = responses.filter(r => r.status === 'Pass' || r.status === 'Fail');
            const avgScore = responses.length > 0 
                ? Math.round(responses.reduce((sum, r) => sum + r.score, 0) / responses.length)
                : 0;
            
            return {
                id: survey.sid,
                title: survey.test.title,
                description: survey.test.description,
                category: survey.test.audience || 'General',
                totalQuestions: survey.questions.length,
                totalResponses,
                completionRate: totalResponses > 0 ? Math.round((completedResponses.length / totalResponses) * 100) : 0,
                averageScore: avgScore,
                status: new Date(survey.test.dueDate) > new Date() ? 'active' : 'expired',
                createdDate: survey.createdAt.toISOString().split('T')[0],
                dueDate: survey.test.dueDate,
                workspacename: survey.workspacename,
                creator: 'Admin' // You can add creator field to schema if needed
            };
        }));
        
        res.json(surveysWithStats);
    } catch (err) {
        console.error("Error fetching compliance surveys:", err.message);
        res.status(500).json({ error: "Failed to fetch compliance surveys." });
    }
};

// Get survey responses overview
export const getSurveyResponsesOverview = async (req, res) => {
    try {
        const { workspacename } = req.query; // Get workspace filter from query params
        
        // Build query object with workspace filter
        let query = {};
        if (workspacename) {
            query.workspacename = workspacename;
        }
        
        const surveys = await ComplianceTest.find(query)
            .select('sid test questions createdAt workspacename')
            .sort({ createdAt: -1 });
        
        const surveysWithResponses = await Promise.all(surveys.map(async (survey) => {
            const responses = await ComplianceResponse.find({ testId: survey.sid })
                .sort({ submittedAt: -1 })
                .limit(3);
            
            const allResponses = await ComplianceResponse.find({ testId: survey.sid });
            const totalResponses = allResponses.length;
            const avgScore = allResponses.length > 0 
                ? Math.round(allResponses.reduce((sum, r) => sum + r.score, 0) / allResponses.length)
                : 0;
            
            return {
                id: survey.sid,
                title: survey.test.title,
                category: survey.test.audience || 'General',
                totalQuestions: survey.questions.length,
                totalResponses,
                completionRate: totalResponses > 0 ? 100 : 0, // Assuming all fetched responses are completed
                averageScore: avgScore,
                status: new Date(survey.test.dueDate) > new Date() ? 'active' : 'expired',
                createdDate: survey.createdAt.toISOString().split('T')[0],
                dueDate: survey.test.dueDate,
                workspacename: survey.workspacename,
                recentResponses: await Promise.all(responses.map(async (r) => {
                    // Try to find user in User collection first by username
                    let user = await User.findOne({ username: r.employeeId })
                        .select('fname lname username');
                    
                    // If not found by username, try by _id (in case employeeId is actually an ObjectId)
                    if (!user && mongoose.Types.ObjectId.isValid(r.employeeId)) {
                        user = await User.findById(r.employeeId)
                            .select('fname lname username');
                    }
                    
                    // If still not found, try Admin collection by username
                    if (!user) {
                        user = await Admin.findOne({ username: r.employeeId })
                            .select('fname lname username');
                    }
                    
                    // If still not found, try Admin collection by _id
                    if (!user && mongoose.Types.ObjectId.isValid(r.employeeId)) {
                        user = await Admin.findById(r.employeeId)
                            .select('fname lname username');
                    }
                    
                    return {
                        id: r._id.toString(),
                        userName: user ? `${user.fname} ${user.lname}` : 'User Not Found',
                        empId: r.employeeId,
                        submittedAt: r.submittedAt.toISOString().split('T')[0],
                        score: r.score
                    };
                }))
            };
        }));
        
        res.json(surveysWithResponses);
    } catch (err) {
        console.error("Error fetching survey responses overview:", err.message);
        res.status(500).json({ error: "Failed to fetch survey responses overview." });
    }
};

// Get detailed responses for a specific survey
export const getSurveyDetailedResponses = async (req, res) => {
    try {
        const { surveyId } = req.params;
        
        // Get survey details
        const survey = await ComplianceTest.findOne({ sid: surveyId });
        if (!survey) {
            return res.status(404).json({ error: "Survey not found" });
        }
        
        // Get all responses for this survey
        const responses = await ComplianceResponse.find({ testId: surveyId })
            .sort({ submittedAt: -1 });
        
        const surveyDetail = {
            id: survey.sid,
            title: survey.test.title,
            description: survey.test.description,
            category: survey.test.audience || 'General',
            totalQuestions: survey.questions.length,
            createdDate: survey.createdAt.toISOString().split('T')[0],
            dueDate: survey.test.dueDate,
            status: new Date(survey.test.dueDate) > new Date() ? 'active' : 'expired',
            workspacename: survey.workspacename,
            creator: 'Admin'
        };
        
        // Fetch response details with real user data
        const responseDetails = await Promise.all(responses.map(async (response) => {
            // Use actual timeSpent from response (stored in minutes), with fallback only if undefined
            const timeSpent = response.timeSpent !== undefined ? response.timeSpent : 0;
            
            // Try to find user in User collection first by username
            let user = await User.findOne({ username: response.employeeId })
                .select('fname lname email teamTitle branch username');
            
            // If not found by username, try by _id (in case employeeId is actually an ObjectId)
            if (!user && mongoose.Types.ObjectId.isValid(response.employeeId)) {
                user = await User.findById(response.employeeId)
                    .select('fname lname email teamTitle branch username');
            }
            
            // If still not found, try Admin collection by username
            if (!user) {
                user = await Admin.findOne({ username: response.employeeId })
                    .select('fname lname email teamTitle branch username');
            }
            
            // If still not found, try Admin collection by _id
            if (!user && mongoose.Types.ObjectId.isValid(response.employeeId)) {
                user = await Admin.findById(response.employeeId)
                    .select('fname lname email teamTitle branch username');
            }
            
            return {
                id: response._id.toString(),
                empId: response.employeeId,
                userName: user ? `${user.fname} ${user.lname}` : 'User Not Found',
                email: user ? user.email : 'N/A',
                department: user ? (user.teamTitle && user.teamTitle.length > 0 ? user.teamTitle.join(', ') : user.branch || 'General') : 'General',
                submittedAt: response.submittedAt.toISOString(),
                score: response.score,
                status: 'completed',
                timeSpent,
                answers: [] // You can expand this to show detailed answers if needed
            };
        }));
        
        res.json({
            survey: surveyDetail,
            responses: responseDetails
        });
    } catch (err) {
        console.error("Error fetching survey detailed responses:", err.message);
        res.status(500).json({ error: "Failed to fetch survey detailed responses." });
    }
};