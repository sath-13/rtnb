import Survey from '../models/survey-model.js';
import SurveyResponse from '../models/SurveyResponse.js';
import AdminReply from '../models/adminFeedback.js';
import { v4 as uuidv4 } from 'uuid';
import { notifyUsersAboutSurveyLaunch, notifyUserAboutCommentReply } from '../service/notification.service.js';
import StatusCodes from 'http-status-codes';

// ✅ Create new survey
export const createSurvey = async (req, res) => {
  try {
    const { survey, questions, workspace } = req.body;
    
    if (!survey || !Array.isArray(questions)) {
      return res.status(400).json({ error: "Survey and questions are required." });
    }
    
    const sid = uuidv4();
    const newSurvey = new Survey({
      sid,
      workspace,
      survey,
      questions
    });
    
    await newSurvey.save();
    
    // 🔔 Send notifications to all users in workspace about new survey
    try {
      const createdByName = req.user?.firstName && req.user?.lastName 
        ? `${req.user.firstName} ${req.user.lastName}` 
        : 'Admin';
      const createdById = req.user?._id || req.user?.id;
      
      await notifyUsersAboutSurveyLaunch(
        { sid, survey }, 
        workspace, 
        createdByName, 
        createdById
      );
    } catch (notificationError) {
      console.error("⚠️ Failed to send survey launch notifications:", notificationError);
      // Don't fail the survey creation if notifications fail
    }
    
    res.status(201).json({ 
      message: "Survey created", 
      sid, 
      survey: newSurvey 
    });
  } catch (err) {
    console.error("❌ Survey creation error:", err.message);
    res.status(500).json({ 
      error: "Survey creation failed", 
      details: err.message 
    });
  }
};

// ✅ Get active surveys
export const getActiveSurveys = async (req, res) => {
  try {
    const { workspacename } = req.query;
    
    const query = {
      $and: [
        { "survey.dueDate": { $gte: new Date().toISOString().split("T")[0] } }
      ]
    };
    
    if (workspacename) {
      query.$and.push({ workspace: workspacename });
    } else {
      return res.status(400).json({ error: "❌ no workspacename provided" });
    }
    
    const activeSurveys = await Survey.find(query).select("sid survey workspace");
    res.json(activeSurveys);
  } catch (err) {
    console.error("❌ Error fetching active surveys:", err.message);
    res.status(500).json({ error: "Failed to fetch active surveys" });
  }
};

