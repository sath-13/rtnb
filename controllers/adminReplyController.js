import AdminReply from '../models/adminFeedback.js';
import { notifyUserAboutCommentReply } from '../service/notification.service.js';
import StatusCodes from 'http-status-codes';

// ✅ Save admin reply to comment with workspace verification
export const createAdminReply = async (req, res) => {
  try {
    const {
      surveyId,
      questionId,
      employeeId,
      commentUniqueId,
      adminId,
      adminName,
      replyText,
    } = req.body;

    console.log('💬 Admin reply submission:', {
      surveyId,
      questionId,
      employeeId,
      commentUniqueId,
      adminId,
      adminName,
      replyText: replyText?.substring(0, 50) + '...',
      userRole: req.user?.role,
      userWorkspaces: req.user?.workspaceNames
    });

    // Validation
    if (!surveyId || !questionId || !employeeId || !commentUniqueId || !adminId || !adminName || !replyText) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Role-based access control
    if (req.user?.role !== 'superadmin') {
      console.log('❌ Access denied - Only super admins can create replies');
      return res.status(403).json({ error: 'Access denied - Only super admins can create replies' });
    }
    
    // Workspace verification - check if survey belongs to admin's workspace
    const SurveyResponse = (await import('../models/SurveyResponse.js')).default;
    const survey = await SurveyResponse.findOne({ sid: surveyId });
    
    if (!survey) {
      console.log('❌ Survey not found:', surveyId);
      return res.status(404).json({ error: 'Survey not found' });
    }
    
    // Check if survey is in admin's workspace
    if (req.user.workspaceNames && !req.user.workspaceNames.includes(survey.workspace)) {
      console.log('❌ Access denied - Survey not in admin workspace:', {
        surveyWorkspace: survey.workspace,
        adminWorkspaces: req.user.workspaceNames
      });
      return res.status(403).json({ error: 'Access denied - Survey not in your workspace' });
    }

    // ✅ Check if reply already exists for this comment - PREVENT multiple replies
    const existing = await AdminReply.findOne({ commentUniqueId });

    if (existing) {
      console.log('❌ Reply already exists for this comment - preventing multiple replies');
      return res.status(400).json({ 
        error: 'A reply already exists for this comment. Only one reply is allowed per comment.',
        existingReply: existing
      });
    }

    // Create new reply (only path allowed)
    const newReply = new AdminReply({
      surveyId,
      questionId,
      employeeId,
      commentUniqueId,
      adminId,
      adminName,
      replyText: replyText.trim(),
      timestamp: new Date()
    });
    
    const savedReply = await newReply.save();
    
    console.log('✅ Created new admin reply');
    
    // 🔔 Send notification for new reply
    try {
      await notifyUserAboutCommentReply(
        surveyId, 
        questionId, 
        employeeId, 
        { reply: replyText, createdBy: adminId }, 
        adminName
      );
    } catch (notificationError) {
      console.error("⚠️ Failed to send reply notification:", notificationError);
    }
    
    return res.status(201).json({ 
      message: 'Reply created successfully', 
      reply: savedReply 
    });
  } catch (error) {
    console.error('❌ Error saving admin reply:', error);
    res.status(500).json({ 
      error: 'Server error saving reply', 
      details: error.message 
    });
  }
};

// ✅ Get admin replies for specific survey/question with workspace filtering
export const getAdminReplies = async (req, res) => {
  try {
    const { surveyId, questionId, employeeId } = req.query;
    
    console.log('🔍 Fetching admin replies for:', { surveyId, questionId, employeeId });
    console.log('👤 User info:', {
      role: req.user?.role,
      workspaceNames: req.user?.workspaceNames,
      userId: req.user?.userId
    });
    
    // Build base query
    const query = {};
    if (surveyId) query.surveyId = surveyId;
    if (questionId) query.questionId = questionId;
    
    // Handle different access patterns based on user role and request type
    if (employeeId) {
      // This is a request for a specific employee's replies
      if (req.user?.role === 'superadmin') {
        // Super admin can access any employee's replies in their workspace
        // We need to verify the survey belongs to admin's workspace
        if (surveyId) {
          const SurveyResponse = (await import('../models/SurveyResponse.js')).default;
          const survey = await SurveyResponse.findOne({ sid: surveyId });
          
          if (!survey) {
            return res.status(404).json({ error: 'Survey not found' });
          }
          
          // Check if survey is in admin's workspace
          if (req.user.workspaceNames && !req.user.workspaceNames.includes(survey.workspace)) {
            console.log('❌ Access denied - Survey not in admin workspace');
            return res.status(403).json({ error: 'Access denied - Survey not in your workspace' });
          }
        }
        
        query.employeeId = employeeId;
      } else {
        // Normal users can only access their own replies
        if (employeeId !== req.user?.userId) {
          console.log('❌ Access denied - User can only access own replies');
          return res.status(403).json({ error: 'Access denied - You can only access your own replies' });
        }
        query.employeeId = employeeId;
      }
    } else {
      // General query for survey/question replies
      if (req.user?.role === 'superadmin') {
        // Super admin needs workspace verification
        if (surveyId) {
          const SurveyResponse = (await import('../models/SurveyResponse.js')).default;
          const survey = await SurveyResponse.findOne({ sid: surveyId });
          
          if (!survey) {
            return res.status(404).json({ error: 'Survey not found' });
          }
          
          // Check if survey is in admin's workspace
          if (req.user.workspaceNames && !req.user.workspaceNames.includes(survey.workspace)) {
            console.log('❌ Access denied - Survey not in admin workspace');
            return res.status(403).json({ error: 'Access denied - Survey not in your workspace' });
          }
        }
      } else {
        // Normal users should not access general replies
        console.log('❌ Access denied - Normal users cannot access general replies');
        return res.status(403).json({ error: 'Access denied - Normal users cannot access general replies' });
      }
    }
    
    const replies = await AdminReply.find(query).sort({ timestamp: 1 });
    
    console.log(`✅ Found ${replies.length} admin replies`);
    res.json(replies);
  } catch (error) {
    console.error('❌ Error fetching admin replies:', error);
    res.status(500).json({ 
      error: 'Server error fetching replies', 
      details: error.message 
    });
  }
};
