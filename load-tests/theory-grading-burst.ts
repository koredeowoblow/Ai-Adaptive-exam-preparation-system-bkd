import axios from 'axios';
import { logger } from '../src/utils/logger';

const API_URL = 'http://localhost:3000/api/v1';

async function runTheoryGradingBurst() {
  logger.info('Starting theory grading burst test...');
  
  // 1. Log in
  const loginRes = await axios.post(`${API_URL}/auth/login`, {
    email: 'student1@loadtest.com',
    password: 'password123!'
  });
  const token = loginRes.data.data.token;
  const headers = { Authorization: `Bearer ${token}` };

  // 2. Start a batch exam to get theory questions
  const startRes = await axios.post(`${API_URL}/practice-sessions/start`, {
    courseId: 'LTC101',
    mode: 'batch',
    questionCount: 50 // Try to get 50 questions
  }, { headers });

  const session = startRes.data.data.session;
  if (!session) {
    throw new Error('Failed to start session');
  }

  // 3. Filter for theory questions (assuming we seeded theory questions)
  // Our seed script created theory questions, but batch mode selects randomly.
  // We'll submit whatever questions we get, if they are theory they'll go to the queue.
  const questions = session.questions;
  logger.info(`Session started with ${questions.length} questions`);

  const answers = questions.map((q: any) => ({
    questionId: q.questionId,
    answer: "This is a detailed theory answer explaining the core concepts accurately and clearly.",
    timeSpent: 60
  }));

  // 4. Submit the burst
  logger.info(`Submitting ${answers.length} answers in a single burst...`);
  const startTime = Date.now();
  await axios.post(`${API_URL}/practice-sessions/${session._id}/submit-batch`, {
    sessionId: session._id,
    answers
  }, { headers });

  // 5. Poll for grading completion
  logger.info('Burst submitted. Polling for grading completion...');
  let allGraded = false;
  let attempts = 0;
  
  while (!allGraded && attempts < 60) { // Max 1 minute polling
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
    
    const statusRes = await axios.get(`${API_URL}/practice-sessions/${session._id}`, { headers });
    const currentSession = statusRes.data.data;
    
    const pendingQuestions = currentSession.questions.filter((q: any) => 
      !q.isGraded && currentSession.mode === 'batch' // Wait, batch is graded at the end, but if they contain theory, they might take time.
    );

    // Actually, in batch mode, status becomes COMPLETED once graded?
    if (currentSession.status === 'COMPLETED') {
      allGraded = true;
      break;
    } else {
      logger.info(`Polling... Status: ${currentSession.status}`);
    }
  }

  const endTime = Date.now();
  const timeTaken = endTime - startTime;

  if (allGraded) {
    logger.info(`✅ Grading burst completed successfully in ${timeTaken}ms`);
  } else {
    logger.error(`❌ Grading burst timed out after ${timeTaken}ms`);
  }
}

runTheoryGradingBurst().catch(console.error);
