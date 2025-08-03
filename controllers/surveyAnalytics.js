import SurveyResponse from '../models/SurveyResponse.js';
import Survey from '../models/survey-model.js';
import mongoose from 'mongoose';

const getSurveyAnalytics = async (req, res) => {
  const { sid, type } = req.params;
  console.log(`Fetching analytics for survey ID: ${sid}, type: ${type || 'overview'}`);

  try {
    // Base analytics query
    const baseAnalytics = await getBaseAnalytics(sid);

    let result;
    switch (type) {
      case 'categories':
        result = await getCategoryAnalytics(sid, baseAnalytics);
        break;
      case 'toggle-checkbox':
        result = await getToggleCheckboxAnalytics(sid, baseAnalytics);
        break;
      case 'scores':
        result = await getScoreAnalytics(sid, baseAnalytics);
        break;
      default:
        result = await getOverviewAnalytics(sid, baseAnalytics);
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate analytics" });
  }
};

const getBaseAnalytics = async (sid) => {
  // First, get the survey info for title and description
  const surveyInfo = await Survey.findOne({ sid }).select('survey.title survey.description');
  
  // Modified aggregate pipeline to handle different question types and skipped questions
  const survey = await SurveyResponse.aggregate([
    { $match: { sid } },
    { $unwind: "$responses" },
    { $unwind: "$responses.answers" },
    // Filter out skipped questions and non-analytical question types
    {
      $match: {
        "responses.answers.skipped": { $ne: true },
        "responses.answers.questionType": {
          $in: ['emoji-scale', 'slider', 'star-rating', 'open-ended','radio-group']
        }
      }
    },
    // Ensure we only process numeric answers for analytics
    {
      $addFields: {
        "numericAnswer": {
          $cond: {
            if: { $in: ["$responses.answers.questionType", ['emoji-scale', 'slider', 'star-rating','radio-group']] },
            then: "$responses.answers.answer",
            else: null
          }
        }
      }
    },
    // Only include answers that have valid numeric values for score-based analytics
    {
      $match: {
        "numericAnswer": { $ne: null }
      }
    },

    {
      $group: {
        _id: {
          question: "$responses.answers.question",
          category: "$responses.answers.category",
          questionType: "$responses.answers.questionType",
          score: "$numericAnswer"
        },
        count: { $sum: 1 },
      }
    },

    {
      $group: {
        _id: {
          question: "$_id.question",
          category: "$_id.category",
          questionType: "$_id.questionType"
        },
        distribution: {
          $push: {
            score: "$_id.score",
            count: "$count"
          }
        },
        totalAnswers: { $sum: "$count" },
        weightedScoreSum: {
          $sum: { $multiply: ["$_id.score", "$count"] }
        }
      }
    },

    {
      $project: {
        _id: 0,
        question: "$_id.question",
        category: "$_id.category",
        questionType: "$_id.questionType",
        averageScore: {
          $round: [{ $divide: ["$weightedScoreSum", "$totalAnswers"] }, 2]
        },
        distribution: {
          $let: {
            vars: {
              dist: {
                $map: {
                  input: [1, 2, 3, 4, 5],
                  as: "score",
                  in: {
                    score: "$$score",
                    count: {
                      $let: {
                        vars: {
                          found: {
                            $first: {
                              $filter: {
                                input: "$distribution",
                                cond: { $eq: ["$$this.score", "$$score"] }
                              }
                            }
                          }
                        },
                        in: { $ifNull: ["$$found.count", 0] }
                      }
                    }
                  }
                }
              }
            },
            in: {
              $arrayToObject: {
                $map: {
                  input: "$$dist",
                  as: "item",
                  in: {
                    k: { $toString: "$$item.score" },
                    v: { count: "$$item.count" }
                  }
                }
              }
            }
          }
        }
      }
    }
  ]);

  // Get total participants and skipped questions count
  const participantStats = await SurveyResponse.aggregate([
    { $match: { sid } },
    {
      $project: {
        participantCount: { $size: "$responses" },
        skippedCount: {
          $size: {
            $filter: {
              input: {
                $reduce: {
                  input: "$responses",
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this.answers"] }
                }
              },
              as: "answer",
              cond: { $eq: ["$$answer.skipped", true] }
            }
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        totalParticipants: { $sum: "$participantCount" },
        totalSkipped: { $sum: "$skippedCount" }
      }
    }
  ]);

  const baseResult = {
    sid,
    title: surveyInfo?.survey?.title || 'Untitled Survey',
    description: surveyInfo?.survey?.description || '',
    totalResponses: participantStats[0]?.totalParticipants || 0,
    totalSkipped: participantStats[0]?.totalSkipped || 0,
    questionAnalytics: survey
  };

  console.log('Base analytics result:', JSON.stringify(baseResult, null, 2));
  return baseResult;
};

const getOverviewAnalytics = async (sid, baseAnalytics) => {
  // Filter out non-score-based question types for overall average calculation
  const scoreBasedQuestions = baseAnalytics.questionAnalytics.filter(q =>
    ['emoji-scale', 'slider', 'star-rating','radio-group'].includes(q.questionType)
  );

  const overallAverage = scoreBasedQuestions.length > 0
    ? scoreBasedQuestions.reduce((sum, q) => sum + q.averageScore, 0) / scoreBasedQuestions.length
    : 0;

  // Calculate completion rate based on how many questions were skipped
  const totalQuestions = baseAnalytics.questionAnalytics.length;
  const skippedPercentage = totalQuestions > 0
    ? (baseAnalytics.totalSkipped / (totalQuestions * baseAnalytics.totalResponses)) * 100
    : 0;
  const completionRate = Math.round(100 - skippedPercentage);

  return {
    ...baseAnalytics,
    overallAverage,
    completionRate,
    questionTypeBreakdown: getQuestionTypeBreakdown(baseAnalytics.questionAnalytics)
  };
};

// Helper function to get distribution of question types
const getQuestionTypeBreakdown = (questions) => {
  const typeCount = {};

  questions.forEach(q => {
    typeCount[q.questionType] = (typeCount[q.questionType] || 0) + 1;
  });

  return Object.entries(typeCount).map(([type, count]) => ({
    type,
    count,
    percentage: Math.round((count / questions.length) * 100)
  }));
};

const getCategoryAnalytics = async (sid, baseAnalytics) => {
  const categoryMap = new Map();

  baseAnalytics.questionAnalytics.forEach(q => {
    // Only process score-based question types for analytics
    if (!['emoji-scale', 'slider', 'star-rating','radio-group'].includes(q.questionType)) {
      return; // Skip non-score-based questions
    }

    if (!categoryMap.has(q.category)) {
      categoryMap.set(q.category, {
        scores: [],
        count: 0,
        questions: [],
        totalResponses: 0,
        highestScore: { question: null, score: 0 },
        lowestScore: { question: null, score: 5 },
        questionTypes: {} // Track question types in this category
      });
    }

    const categoryData = categoryMap.get(q.category);
    categoryData.scores.push(q.averageScore);
    categoryData.count++;
    categoryData.questions.push(q);

    // Track question types
    categoryData.questionTypes[q.questionType] = (categoryData.questionTypes[q.questionType] || 0) + 1;

    // Calculate total responses for this question
    const responsesForQuestion = Object.values(q.distribution || {})
      .reduce((sum, val) => sum + (val.count || 0), 0);

    categoryData.totalResponses += responsesForQuestion;

    // Track highest and lowest scoring questions in this category
    if (q.averageScore > categoryData.highestScore.score) {
      categoryData.highestScore = {
        question: q.question,
        score: q.averageScore,
        questionType: q.questionType
      };
    }
    if (q.averageScore < categoryData.lowestScore.score) {
      categoryData.lowestScore = {
        question: q.question,
        score: q.averageScore,
        questionType: q.questionType
      };
    }
  });

  const categoryAnalytics = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    averageScore: data.scores.length > 0 ?
      data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length : 0,
    questionCount: data.count,
    totalResponses: data.totalResponses,
    highestScoringQuestion: data.highestScore,
    lowestScoringQuestion: data.lowestScore,
    questionTypes: Object.entries(data.questionTypes).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / data.count) * 100)
    }))
  }));

  return {
    ...baseAnalytics,
    categoryAnalytics
  };
};

