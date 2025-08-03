import SurveyResponse from '../models/SurveyResponse.js';
import User from '../models/user-model.js';
import Admin from '../models/SuperAdmin-model.js';
import { BadRequest, InternalServer } from '../middlewares/customError.js';
import StatusCodes from 'http-status-codes';

// Get all workspaces with survey counts (for superadmin only)
export const getAllWorkspacesWithSurveys = async (req, res, next) => {
  try {
    const workspaces = await SurveyResponse.aggregate([
      {
        $group: {
          _id: '$workspace',
          totalSurveys: { $sum: 1 },
          totalResponses: { $sum: { $size: '$responses' } },
          lastActivity: { $max: '$updatedAt' },
          activeSurveys: {
            $sum: {
              $cond: [
                { $gt: [{ $size: '$responses' }, 0] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          workspace: '$_id',
          totalSurveys: 1,
          totalResponses: 1,
          lastActivity: 1,
          activeSurveys: 1,
          pendingSurveys: { $subtract: ['$totalSurveys', '$activeSurveys'] }
        }
      },
      {
        $sort: { lastActivity: -1 }
      }
    ]);

    const formattedWorkspaces = workspaces.map(workspace => ({
      name: workspace.workspace,
      displayName: workspace.workspace.charAt(0).toUpperCase() + workspace.workspace.slice(1).replace(/[-_]/g, ' '),
      totalSurveys: workspace.totalSurveys,
      totalResponses: workspace.totalResponses,
      activeSurveys: workspace.activeSurveys,
      pendingSurveys: workspace.pendingSurveys,
      lastActivity: workspace.lastActivity,
      status: workspace.activeSurveys > 0 ? 'active' : 'pending'
    }));

    res.status(StatusCodes.OK).json({
      success: true,
      workspaces: formattedWorkspaces,
      message: 'Workspaces fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    next(InternalServer('Failed to fetch workspaces'));
  }
};

// Get surveys grouped by workspace (for superadmin only)
export const getSurveysGroupedByWorkspace = async (req, res, next) => {
  try {
    const surveysGrouped = await SurveyResponse.aggregate([
      {
        $project: {
          sid: 1,
          workspace: 1,
          audienceType: 1,
          createdAt: 1,
          updatedAt: 1,
          responseCount: { $size: '$responses' },
          lastResponseDate: {
            $max: '$responses.submittedAt'
          }
        }
      },
      {
        $group: {
          _id: '$workspace',
          surveys: {
            $push: {
              sid: '$sid',
              title: {
                $concat: [
                  { $toUpper: { $substr: ['$sid', 0, 1] } },
                  { $substr: ['$sid', 1, -1] }
                ]
              },
              workspace: '$workspace',
              audienceType: '$audienceType',
              responseCount: '$responseCount',
              createdAt: '$createdAt',
              lastResponseDate: '$lastResponseDate',
              status: {
                $cond: [
                  { $gt: ['$responseCount', 0] },
                  'active',
                  'pending'
                ]
              }
            }
          },
          totalSurveys: { $sum: 1 },
          totalResponses: { $sum: '$responseCount' },
          lastActivity: { $max: '$updatedAt' }
        }
      },
      {
        $project: {
          workspace: '$_id',
          displayName: {
            $concat: [
              { $toUpper: { $substr: ['$_id', 0, 1] } },
              { $substr: ['$_id', 1, -1] }
            ]
          },
          surveys: {
            $sortArray: {
              input: '$surveys',
              sortBy: { createdAt: -1 }
            }
          },
          totalSurveys: 1,
          totalResponses: 1,
          lastActivity: 1
        }
      },
      {
        $sort: { lastActivity: -1 }
      }
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: surveysGrouped,
      message: 'Surveys grouped by workspace fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching grouped surveys:', error);
    next(InternalServer('Failed to fetch grouped surveys'));
  }
};

// Get all surveys with their response counts (for superadmin only) - LEGACY
export const getAllSurveysForSuperAdmin = async (req, res, next) => {
  try {
    const { workspace } = req.query;
    
    // Build match stage for aggregation
    const matchStage = workspace ? { $match: { workspace } } : {};
    
    const surveys = await SurveyResponse.aggregate([
      ...(workspace ? [matchStage] : []),
      {
        $project: {
          sid: 1,
          title: 1,
          workspace: 1,
          audienceType: 1,
          createdAt: 1,
          updatedAt: 1,
          responseCount: { $size: '$responses' },
          lastResponseDate: {
            $max: '$responses.submittedAt'
          }
        }
      },
      {
        $sort: { updatedAt: -1 }
      }
    ]);

    // Format the survey data
    const formattedSurveys = surveys.map(survey => ({
      sid: survey.sid,
      title: survey.title,
      workspace: survey.workspace,
      audienceType: survey.audienceType,
      responseCount: survey.responseCount,
      createdAt: survey.createdAt,
      lastResponseDate: survey.lastResponseDate,
      status: survey.responseCount > 0 ? 'active' : 'pending'
    }));

    res.status(StatusCodes.OK).json({
      success: true,
      surveys: formattedSurveys,
      message: 'Surveys fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching surveys:', error);
    next(InternalServer('Failed to fetch surveys'));
  }
};

// Get all users who responded to a specific survey
export const getSurveyRespondents = async (req, res, next) => {
  try {
    const { sid } = req.params;
    console.log(`🔍 Fetching respondents for survey: ${sid}`);
    
    const surveyData = await SurveyResponse.findOne({ sid });
    
    if (!surveyData) {
      console.log(`❌ Survey not found: ${sid}`);
      return next(BadRequest('Survey not found'));
    }

    console.log(`📊 Found survey with ${surveyData.responses.length} responses`);

    // Get all respondents with their basic info
    const respondents = await Promise.all(
      surveyData.responses.map(async (response, index) => {
        console.log(`👤 Processing response ${index + 1}: empId=${response.empId}, anonymous=${response.isAnonymous}`);
        
        let user = null;
        
        if (!response.isAnonymous) {
          // Add debugging to understand what's in the database
          console.log(`🔍 Looking for user with ID: "${response.empId}"`);
          
          // Find user by _id (empId should match the _id field in User collection)
          try {
            user = await User.findById(response.empId).select('fname lname email role teamTitle branch username');
          } catch (err) {
            console.log(`❌ Error finding user by ID: ${err.message}`);
          }
          
          if (!user) {
            // Try Admin collection if not found in User collection
            try {
              user = await Admin.findById(response.empId).select('fname lname email role teamTitle branch username');
            } catch (err) {
              console.log(`❌ Error finding admin by ID: ${err.message}`);
            }
          }
          
          // If still not found by ID, try by username (fallback for old data)
          if (!user) {
            console.log(`🔍 User not found by ID "${response.empId}", trying username...`);
            user = await User.findOne({ username: response.empId }).select('fname lname email role teamTitle branch username');
            
            if (!user) {
              user = await Admin.findOne({ username: response.empId }).select('fname lname email role teamTitle branch username');
            }
          }
          
          // If still not found, let's check if user exists with different criteria
          if (!user) {
            console.log(`� User not found by username "${response.empId}", trying other methods...`);
            
          // Try to find by email (in case empId is email prefix like "sat" for "sat@gmail.com")
          user = await User.findOne({ email: { $regex: new RegExp(`^${response.empId}@`, 'i') } }).select('fname lname email role teamTitle branch username');
          
          if (!user) {
            user = await Admin.findOne({ email: { $regex: new RegExp(`^${response.empId}@`, 'i') } }).select('fname lname email role teamTitle branch username');
          }            if (user) {
              console.log(`✅ Found user by email match: ${user.fname} ${user.lname} (username: ${user.username}, email: ${user.email})`);
            }
          }
          
          // If still not found, let's see what users actually exist
          if (!user) {
            console.log(`🔍 Still not found. Let's check what users exist...`);
            const allUsers = await User.find({}).select('username email fname lname').limit(5);
            const allAdmins = await Admin.find({}).select('username email fname lname').limit(5);
            
            console.log('📋 Sample Users in User collection:');
            allUsers.forEach(u => console.log(`  - username: "${u.username}", email: "${u.email}", name: "${u.fname} ${u.lname}"`));
            
            console.log('📋 Sample Users in Admin collection:');
            allAdmins.forEach(u => console.log(`  - username: "${u.username}", email: "${u.email}", name: "${u.fname} ${u.lname}"`));
          }
          
          console.log(`👤 User lookup result: ${user ? `${user.fname} ${user.lname} (username: ${user.username})` : 'Not found'}`);
        }

        return {
          responseId: response._id,
          empId: response.empId,
          submittedAt: response.submittedAt,
          isAnonymous: response.isAnonymous,
          answerCount: response.answers ? response.answers.length : 0,
          skippedCount: response.answers ? response.answers.filter(ans => ans.skipped).length : 0,
          user: response.isAnonymous ? null : user ? {
            name: `${user.fname} ${user.lname}`,
            email: user.email,
            role: user.role,
            teamTitle: user.teamTitle,
            branch: user.branch
          } : {
            name: 'User Not Found',
            email: 'N/A',
            role: 'N/A',
            teamTitle: [],
            branch: 'N/A'
          }
        };
      })
    );

    console.log(`✅ Successfully processed ${respondents.length} respondents`);

    // Sort by submission date (newest first)
    respondents.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    res.status(StatusCodes.OK).json({
      success: true,
      survey: {
        sid: surveyData.sid,
        workspace: surveyData.workspace,
        audienceType: surveyData.audienceType,
        totalResponses: surveyData.responses.length
      },
      respondents,
      message: 'Survey respondents fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching survey respondents:', error);
    next(InternalServer('Failed to fetch survey respondents'));
  }
};

// Get detailed response of a specific user for a specific survey
export const getUserSurveyResponse = async (req, res, next) => {
  try {
    const { sid, empId } = req.params;
    
    const surveyData = await SurveyResponse.findOne({ sid });
    
    if (!surveyData) {
      return next(BadRequest('Survey not found'));
    }

    // Find the specific user's response
    const userResponse = surveyData.responses.find(response => 
      response.empId === empId
    );

    if (!userResponse) {
      return next(BadRequest('User response not found for this survey'));
    }

    // Get user details if not anonymous
    let userData = null;
    if (!userResponse.isAnonymous) {
      console.log(`🔍 Looking for user with ID: "${empId}"`);
      
      // Find user by _id (empId should match the _id field in User collection)
      try {
        userData = await User.findById(empId).select('fname lname email role teamTitle branch userLogo');
      } catch (err) {
        console.log(`❌ Error finding user by ID: ${err.message}`);
      }
      
      if (!userData) {
        // Try Admin collection if not found in User collection
        try {
          userData = await Admin.findById(empId).select('fname lname email role teamTitle branch userLogo');
        } catch (err) {
          console.log(`❌ Error finding admin by ID: ${err.message}`);
        }
      }
      
      // If still not found by ID, try by username (fallback for old data)
      if (!userData) {
        console.log(`🔍 User not found by ID "${empId}", trying username...`);
        userData = await User.findOne({ username: empId }).select('fname lname email role teamTitle branch userLogo');
        
        if (!userData) {
          userData = await Admin.findOne({ username: empId }).select('fname lname email role teamTitle branch userLogo');
        }
      }
      
      if (userData) {
        console.log(`✅ Found user: ${userData.fname} ${userData.lname} (ID: ${userData._id})`);
      } else {
        console.log(`❌ User not found for empId: "${empId}"`);
      }
    }

    // Organize answers by category
    const answersByCategory = {};
    userResponse.answers.forEach(answer => {
      if (!answersByCategory[answer.category]) {
        answersByCategory[answer.category] = [];
      }
      answersByCategory[answer.category].push({
        question: answer.question,
        questionType: answer.questionType,
        answer: answer.answer,
        skipped: answer.skipped
      });
    });

    // Calculate statistics
    const totalQuestions = userResponse.answers.length;
    const answeredQuestions = userResponse.answers.filter(ans => !ans.skipped).length;
    const skippedQuestions = totalQuestions - answeredQuestions;
    
    // Calculate average score for score-based questions
    const scoreBasedAnswers = userResponse.answers.filter(ans => 
      !ans.skipped && 
      ['emoji-scale', 'slider', 'star-rating'].includes(ans.questionType) &&
      typeof ans.answer === 'number'
    );
    
    const averageScore = scoreBasedAnswers.length > 0 
      ? scoreBasedAnswers.reduce((sum, ans) => sum + ans.answer, 0) / scoreBasedAnswers.length 
      : null;

    res.status(StatusCodes.OK).json({
      success: true,
      survey: {
        sid: surveyData.sid,
        workspace: surveyData.workspace,
        audienceType: surveyData.audienceType
      },
      response: {
        empId: userResponse.empId,
        submittedAt: userResponse.submittedAt,
        isAnonymous: userResponse.isAnonymous,
        user: userResponse.isAnonymous ? null : userData ? {
          name: `${userData.fname} ${userData.lname}`,
          email: userData.email,
          role: userData.role,
          teamTitle: userData.teamTitle,
          branch: userData.branch,
          userLogo: userData.userLogo
        } : {
          name: 'User Not Found',
          email: 'N/A',
          role: 'N/A',
          teamTitle: [],
          branch: 'N/A',
          userLogo: null
        },
        statistics: {
          totalQuestions,
          answeredQuestions,
          skippedQuestions,
          completionRate: Math.round((answeredQuestions / totalQuestions) * 100),
          averageScore: averageScore ? Math.round(averageScore * 100) / 100 : null
        },
        answersByCategory
      },
      message: 'User survey response fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching user survey response:', error);
    next(InternalServer('Failed to fetch user survey response'));
  }
};

// Get summary statistics for all surveys (for dashboard)
export const getSurveyResponseSummary = async (req, res, next) => {
  try {
    const { workspace } = req.query;
    
    const matchStage = workspace ? { $match: { workspace } } : {};
    
    const summary = await SurveyResponse.aggregate([
      ...(workspace ? [matchStage] : []),
      {
        $group: {
          _id: null,
          totalSurveys: { $sum: 1 },
          totalResponses: { $sum: { $size: '$responses' } },
          activeSurveys: {
            $sum: {
              $cond: [{ $gt: [{ $size: '$responses' }, 0] }, 1, 0]
            }
          },
          averageResponsesPerSurvey: { $avg: { $size: '$responses' } }
        }
      }
    ]);

    const result = summary[0] || {
      totalSurveys: 0,
      totalResponses: 0,
      activeSurveys: 0,
      averageResponsesPerSurvey: 0
    };

    res.status(StatusCodes.OK).json({
      success: true,
      summary: {
        ...result,
        averageResponsesPerSurvey: Math.round(result.averageResponsesPerSurvey * 100) / 100
      },
      message: 'Survey response summary fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching survey response summary:', error);
    next(InternalServer('Failed to fetch survey response summary'));
  }
};
