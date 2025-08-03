import ComplianceTest from '../models/ComplianceTest.js';
import ComplianceResponse from '../models/ComplianceResponse.js';
import { v4 as uuidv4 } from 'uuid';

export const saveNewTest = async (test, questions, workspacename) => {
  const newTest = new ComplianceTest({ 
    sid: uuidv4(), 
    test, 
    questions, 
    workspacename: workspacename || 'default' // Add workspace field
  });
  await newTest.save();
  return newTest;
};

export const getTestForUser = async (testId) => {
  const test = await ComplianceTest.findOne({ sid: testId });
  if (!test) throw new Error('Test not found');
  return test.questions.map(q => ({
    _id: q._id,
    question: q.question,
    options: q.options,
  }));
};

export const gradeUserAnswers = async (employeeId, testId, answers, timeSpent = 0) => {
  console.log('gradeUserAnswers called with:', { employeeId, testId, answers, timeSpent });
  
  const test = await ComplianceTest.findOne({ sid: testId });
  if (!test) {
    console.log('Test not found for testId:', testId);
    throw new Error('Test not found');
  }

  console.log('Found test:', test.test.title);
  console.log('Test questions:', test.questions.length);

  let correctCount = 0;
  test.questions.forEach(q => {
    const userAnswer = answers[q._id];
    const correctAnswer = q.answer;
    const isCorrect = userAnswer === correctAnswer;
    console.log(`Question ${q._id}: User: "${userAnswer}", Correct: "${correctAnswer}", Match: ${isCorrect}`);
    if (isCorrect) {
      correctCount++;
    }
  });

  const score = test.questions.length > 0 ? (correctCount / test.questions.length) * 100 : 0;
  const status = score >= 80 ? 'Pass' : 'Fail';

  console.log('Final scoring:', { correctCount, totalQuestions: test.questions.length, score, status });

  const responseData = {
    employeeId, 
    testId, 
    answers, 
    score, 
    status,
    timeSpent: timeSpent || 0
  };
  
  console.log('Creating ComplianceResponse with data:', responseData);

  const newResponse = new ComplianceResponse(responseData);
  await newResponse.save();

  console.log('ComplianceResponse saved successfully');

  return { score: score.toFixed(0), status, timeSpent };
};