// Function to get score-based analytics (most positive/negative responses)
const getScoreAnalytics = async (sid, baseAnalytics) => {
  // Filter analytics to only include score-based question types
  const scoreQuestions = baseAnalytics.questionAnalytics.filter(q =>
    ['emoji-scale', 'slider', 'star-rating','radio-group'].includes(q.questionType)
  );

  // Sort questions by average score
  const sortedByScore = [...scoreQuestions].sort((a, b) => a.averageScore - b.averageScore);

  // Group questions by score range
  const scoreRanges = {
    veryNegative: sortedByScore.filter(q => q.averageScore < 2),
    negative: sortedByScore.filter(q => q.averageScore >= 2 && q.averageScore < 3),
    neutral: sortedByScore.filter(q => q.averageScore >= 3 && q.averageScore < 4),
    positive: sortedByScore.filter(q => q.averageScore >= 4 && q.averageScore < 4.5),
    veryPositive: sortedByScore.filter(q => q.averageScore >= 4.5),
  };

  // Group by question type
  const byQuestionType = {};
  scoreQuestions.forEach(q => {
    if (!byQuestionType[q.questionType]) {
      byQuestionType[q.questionType] = [];
    }
    byQuestionType[q.questionType].push(q);
  });

  // Calculate average scores by question type
  const questionTypeAverages = Object.entries(byQuestionType).map(([type, questions]) => ({
    type,
    count: questions.length,
    averageScore: questions.reduce((sum, q) => sum + q.averageScore, 0) / questions.length
  }));

  return {
    ...baseAnalytics,
    scoreRanges,
    questionTypeAverages,
    mostPositive: sortedByScore.slice(-5).reverse(), // Top 5 highest scoring questions
    mostNegative: sortedByScore.slice(0, 5),         // Top 5 lowest scoring questions
  };
};

