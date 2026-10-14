import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import mongoose from "mongoose";
import { logger } from "../utils/logger";
import { connectDatabase } from "../config/db";
import { departmentController } from "../controllers/department.controller";
import { courseController } from "../controllers/course.controller";
import { topicController } from "../controllers/topic.controller";
import { questionController } from "../controllers/question.controller";
import { authController } from "../controllers/auth.controller";
import { practiceController } from "../controllers/practice.controller";
import { integrityController } from "../controllers/integrity.controller";
import { Achievement } from "../models/achievement.model";
import { Role } from "../models/role.model";
import { Student } from "../models/student.model";
import { Request, Response } from "express";
import { cacheService } from "../utils/cache";
import { redisClient } from "../config/redis";

// Mock Express Request and Response
const mockReq = (user: any, body: any = {}, params: any = {}): any => ({
  user,
  body,
  params,
  query: {},
  headers: {},
});

class MockRes {
  statusCode: number = 200;
  responseData: any = null;

  status(code: number) {
    this.statusCode = code;
    return this;
  }

  json(data: any) {
    this.responseData = data;
    return this;
  }
}

async function seed() {
  try {
    logger.info("Connecting to MongoDB...");
    await connectDatabase();
    logger.info("Connected to MongoDB");

    // Clear existing collections
    logger.info("Clearing old data...");
    await mongoose.connection.db?.dropDatabase();
    logger.info("Database dropped for a fresh seed.");

    try {
      if (redisClient.status !== 'ready') {
        await redisClient.connect().catch(() => { });
      }
      await redisClient.flushdb();
      logger.info("Flushed Redis cache for a fresh seed.");
    } catch {
      await cacheService.deleteByPattern('*').catch(() => { });
    }

    // 1. Base Achievements
    logger.info("--- SEEDING BASE ACHIEVEMENTS ---");
    await Achievement.create([
      {
        name: "First Steps",
        description: "Complete your first practice session.",
        icon: "star",
        requirement: "Complete 1 session",
      },
      {
        name: "On Fire",
        description: "Achieve a 3-day streak.",
        icon: "flame",
        requirement: "3 day streak",
      },
      {
        name: "Subject Master",
        description: "Reach 80% mastery in a topic.",
        icon: "crown",
        requirement: "80% mastery",
      },
    ]);
    logger.info("Seeded base achievements.");

    // 2. Base Admin Roles
    logger.info("--- SEEDING ADMIN ROLE ---");
    const adminRole = await Role.create({
      name: "Administrator",
      slug: "admin",
      description: "System administrator with full access",
      isSystem: true,
      permissionIds: [],
    });

    // 3. Admin User
    logger.info("--- SEEDING ADMIN USER ---");
    const adminAuthRes = new MockRes();
    await authController.register(
      mockReq(null, {
        email: "admin@eduadapt.com",
        password: "AdminPassword123!",
        name: "System Administrator",
      }) as Request,
      adminAuthRes as unknown as Response,
    );
    const admin = adminAuthRes.responseData?.data?.user;
    if (!admin) throw new Error("Failed to create admin user");

    // Assign Admin Role manually
    await Student.findByIdAndUpdate(admin.id, {
      $push: { roleIds: adminRole._id },
    });
    logger.info(`Registered Admin User: ${admin.email}`);

    const adminActor = { id: admin.id };

    // 4. Normal Student User
    logger.info("--- SEEDING STUDENT USER ---");
    const studentAuthRes = new MockRes();
    await authController.register(
      mockReq(null, {
        email: "student@eduadapt.com",
        password: "StudentPassword123!",
        name: "Demo Student",
      }) as Request,
      studentAuthRes as unknown as Response,
    );
    const student = studentAuthRes.responseData?.data?.user;
    if (!student) throw new Error("Failed to create student user");
    logger.info(`Registered Student User: ${student.email}`);

    const studentActor = { id: student.id };

    // 5. Departments, Courses, Topics, and Questions
    logger.info("--- SEEDING REAL DEPARTMENTS, COURSES, AND QUESTIONS ---");

    const seedData = [
      {
        dept: "Computer Science",
        desc: "Study of computation, algorithms, and systems.",
        courses: [
          {
            title: "Data Structures", code: "CS101", qs: [
              { q: "What is the time complexity of array index access?", a: "O(1)", b: "O(n)", c: "O(log n)", d: "O(n^2)", ans: "A", exp: "Direct memory access takes constant time." },
              { q: "Which structure uses LIFO?", a: "Queue", b: "Stack", c: "Tree", d: "Graph", ans: "B", exp: "Stacks are Last-In-First-Out." },
              { q: "What is the worst-case time for QuickSort?", a: "O(n)", b: "O(n log n)", c: "O(n^2)", d: "O(1)", ans: "C", exp: "Occurs when pivot is extremely unbalanced." },
              { q: "Which tree traversal visits root, left, right?", a: "Inorder", b: "Postorder", c: "Preorder", d: "Level-order", ans: "C", exp: "Preorder processes the node before its children." }
            ]
          },
          {
            title: "Operating Systems", code: "CS102", qs: [
              { q: "What is a context switch?", a: "Changing variables", b: "Switching CPU to another process", c: "Turning off OS", d: "Network routing", ans: "B", exp: "Saves state of old process and loads new one." },
              { q: "Which is a synchronization primitive?", a: "Mutex", b: "Cache", c: "Register", d: "Socket", ans: "A", exp: "Mutex provides mutual exclusion." },
              { q: "What causes a page fault?", a: "Divide by zero", b: "Accessing swapped out memory", c: "Syntax error", d: "Hardware failure", ans: "B", exp: "The page must be fetched from disk." },
              { q: "Which algorithm avoids deadlock?", a: "Round Robin", b: "Banker's Algorithm", c: "FCFS", d: "LRU", ans: "B", exp: "Banker's checks state safety before granting." }
            ]
          },
          {
            title: "Databases", code: "CS103", qs: [
              { q: "What does ACID stand for?", a: "Atomicity, Consistency, Isolation, Durability", b: "Active, Code, Index, Data", c: "Array, Class, Integer, Double", d: "Auto, Create, Insert, Delete", ans: "A", exp: "Core properties of database transactions." },
              { q: "Which SQL clause filters groups?", a: "WHERE", b: "HAVING", c: "ORDER BY", d: "GROUP BY", ans: "B", exp: "HAVING applies to aggregated group records." },
              { q: "What is a primary key?", a: "First column", b: "Unique row identifier", c: "Foreign key reference", d: "Encrypted password", ans: "B", exp: "Must be unique and not null." },
              { q: "What solves read anomalies?", a: "Indexing", b: "Normalization", c: "Isolation Levels", d: "Triggers", ans: "C", exp: "Higher isolation prevents dirty/phantom reads." }
            ]
          },
          {
            title: "Computer Networks", code: "CS104", qs: [
              { q: "Which protocol is connection-oriented?", a: "UDP", b: "TCP", c: "IP", d: "ICMP", ans: "B", exp: "TCP guarantees delivery via handshakes." },
              { q: "What layer is IP on in OSI?", a: "Data Link", b: "Transport", c: "Network", d: "Application", ans: "C", exp: "Layer 3 handles routing." },
              { q: "What does DNS do?", a: "Encrypts data", b: "Resolves domain to IP", c: "Allocates IP addresses", d: "Blocks malware", ans: "B", exp: "Translates human-readable names to IPs." },
              { q: "What is the port for HTTPS?", a: "80", b: "21", c: "443", d: "22", ans: "C", exp: "Port 443 is standard for secure web traffic." }
            ]
          },
          {
            title: "Artificial Intelligence", code: "CS105", qs: [
              { q: "What is backpropagation?", a: "A sorting algorithm", b: "Error gradient descent method", c: "Data compression", d: "Network routing", ans: "B", exp: "Used to update weights in neural nets." },
              { q: "What defines a Markov Decision Process?", a: "States, Actions, Rewards, Transitions", b: "Inputs, Outputs, Weights", c: "Nodes, Edges, Costs", d: "Tokens, Syntax, Grammar", ans: "A", exp: "Mathematical framework for reinforcement learning." },
              { q: "What is overfitting?", a: "Model is too small", b: "Model memorizes training data", c: "Model runs too fast", d: "Model ignores features", ans: "B", exp: "High variance, poor generalization." },
              { q: "Which search guarantees shortest path?", a: "DFS", b: "BFS", c: "Random Walk", d: "Heuristic Search", ans: "B", exp: "BFS finds shortest path on unweighted graphs." }
            ]
          }
        ]
      },
      {
        dept: "Mathematics",
        desc: "Study of numbers, quantities, and shapes.",
        courses: [
          {
            title: "Calculus I", code: "MAT101", qs: [
              { q: "What is the derivative of x^2?", a: "x", b: "2x", c: "x^3/3", d: "2", ans: "B", exp: "Power rule: bring down the exponent." },
              { q: "What does the integral represent?", a: "Slope", b: "Area under curve", c: "Point of inflection", d: "Limit", ans: "B", exp: "Definite integral calculates net area." },
              { q: "Limit of sin(x)/x as x->0?", a: "0", b: "1", c: "Infinity", d: "Undefined", ans: "B", exp: "Fundamental trigonometric limit." },
              { q: "Derivative of e^x?", a: "e^x", b: "x*e^(x-1)", c: "ln(x)", d: "1/x", ans: "A", exp: "e^x is its own derivative." }
            ]
          },
          {
            title: "Linear Algebra", code: "MAT102", qs: [
              { q: "What is the determinant of the identity matrix?", a: "0", b: "1", c: "n", d: "-1", ans: "B", exp: "Identity matrix determinant is always 1." },
              { q: "What are eigenvectors?", a: "Vectors that don't change direction under transformation", b: "Zero vectors", c: "Orthogonal vectors", d: "Unit vectors", ans: "A", exp: "Av = lambda * v." },
              { q: "What does rank of a matrix denote?", a: "Size", b: "Max number of linearly independent columns", c: "Number of zeroes", d: "Trace", ans: "B", exp: "Dimension of the column space." },
              { q: "If determinant is 0, the matrix is...", a: "Invertible", b: "Singular", c: "Orthogonal", d: "Symmetric", ans: "B", exp: "Cannot be inverted." }
            ]
          },
          {
            title: "Discrete Math", code: "MAT103", qs: [
              { q: "How many subsets does a set of size n have?", a: "n", b: "n^2", c: "2^n", d: "n!", ans: "C", exp: "Each element is either in or out." },
              { q: "What is p -> q logically equivalent to?", a: "q -> p", b: "~p OR q", c: "~q AND p", d: "p AND q", ans: "B", exp: "Material implication." },
              { q: "What principle states if n items are put into m containers, with n > m, then at least one container must contain more than one item?", a: "Pigeonhole", b: "Inclusion-Exclusion", c: "Well-ordering", d: "Induction", ans: "A", exp: "Basic counting principle." },
              { q: "What is a connected graph with no cycles?", a: "Bipartite", b: "Complete", c: "Tree", d: "Planar", ans: "C", exp: "Definition of a tree in graph theory." }
            ]
          },
          {
            title: "Probability & Statistics", code: "MAT104", qs: [
              { q: "What is the sum of all probabilities in a sample space?", a: "0", b: "0.5", c: "1", d: "100", ans: "C", exp: "Probabilities must sum to 1." },
              { q: "What measures the spread of data?", a: "Mean", b: "Median", c: "Variance", d: "Mode", ans: "C", exp: "Variance measures average squared deviation." },
              { q: "What distribution represents a bell curve?", a: "Binomial", b: "Normal", c: "Poisson", d: "Uniform", ans: "B", exp: "Normal or Gaussian distribution." },
              { q: "P(A|B) is calculated using...", a: "Bayes' Theorem", b: "Central Limit Theorem", c: "Law of Large Numbers", d: "Markov's Inequality", ans: "A", exp: "Relates conditional probabilities." }
            ]
          },
          {
            title: "Differential Equations", code: "MAT105", qs: [
              { q: "What is the order of y'' + y = 0?", a: "First", b: "Second", c: "Third", d: "Zero", ans: "B", exp: "Highest derivative is second derivative." },
              { q: "Solution to y' = y is?", a: "y=x", b: "y=x^2", c: "y=ce^x", d: "y=sin(x)", ans: "C", exp: "Exponential function is its own derivative." },
              { q: "What transforms ODEs into algebraic equations?", a: "Fourier Transform", b: "Laplace Transform", c: "Taylor Series", d: "Euler's Method", ans: "B", exp: "Laplace turns differentiation into multiplication." },
              { q: "What is an integrating factor used for?", a: "Finding roots", b: "Solving non-exact linear ODEs", c: "Matrix inversion", d: "Graphing", ans: "B", exp: "Multiplies ODE to make it exact." }
            ]
          }
        ]
      },
      {
        dept: "Business Administration",
        desc: "Management, marketing, and finance.",
        courses: [
          {
            title: "Microeconomics", code: "BUS101", qs: [
              { q: "What is opportunity cost?", a: "Price of goods", b: "Value of next best alternative", c: "Accounting loss", d: "Sunk cost", ans: "B", exp: "What you give up to get something." },
              { q: "Law of Demand states price and quantity demanded are...", a: "Inversely related", b: "Directly related", c: "Unrelated", d: "Equal", ans: "A", exp: "As price rises, demand falls." },
              { q: "What market structure has a single seller?", a: "Perfect Competition", b: "Oligopoly", c: "Monopoly", d: "Monopsony", ans: "C", exp: "Mono = single, poly = seller." },
              { q: "What is marginal utility?", a: "Total satisfaction", b: "Extra satisfaction from one more unit", c: "Cost of production", d: "Tax rate", ans: "B", exp: "Utility gained from marginal consumption." }
            ]
          },
          {
            title: "Financial Accounting", code: "BUS102", qs: [
              { q: "What is the accounting equation?", a: "Assets = Liabilities + Equity", b: "Profit = Revenue - Cost", c: "Debit = Credit", d: "Cash = Income", ans: "A", exp: "Fundamental balance sheet equation." },
              { q: "Which statement shows profitability over time?", a: "Balance Sheet", b: "Income Statement", c: "Cash Flow Statement", d: "Retained Earnings", ans: "B", exp: "Tracks revenues and expenses." },
              { q: "What is depreciation?", a: "Increase in value", b: "Allocation of asset cost over time", c: "Cash withdrawal", d: "Tax penalty", ans: "B", exp: "Matches expense to asset's useful life." },
              { q: "What type of account is Accounts Payable?", a: "Asset", b: "Liability", c: "Equity", d: "Revenue", ans: "B", exp: "Money owed to creditors." }
            ]
          },
          {
            title: "Marketing Principles", code: "BUS103", qs: [
              { q: "What are the 4 Ps of Marketing?", a: "Product, Price, Place, Promotion", b: "People, Process, Physical, Plan", c: "Price, Profit, Percentage, Pull", d: "Product, Package, Pitch, Play", ans: "A", exp: "The traditional marketing mix." },
              { q: "What is market segmentation?", a: "Raising prices", b: "Dividing market into distinct groups", c: "Firing employees", d: "Buying competitors", ans: "B", exp: "Targeting specific consumer profiles." },
              { q: "What is a brand?", a: "A logo", b: "Customer's overall perception", c: "A legal trademark", d: "A product line", ans: "B", exp: "Encompasses identity, reputation, and emotion." },
              { q: "What is B2B?", a: "Business to Buyer", b: "Business to Business", c: "Brand to Brand", d: "Back to Back", ans: "B", exp: "Commerce between two businesses." }
            ]
          },
          {
            title: "Organizational Behavior", code: "BUS104", qs: [
              { q: "What is Maslow's highest need?", a: "Safety", b: "Esteem", c: "Self-actualization", d: "Physiological", ans: "C", exp: "Realizing personal potential." },
              { q: "What describes a company's shared values?", a: "Corporate Strategy", b: "Organizational Culture", c: "Mission Statement", d: "Hierarchy", ans: "B", exp: "The 'personality' of the organization." },
              { q: "What is Groupthink?", a: "Brainstorming", b: "Desire for harmony resulting in irrational decisions", c: "Team building", d: "Democratic voting", ans: "B", exp: "Prioritizes consensus over critical evaluation." },
              { q: "Which leadership style involves employees in decisions?", a: "Autocratic", b: "Laissez-faire", c: "Democratic", d: "Transformational", ans: "C", exp: "Also known as participative leadership." }
            ]
          },
          {
            title: "Corporate Finance", code: "BUS105", qs: [
              { q: "What is NPV?", a: "Net Present Value", b: "New Product Volume", c: "Net Profit Variance", d: "No Par Value", ans: "A", exp: "Present value of cash flows." },
              { q: "What does a stock represent?", a: "Debt", b: "Ownership equity", c: "Insurance", d: "Commodity", ans: "B", exp: "Shares of ownership in a corporation." },
              { q: "What is diversification?", a: "Putting all money in one stock", b: "Spreading investments to reduce risk", c: "Taking out a loan", d: "Paying dividends", ans: "B", exp: "Don't put all eggs in one basket." },
              { q: "What does ROI stand for?", a: "Rate of Inflation", b: "Return on Investment", c: "Risk of Insolvency", d: "Revenue Over Income", ans: "B", exp: "Measure of profitability." }
            ]
          }
        ]
      },
      {
        dept: "Biology",
        desc: "Study of living organisms.",
        courses: [
          {
            title: "Cell Biology", code: "BIO101", qs: [
              { q: "What is the powerhouse of the cell?", a: "Nucleus", b: "Mitochondria", c: "Ribosome", d: "Golgi", ans: "B", exp: "Generates ATP." },
              { q: "What process produces somatic cells?", a: "Meiosis", b: "Mitosis", c: "Osmosis", d: "Apoptosis", ans: "B", exp: "Cell division for growth and repair." },
              { q: "What is the cell membrane made of?", a: "Cellulose", b: "Phospholipid bilayer", c: "Peptidoglycan", d: "Chitin", ans: "B", exp: "Lipid layer with embedded proteins." },
              { q: "Where is DNA stored in eukaryotes?", a: "Cytoplasm", b: "Nucleus", c: "Vacuole", d: "Lysosome", ans: "B", exp: "Membrane-bound organelle containing genetics." }
            ]
          },
          {
            title: "Genetics", code: "BIO102", qs: [
              { q: "Who is the father of genetics?", a: "Darwin", b: "Mendel", c: "Watson", d: "Crick", ans: "B", exp: "Discovered inheritance laws with pea plants." },
              { q: "What pairs with Adenine in DNA?", a: "Cytosine", b: "Guanine", c: "Thymine", d: "Uracil", ans: "C", exp: "A-T and C-G base pairing." },
              { q: "What is a phenotype?", a: "Genetic makeup", b: "Observable trait", c: "Mutation", d: "Chromosome", ans: "B", exp: "Physical expression of genes." },
              { q: "How many chromosomes do human gametes have?", a: "46", b: "23", c: "22", d: "44", ans: "B", exp: "Haploid number is 23." }
            ]
          },
          {
            title: "Ecology", code: "BIO103", qs: [
              { q: "What is an ecosystem?", a: "A single species", b: "Community interacting with environment", c: "A climate zone", d: "A food chain", ans: "B", exp: "Biotic and abiotic factors." },
              { q: "What role do plants play in a food web?", a: "Consumers", b: "Decomposers", c: "Producers", d: "Scavengers", ans: "C", exp: "They produce energy via photosynthesis." },
              { q: "What is a symbiotic relationship where both benefit?", a: "Parasitism", b: "Commensalism", c: "Mutualism", d: "Predation", ans: "C", exp: "Mutual benefit." },
              { q: "What is the carrying capacity?", a: "Weight limit", b: "Max population an environment can sustain", c: "Reproductive rate", d: "Migration rate", ans: "B", exp: "Determined by limiting factors." }
            ]
          },
          {
            title: "Human Anatomy", code: "BIO104", qs: [
              { q: "What is the longest bone in the body?", a: "Humerus", b: "Femur", c: "Tibia", d: "Fibula", ans: "B", exp: "The thigh bone." },
              { q: "What organ pumps blood?", a: "Lungs", b: "Liver", c: "Heart", d: "Brain", ans: "C", exp: "The cardiovascular pump." },
              { q: "Which blood cells fight infection?", a: "Red", b: "White", c: "Platelets", d: "Plasma", ans: "B", exp: "Leukocytes are immune cells." },
              { q: "Where does most digestion occur?", a: "Stomach", b: "Large Intestine", c: "Small Intestine", d: "Esophagus", ans: "C", exp: "Nutrient absorption mostly happens here." }
            ]
          },
          {
            title: "Evolutionary Biology", code: "BIO105", qs: [
              { q: "Who proposed Natural Selection?", a: "Lamarck", b: "Darwin", c: "Linnaeus", d: "Wallace", ans: "B", exp: "Charles Darwin (alongside Wallace)." },
              { q: "What is survival of the fittest?", a: "Strongest survive", b: "Best adapted reproduce", c: "Fastest survive", d: "Oldest survive", ans: "B", exp: "Fitness means reproductive success." },
              { q: "What are homologous structures?", a: "Same function, different origin", b: "Same origin, different function", c: "Vestigial organs", d: "Mutations", ans: "B", exp: "e.g. human arm and bat wing." },
              { q: "What is genetic drift?", a: "Directed mutation", b: "Random changes in allele frequency", c: "Migration", d: "Natural selection", ans: "B", exp: "More pronounced in small populations." }
            ]
          }
        ]
      },
      {
        dept: "History",
        desc: "Study of past events and civilizations.",
        courses: [
          {
            title: "Ancient Civilizations", code: "HIS101", qs: [
              { q: "Where did writing originate?", a: "Egypt", b: "Mesopotamia", c: "China", d: "Greece", ans: "B", exp: "Cuneiform in Sumer." },
              { q: "Who built the Pyramids of Giza?", a: "Romans", b: "Mayans", c: "Egyptians", d: "Aztecs", ans: "C", exp: "Old Kingdom pharaohs." },
              { q: "What was the first known code of laws?", a: "Ten Commandments", b: "Code of Hammurabi", c: "Magna Carta", d: "Justinian Code", ans: "B", exp: "Babylonian legal text." },
              { q: "Who was the first emperor of Rome?", a: "Julius Caesar", b: "Augustus", c: "Nero", d: "Constantine", ans: "B", exp: "Octavian became Augustus." }
            ]
          },
          {
            title: "World War II", code: "HIS102", qs: [
              { q: "When did WWII begin?", a: "1914", b: "1939", c: "1941", d: "1945", ans: "B", exp: "Invasion of Poland." },
              { q: "Which countries formed the Axis powers?", a: "US, UK, USSR", b: "Germany, Italy, Japan", c: "France, Poland, China", d: "Spain, Turkey, Sweden", ans: "B", exp: "The primary fascist alliance." },
              { q: "What was the D-Day invasion?", a: "Invasion of Russia", b: "Bombing of Pearl Harbor", c: "Allied invasion of Normandy", d: "Fall of Berlin", ans: "C", exp: "Operation Overlord in 1944." },
              { q: "Which city was the first to be hit by an atomic bomb?", a: "Tokyo", b: "Hiroshima", c: "Nagasaki", d: "Kyoto", ans: "B", exp: "Dropped on August 6, 1945." }
            ]
          },
          {
            title: "American History", code: "HIS103", qs: [
              { q: "Who was the first US President?", a: "Lincoln", b: "Jefferson", c: "Washington", d: "Adams", ans: "C", exp: "George Washington." },
              { q: "When was the Declaration of Independence signed?", a: "1776", b: "1789", c: "1492", d: "1812", ans: "A", exp: "July 4, 1776." },
              { q: "Which war was fought over slavery and states' rights?", a: "Revolutionary War", b: "War of 1812", c: "Civil War", d: "Mexican-American War", ans: "C", exp: "1861 to 1865." },
              { q: "What did the 19th Amendment do?", a: "End slavery", b: "Grant women the right to vote", c: "Establish income tax", d: "Prohibit alcohol", ans: "B", exp: "Ratified in 1920." }
            ]
          },
          {
            title: "European History", code: "HIS104", qs: [
              { q: "What period followed the Middle Ages?", a: "Antiquity", b: "Renaissance", c: "Industrial Revolution", d: "Enlightenment", ans: "B", exp: "Rebirth of culture and art." },
              { q: "Who started the Protestant Reformation?", a: "Henry VIII", b: "John Calvin", c: "Martin Luther", d: "Pope Leo X", ans: "C", exp: "Nailed the 95 Theses in 1517." },
              { q: "What event sparked the French Revolution?", a: "Storming of the Bastille", b: "Execution of Louis XVI", c: "Reign of Terror", d: "Waterloo", ans: "A", exp: "July 14, 1789." },
              { q: "Who was defeated at the Battle of Waterloo?", a: "Hitler", b: "Napoleon", c: "Bismarck", d: "Caesar", ans: "B", exp: "Napoleon's final defeat in 1815." }
            ]
          },
          {
            title: "Asian History", code: "HIS105", qs: [
              { q: "Who built the Great Wall of China?", a: "Han Dynasty", b: "Qin Dynasty", c: "Ming Dynasty", d: "Multiple Dynasties", ans: "D", exp: "Started by Qin, expanded by Ming and others." },
              { q: "What was the samurai code of honor?", a: "Bushido", b: "Seppuku", c: "Ronin", d: "Shogun", ans: "A", exp: "The way of the warrior." },
              { q: "Who was the founder of the Mongol Empire?", a: "Kublai Khan", b: "Genghis Khan", c: "Attila", d: "Timur", ans: "B", exp: "United the nomadic tribes." },
              { q: "Which country was partitioned in 1947?", a: "Korea", b: "Vietnam", c: "India", d: "China", ans: "C", exp: "Into India and Pakistan." }
            ]
          }
        ]
      }
    ];

    const createdDepartments: any = {};
    const createdCourses: any = {};

    for (const dData of seedData) {
      const res = new MockRes();
      await departmentController.create(
        mockReq(adminActor, { name: dData.dept, description: dData.desc, createdBy: adminActor.id }) as Request,
        res as unknown as Response,
      );
      const dept = res.responseData?.data;
      createdDepartments[dept.name] = dept;
      logger.info(`Created Department: ${dept.name}`);

      for (const cData of dData.courses) {
        const cRes = new MockRes();
        await courseController.create(
          mockReq(adminActor, {
            title: cData.title,
            code: cData.code,
            departmentId: dept._id,
            description: `${cData.title} curriculum`,
            level: 100 + Math.floor(Math.random() * 4) * 100, // Random level between 100, 200, 300, 400
            topics: cData.qs.map((q: any) => q.q.split(' ')[0]), // Simple mock topics from question text
            createdBy: adminActor.id,
          }) as Request,
          cRes as unknown as Response,
        );
        const course = cRes.responseData?.data;
        createdCourses[course.title] = course;
        logger.info(`Created Course: ${course.title}`);

        // Create Topic
        const topicRes = new MockRes();
        await topicController.create(
          mockReq(adminActor, {
            name: `Fundamentals of ${course.title}`,
            courseId: course._id,
            order: 1,
            createdBy: adminActor.id,
          }) as Request,
          topicRes as unknown as Response,
        );
        const topic = topicRes.responseData?.data;

        // Seed 200 Questions using the real templates
        logger.info(`Seeding 200 questions for ${course.title}...`);
        for (let i = 1; i <= 200; i++) {
          const qTemplate = cData.qs[(i - 1) % cData.qs.length];
          const variantText = ` [Variant ${i}]`;
          const isTheory = i % 5 === 0;

          const qRes = new MockRes();
          const questionData: any = {
            topicId: topic._id,
            questionText: qTemplate.q + variantText,
            explanation: qTemplate.exp,
            explanationSource: "manual",
            eloRating: 1000 + Math.floor(Math.random() * 800), // Random elo 1000-1800
            createdBy: adminActor.id,
          };

          if (isTheory) {
            questionData.type = "THEORY";
            questionData.modelAnswer = "This is a detailed model answer for the concept: " + qTemplate.exp;
            questionData.rubric = [
              { point: "Identifies core concept", weight: 0.5 },
              { point: "Provides accurate reasoning", weight: 0.5 }
            ];
          } else {
            questionData.type = "MULTIPLE_CHOICE";
            questionData.options = [
              { id: "A", text: qTemplate.a },
              { id: "B", text: qTemplate.b },
              { id: "C", text: qTemplate.c },
              { id: "D", text: qTemplate.d },
            ];
            questionData.correctAnswer = qTemplate.ans;
          }

          await questionController.create(
            mockReq(adminActor, questionData) as Request,
            qRes as unknown as Response,
          );
        }
        logger.info(`Successfully seeded 200 questions for ${course.title}`);
      }
    }

    // Assign Computer Science department and courses to demo student, mark isOnboarded: true
    const csDept = createdDepartments["Computer Science"];
    const csCourseIds = Object.values(createdCourses).map((c: any) => c._id);
    if (csDept && student) {
      await Student.findByIdAndUpdate(student.id, {
        departmentId: csDept._id,
        level: '100L',
        isOnboarded: true,
        $addToSet: { enrolledCourseIds: { $each: csCourseIds } }
      });
      logger.info(`Assigned demo student to ${csDept.name} with ${csCourseIds.length} courses (isOnboarded: true).`);
    }

    logger.info("Seeding completed successfully!");

  } catch (error) {
    logger.error("Error during seeding:", error);
    process.exit(1);
  } finally {
    try {
      if (redisClient && typeof redisClient.disconnect === 'function') {
        redisClient.disconnect();
      }
    } catch (_) { }
    await mongoose.disconnect();
    process.exit(0);
  }
}

if (require.main === module) {
  seed();
}