// ✅ Get specific survey by ID
export const getSurveyById = async (req, res) => {
  try {
    const { surveyId } = req.params;
    const survey = await Survey.findOne({ sid: surveyId });
    
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    const questionsWithTypes = survey.questions.map(q => ({
      _id: q._id,
      question: q.question,
      category: q.category,
      questionType: q.questionType || 'emoji',
      options: q.options || []
    }));
    
    res.json({
      title: survey.survey.title || 'Untitled Survey',
      description: survey.survey.description || '',
      questions: questionsWithTypes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Submit survey responses
export const submitSurveyResponse = async (req, res) => {
  console.log('🚀 Survey submission endpoint called!');
  console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
  console.log('🔐 Auth user:', req.user);
  
  try {
    const { empId, isAnonymous, answers, comments, surveyId, workspace } = req.body;
    
    // Fix isAnonymous if it's sent as an array (take the first value)
    const isAnonymousValue = Array.isArray(isAnonymous) ? isAnonymous[0] : isAnonymous;
    
    console.log('🔍 Survey submission received:');
    console.log('empId from request:', empId);
    console.log('isAnonymous:', isAnonymous);
    console.log('isAnonymous (processed):', isAnonymousValue);
    console.log('surveyId:', surveyId);
    console.log('workspace:', workspace);
    console.log('comments:', comments);
    console.log('answers array:', answers);
    console.log('answers type:', typeof answers);
    console.log('answers length:', answers ? answers.length : 'undefined');
    
    // Enhanced logging for debugging
    console.log('📊 Survey submission details:');
    console.log('  👤 Employee ID:', empId);
    console.log('  🏢 Workspace:', workspace);
    console.log('  🔒 Anonymous:', isAnonymousValue);
    console.log('  📝 Survey ID:', surveyId);
    
    // Validate required fields
    if (!surveyId || !answers || !Array.isArray(answers)) {
      console.error('❌ Missing required fields:', { surveyId, answersType: typeof answers, answersIsArray: Array.isArray(answers) });
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'surveyId and answers array are required' 
      });
    }
    
    // Validate empId
    if (!empId || empId.trim() === '') {
      console.error('❌ No empId provided in request');
      return res.status(400).json({ error: 'empId is required' });
    }
    
    const survey = await Survey.findOne({ sid: surveyId });
    if (!survey) {
      console.error('❌ Survey not found:', surveyId);
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    console.log('✅ Survey found:', survey.survey.title);
    console.log('📝 Survey questions count:', survey.questions.length);
    console.log('📝 Answers received count:', answers ? answers.length : 0);
    console.log('📝 Full survey questions:', JSON.stringify(survey.questions, null, 2));
    
    const formattedAnswers = survey.questions.map((question, index) => {
      console.log(`🔍 Processing question ${index}:`, {
        question: question,
        hasId: !!question?._id,
        questionText: question?.question,
        category: question?.category,
        questionType: question?.questionType
      });
      
      // Safety check for question object
      if (!question) {
        console.error(`❌ Question ${index} is null or undefined`);
        return null;
      }
      
      let processedAnswer = answers[index];
      let isSkipped = false;
      
      if (question.questionType === 'toggle') {
        isSkipped = answers[index] === "";
      } else {
        isSkipped = !answers[index] || answers[index] === '';
      }
      
      if (question.questionType === 'yesno') {
        processedAnswer = processedAnswer === 'yes' ? 5 : 0;
      } else if (question.questionType === 'emoji' || question.questionType === 'rating') {
        processedAnswer = parseInt(processedAnswer) || 0;
      }
      
      // Generate a unique questionId - use index since _id is disabled in schema
      // Create a more stable questionId based on question content
      let questionId;
      
      if (question._id) {
        questionId = question._id.toString();
      } else {
        // Create a simple hash from question content for consistency
        const questionHash = Buffer.from(
          `${question.question || ''}_${question.category || ''}_${index}`
        ).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
        questionId = `q_${index}_${questionHash}`;
      }
      
      // Ensure questionId is never null, undefined, or empty
      if (!questionId || questionId === 'undefined' || questionId === 'null' || questionId.trim() === '') {
        questionId = `question_${index}_${Date.now()}`;
      }
      
      console.log(`🔑 Generated questionId for question ${index}: "${questionId}"`);
      
      const formattedAnswer = {
        questionId: questionId,
        question: question.question || `Question ${index + 1}`,
        category: question.category || 'General',
        questionType: question.questionType || 'emoji',
        answer: processedAnswer,
        comments: comments && comments[index] ? comments[index] : null,
        skipped: isSkipped
      };
      
      console.log(`📝 Final formatted answer ${index}:`, JSON.stringify(formattedAnswer, null, 2));
      
      return formattedAnswer;
    }).filter(answer => answer !== null); // Remove any null entries
    
    console.log(`📋 Total formatted answers: ${formattedAnswers.length}`);
    
    // Validate that all answers have required fields
    const invalidAnswers = formattedAnswers.filter(answer => 
      !answer.questionId || !answer.question || !answer.category || !answer.questionType
    );
    
    if (invalidAnswers.length > 0) {
      console.error('❌ Invalid answers found:', invalidAnswers);
      return res.status(400).json({ 
        error: 'Invalid answer format', 
        details: invalidAnswers.map(ans => `Missing required fields for question: ${ans.question || 'Unknown'}`)
      });
    }
    
    console.log('✅ All answers validated successfully');
    
    let responseDoc = await SurveyResponse.findOne({ sid: surveyId });
    if (!responseDoc) {
      responseDoc = new SurveyResponse({
        sid: surveyId,
        title: survey.survey.title || 'Untitled Survey',
        workspace: workspace,
        audienceType: 'all-employees',
        responses: []
      });
      console.log('📄 Created new response document');
    } else {
      console.log('📄 Found existing response document with', responseDoc.responses.length, 'responses');
      
      // Debug existing responses and clean up any corrupted data
      responseDoc.responses.forEach((existingResponse, idx) => {
        console.log(`📋 Existing response ${idx}:`, {
          empId: existingResponse.empId,
          answersCount: existingResponse.answers.length,
          firstAnswerQuestionId: existingResponse.answers[0]?.questionId
        });
        
        // Check and fix any existing responses with missing questionId
        existingResponse.answers.forEach((answer, answerIdx) => {
          if (!answer.questionId) {
            console.log(`🔧 Fixing missing questionId for existing response ${idx}, answer ${answerIdx}`);
            answer.questionId = `legacy_question_${answerIdx}`;
          }
        });
      });
    }
    
    const employeeResponse = {
      empId: (isAnonymousValue === true) ? 'anonymous' : empId.trim(),
      submittedAt: new Date(),
      answers: formattedAnswers,
      isAnonymous: isAnonymousValue === true
    };
    
    console.log('📤 Final empId being saved:', employeeResponse.empId);
    console.log('📤 isAnonymous being saved:', employeeResponse.isAnonymous);
    
    // Create a test document to validate the structure before adding to the main document
    try {
      const testResponse = new SurveyResponse({
        sid: 'test',
        title: 'Test',
        workspace: 'test',
        responses: [employeeResponse]
      });
      
      // Validate the test response
      await testResponse.validate();
      console.log('✅ Employee response structure validation passed');
      
    } catch (validationError) {
      console.error('❌ Employee response validation failed:', validationError);
      return res.status(400).json({ 
        error: 'Invalid response structure', 
        details: validationError.message 
      });
    }
    
    console.log('📤 Employee response object:', JSON.stringify(employeeResponse, null, 2));
    
    // Additional validation before saving
    console.log('🔍 Validating answers before save:');
    employeeResponse.answers.forEach((answer, idx) => {
      console.log(`Answer ${idx}:`, {
        questionId: answer.questionId,
        questionIdType: typeof answer.questionId,
        question: answer.question,
        hasQuestionId: !!answer.questionId && answer.questionId !== null && answer.questionId !== undefined
      });
      
      if (!answer.questionId) {
        console.error(`❌ Answer ${idx} has invalid questionId:`, answer.questionId);
      }
    });
    
    responseDoc.responses.push(employeeResponse);
    
    console.log('💾 About to save responseDoc with', responseDoc.responses.length, 'responses');
    console.log('💾 Response document ID:', responseDoc._id);
    
    // Try to save with detailed error reporting
    try {
      const savedDoc = await responseDoc.save();
      console.log('✅ Survey response saved successfully!');
      console.log('✅ Saved document ID:', savedDoc._id);
      console.log('✅ Total responses now:', savedDoc.responses.length);
      
      res.json({ message: 'Survey submitted successfully', responseId: savedDoc._id });
    } catch (saveError) {
      console.error('❌ Save error details:', saveError);
      
      // If there's a validation error, try to save just the new response in a separate document
      if (saveError.name === 'ValidationError') {
        console.log('🔄 Trying to save as new document due to validation error...');
        
        try {
          const newResponseDoc = new SurveyResponse({
            sid: `${surveyId}_${Date.now()}`, // Create a unique sid
            title: survey.survey.title || 'Untitled Survey',
            workspace: workspace,
            audienceType: 'all-employees',
            responses: [employeeResponse]
          });
          
          const newSavedDoc = await newResponseDoc.save();
          console.log('✅ Survey response saved to new document!');
          console.log('✅ New document ID:', newSavedDoc._id);
          
          res.json({ message: 'Survey submitted successfully', responseId: newSavedDoc._id });
        } catch (newSaveError) {
          console.error('❌ New document save also failed:', newSaveError);
          throw saveError; // Throw the original error
        }
      } else {
        throw saveError;
      }
    }
  } catch (error) {
    console.error('❌ Survey submission error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get survey reports for feedback with workspace filtering
export const getSurveyReports = async (req, res) => {
  try {
    console.log('📊 Fetching surveys report...');
    console.log('👤 User info:', {
      role: req.user?.role,
      userId: req.user?.id
    });
    
    // Build query based on user role and workspace access
    let query = {};
    
    if (req.user?.role === 'superadmin') {
      // Super admin can only see surveys from their assigned workspaces
      // Need to fetch user's workspace data from database since JWT doesn't include it
      const Admin = (await import('../models/SuperAdmin-model.js')).default;
      const adminUser = await Admin.findById(req.user.id);
      
      if (!adminUser) {
        console.log('❌ Admin user not found');
        return res.status(404).json({ error: 'Admin user not found' });
      }
      
      console.log('👤 Admin workspaces:', adminUser.workspaceName);
      
      if (adminUser.workspaceName && adminUser.workspaceName.length > 0) {
        query.workspace = { $in: adminUser.workspaceName };
      } else {
        // If no workspace assigned, return empty results
        console.log('⚠️ Super admin has no assigned workspaces');
        return res.json([]);
      }
    } else {
      // Normal users should not access survey reports through this endpoint
      // They should use a different endpoint for their own feedback
      console.log('❌ Access denied - Normal users cannot access survey reports');
      return res.status(403).json({ 
        error: 'Access denied. Normal users cannot access survey reports.' 
      });
    }
    
    console.log('🔍 Query filter:', query);
    
    // Get survey responses filtered by workspace
    const surveyResponses = await SurveyResponse.find(query);
    
    console.log(`📋 Found ${surveyResponses.length} survey response documents in allowed workspaces`);
    
    // Transform the data to match the frontend expectations
    const reportData = surveyResponses.map(responseDoc => {
      // Get survey details
      const survey = {
        sid: responseDoc.sid,
        title: responseDoc.title || `Survey ${responseDoc.sid}`,
        surveyName: responseDoc.title || responseDoc.workspace || `Survey ${responseDoc.sid}`,
        workspace: responseDoc.workspace,
        responses: responseDoc.responses.map(response => ({
          empId: response.empId,
          submittedAt: response.submittedAt,
          isAnonymous: response.isAnonymous,
          answers: response.answers.map(answer => ({
            questionId: answer.questionId,
            question: answer.question,
            category: answer.category,
            questionType: answer.questionType,
            answer: answer.answer,
            comments: answer.comments || null, // Include comments field
            isAnonymous: answer.isAnonymous, // Include per-question anonymity
            skipped: answer.skipped
          }))
        }))
      };
      
      return survey;
    });
    
    console.log(`✅ Returning ${reportData.length} survey reports for workspace access`);
    res.json(reportData);
  } catch (error) {
    console.error('❌ Error fetching surveys report:', error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get user's own survey responses and admin replies (for normal users)
export const getUserOwnFeedback = async (req, res) => {
  try {
    console.log('👤 Fetching user own feedback...');
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID not found in token' });
    }
    
    console.log('🔍 Fetching feedback for user ID:', userId);
    
    // Get admin replies for this specific user
    const userReplies = await AdminReply.find({ employeeId: userId }).sort({ timestamp: -1 });
    console.log(`📨 Found ${userReplies.length} admin replies for user`);
    
    // If no replies, return empty array
    if (userReplies.length === 0) {
      return res.json([]);
    }
    
    // Get unique survey IDs from the replies
    const surveyIds = [...new Set(userReplies.map(reply => reply.surveyId))];
    console.log('📊 User has replies in surveys:', surveyIds);
    
    // Get survey responses for these surveys to find user's original comments
    const surveyResponses = await SurveyResponse.find({ 
      sid: { $in: surveyIds }
    });
    
    // Build user feedback data
    const userFeedbackData = [];
    
    userReplies.forEach(reply => {
      // Find the survey this reply belongs to
      const survey = surveyResponses.find(s => s.sid === reply.surveyId);
      
      let originalComment = null;
      let originalAnswer = null;
      let questionText = null;
      let isAnonymous = false;
      let submittedAt = null;
      let hasFullDetails = false;
      
      if (survey) {
        // Find user's response in this survey
        const userResponse = survey.responses.find(response => response.empId === userId);
        
        if (userResponse) {
          // Find the specific answer that matches this reply
          const userAnswer = userResponse.answers.find(answer => 
            answer.questionId === reply.questionId && answer.comments && answer.comments.trim()
          );
          
          if (userAnswer) {
            originalComment = userAnswer.comments;
            originalAnswer = userAnswer.answer;
            questionText = userAnswer.question;
            isAnonymous = userAnswer.isAnonymous;
            submittedAt = userResponse.submittedAt;
            hasFullDetails = true;
          }
        }
      }
      
      userFeedbackData.push({
        id: reply.commentUniqueId,
        surveyId: reply.surveyId,
        surveyTitle: survey?.title || `Survey ${reply.surveyId}`,
        questionId: reply.questionId,
        questionText: questionText || 'Question details not available',
        userAnswer: originalAnswer || 'Answer details not available',
        userComment: originalComment || 'Comment details not available',
        isAnonymous: isAnonymous,
        submittedAt: submittedAt || reply.timestamp,
        adminReply: reply,
        hasFullDetails: hasFullDetails,
        limitedAccess: !hasFullDetails
      });
    });
    
    // Sort by submission date (newest first)
    userFeedbackData.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
    console.log(`✅ Returning ${userFeedbackData.length} feedback items for user`);
    res.json(userFeedbackData);
    
  } catch (error) {
    console.error('❌ Error fetching user own feedback:', error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get analytics overview
export const getAnalyticsOverview = async (req, res) => {
  try {
    const surveys = await Survey.find({});
    const totalSurveys = surveys.length;
    let totalResponses = 0;
    let totalRatings = 0;
    let ratingCount = 0;
    
    surveys.forEach((s) => {
      totalResponses += s.questions.length;
      s.questions.forEach((q) => {
        if (!q.skipped) {
          totalRatings += 4;
          ratingCount += 1;
        }
      });
    });
    
    const avgRating = ratingCount > 0 ? (totalRatings / ratingCount).toFixed(2) : 0;
    const responseRate = totalResponses > 0 ? ((ratingCount / totalResponses) * 100).toFixed(1) : 0;
    const activeSurveys = surveys.filter(s =>
      !s.survey.dueDate || new Date(s.survey.dueDate) >= new Date()
    ).length;
    
    res.json({
      activeSurveys,
      totalResponses,
      responseRate,
      avgRating,
    });
  } catch (err) {
    console.error("❌ Error in /analytics/overview:", err.message);
    res.status(500).json({ error: "Failed to fetch overview data" });
  }
};