// Function to extract textual feedback from open-ended questions
async function getTextualFeedback(sid) {
  try {
    const feedback = await SurveyResponse.aggregate([
      { $match: { sid } },
      { $unwind: "$responses" },
      { $unwind: "$responses.answers" },
      {
        $match: {
          "responses.answers.skipped": { $ne: true },
          "responses.answers.questionType": "open-ended"
        }
      },
      {
        $project: {
          _id: 0,
          question: "$responses.answers.question",
          category: "$responses.answers.category",
          answer: "$responses.answers.answer",
          submittedAt: "$responses.submittedAt",
          isAnonymous: "$responses.isAnonymous",
          empId: {
            $cond: {
              if: "$responses.isAnonymous",
              then: "Anonymous",
              else: "$responses.empId"
            }
          }
        }
      },
      { $sort: { submittedAt: -1 } }
    ]);

    return {
      sid,
      totalFeedbackCount: feedback.length,
      feedback
    };
  } catch (err) {
    console.error("Error getting textual feedback:", err);
    throw err;
  }
}

// Function to get specialized analytics for toggle and checkbox questions
const getToggleCheckboxAnalytics = async (sid, baseAnalytics) => {
  try {
    // Query specifically for toggle and checkbox question types
    const toggleCheckboxData = await SurveyResponse.aggregate([
      { $match: { sid } },
      { $unwind: "$responses" },
      { $unwind: "$responses.answers" },
      // Filter for toggle and checkbox question types only
      {
        $match: {
          "responses.answers.skipped": { $ne: true },
          "responses.answers.questionType": { $in: ['toggle', 'checkbox-group'] }
        }
      },
      // Group by question, category, type and specific answer value
      {
        $group: {
          _id: {
            question: "$responses.answers.question",
            category: "$responses.answers.category",
            questionType: "$responses.answers.questionType",
            answer: "$responses.answers.answer",
            // For toggle, we get true/false; for checkbox, we need each option
            answerValue: {
              $cond: {
                if: { $eq: ["$responses.answers.questionType", "toggle"] },
                then: "$responses.answers.answer", // boolean
                else: {
                  $cond: {
                    if: { $isArray: "$responses.answers.answer" },
                    then: "$responses.answers.answer", // ← keep entire array!
                    else: "$responses.answers.answer" // string or null
                  }
                }
              }
            }

          },
          count: { $sum: 1 },
          // Record which user responded
          responders: {
            $addToSet: {
              $cond: {
                if: "$responses.isAnonymous",
                then: "Anonymous",
                else: "$responses.empId"
              }
            }
          }
        }
      },
      // For checkbox questions, we need to track each option separately
      {
        $facet: {
          // Toggle questions - simple true/false analysis
          toggleQuestions: [
            { $match: { "_id.questionType": "toggle" } },
            {
              $group: {
                _id: {
                  question: "$_id.question",
                  category: "$_id.category"
                },
                trueCount: {
                  $sum: {
                    $cond: [{ $eq: ["$_id.answer", 5] }, "$count", 0]
                  }
                },
                falseCount: {
                  $sum: {
                    $cond: [{ $eq: ["$_id.answer", 0] }, "$count", 0]
                  }
                },
                totalResponses: { $sum: "$count" },
                responders: { $addToSet: "$responders" }
              }
            },

  // Step 1: Project consistent structure
 
 { $project: {
                _id: 0,
                question: "$_id.question",
                category: "$_id.category",
                questionType: "toggle",
                responses: {
                  true: "$trueCount",
                  false: "$falseCount"
                },
                // Calculate percentages
                percentages: {
                  true: {
                    $round: [
                      { $multiply: [{ $divide: ["$trueCount", "$totalResponses"] }, 100] },
                      1
                    ]
                  },
                  false: {
                    $round: [
                      { $multiply: [{ $divide: ["$falseCount", "$totalResponses"] }, 100] },
                      1
                    ]
                  }
                },
                totalResponses: "$totalResponses",
                responderCount: { $size: { $reduce: { input: "$responders", initialValue: [], in: { $concatArrays: ["$$value", "$$this"] } } } }
 }} ],

          // Checkbox questions - analyze option frequency
          checkboxQuestions: [
            {
              $match: { "_id.questionType": "checkbox-group" }
            },
            // ✅ Unwind answerValue to handle array responses correctly
            {
              $unwind: "$_id.answerValue"
            },
            {
              $group: {
                _id: {
                  question: "$_id.question",
                  category: "$_id.category",
                  option: "$_id.answerValue"
                },
                selectionCount: { $sum: "$count" },
                responders: { $addToSet: "$responders" }
              }
            },
            {
              $group: {
                _id: {
                  question: "$_id.question",
                  category: "$_id.category"
                },
                options: {
                  $push: {
                    option: "$_id.option",
                    count: "$selectionCount",
                    responders: "$responders"
                  }
                },
                allResponders: { $addToSet: "$responders" }
              }
            },
            {
              $project: {
                _id: 0,
                question: "$_id.question",
                category: "$_id.category",
                questionType: "checkbox-group",
                options: {
                  $map: {
                    input: "$options",
                    as: "option",
                    in: {
                      name: "$$option.option",
                      count: "$$option.count",
                      responderCount: {
                        $size: {
                          $reduce: {
                            input: "$$option.responders",
                            initialValue: [],
                            in: { $concatArrays: ["$$value", "$$this"] }
                          }
                        }
                      }
                    }
                  }
                },
                totalResponders: {
                  $size: {
                    $reduce: {
                      input: "$allResponders",
                      initialValue: [],
                      in: { $concatArrays: ["$$value", "$$this"] }
                    }
                  }
                }
              }
            },
            {
              $addFields: {
                "options": {
                  $map: {
                    input: "$options",
                    as: "opt",
                    in: {
                      name: "$$opt.name",
                      count: "$$opt.count",
                      responderCount: "$$opt.responderCount",
                      percentage: {
                        $round: [
                          {
                            $multiply: [
                              {
                                $cond: [
                                  { $eq: ["$totalResponders", 0] },
                                  0,
                                  { $divide: ["$$opt.responderCount", "$totalResponders"] }
                                ]
                              },
                              100
                            ]
                          },
                          1
                        ]
                      }
                    }
                  }
                }
              }
            }
          ]

        }
      }
    ]);

    // Process and combine the results
    const toggleResults = toggleCheckboxData[0].toggleQuestions || [];
    const checkboxResults = toggleCheckboxData[0].checkboxQuestions || [];

    // Identify top choices from checkbox questions
    const topCheckboxChoices = checkboxResults.map(question => {
      // Sort options by selection count (descending)
      const sortedOptions = [...question.options].sort((a, b) => b.count - a.count);

      return {
        question: question.question,
        category: question.category,
        topChoices: sortedOptions.slice(0, 3), // Top 3 choices
        leastChoices: sortedOptions.slice(-3).reverse(), // Bottom 3 choices
        optionCount: sortedOptions.length
      };
    });

    // Get response rates by category
    const categoryResponseRates = {};
    [...toggleResults, ...checkboxResults].forEach(q => {
      if (!categoryResponseRates[q.category]) {
        categoryResponseRates[q.category] = {
          totalQuestions: 0,
          totalResponders: 0
        };
      }

      categoryResponseRates[q.category].totalQuestions++;

      if (q.questionType === 'toggle') {
        categoryResponseRates[q.category].totalResponders += q.responderCount;
      } else {
        categoryResponseRates[q.category].totalResponders += q.totalResponders;
      }
    });

    // Calculate average responders per category
    Object.keys(categoryResponseRates).forEach(category => {
      const data = categoryResponseRates[category];
      data.averageResponders = Math.round(data.totalResponders / data.totalQuestions);
    });

    return {
      sid: baseAnalytics.sid,
      totalResponses: baseAnalytics.totalResponses,
      toggleQuestions: {
        count: toggleResults.length,
        questions: toggleResults,
        positivePercentage: toggleResults.length > 0 ?
          Math.round(toggleResults.reduce((sum, q) => sum + q.percentages.true, 0) / toggleResults.length) : 0
      },
      checkboxQuestions: {
        count: checkboxResults.length,
        questions: checkboxResults,
        topChoices: topCheckboxChoices
      },
      categoryResponseRates,
      analysisType: 'toggle-checkbox'
    };
  } catch (err) {
    console.error("Error getting toggle-checkbox analytics:", err);
    throw err;
  }
}

export { getSurveyAnalytics, getScoreAnalytics, getTextualFeedback, getToggleCheckboxAnalytics };
