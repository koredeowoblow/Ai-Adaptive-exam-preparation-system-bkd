import { SeedDiagrams } from "./seed-diagrams";

export interface SeedSubPart {
  id: string;
  label: string; // e.g. "1(a)", "1(a)(i)", "1(a)(ii)", "1(a)(iii)", "1(b)", "1(b)(i)", "1(b)(ii)", "1(c)"
  prompt: string;
  maxMarks: number;
  modelAnswer: string;
  rubric: { point: string; weight: number }[];
  diagramUrl?: string;
  diagramCaption?: string;
  order?: number;
}

export interface SeedQuestion {
  q: string;
  a?: string;
  b?: string;
  c?: string;
  d?: string;
  ans?: string;
  exp: string;
  type?: 'MULTIPLE_CHOICE' | 'THEORY';
  diagramUrl?: string;
  diagramCaption?: string;
  hasSubParts?: boolean;
  subParts?: SeedSubPart[];
  modelAnswer?: string;
  rubric?: { point: string; weight: number }[];
}

export interface SeedCourse {
  title: string;
  code: string;
  level: 100 | 200 | 300 | 400 | 500;
  qs: SeedQuestion[];
}

export interface SeedDepartment {
  dept: string;
  desc: string;
  faculty: string;
  courses: SeedCourse[];
}

export const lasustechSeedData: SeedDepartment[] = [
  // ==========================================
  // COLLEGE OF BASIC SCIENCES
  // ==========================================
  {
    dept: "Computer Science",
    desc: "Rigorous education in software development, algorithms, artificial intelligence, and computing systems at Lagos State University of Science and Technology.",
    faculty: "College of Basic Sciences",
    courses: [
      {
        title: "Introduction to Computer Science",
        code: "CSC101",
        level: 100,
        qs: [
          { q: "What is the primary function of the Central Processing Unit (CPU)?", a: "Storing long-term files", b: "Executing instructions and processing data", c: "Managing network routing", d: "Rendering sound signals", ans: "B", exp: "The CPU performs arithmetic, logical, and control operations to execute program instructions." },
          { q: "Which number system is native to digital computer hardware?", a: "Decimal", b: "Binary", c: "Octal", d: "Hexadecimal", ans: "B", exp: "Digital electronics operate on high and low voltage states representing binary 1 and 0." },
          { q: "What is the role of an operating system kernel?", a: "Translating HTML", b: "Core resource management and hardware abstraction", c: "Scanning malware", d: "Compiling Python", ans: "B", exp: "The kernel manages CPU, memory, and device drivers at the lowest privilege level." },
          {
            q: "Consider the digital logic circuit schematic shown in Figure 1.1, representing a 1-bit binary Full Adder with carry lookahead logic.",
            exp: "Comprehensive digital logic analysis of a 1-bit full adder circuit including Boolean formulation, truth table derivation, propagation delay, and glitch hazard mitigation.",
            type: "THEORY",
            diagramUrl: SeedDiagrams.fullAdderCircuit,
            diagramCaption: "Figure 1.1: 1-Bit Full Adder Logic Gate Schematic",
            hasSubParts: true,
            subParts: [
              {
                id: "part-1a",
                label: "1(a)",
                prompt: "Define the operational role of a Full Adder in modern arithmetic logic units (ALU), and distinguish its functionality from a Half Adder.",
                maxMarks: 4,
                modelAnswer: "A Full Adder computes the arithmetic sum of three single binary bits: two input operands (A and B) and an incoming carry bit (Cin). In contrast, a Half Adder only adds two single-bit operands (A and B) and lacks any mechanism to incorporate an incoming carry from a previous arithmetic stage. Consequently, cascading multiple Full Adders allows arbitrary n-bit binary integer addition in ALUs.",
                rubric: [
                  { point: "Accurate distinction regarding Cin acceptance between Full and Half Adders", weight: 2 },
                  { point: "Operational role in cascading multi-bit arithmetic units within modern ALUs", weight: 2 }
                ],
                order: 1
              },
              {
                id: "part-1a-i",
                label: "1(a)(i)",
                prompt: "Derive the canonical Boolean algebraic expression for the Sum output terminal S in terms of inputs A, B, and Cin.",
                maxMarks: 3,
                modelAnswer: "The Sum output represents the odd-parity XOR sum of all three inputs: S = A ⊕ B ⊕ Cin. In canonical sum-of-products (SOP) minterm form: S = A'B'Cin + A'BCin' + AB'Cin' + ABCin.",
                rubric: [
                  { point: "Correct Boolean expression S = A ⊕ B ⊕ Cin", weight: 1.5 },
                  { point: "Canonical SOP or intermediate XOR gate derivation", weight: 1.5 }
                ],
                order: 2
              },
              {
                id: "part-1a-ii",
                label: "1(a)(ii)",
                prompt: "Derive the minimized Boolean algebraic expression for the Carry Out (Cout) terminal, and show how it is synthesized from gates XOR 1, AND 1, AND 2, and OR 1 in Figure 1.1.",
                maxMarks: 4,
                modelAnswer: "The Carry Out signal is generated when at least two inputs are 1: Cout = (A · B) + (Cin · (A ⊕ B)). Gate synthesis: AND 1 computes A · B, XOR 1 computes A ⊕ B, AND 2 computes Cin · (A ⊕ B), and OR 1 sums these two partial terms to yield Cout.",
                rubric: [
                  { point: "Correct Boolean equation Cout = (A·B) + Cin·(A⊕B)", weight: 2 },
                  { point: "Explicit mapping of terms to circuit gates AND1, AND2, and OR1", weight: 2 }
                ],
                order: 3
              },
              {
                id: "part-1a-iii",
                label: "1(a)(iii)",
                prompt: "Construct the complete truth table for all eight input combinations of (A, B, Cin) verifying the Sum and Carry Out outputs.",
                maxMarks: 4,
                modelAnswer: "Truth table: (0,0,0)->(S=0,Cout=0); (0,0,1)->(S=1,Cout=0); (0,1,0)->(S=1,Cout=0); (0,1,1)->(S=0,Cout=1); (1,0,0)->(S=1,Cout=0); (1,0,1)->(S=0,Cout=1); (1,1,0)->(S=0,Cout=1); (1,1,1)->(S=1,Cout=1).",
                rubric: [
                  { point: "All 8 input combinations listed systematically", weight: 2 },
                  { point: "100% accurate Sum and Carry Out evaluation across all rows", weight: 2 }
                ],
                order: 4
              },
              {
                id: "part-1b-i",
                label: "1(b)(i)",
                prompt: "Refer to the timing waveform shown below. Explain what causes the transient static-1 hazard glitch at Output Y during input transitions.",
                diagramUrl: SeedDiagrams.timingWaveform,
                diagramCaption: "Figure 1.2: Gate Propagation Delay & Hazard Glitch Waveform",
                maxMarks: 5,
                modelAnswer: "Static hazards occur due to unequal propagation delays along converging signal paths. When input A transitions, the direct path to the gate responds faster than the delayed path through Node X (Δt = 4.2ns). During this brief propagation window, both inputs to the output gate momentarily satisfy the false condition, dropping the output to 0 before recovering to 1.",
                rubric: [
                  { point: "Identification of unequal path propagation delays", weight: 2.5 },
                  { point: "Explanation of momentary invalid state during signal race", weight: 2.5 }
                ],
                order: 5
              },
              {
                id: "part-1b-ii",
                label: "1(b)(ii)",
                prompt: "Propose two engineering remedies to eliminate or mask this hazard glitch in synchronous high-speed digital systems.",
                maxMarks: 4,
                modelAnswer: "1) Adding redundant consensus terms (hazard-free logic synthesis) on Karnaugh maps to bridge adjacent minterm groupings. 2) Synchronous clock gating and registering outputs into D flip-flops, sampling signals only after the propagation delay and glitch have settled.",
                rubric: [
                  { point: "Consensus terms / redundant cover on Karnaugh map", weight: 2 },
                  { point: "Synchronous registered output / clock sampling delay", weight: 2 }
                ],
                order: 6
              }
            ]
          }
        ]
      },
      {
        title: "Problem Solving & Algorithm Design",
        code: "CSC102",
        level: 100,
        qs: [
          { q: "What is an algorithm in computing?", a: "A programming language syntax", b: "Step-by-step sequence of instructions to solve a problem", c: "A hardware component", d: "A database table", ans: "B", exp: "An algorithm is an unambiguous, finite sequence of steps solving a specific computational task." },
          { q: "Which graphical tool represents logic flow with shapes like diamonds and rectangles?", a: "UML Class Diagram", b: "Flowchart", c: "Circuit schematic", d: "Entity Relationship Diagram", ans: "B", exp: "Flowcharts use standardized symbols to trace decision branches and execution flow." },
          { q: "What control structure repeatedly executes a block of code while a condition is true?", a: "Sequence", b: "Selection", c: "Iteration / Loop", d: "Exception", ans: "C", exp: "While and for loops iterate code blocks until termination criteria are met." },
          {
            q: "Figure 6.1 displays the state transition graph of a Deterministic Finite Automaton (DFA) over the alphabet Σ = {0, 1}.",
            exp: "Formal language and automata analysis of a 3-state DFA verifying language recognition, string tracing, transition functions, and regular expression synthesis.",
            type: "THEORY",
            diagramUrl: SeedDiagrams.dfaAutomaton,
            diagramCaption: "Figure 6.1: DFA State Transition Graph for Language L",
            hasSubParts: true,
            subParts: [
              {
                id: "part-dfa-1a",
                label: "1a",
                prompt: "Define a Deterministic Finite Automaton formally as a 5-tuple M = (Q, Σ, δ, q0, F) and specify the exact mathematical set components for the automaton illustrated in Figure 6.1.",
                maxMarks: 4,
                modelAnswer: "A DFA is a 5-tuple M = (Q, Σ, δ, q0, F) where: Q is the finite set of states {q0, q1, q2}; Σ is the finite input alphabet {0, 1}; δ: Q × Σ → Q is the transition function; q0 ∈ Q is the designated initial state (q0); and F ⊆ Q is the set of accepting / final states {q2}.",
                rubric: [
                  { point: "Accurate theoretical 5-tuple definition of a DFA", weight: 2 },
                  { point: "Correct specification of Q, Σ, q0, and F from Figure 6.1", weight: 2 }
                ],
                order: 1
              },
              {
                id: "part-dfa-ai",
                label: "ai",
                prompt: "Trace the step-by-step state sequence for each of the following input strings, and state whether each string is ACCEPTED or REJECTED: (i) '10101', (ii) '00100', (iii) '1101'.",
                maxMarks: 4,
                modelAnswer: "(i) '10101': q0 --1--> q0 --0--> q1 --1--> q2 --0--> q1 --1--> q2 (Ends in q2: ACCEPTED). (ii) '00100': q0 --0--> q1 --0--> q1 --1--> q2 --0--> q1 --0--> q1 (Ends in q1: REJECTED). (iii) '1101': q0 --1--> q0 --1--> q0 --0--> q1 --1--> q2 (Ends in q2: ACCEPTED).",
                rubric: [
                  { point: "Accurate path trace for string (i) and correct acceptance verdict", weight: 1.5 },
                  { point: "Accurate path traces for strings (ii) and (iii) with correct verdicts", weight: 2.5 }
                ],
                order: 2
              },
              {
                id: "part-dfa-aii",
                label: "aii",
                prompt: "State in precise mathematical set-builder notation the exact regular language L recognized by this automaton.",
                maxMarks: 3,
                modelAnswer: "L = { w ∈ {0, 1}* | w ends with the substring '01' }. Formally: L = { x01 | x ∈ {0, 1}* }.",
                rubric: [
                  { point: "Clear identification that strings must terminate with '01'", weight: 1.5 },
                  { point: "Proper formal set-builder or concatenation notation", weight: 1.5 }
                ],
                order: 3
              },
              {
                id: "part-dfa-aiii",
                label: "aiii",
                prompt: "Construct the complete state transition table δ(q, σ) for all states q ∈ Q and inputs σ ∈ Σ.",
                maxMarks: 3,
                modelAnswer: "Transition Table:\nState | Input 0 | Input 1\n----------------------\n-> q0 |   q1    |   q0  \n   q1 |   q1    |   q2  \n * q2 |   q1    |   q0  ",
                rubric: [
                  { point: "Systematic matrix/table structure with initial and accepting indicators", weight: 1 },
                  { point: "100% correct transition targets across all 6 state-input combinations", weight: 2 }
                ],
                order: 4
              },
              {
                id: "part-dfa-1b",
                label: "1b",
                prompt: "Derive an equivalent regular expression for the language accepted by this DFA using the state elimination technique or Arden's Lemma.",
                maxMarks: 4,
                modelAnswer: "Starting at q0, strings can loop on '1's or consume any sequence of '0's and '1's as long as they terminate with '01'. The resulting minimal regular expression is: (0 + 1)* 0 1.",
                rubric: [
                  { point: "Valid derivation steps via state elimination or prefix analysis", weight: 2 },
                  { point: "Accurate final regular expression (0+1)*01", weight: 2 }
                ],
                order: 5
              },
              {
                id: "part-dfa-bi",
                label: "bi",
                prompt: "State the Pumping Lemma for regular languages, and outline the proof technique to establish that the non-regular language L_pal = { w w^R | w ∈ {0,1}* } cannot be recognized by any finite automaton.",
                maxMarks: 4,
                modelAnswer: "The Pumping Lemma states that for any regular language L, there exists a pumping length p such that any string s ∈ L with |s| >= p can be split into s = xyz satisfying: 1) |y| > 0, 2) |xy| <= p, 3) for all i >= 0, x(y^i)z ∈ L. To prove L_pal is not regular, choose string s = 0^p 1 1 0^p. Because |xy| <= p, y consists purely of 0s. Pumping with i = 0 or 2 yields an unequal count of 0s on the sides, violating symmetry and contradicting regularity.",
                rubric: [
                  { point: "Precise statement of Pumping Lemma 3 conditions", weight: 2 },
                  { point: "Sound contradiction proof by pumping a chosen adversary string", weight: 2 }
                ],
                order: 6
              },
              {
                id: "part-dfa-bii",
                label: "bii",
                prompt: "Explain how to construct a DFA that recognizes the intersection of two regular languages L1 and L2 using the Cartesian Product Machine construction.",
                maxMarks: 4,
                modelAnswer: "Given DFAs M1 = (Q1, Σ, δ1, q01, F1) and M2 = (Q2, Σ, δ2, q02, F2), the product DFA M_inter is defined with Q = Q1 × Q2, start state (q01, q02), transition function δ((p, q), a) = (δ1(p, a), δ2(q, a)), and accepting states F = F1 × F2. A string is accepted if and only if both machines simultaneously land in their respective accepting states.",
                rubric: [
                  { point: "Formulation of Cartesian product states Q1 × Q2 and composite transitions", weight: 2 },
                  { point: "Acceptance condition F1 × F2 for language intersection", weight: 2 }
                ],
                order: 7
              }
            ]
          }
        ]
      },
      {
        title: "Data Structures & Algorithms",
        code: "CSC201",
        level: 200,
        qs: [
          { q: "What is the average lookup time complexity of a hash table with good distribution?", a: "O(n)", b: "O(1)", c: "O(log n)", d: "O(n^2)", ans: "B", exp: "Hash tables map keys directly to array buckets in constant expected time." },
          { q: "Which data structure operates on a Last-In First-Out (LIFO) discipline?", a: "Queue", b: "Stack", c: "Binary Tree", d: "Linked List", ans: "B", exp: "Stacks push and pop elements from the same end, enforcing LIFO behavior." },
          { q: "What is the worst-case time complexity of QuickSort?", a: "O(n)", b: "O(n log n)", c: "O(n^2)", d: "O(1)", ans: "C", exp: "QuickSort degrades to quadratic time when pivots produce maximally unbalanced partitions." },
          { q: "Explain how a binary search tree maintains its ordering invariant during node insertion.", exp: "During insertion, values smaller than the current node traverse left, while values greater traverse right until an available empty child pointer is found." }
        ]
      },
      {
        title: "Object-Oriented Programming with Java",
        code: "CSC202",
        level: 200,
        qs: [
          { q: "Which OOP pillar hides internal implementation details behind public methods?", a: "Inheritance", b: "Polymorphism", c: "Encapsulation", d: "Aggregation", ans: "C", exp: "Encapsulation restricts direct state access, enforcing access through getters, setters, or methods." },
          { q: "What Java keyword allows a subclass to inherit from a parent class?", a: "implements", b: "extends", c: "inherits", d: "super", ans: "B", exp: "The extends keyword declares an inheritance hierarchy between classes." },
          { q: "What is method overriding in object-oriented programming?", a: "Multiple methods with same name and different parameters", b: "Subclass re-implementing an inherited parent method", c: "Calling a private method externally", d: "Hiding a class variable", ans: "B", exp: "Method overriding provides specialized behavior in a derived class for a method declared in the superclass." },
          { q: "Describe the distinction between method overloading and method overriding in object-oriented languages.", exp: "Overloading occurs within the same class using identical method names with differing parameter signatures at compile time; overriding occurs across class hierarchies at runtime." }
        ]
      },
      {
        title: "Operating Systems & Systems Programming",
        code: "CSC301",
        level: 300,
        qs: [
          { q: "What is a context switch in modern operating systems?", a: "Reallocating disk space", b: "Saving and restoring CPU state between processes", c: "Changing system timezone", d: "Installing updates", ans: "B", exp: "Context switching preserves program counter and registers of an outgoing process and loads the incoming process state." },
          { q: "Which synchronization primitive prevents race conditions by allowing only one thread into a critical section?", a: "Semaphore", b: "Mutex", c: "Pipe", d: "Socket", ans: "B", exp: "Mutual exclusion locks (mutexes) serialize access to shared memory." },
          { q: "What virtual memory condition occurs when pages are constantly swapped out, severely degrading throughput?", a: "Fragmentation", b: "Thrashing", c: "Deadlock", d: "Starvation", ans: "B", exp: "Thrashing occurs when the resident set exceeds physical RAM, forcing continuous page faulting." },
          { q: "Explain the four Coffman conditions required for system deadlock to occur.", exp: "Deadlock requires mutual exclusion, hold and wait, no preemption, and circular wait occurring simultaneously." }
        ]
      },
      {
        title: "Database Design & Management Systems",
        code: "CSC303",
        level: 300,
        qs: [
          { q: "What does ACID stand for in relational transaction processing?", a: "Active, Code, Index, Data", b: "Atomicity, Consistency, Isolation, Durability", c: "Automated, Cached, Integrated, Distributed", d: "Array, Column, Integer, Double", ans: "B", exp: "ACID represents the fundamental reliability guarantees of relational transaction management." },
          { q: "Which normal form requires removing transitive dependencies on non-key columns?", a: "First Normal Form", b: "Second Normal Form", c: "Third Normal Form", d: "Boyce-Codd Normal Form", ans: "C", exp: "Third Normal Form (3NF) ensures non-prime attributes depend solely and directly on candidate keys." },
          { q: "Which index structure is universally used in relational database engines for fast range scans?", a: "Hash Index", b: "B+ Tree", c: "Binary Search Tree", d: "Red-Black Tree", ans: "B", exp: "B+ Trees maintain sorted leaf nodes linked in a sequence, ideal for sequential and range lookups." },
          { q: "Describe the trade-offs between database normalization and denormalization in high-performance applications.", exp: "Normalization prevents data redundancy and update anomalies but requires expensive joins; denormalization speeds up read queries at the expense of duplicate data and complex writes." }
        ]
      },
      {
        title: "Artificial Intelligence & Expert Systems",
        code: "CSC401",
        level: 400,
        qs: [
          { q: "What algorithm computes gradients of the loss function with respect to neural network weights?", a: "A* Search", b: "Backpropagation", c: "Simulated Annealing", d: "Dijkstra's Algorithm", ans: "B", exp: "Backpropagation applies the calculus chain rule backwards through network layers to calculate weight gradients." },
          { q: "Which machine learning paradigm learns an optimal policy through rewards and penalties?", a: "Supervised Learning", b: "Unsupervised Learning", c: "Reinforcement Learning", d: "Self-supervised Learning", ans: "C", exp: "Reinforcement learning agents interact with environments to maximize cumulative expected return." },
          { q: "What regularization technique randomly drops neuron activations during training to prevent co-adaptation?", a: "Batch Normalization", b: "Dropout", c: "Gradient Clipping", d: "Weight Decay", ans: "B", exp: "Dropout prevents neural networks from relying excessively on specific co-adapted neuron pathways." },
          { q: "Explain the difference between supervised learning and unsupervised learning with practical examples.", exp: "Supervised learning trains models on labeled input-output pairs like spam classification, whereas unsupervised learning discovers latent patterns like customer clustering without ground truth targets." }
        ]
      },
      {
        title: "Software Engineering & Project Management",
        code: "CSC403",
        level: 400,
        qs: [
          { q: "Which software development methodology emphasizes short sprints, daily standups, and adaptive planning?", a: "Waterfall", b: "Agile Scrum", c: "V-Model", d: "Big Bang", ans: "B", exp: "Scrum structures work into iterative sprints with continuous stakeholder feedback." },
          { q: "What software architectural pattern separates application state, user interface, and control flow?", a: "Microkernel", b: "Model-View-Controller (MVC)", c: "Event-Driven", d: "Pipe and Filter", ans: "B", exp: "MVC isolates business logic (Model) from presentation (View) and user input routing (Controller)." },
          { q: "What type of software testing verifies that individual functions and classes work correctly in isolation?", a: "Acceptance Testing", b: "Integration Testing", c: "Unit Testing", d: "Smoke Testing", ans: "C", exp: "Unit tests validate discrete, isolated blocks of code using test runners and mocks." },
          { q: "Describe the trade-offs between monolithic architecture and microservices architecture.", exp: "Monoliths offer simple development and atomic deployments but become difficult to scale and maintain; microservices offer independent scalability and tech diversity at the cost of network complexity." }
        ]
      }
    ]
  },

  // ==========================================
  // COLLEGE OF ENGINEERING & TECHNOLOGY
  // ==========================================
  {
    dept: "Computer Engineering",
    desc: "Design and integration of computational hardware, digital circuits, embedded systems, and robotics at Lagos State University of Science and Technology.",
    faculty: "College of Engineering & Technology",
    courses: [
      {
        title: "General Engineering Mathematics I",
        code: "CPE101",
        level: 100,
        qs: [
          { q: "What is the derivative of f(x) = 3x^3 - 4x + 7 with respect to x?", a: "9x^2 - 4", b: "6x^2 - 4x", c: "9x - 4", d: "3x^2 - 4", ans: "A", exp: "By power rule: d/dx(3x^3) = 9x^2, d/dx(-4x) = -4, and constant derivative is 0." },
          { q: "What mathematical property characterizes two perpendicular vectors?", a: "Cross product is 1", b: "Dot product is 0", c: "Magnitudes are equal", d: "Angle is 0 degrees", ans: "B", exp: "The dot product of orthogonal vectors is zero since cos(90) = 0." },
          { q: "What does the definite integral of a function represent geometrically?", a: "Slope of the tangent line", b: "Net signed area between curve and x-axis", c: "Radius of curvature", d: "Inflection point", ans: "B", exp: "Integration sums infinitesimal rectangular strips under a function curve." },
          { q: "State and explain the fundamental theorem of calculus and its application in engineering.", exp: "It establishes the connection between differentiation and integration, stating that integration can be solved by evaluating an antiderivative at boundary limits." }
        ]
      },
      {
        title: "Digital Logic & Switching Circuits",
        code: "CPE201",
        level: 200,
        qs: [
          { q: "Which Boolean logic gate outputs 1 only when all its inputs are 1?", a: "OR", b: "AND", c: "XOR", d: "NOR", ans: "B", exp: "AND gates perform logical conjunction, yielding true only when every input evaluates to true." },
          { q: "How many distinct input combinations exist for a truth table with 4 Boolean variables?", a: "8", b: "16", c: "32", d: "64", ans: "B", exp: "A binary system with n variables produces 2^n states (2^4 = 16)." },
          { q: "What sequential logic device stores a single bit of state using feedback?", a: "Multiplexer", b: "Flip-Flop", c: "Decoder", d: "Full Adder", ans: "B", exp: "Flip-flops are bistable multivibrators that latch state synchronized to clock transitions." },
          { q: "Explain the difference between combinational logic and sequential logic circuits.", exp: "Combinational logic outputs depend exclusively on present inputs without memory, whereas sequential circuits use feedback and clocks to retain memory of past states." }
        ]
      },
      {
        title: "Microprocessor Systems & Assembly Language",
        code: "CPE301",
        level: 300,
        qs: [
          { q: "What register holds the memory address of the next instruction to be fetched?", a: "Accumulator", b: "Program Counter (PC)", c: "Stack Pointer (SP)", d: "Instruction Register (IR)", ans: "B", exp: "The program counter advances sequentially or jumps during branch execution." },
          { q: "What bus architecture carries memory addresses from CPU to system RAM?", a: "Data Bus", b: "Address Bus", c: "Control Bus", d: "Power Bus", ans: "B", exp: "The address bus specifies the physical target memory location for read and write operations." },
          { q: "What hardware mechanism allows external devices to halt CPU execution for urgent processing?", a: "Polling", b: "Hardware Interrupt", c: "Direct Memory Access", d: "Context Switch", ans: "B", exp: "Interrupt request lines trigger CPU interrupt service routines (ISRs) immediately." },
          { q: "Describe the three phases of the classic microprocessor instruction execution cycle.", exp: "Fetch retrieves the instruction from memory address into IR; Decode determines opcode and operands; Execute carries out arithmetic, logic, or data transfer." }
        ]
      },
      {
        title: "Embedded Systems & IoT Engineering",
        code: "CPE401",
        level: 400,
        qs: [
          { q: "Which protocol is a lightweight publish-subscribe messaging transport popular in IoT?", a: "HTTP/1.1", b: "MQTT", c: "FTP", d: "SSH", ans: "B", exp: "Message Queuing Telemetry Transport (MQTT) operates on low bandwidth and minimal packet overhead." },
          { q: "What hardware feature resets a microcontroller if firmware enters an infinite hanging loop?", a: "Brownout detector", b: "Watchdog Timer", c: "Phase-locked loop", d: "Schmitt trigger", ans: "B", exp: "Watchdog timers periodically expect keep-alive kicks, resetting hardware if firmware freezes." },
          { q: "Which serial communication bus uses two wires named SDA (Serial Data) and SCL (Serial Clock)?", a: "SPI", b: "UART", c: "I2C", d: "CAN", ans: "C", exp: "Inter-Integrated Circuit (I2C) enables multi-master communication using bidirectional open-drain lines." },
          { q: "Explain how Pulse Width Modulation (PWM) is used to control DC motor speed in embedded systems.", exp: "PWM rapidly alternates power on and off at fixed frequency; varying duty cycle changes the effective average voltage supplied to the motor without excessive heat loss." }
        ]
      },
      {
        title: "Robotics & Autonomous Intelligent Systems",
        code: "CPE501",
        level: 500,
        qs: [
          { q: "What kinematic analysis computes end-effector position given known joint angles?", a: "Inverse Kinematics", b: "Forward Kinematics", c: "Differential Kinematics", d: "Dynamics", ans: "B", exp: "Forward kinematics maps joint coordinates through geometric transformation matrices to tool position." },
          { q: "What algorithm solves Simultaneous Localization and Mapping (SLAM) in mobile robots?", a: "Extended Kalman Filter (EKF)", b: "Bubble Sort", c: "Bellman-Ford", d: "RSA", ans: "A", exp: "EKF-SLAM estimates robotic vehicle pose and landmark positions under sensor noise." },
          { q: "Which sensor emits light pulses to measure variable distances for 3D spatial mapping?", a: "Sonar", b: "LiDAR", c: "Potentiometer", d: "Thermocouple", ans: "B", exp: "Light Detection and Ranging (LiDAR) computes distance via time-of-flight reflections of laser beams." },
          { q: "Describe the distinction between forward kinematics and inverse kinematics in robotic manipulator design.", exp: "Forward kinematics calculates hand position from known joint angles; inverse kinematics computes the complex multiple joint angles required to position the hand at a specified target coordinate." }
        ]
      }
    ]
  },

  {
    dept: "Electrical & Electronics Engineering",
    desc: "Power generation, transmission, industrial electronics, telecommunications, and control engineering at Lagos State University of Science and Technology.",
    faculty: "College of Engineering & Technology",
    courses: [
      {
        title: "Applied Physics for Engineers",
        code: "EEE101",
        level: 100,
        qs: [
          { q: "What physical law states that electrostatic force is inversely proportional to square of distance?", a: "Ohm's Law", b: "Coulomb's Law", c: "Gauss's Law", d: "Faraday's Law", ans: "B", exp: "Coulomb's Law quantifies attractive or repulsive force between two stationary electric charges." },
          { q: "What is the SI unit of magnetic flux density?", a: "Weber", b: "Tesla", c: "Henry", d: "Farad", ans: "B", exp: "Magnetic flux density B is measured in Teslas (T), equivalent to Webers per square meter." },
          { q: "Which device converts electrical energy into mechanical rotational motion?", a: "Alternator", b: "Electric Motor", c: "Transformer", d: "Rectifier", ans: "B", exp: "Lorentz forces on current-carrying conductors in magnetic fields produce continuous motor rotation." },
          { q: "State Faraday's law of electromagnetic induction and write its mathematical formulation.", exp: "Faraday's law states that induced electromotive force in a circuit equals the negative time rate of change of magnetic flux through the circuit: EMF = -d(Phi)/dt." }
        ]
      },
      {
        title: "Electric Circuit Theory & Network Analysis",
        code: "EEE201",
        level: 200,
        qs: [
          { q: "What does Kirchhoff's Current Law (KCL) state regarding an electrical node?", a: "Sum of currents entering equals sum leaving", b: "Voltage drop across node is zero", c: "Resistance equals zero", d: "Power is doubled", ans: "A", exp: "KCL enforces conservation of electric charge: algebraic sum of currents at any junction is zero." },
          { q: "What theorem replaces any linear circuit with an equivalent voltage source in series with a resistor?", a: "Norton's Theorem", b: "Thevenin's Theorem", c: "Superposition Theorem", d: "Maximum Power Theorem", ans: "B", exp: "Thevenin's theorem simplifies two-terminal networks to V_th and series R_th." },
          { q: "Under what condition does maximum power transfer occur from a source to a load?", a: "R_load = 0", b: "R_load = R_source", c: "R_load is infinite", d: "V_load = 0", ans: "B", exp: "Maximum power transfer theorem requires load resistance to equal the internal source Thevenin resistance." },
          { q: "Explain the procedure for applying Thevenin theorem to simplify a complex DC electrical network.", exp: "First disconnect the load resistor; second calculate open-circuit voltage across terminals as V_th; third deactivate independent sources and find equivalent resistance R_th." }
        ]
      },
      {
        title: "Electromagnetic Fields & Wave Propagation",
        code: "EEE301",
        level: 300,
        qs: [
          { q: "Which Maxwell equation states that magnetic monopoles do not exist?", a: "Gauss's Law for Electricity", b: "Gauss's Law for Magnetism (div B = 0)", c: "Faraday's Law", d: "Ampere-Maxwell Law", ans: "B", exp: "Divergence of magnetic field B is zero everywhere, meaning magnetic field lines form continuous closed loops." },
          { q: "What is the speed of electromagnetic waves in a vacuum?", a: "3.0 x 10^6 m/s", b: "3.0 x 10^8 m/s", c: "3.0 x 10^10 m/s", d: "330 m/s", ans: "B", exp: "Light and radio waves travel at c = 1 / sqrt(mu_0 * epsilon_0) approximately 3.0 x 10^8 meters per second." },
          { q: "What wave parameter represents the ratio of electric field to magnetic field in a medium?", a: "Propagation constant", b: "Intrinsic Impedance (eta)", c: "Dielectric loss", d: "Skin depth", ans: "B", exp: "Intrinsic impedance eta equals sqrt(mu / epsilon), which is approximately 377 ohms in free space." },
          { q: "Discuss skin effect in high-frequency electrical conductors and its engineering implications.", exp: "Alternating currents at high frequencies concentrate near conductor outer surfaces due to eddy currents, increasing effective AC resistance and necessitating stranded or hollow conductors." }
        ]
      },
      {
        title: "Control Systems Engineering",
        code: "EEE401",
        level: 400,
        qs: [
          { q: "Which controller combines proportional, integral, and derivative action to stabilize dynamic processes?", a: "LQR Controller", b: "PID Controller", c: "Bang-bang Controller", d: "Lead-Lag Compensator", ans: "B", exp: "PID controllers correct present error (P), eliminate steady-state offset (I), and anticipate future trends (D)." },
          { q: "What mathematical transformation converts differential equations into s-domain algebraic equations?", a: "Fourier Transform", b: "Laplace Transform", c: "Z-Transform", d: "Wavelet Transform", ans: "B", exp: "Laplace transformation replaces differentiation with algebraic multiplication by complex frequency variable s." },
          { q: "Where must closed-loop poles lie in the complex s-plane for an LTI system to be strictly stable?", a: "Right-half plane", b: "Left-half plane", c: "On the imaginary axis", d: "At infinity", ans: "B", exp: "Left-half plane poles guarantee exponential decay of transient response." },
          { q: "Explain the role of each term (P, I, and D) in a closed-loop PID control system.", exp: "Proportional action responds to current error magnitude, Integral eliminates persistent steady-state error, and Derivative dampens oscillation by damping error rate of change." }
        ]
      },
      {
        title: "Power Systems Analysis & Protection",
        code: "EEE501",
        level: 500,
        qs: [
          { q: "What method solves non-linear power flow equations in large electrical transmission grids?", a: "Euler's Method", b: "Newton-Raphson Method", c: "Simplex Method", d: "Cramer's Rule", ans: "B", exp: "Newton-Raphson provides quadratic convergence for solving real and reactive power mismatch equations." },
          { q: "What symmetrical component transformation resolves unbalanced 3-phase faults into balanced sets?", a: "Fourier Analysis", b: "Fortescue Transformation", c: "Clarke Transformation", d: "Park Transformation", ans: "B", exp: "Fortescue decomposition resolves unbalanced phases into positive, negative, and zero sequence networks." },
          { q: "Which protective device opens circuit breakers when it detects high-magnitude short-circuit currents?", a: "Isolator switch", b: "Protective Relay", c: "Surge arrester", d: "Capacitor bank", ans: "B", exp: "Protective relays sense fault currents via instrument transformers and send trip signals to circuit breakers." },
          { q: "Explain the operating principle of differential protection for power transformers.", exp: "Differential relays measure current entering and leaving transformer windings; under normal conditions currents balance, but internal faults create an imbalance that trips the breaker." }
        ]
      }
    ]
  },

  {
    dept: "Mechanical Engineering",
    desc: "Thermodynamics, fluid mechanics, machine design, materials engineering, and automotive systems at Lagos State University of Science and Technology.",
    faculty: "College of Engineering & Technology",
    courses: [
      {
        title: "Technical Drawing & Descriptive Geometry",
        code: "MEE101",
        level: 100,
        qs: [
          { q: "Which projection method depicts three faces of an object inclined equally at 120 degrees?", a: "Oblique Projection", b: "Isometric Projection", c: "Perspective Projection", d: "First-angle Projection", ans: "B", exp: "Isometric drawings place axes at 120 degrees to represent 3D components without perspective foreshortening." },
          { q: "In engineering drawings, what line type represents hidden edges and contours?", a: "Continuous thick line", b: "Dashed / Hidden line", c: "Center line with long and short dashes", d: "Zigzag line", ans: "B", exp: "Dashed lines denote surfaces obscured behind visible foreground features." },
          { q: "What scale is used when an engineering drawing is drawn to exact real physical size?", a: "1:2", b: "1:1", c: "2:1", d: "1:100", ans: "B", exp: "Scale 1:1 represents full real-world dimensioning." },
          { q: "Explain the difference between first-angle and third-angle orthographic projections.", exp: "In first-angle projection, the object lies between observer and projection plane (European standard); in third-angle, the projection plane lies between observer and object (American standard)." }
        ]
      },
      {
        title: "Strength of Materials & Mechanics of Solids",
        code: "MEE201",
        level: 200,
        qs: [
          { q: "What is Hooke's Law in elastic solid mechanics?", a: "Stress is proportional to strain", b: "Force equals mass times acceleration", c: "Pressure equals force over area", d: "Work equals torque times angle", ans: "A", exp: "Within the proportional limit, tensile stress sigma is directly proportional to strain epsilon (sigma = E * epsilon)." },
          { q: "What property measures a material's resistance to localized plastic indentation or scratching?", a: "Ductility", b: "Hardness", c: "Toughness", d: "Malleability", ans: "B", exp: "Hardness testing measures resistance to permanent surface penetration under indenters." },
          { q: "What is the ratio of lateral strain to axial strain called in elastic materials?", a: "Shear Modulus", b: "Poisson's Ratio", c: "Bulk Modulus", d: "Yield Strength", ans: "B", exp: "Poisson's ratio nu characterizes lateral contraction during longitudinal stretching." },
          { q: "Draw and explain the key regions of the engineering stress-strain curve for mild structural steel.", exp: "The curve displays an initial linear elastic region up to proportional limit, upper and lower yield points, plastic strain hardening, ultimate tensile strength, and necking prior to fracture." }
        ]
      },
      {
        title: "Applied Thermodynamics & Heat Engines",
        code: "MEE301",
        level: 300,
        qs: [
          { q: "Which ideal thermodynamic cycle models the operation of spark-ignition petrol engines?", a: "Diesel Cycle", b: "Otto Cycle", c: "Brayton Cycle", d: "Rankine Cycle", ans: "B", exp: "The Otto cycle consists of two isentropic processes and two constant-volume heat transfer processes." },
          { q: "What thermodynamic property remains strictly constant during an isentropic process?", a: "Enthalpy", b: "Entropy", c: "Pressure", d: "Temperature", ans: "B", exp: "An isentropic process is both reversible and adiabatic, maintaining constant entropy." },
          { q: "What law of thermodynamics states that entropy of an isolated system always increases over time?", a: "Zeroth Law", b: "First Law", c: "Second Law", d: "Third Law", ans: "C", exp: "The Second Law dictates that natural processes increase overall entropy, prohibiting 100% efficient heat engines." },
          { q: "Explain the four processes that constitute the ideal Carnot thermodynamic cycle.", exp: "Carnot cycle comprises isothermal heat addition at high temperature, isentropic expansion, isothermal heat rejection at low temperature, and isentropic compression to starting state." }
        ]
      },
      {
        title: "Fluid Mechanics & Turbo-Machinery",
        code: "MEE401",
        level: 400,
        qs: [
          { q: "What dimensionless number predicts laminar versus turbulent flow in a circular pipe?", a: "Mach Number", b: "Reynolds Number", c: "Froude Number", d: "Nusselt Number", ans: "B", exp: "Reynolds number Re = rho * v * D / mu relates inertial forces to viscous forces." },
          { q: "Which equation expresses conservation of mechanical energy along a streamline in inviscid, incompressible flow?", a: "Navier-Stokes Equation", b: "Bernoulli's Equation", c: "Continuity Equation", d: "Poiseuille Equation", ans: "B", exp: "Bernoulli's equation states P + 0.5*rho*v^2 + rho*g*h remains constant along a streamline." },
          { q: "What impulse hydraulic turbine uses high-velocity water jets striking double-hemispherical buckets?", a: "Francis Turbine", b: "Kaplan Turbine", c: "Pelton Wheel", d: "Darrieus Turbine", ans: "C", exp: "Pelton wheels extract kinetic energy from high-head, low-discharge fluid nozzles." },
          { q: "Derive and interpret the physical significance of the continuity equation for steady incompressible fluid flow.", exp: "From conservation of mass, mass flow rate remains constant: A1 * V1 = A2 * V2, showing velocity increases when cross-sectional flow area constricts." }
        ]
      },
      {
        title: "Refrigeration, Air Conditioning & Thermal Systems",
        code: "MEE501",
        level: 500,
        qs: [
          { q: "Which component in vapor-compression refrigeration reduces refrigerant pressure from condenser to evaporator?", a: "Compressor", b: "Expansion Valve / Capillary Tube", c: "Accumulator", d: "Receiver", ans: "B", exp: "Throttling valves cause isenthalpic pressure and temperature drop before evaporator entry." },
          { q: "What performance index is defined as desired cooling output divided by required electrical work input?", a: "Thermal Efficiency", b: "Coefficient of Performance (COP)", c: "Carnot Factor", d: "Energy Factor", ans: "B", exp: "COP = Q_evaporator / W_compressor, typically exceeding 1 in efficient cooling cycles." },
          { q: "What chart displays relationships between dry-bulb temperature, wet-bulb temperature, and relative humidity?", a: "Mollier Diagram", b: "Psychrometric Chart", c: "Moody Chart", d: "S-N Curve", ans: "B", exp: "Psychrometric charts plot atmospheric moist air thermodynamic properties for HVAC calculations." },
          { q: "Describe the four main thermodynamic steps in the standard vapor-compression refrigeration cycle.", exp: "First isentropic compression of vapor, second isobaric heat rejection in condenser, third isenthalpic throttling expansion, and fourth isobaric heat absorption in evaporator." }
        ]
      }
    ]
  },

  {
    dept: "Civil & Construction Engineering",
    desc: "Structural engineering, highways, environmental hydraulics, soil geotechnics, and urban infrastructure at Lagos State University of Science and Technology.",
    faculty: "College of Engineering & Technology",
    courses: [
      {
        title: "Civil Engineering Materials & Construction",
        code: "CVE101",
        level: 100,
        qs: [
          { q: "What chemical compound in Ordinary Portland Cement provides early strength within the first 7 days?", a: "Dicalcium Silicate (C2S)", b: "Tricalcium Silicate (C3S)", c: "Tricalcium Aluminate (C3A)", d: "Tetracalcium Aluminoferrite", ans: "B", exp: "C3S hydrates rapidly, providing early compressive strength in concrete curing." },
          { q: "What standard test assesses the workability and consistency of fresh concrete on-site?", a: "Tensile Splitting Test", b: "Slump Test", c: "Schmidt Rebound Hammer Test", d: "Proctor Compaction Test", ans: "B", exp: "The slump test measures concrete cone subsidence under gravity to verify water-cement consistency." },
          { q: "What aggregate size separates fine aggregate (sand) from coarse aggregate (gravel)?", a: "0.075 mm", b: "4.75 mm", c: "12.5 mm", d: "25 mm", ans: "B", exp: "Particles passing through a 4.75 mm (No. 4) sieve are categorized as fine aggregate." },
          { q: "Explain the hydration reaction of cement and the critical importance of concrete curing.", exp: "Hydration is an exothermic reaction forming calcium silicate hydrate gel (C-S-H); moist curing prevents early water evaporation and thermal cracking to ensure targeted compressive strength." }
        ]
      },
      {
        title: "Plane Surveying & Field Geomatics",
        code: "CVE201",
        level: 200,
        qs: [
          { q: "What optical surveying instrument measures both horizontal and vertical angles with high precision?", a: "Dumpy Level", b: "Theodolite", c: "Prismatic Compass", d: "Abney Level", ans: "B", exp: "Theodolites measure horizontal and zenith angles for triangulation and traverse control." },
          { q: "What type of leveling uses a telescope to determine height differences relative to a benchmark?", a: "Barometric leveling", b: "Differential leveling", c: "Trigonometric leveling", d: "Stadia leveling", ans: "B", exp: "Differential leveling reads staff heights across back-sights and fore-sights along a leveling route." },
          { q: "What error occurs in chaining or taping when the tape droops under its own self-weight?", a: "Pull error", b: "Sag error", c: "Slope error", d: "Alignment error", ans: "B", exp: "Sag causes the tape to form a catenary curve, making recorded span measurements longer than true horizontal distance." },
          { q: "Describe the method of Radiation and Intersection in Plane Table Surveying.", exp: "Radiation plots points by measuring directional rays and distances from one station; Intersection fixes points at the intersection of rays plotted from two distinct benchmark stations." }
        ]
      },
      {
        title: "Structural Analysis & Indeterminate Structures",
        code: "CVE301",
        level: 300,
        qs: [
          { q: "Which method solves continuous indeterminate beams using rotations and displacements?", a: "Method of Joints", b: "Slope-Deflection Method", c: "Maxwell Reciprocal Theorem", d: "Williot-Mohr Diagram", ans: "B", exp: "Slope-deflection relates member end moments to nodal joint rotations and lateral translations." },
          { q: "What is the degree of static indeterminacy for a beam fixed at both ends with no internal hinges?", a: "1", b: "2", c: "3", d: "0", ans: "C", exp: "Both fixed ends produce 6 reaction components against 3 static equilibrium equations (6 - 3 = 3)." },
          { q: "What structural diagram plots the variations of internal bending moment along a member span?", a: "Axial Force Diagram", b: "Bending Moment Diagram (BMD)", c: "Shear Force Diagram", d: "Influence Line", ans: "B", exp: "The BMD plots bending moments along beam length to size tensile reinforcement." },
          { q: "Explain Moment Distribution Method (Hardy Cross method) for analyzing continuous structural beams.", exp: "Hardy Cross method iteratively locks joints, computes fixed-end moments, releases joints, and distributes unbalanced moments to adjacent members according to stiffness ratios." }
        ]
      },
      {
        title: "Reinforced Concrete Design & Structural Eurocodes",
        code: "CVE401",
        level: 400,
        qs: [
          { q: "Why is steel reinforcement embedded in structural concrete beams?", a: "To resist shear alone", b: "To resist tensile forces where concrete is weak", c: "To reduce beam weight", d: "To prevent thermal expansion", ans: "B", exp: "Plain concrete has high compressive strength but poor tensile capacity (approximately 10% of compressive strength)." },
          { q: "What limit state ensures a building structure does not undergo excessive deflection or cracking under service loads?", a: "Ultimate Limit State (ULS)", b: "Serviceability Limit State (SLS)", c: "Fatigue Limit State", d: "Accidental Limit State", ans: "B", exp: "SLS criteria guarantee comfort, appearance, and durability during routine occupancy." },
          { q: "What is the minimum concrete cover thickness specified for reinforcement primarily intended to achieve?", a: "Aesthetic finish", b: "Corrosion protection and fire resistance", c: "Reducing cement usage", d: "Ease of vibration", ans: "B", exp: "Concrete cover isolates steel rebar from carbonation, chlorides, and fire temperatures." },
          { q: "Explain the difference between Ultimate Limit State (ULS) and Serviceability Limit State (SLS) design.", exp: "ULS designs against structural collapse, overturning, and rupture under factored loads; SLS designs against user discomfort, cosmetic cracking, and excessive deflections under operational loads." }
        ]
      },
      {
        title: "Geotechnical & Deep Foundation Engineering",
        code: "CVE501",
        level: 500,
        qs: [
          { q: "What standard soil classification test measures Liquid Limit and Plastic Limit?", a: "Standard Proctor Test", b: "Atterberg Limits Test", c: "Direct Shear Box Test", d: "California Bearing Ratio (CBR)", ans: "B", exp: "Atterberg limits determine moisture contents where fine-grained cohesive soils transition from solid to plastic and liquid states." },
          { q: "Which foundation type transfers structural building loads through weak surface strata down to hard bedrock?", a: "Isolated Spread Footing", b: "Deep Pile Foundation", c: "Strip Footing", d: "Raft Slab", ans: "B", exp: "Piles transmit heavy column loads via end-bearing on bedrock or skin friction along the shaft." },
          { q: "What geotechnical phenomenon occurs when saturated sandy soil temporarily loses shear strength during seismic shaking?", a: "Consolidation", b: "Soil Liquefaction", c: "Compaction", d: "Piping", ans: "B", exp: "Excess pore water pressure during earthquake shaking eliminates effective stress in loose sands." },
          { q: "Derive Terzaghi's 1D consolidation theory and explain its application in predicting foundation settlement.", exp: "Terzaghi's theory models dissipation of excess pore water pressure in saturated clay under vertical surcharge, predicting primary consolidation settlement over time." }
        ]
      }
    ]
  },

  // ==========================================
  // COLLEGE OF APPLIED SOCIAL SCIENCES
  // ==========================================
  {
    dept: "Accounting",
    desc: "Financial reporting, auditing, cost accounting, corporate taxation, and forensic accounting at Lagos State University of Science and Technology.",
    faculty: "College of Applied Social Sciences",
    courses: [
      {
        title: "Introduction to Financial Accounting",
        code: "ACC101",
        level: 100,
        qs: [
          { q: "What is the fundamental accounting equation?", a: "Assets = Liabilities + Equity", b: "Profit = Revenues - Expenses", c: "Debit = Credit", d: "Cash = Capital", ans: "A", exp: "Assets must always equal the claims on those assets by creditors (liabilities) and owners (equity)." },
          { q: "Under double-entry bookkeeping, what entry increases an Asset account?", a: "Credit", b: "Debit", c: "Contra", d: "Accrual", ans: "B", exp: "Debit entries increase asset and expense accounts, while credit entries decrease them." },
          { q: "Which financial statement reports a firm's financial position at a specific point in time?", a: "Income Statement", b: "Statement of Financial Position (Balance Sheet)", c: "Cash Flow Statement", d: "Statement of Changes in Equity", ans: "B", exp: "The Balance Sheet is a snapshot of assets, liabilities, and equity on a specific calendar date." },
          { q: "Explain the accrual principle of accounting and contrast it with cash basis accounting.", exp: "Accrual accounting recognizes revenue when earned and expenses when incurred regardless of cash timing, unlike cash accounting which records transactions only when physical funds exchange." }
        ]
      },
      {
        title: "Cost & Management Accounting",
        code: "ACC201",
        level: 200,
        qs: [
          { q: "What cost behavior remains constant per unit of output but varies directly with total production volume?", a: "Fixed Cost", b: "Variable Cost", c: "Sunk Cost", d: "Opportunity Cost", ans: "B", exp: "Variable costs like raw materials scale directly with units produced while per-unit cost stays steady." },
          { q: "What point represents zero profit and zero loss where total revenue equals total cost?", a: "Margin of Safety", b: "Break-Even Point", c: "Contribution Margin", d: "Economic Order Quantity", ans: "B", exp: "At the break-even point, sales contribution margin exactly offsets all fixed operating expenses." },
          { q: "Which costing method assigns both variable and fixed manufacturing overhead to unit product costs?", a: "Marginal Costing", b: "Absorption Costing", c: "Activity Based Costing", d: "Standard Costing", ans: "B", exp: "Absorption costing full-costs inventory by capturing direct materials, direct labor, and all factory overhead." },
          { q: "Explain the concept of Contribution Margin and how it is used in Cost-Volume-Profit (CVP) analysis.", exp: "Contribution margin equals Sales Revenue minus Total Variable Costs; it measures the funds available to cover fixed costs and generate operating profit." }
        ]
      },
      {
        title: "Nigerian Taxation & Fiscal Policy",
        code: "ACC301",
        level: 300,
        qs: [
          { q: "Which tax is levied on company profits under the Nigerian Companies Income Tax Act (CITA)?", a: "PAYE", b: "Companies Income Tax (CIT)", c: "Capital Gains Tax", d: "Stamp Duties", ans: "B", exp: "CIT is charged annually on taxable profits of resident and non-resident corporate entities in Nigeria." },
          { q: "What is the standard Value Added Tax (VAT) rate in Nigeria under current Finance Acts?", a: "5%", b: "7.5%", c: "10%", d: "15%", ans: "B", exp: "The Nigerian VAT rate was revised to 7.5% under the Finance Act 2020." },
          { q: "What statutory allowance is granted to corporate entities to replace accounting depreciation for tax deduction?", a: "Investment tax credit", b: "Capital Allowance", c: "Loss relief", d: "Pioneer status", ans: "B", exp: "Capital allowances provide standardized tax deductions on qualifying capital expenditures." },
          { q: "Distinguish between tax avoidance and tax evasion with legal and ethical implications.", exp: "Tax avoidance uses legitimate statutory tax incentives and loopholes to minimize tax liability legally; tax evasion is illegal fraud and deliberate non-disclosure of income." }
        ]
      },
      {
        title: "Auditing & Assurance Services",
        code: "ACC401",
        level: 400,
        qs: [
          { q: "What type of audit opinion states that financial statements give a true and fair view in all material respects?", a: "Qualified Opinion", b: "Unmodified / Clean Opinion", c: "Adverse Opinion", d: "Disclaimer of Opinion", ans: "B", exp: "An unmodified audit report confirms the financial statements are free of material misstatement under IFRS." },
          { q: "What concept describes the risk that an auditor expresses an inappropriate opinion when financial statements are materially misstated?", a: "Control Risk", b: "Audit Risk", c: "Inherent Risk", d: "Detection Risk", ans: "B", exp: "Audit Risk equals the product of Inherent Risk, Control Risk, and Detection Risk (AR = IR * CR * DR)." },
          { q: "Which statutory body regulates professional chartered accountancy standards in Nigeria alongside ANAN?", a: "NUC", b: "ICAN", c: "CAC", d: "SEC", ans: "B", exp: "The Institute of Chartered Accountants of Nigeria (ICAN) governs professional practice and ethics." },
          { q: "Explain the Audit Risk Model and the relationships among Inherent Risk, Control Risk, and Detection Risk.", exp: "Audit Risk = Inherent Risk x Control Risk x Detection Risk. Auditors evaluate inherent and control risks in client operations, then adjust detection risk through substantive testing." }
        ]
      }
    ]
  },

  {
    dept: "Business Administration",
    desc: "Strategic management, entrepreneurship, organizational dynamics, marketing, and corporate governance at Lagos State University of Science and Technology.",
    faculty: "College of Applied Social Sciences",
    courses: [
      {
        title: "Introduction to Business & Enterprise",
        code: "BUS101",
        level: 100,
        qs: [
          { q: "What form of business organization gives owners limited liability and separate legal personality?", a: "Sole Proprietorship", b: "Partnership", c: "Limited Liability Company (LLC/Plc)", d: "Joint Venture", ans: "C", exp: "Incorporated companies exist as distinct legal persons separate from shareholder personal assets." },
          { q: "What economic concept represents the value of the next best alternative sacrificed when making a decision?", a: "Marginal Cost", b: "Opportunity Cost", c: "Sunk Cost", d: "Explicit Cost", ans: "B", exp: "Opportunity cost measures the foregone return of alternative investments." },
          { q: "What document sets out a company's internal regulations, management powers, and shareholder rights upon incorporation?", a: "Memorandum of Association", b: "Articles of Association", c: "Certificate of Incorporation", d: "Prospectus", ans: "B", exp: "Articles of Association govern internal administration, director appointments, and voting rights." },
          { q: "Describe the primary advantages and disadvantages of operating as a sole proprietorship.", exp: "Advantages include total managerial autonomy, direct profit retention, and ease of registration; disadvantages include unlimited personal liability and limited capital access." }
        ]
      },
      {
        title: "Organizational Behaviour & Dynamics",
        code: "BUS201",
        level: 200,
        qs: [
          { q: "According to Maslow's Hierarchy of Needs, what is the highest-level motivational aspiration?", a: "Safety Needs", b: "Social Needs", c: "Self-Actualization", d: "Physiological Needs", ans: "C", exp: "Self-actualization represents fulfilling one's potential, creativity, and personal development." },
          { q: "What leadership style involves active consultation, consensus building, and shared decision-making with subordinates?", a: "Autocratic", b: "Democratic / Participative", c: "Laissez-faire", d: "Bureaucratic", ans: "B", exp: "Democratic leaders empower staff participation while retaining accountability." },
          { q: "What organizational phenomenon describes cohesive groups prioritizing harmony over critical evaluation, producing flawed choices?", a: "Brainstorming", b: "Groupthink", c: "Social Loafing", d: "Cognitive Dissonance", ans: "B", exp: "Groupthink suppresses dissenting viewpoints to preserve consensus." },
          { q: "Explain Herzberg's Two-Factor Theory of motivation (Hygiene factors vs. Motivators).", exp: "Hygiene factors like salary and working conditions prevent job dissatisfaction but do not motivate; true motivators like achievement and responsibility drive superior engagement." }
        ]
      },
      {
        title: "Production & Operations Management",
        code: "BUS301",
        level: 300,
        qs: [
          { q: "What inventory management model determines the optimal order size that minimizes total holding and ordering costs?", a: "ABC Analysis", b: "Economic Order Quantity (EOQ)", c: "Just-In-Time (JIT)", d: "Material Requirements Planning", ans: "B", exp: "EOQ balances annual inventory carrying costs against fixed setup/ordering fees." },
          { q: "Which manufacturing philosophy, popularized by Toyota, aims to eliminate all non-value-adding waste (Muda)?", a: "Six Sigma", b: "Lean Production / JIT", c: "Agile Workflow", d: "Critical Path Method", ans: "B", exp: "Lean and Just-In-Time minimize buffer inventory and process bottlenecks." },
          { q: "What project scheduling technique identifies the sequence of dependent activities that determines minimum project duration?", a: "Gantt Chart", b: "Critical Path Method (CPM)", c: "Pareto Chart", d: "Ishikawa Diagram", ans: "B", exp: "The critical path has zero slack; delays on any critical activity delay the final completion date." },
          { q: "Discuss the strategic objectives of Quality Management and the principles of Total Quality Management (TQM).", exp: "TQM is a continuous management philosophy focused on customer satisfaction, total employee involvement, process optimization, and zero defects across all business functions." }
        ]
      },
      {
        title: "Corporate Governance & Strategic Management",
        code: "BUS401",
        level: 400,
        qs: [
          { q: "What strategic analysis tool evaluates internal Strengths and Weaknesses alongside external Opportunities and Threats?", a: "PESTEL Analysis", b: "SWOT Analysis", c: "Porter's Five Forces", d: "BCG Matrix", ans: "B", exp: "SWOT combines internal resource audits with external environmental scans." },
          { q: "According to Michael Porter, what competitive strategy targets an entire industry through unique product offerings?", a: "Cost Leadership", b: "Differentiation", c: "Cost Focus", d: "Differentiation Focus", ans: "B", exp: "Differentiation builds competitive advantage through brand image, technology, and superior customer features." },
          { q: "What agency problem arises in modern public corporations with separated ownership and management?", a: "Double taxation", b: "Managers pursuing personal interests divergent from shareholder value", c: "Stock market crashes", d: "Insider trading", ans: "B", exp: "Agency theory addresses conflicts between principals (owners) and agents (executives)." },
          { q: "Explain Porter's Five Forces framework and how it determines industry attractiveness.", exp: "The framework analyzes threat of new entrants, bargaining power of buyers, bargaining power of suppliers, threat of substitute products, and competitive rivalry." }
        ]
      }
    ]
  },

  {
    dept: "Mass Communication",
    desc: "Broadcasting, investigative journalism, digital media publishing, public relations, and advertising at Lagos State University of Science and Technology.",
    faculty: "College of Applied Social Sciences",
    courses: [
      {
        title: "Introduction to Mass Communication",
        code: "MAC101",
        level: 100,
        qs: [
          { q: "What communication model describes who says what in which channel to whom with what effect?", a: "Shannon-Weaver Model", b: "Lasswell's Communication Model", c: "Osgood-Schramm Model", d: "Westley-MacLean Model", ans: "B", exp: "Harold Lasswell framed communication through speaker, message, medium, audience, and effect." },
          { q: "Which medium was the first mass broadcast communication technology?", a: "Television", b: "Radio", c: "Internet", d: "Printing Press", ans: "B", exp: "Wireless radio transmissions delivered simultaneous audio broadcasts into households across continents." },
          { q: "What is noise in human communication theory?", a: "Sound above 80 decibels", b: "Any interference that distorts or obstructs message transmission", c: "Microphone feedback", d: "Radio static only", ans: "B", exp: "Noise encompasses physical, physiological, and psychological barriers hindering accurate decoding." },
          { q: "Explain the four primary societal surveillance, correlation, transmission, and entertainment functions of mass media.", exp: "Surveillance monitors news and threats; Correlation interprets events; Cultural transmission preserves values across generations; Entertainment provides relaxation." }
        ]
      },
      {
        title: "Broadcast Journalism for Radio & Television",
        code: "MAC201",
        level: 200,
        qs: [
          { q: "What broadcast term refers to a recorded quote or interview excerpt from a source inserted into a news story?", a: "Lead", b: "Soundbite / Actuality", c: "Voice-Over", d: "Teaser", ans: "B", exp: "Soundbites provide authentic firsthand statements from newsmakers within broadcast packages." },
          { q: "What broadcast script format places video descriptions on the left column and spoken audio on the right?", a: "Split-Page / Two-Column Script", b: "Screenplay format", c: "Storyboard", d: "Teleprompter scroll", ans: "A", exp: "Two-column scripts synchronize visual cues (video) with reporter copy and audio effects." },
          { q: "What live broadcast technique places a television reporter speaking directly to camera at a breaking news scene?", a: "Voice-over", b: "Stand-Up", c: "Montage", d: "B-roll", ans: "B", exp: "Stand-ups establish on-the-scene credibility and transition key story segments." },
          { q: "Discuss the differences in writing news copy for broadcast compared to writing for print journalism.", exp: "Broadcast writing is conversational, concise, written for the ear in present tense with phonetic spellings; print writing allows complex sentence structures and extensive background." }
        ]
      },
      {
        title: "Media Law, Copyright & Ethical Conduct",
        code: "MAC301",
        level: 300,
        qs: [
          { q: "What is written or published defamation that damages an individual's reputation called?", a: "Slander", b: "Libel", c: "Contempt of Court", d: "Sedition", ans: "B", exp: "Libel is defamatory communication recorded in permanent form such as print, broadcast, or internet." },
          { q: "What legal doctrine allows limited citation and reproduction of copyrighted work for criticism and news reporting?", a: "Patent", b: "Fair Use / Fair Dealing", c: "Public Domain", d: "Creative Commons", ans: "B", exp: "Fair use permits transformative educational and journalistic excerpts without copyright infringement." },
          { q: "What ethical principle prohibits journalists from accepting gifts or monetary inducements in Nigeria?", a: "Brown Envelope Syndrome", b: "Checkbook Journalism", c: "Yellow Journalism", d: "Muckraking", ans: "A", exp: "Accepting brown envelopes compromises objectivity and breaches the NUJ code of ethics." },
          { q: "Explain the defenses available to a journalist sued for defamation under Nigerian media law.", exp: "Key legal defenses include Justification (proving statements are true), Fair Comment on matters of public interest, and Absolute or Qualified Privilege." }
        ]
      },
      {
        title: "Digital Media, Online Publishing & Analytics",
        code: "MAC401",
        level: 400,
        qs: [
          { q: "What digital publishing practice optimizes website content to rank prominently in organic search engine results?", a: "SEM", b: "Search Engine Optimization (SEO)", c: "CTR", d: "CPC", ans: "B", exp: "SEO leverages keyword strategy, responsive design, and quality backlinks to improve search visibility." },
          { q: "What metric measures the percentage of visitors who leave a webpage after viewing only one single page?", a: "Click-Through Rate", b: "Bounce Rate", c: "Conversion Rate", d: "Impression Share", ans: "B", exp: "High bounce rates indicate visitors did not interact further or find complementary links." },
          { q: "What term describes user-generated verification, reporting, and news dissemination via smartphones and social platforms?", a: "Guerilla marketing", b: "Citizen Journalism", c: "Spin doctoring", d: "Syndication", ans: "B", exp: "Citizen journalism decentralizes news gathering through eyewitness mobile reporting." },
          { q: "Discuss the impact of artificial intelligence and algorithmic curation on modern digital journalism.", exp: "AI automates reporting workflows and personalization but introduces algorithmic bias, filter bubbles, copyright challenges, and deepfake verification concerns." }
        ]
      }
    ]
  },

  // ==========================================
  // COLLEGE OF ENVIRONMENTAL DESIGN & TECHNOLOGY
  // ==========================================
  {
    dept: "Architecture",
    desc: "Architectural graphics, sustainable building design, urban masterplanning, digital CAD/BIM modeling, and heritage conservation at Lagos State University of Science and Technology.",
    faculty: "College of Environmental Design & Technology",
    courses: [
      {
        title: "Architectural Graphics & Freehand Drawing",
        code: "ARC101",
        level: 100,
        qs: [
          { q: "What drawing tool provides smooth guide curves of varying radii not achievable with a compass?", a: "T-square", b: "French Curve", c: "Scale rule", d: "Protractor", ans: "B", exp: "French curves allow draftspersons to connect points along non-circular organic curves." },
          { q: "In architectural perspective drawings, what line represents the theoretical eye-level of the observer?", a: "Ground Line", b: "Horizon Line", c: "Station Point", d: "Vanishing Trace", ans: "B", exp: "The horizon line corresponds to viewer eye elevation where vanishing points terminate." },
          { q: "What line weight convention is applied in architectural floor plans to indicate sliced masonry walls?", a: "Light thin line", b: "Heavy bold line", c: "Dashed line", d: "Dotted line", ans: "B", exp: "Cut plane elements like load-bearing walls use heavy line weight to convey physical depth." },
          { q: "Explain the visual principles of two-point perspective drawing and its construction in architectural visualization.", exp: "Two-point perspective uses two vanishing points positioned on the horizon line; vertical lines remain parallel while horizontal wall planes converge toward left and right vanishing points." }
        ]
      },
      {
        title: "Architectural Design Studio & Spatial Organization",
        code: "ARC201",
        level: 200,
        qs: [
          { q: "What architectural concept describes the sequence and path of human movement through spaces?", a: "Zoning", b: "Circulation", c: "Fenestration", d: "Elevation", ans: "B", exp: "Circulation plans designate corridors, doorways, and vertical stair transitions." },
          { q: "Which Roman architect authored the treatise 'De Architectura' establishing Firmitas, Utilitas, and Venustas?", a: "Michelangelo", b: "Vitruvius", c: "Brunelleschi", d: "Palladio", ans: "B", exp: "Vitruvius defined architecture through strength, utility, and beauty." },
          { q: "What architectural drawing slices vertically through a building to reveal interior ceiling heights and construction strata?", a: "Site Plan", b: "Building Section", c: "Roof Plan", d: "Elevation", ans: "B", exp: "Cross-sections show vertical space relationships, foundation depths, and structural framing." },
          { q: "Explain how passive solar design principles inform building orientation and fenestration in tropical Nigerian climates.", exp: "Buildings are oriented along the East-West axis with minimized East/West glazing to reduce solar heat gain, while North/South windows and shading devices promote cross-ventilation." }
        ]
      },
      {
        title: "Sustainable Building Climatology & Building Physics",
        code: "ARC301",
        level: 300,
        qs: [
          { q: "What architectural shading device features horizontal louvers above windows to block high summer sun?", a: "Mullion", b: "Brise-Soleil / Overhang", c: "Transom", d: "Clerestory", ans: "B", exp: "Brise-soleil deflects direct solar radiation while admitting natural ambient daylight." },
          { q: "What natural ventilation phenomenon draws cool air into lower levels as heated indoor air rises through a central atrium?", a: "Cross ventilation", b: "Stack Effect / Thermal Chimney", c: "Bernoulli effect", d: "Wind scoop", ans: "B", exp: "Stack effect leverages density differences between warm indoor air and cooler outdoor ambient air." },
          { q: "Which building rating system certifies environmental sustainability globally alongside BREEAM?", a: "ISO 9001", b: "LEED", c: "ASTM", d: "DIN", ans: "B", exp: "Leadership in Energy and Environmental Design (LEED) certifies green architecture." },
          { q: "Describe passive cooling strategies suitable for high-humidity tropical coastal zones like Lagos.", exp: "Strategies include cross ventilation through permeable jalousie windows, wide roof overhangs for rain and sun protection, elevated stilts for ground breezes, and light-colored reflective surfaces." }
        ]
      },
      {
        title: "Urban Design, Masterplanning & Professional Practice",
        code: "ARC401",
        level: 400,
        qs: [
          { q: "What regulatory mechanism controls land use, building heights, and population density across urban areas?", a: "Building Code", b: "Zoning Ordinance / Master Plan", c: "Deed of Assignment", d: "Tenancy Agreement", ans: "B", exp: "Zoning segregates incompatible uses like heavy manufacturing away from residential neighborhoods." },
          { q: "Which professional statutory council regulates architectural practice and licensing in Nigeria?", a: "COREN", b: "ARCON", c: "CORBON", d: "SURCON", ans: "B", exp: "The Architects Registration Council of Nigeria (ARCON) accredits architects and regulates standards." },
          { q: "What BIM software platform enables intelligent parametric 3D modeling and multi-disciplinary coordination?", a: "Photoshop", b: "Autodesk Revit", c: "CorelDraw", d: "Microsoft Visio", ans: "B", exp: "Building Information Modeling (BIM) via Revit integrates geometric design with material schedules." },
          { q: "Discuss the role of the Architect as the lead consultant in building contract administration.", exp: "The architect translates client briefs, coordinates engineering specialists, obtains municipal building approvals, issues architectural drawings, and certifies construction valuations on-site." }
        ]
      }
    ]
  },

  // ==========================================
  // COLLEGE OF AGRICULTURE
  // ==========================================
  {
    dept: "Agricultural Economics & Farm Management",
    desc: "Agribusiness strategy, farm budgeting, agricultural finance, rural development, and commodity value chains at Lagos State University of Science and Technology.",
    faculty: "College of Agriculture",
    courses: [
      {
        title: "Introduction to Agricultural Systems & Economics",
        code: "AGE101",
        level: 100,
        qs: [
          { q: "What primary sector of the Nigerian economy provides food, raw materials, and rural employment?", a: "Mining", b: "Agriculture", c: "Telecommunications", d: "Banking", ans: "B", exp: "Agriculture remains the dominant employer in rural Nigeria and contributor to non-oil GDP." },
          { q: "Which farming system integrates crop cultivation with livestock rearing on the same land holding?", a: "Monoculture", b: "Mixed Farming", c: "Nomadic pastoralism", d: "Shifting cultivation", ans: "B", exp: "Mixed farming recycles crop residues into animal feed and manure into crop fertilizer." },
          { q: "What fundamental economic law states that adding variable inputs eventually yields smaller additions to output?", a: "Law of Demand", b: "Law of Diminishing Marginal Returns", c: "Law of Supply", d: "Say's Law", ans: "B", exp: "The law of diminishing returns dictates that marginal product declines as a variable factor increases against fixed land." },
          { q: "Explain the role of agriculture in the overall economic development of Nigeria.", exp: "Agriculture provides food security, raw materials for industrial manufacturing, foreign exchange through exports, and employment for over 35% of the national labor force." }
        ]
      },
      {
        title: "Farm Management, Accounting & Production Economics",
        code: "AGE201",
        level: 200,
        qs: [
          { q: "What farm record tracks physical inventory of land, machinery, livestock, and crops at a specific date?", a: "Cash Book", b: "Farm Inventory", c: "Payroll Register", d: "Breeding Log", ans: "B", exp: "Farm inventory values all physical farm assets at opening and closing accounting periods." },
          { q: "What budgeting method assesses the financial impact of a minor adjustment to an existing farm enterprise?", a: "Complete Budgeting", b: "Partial Budgeting", c: "Zero-based Budgeting", d: "Capital Budgeting", ans: "B", exp: "Partial budgeting evaluates added costs and reduced revenues against added revenues and reduced costs." },
          { q: "Which production input is considered strictly fixed in the short run for traditional farming?", a: "Seedlings", b: "Fertilizer", c: "Agricultural Land", d: "Casual Labor", ans: "C", exp: "Land area cannot be instantaneously expanded in the short run." },
          { q: "Explain the four steps involved in preparing a partial budget for an agricultural enterprise.", exp: "Calculate Added Costs (new expenses), Reduced Returns (income foregone), Added Returns (new revenue), and Reduced Costs (expenses saved); net change determines financial viability." }
        ]
      },
      {
        title: "Agricultural Marketing & Value Chain Analysis",
        code: "AGE301",
        level: 300,
        qs: [
          { q: "What agricultural marketing function bridges the temporal gap between harvest time and year-round consumption?", a: "Transportation", b: "Storage / Warehousing", c: "Grading", d: "Financing", ans: "B", exp: "Grain silos and cold storage preserve seasonal harvests for steady market availability." },
          { q: "What term describes the price difference between what consumers pay and what primary farmers receive?", a: "Farm Profit", b: "Marketing Margin / Spread", c: "Subsidized Cost", d: "Arbitrage Value", ans: "B", exp: "Marketing margin covers processing, packaging, transit, and retailer markups." },
          { q: "What organization allows smallholder farmers to pool produce for bulk marketing and input discounts?", a: "Trade Union", b: "Agricultural Cooperative Society", c: "Chamber of Commerce", d: "Consortium", ans: "B", exp: "Cooperatives provide collective bargaining power, eliminating exploitation by middlemen." },
          { q: "Describe the major constraints facing agricultural commodity value chains in Lagos and Southwest Nigeria.", exp: "Key bottlenecks include poor rural feeder roads, lack of cold-chain storage leading to post-harvest losses, erratic electricity, high transport costs, and limited access to credit." }
        ]
      },
      {
        title: "Agricultural Finance, Credit & Project Appraisal",
        code: "AGE401",
        level: 400,
        qs: [
          { q: "What Nigerian central bank intervention program financed agricultural value chains via anchor commercial off-takers?", a: "TraderMoni", b: "Anchor Borrowers' Programme (ABP)", c: "N-Power", d: "SURE-P", ans: "B", exp: "The CBN Anchor Borrowers' Programme provided inputs and loans to smallholders linked to corporate processors." },
          { q: "Which discounted cash flow metric calculates the discount rate where Net Present Value (NPV) equals exactly zero?", a: "Benefit-Cost Ratio", b: "Internal Rate of Return (IRR)", c: "Payback Period", d: "Accounting Rate of Return", ans: "B", exp: "IRR represents the breakeven rate of return of capital projects." },
          { q: "What is an asset pledged by a borrowing farmer to secure loan repayment against default?", a: "Collateral", b: "Dividend", c: "Equity", d: "Debenture", ans: "A", exp: "Lenders require collateral like land titles or equipment to mitigate credit default risk." },
          { q: "Explain the 3 Rs of agricultural credit: Returns, Repayment capacity, and Risk-bearing ability.", exp: "Returns assess whether loan investment generates profit; Repayment capacity determines if cash flow covers principal and interest; Risk-bearing ability evaluates buffer capital against crop failure." }
        ]
      },
      {
        title: "Agribusiness Strategy & Food Policy Analysis",
        code: "AGE501",
        level: 500,
        qs: [
          { q: "What agricultural strategy integrates input supply, farm production, processing, and retail distribution?", a: "Horizontal Integration", b: "Vertical Integration / Agribusiness", c: "Conglomeration", d: "Outsourcing", ans: "B", exp: "Vertical integration coordinates consecutive stages of agricultural supply chains under corporate control." },
          { q: "Which policy instrument places a tax on imported food commodities to protect domestic agricultural producers?", a: "Quota", b: "Import Tariff", c: "Export Subsidy", d: "Price Ceiling", ans: "B", exp: "Tariffs make foreign goods more expensive, incentivizing local production like domestic rice milling." },
          { q: "What international index measures national accessibility, affordability, quality, and safety of food supplies?", a: "Human Development Index", b: "Global Food Security Index (GFSI)", c: "Gini Coefficient", d: "Consumer Price Index", ans: "B", exp: "GFSI benchmarks countries against food availability, affordability, and resilience." },
          { q: "Analyze the trade-offs between national food self-sufficiency policies and open agricultural trade.", exp: "Self-sufficiency protects domestic farmers and reduces import dependency during global crises, but may result in higher domestic consumer food prices and trade friction." }
        ]
      }
    ]
  },

  {
    dept: "Biotechnology & Food Technology",
    desc: "Food preservation, bioprocessing, industrial microbiology, nutritional biochemistry, and post-harvest technology at Lagos State University of Science and Technology.",
    faculty: "College of Agriculture",
    courses: [
      {
        title: "Fundamentals of Food Science & Technology",
        code: "BFT101",
        level: 100,
        qs: [
          { q: "What thermal food preservation process destroys pathogenic microorganisms without sterilizing the product?", a: "Freezing", b: "Pasteurization", c: "Irradiation", d: "Freeze-drying", ans: "B", exp: "Pasteurization applies controlled heat (e.g. 72 degrees C for 15s) to eliminate pathogens in milk and juices." },
          { q: "Which food component provides the primary energy source through starch and dietary fiber?", a: "Proteins", b: "Carbohydrates", c: "Lipids", d: "Minerals", ans: "B", exp: "Carbohydrates yield 4 kcal/g and form the staple caloric foundation of human diets." },
          { q: "What condition describes the amount of unbound water available for bacterial and fungal growth in food?", a: "Moisture content", b: "Water Activity (aw)", c: "Relative Humidity", d: "Brix value", ans: "B", exp: "Water activity below 0.6 prevents most microbiological spoilage in foods." },
          { q: "Explain the principles behind food preservation methods and how they suppress spoilage.", exp: "Preservation suppresses spoilage by removing moisture (drying), applying heat (canning/pasteurization), lowering temperature (freezing), altering pH (pickling), or adding preservatives." }
        ]
      },
      {
        title: "Food Microbiology, Spoilage & Safety",
        code: "BFT201",
        level: 200,
        qs: [
          { q: "What anaerobic, spore-forming bacterium produces a lethal neurotoxin in improperly canned foods?", a: "Escherichia coli", b: "Clostridium botulinum", c: "Salmonella enterica", d: "Staphylococcus aureus", ans: "B", exp: "Clostridium botulinum thrives in low-acid anaerobic environments, producing fatal botulinum toxin." },
          { q: "What fungal metabolites contaminate stored grains and groundnuts in humid tropical conditions?", a: "Bacteriocins", b: "Aflatoxins", c: "Enzymes", d: "Antibiotics", ans: "B", exp: "Aspergillus flavus synthesizes carcinogenic aflatoxins in poorly dried maize and nuts." },
          { q: "Which microorganism is the primary yeast utilized for alcoholic fermentation in brewing and bread baking?", a: "Lactobacillus bulgaricus", b: "Saccharomyces cerevisiae", c: "Acetobacter aceti", d: "Penicillium roqueforti", ans: "B", exp: "Saccharomyces cerevisiae ferments simple sugars into ethanol and carbon dioxide." },
          { q: "Describe the seven core principles of the Hazard Analysis Critical Control Point (HACCP) system.", exp: "HACCP conducts hazard analysis, determines critical control points (CCPs), establishes critical limits, monitors CCPs, establishes corrective actions, verifies procedures, and maintains documentation." }
        ]
      },
      {
        title: "Thermal & Non-Thermal Food Processing Operations",
        code: "BFT301",
        level: 300,
        qs: [
          { q: "What brief boiling or steam pre-treatment deactivates enzymes in vegetables prior to freezing?", a: "Pasteurization", b: "Blanching", c: "Extrusion", d: "Milling", ans: "B", exp: "Blanching denatures polyphenol oxidase and lipoxygenase enzymes, preserving color and nutrients." },
          { q: "What non-thermal preservation technology uses high hydrostatic pressure (300-600 MPa) to kill microbes?", a: "Freeze drying", b: "High Pressure Processing (HPP)", c: "Aseptic packaging", d: "Spray drying", ans: "B", exp: "HPP inactivates bacteria while retaining fresh taste and heat-labile vitamins." },
          { q: "Which chemical browning reaction occurs between reducing sugars and amino acids under heat?", a: "Caramelization", b: "Maillard Reaction", c: "Enzymatic Oxidation", d: "Rancidity", ans: "B", exp: "The Maillard reaction generates complex golden-brown pigments and desirable aromas in baked crusts." },
          { q: "Explain the D-value and z-value concepts used in thermal bacteriological processing calculations.", exp: "The D-value is time required at a given temperature to reduce a microbial population by 90% (1-log cycle); the z-value is temperature change required to change the D-value by a factor of 10." }
        ]
      },
      {
        title: "Quality Assurance, HACCP & Food Regulations",
        code: "BFT401",
        level: 400,
        qs: [
          { q: "What statutory regulatory agency inspects and certifies processed foods and drugs in Nigeria?", a: "SON", b: "NAFDAC", c: "FEPA", d: "FCCPC", ans: "B", exp: "The National Agency for Food and Drug Administration and Control (NAFDAC) regulates commercial foods." },
          { q: "What international standards commission established by FAO and WHO sets international food safety codes?", a: "ISO", b: "Codex Alimentarius", c: "FDA", d: "EFSA", ans: "B", exp: "Codex Alimentarius harmonizes international standards, guidelines, and codes of practice." },
          { q: "What sensory evaluation test asks panelists to identify the odd sample out of three presented products?", a: "Paired Comparison Test", b: "Triangle Test", c: "Hedonic Scale Test", d: "Duo-Trio Test", ans: "B", exp: "The triangle test presents two identical samples and one different sample to detect subtle reformulation changes." },
          { q: "Discuss the mandatory regulatory requirements for registering and labeling a packaged food product with NAFDAC.", exp: "Requirements include Good Manufacturing Practice (GMP) audit, trademark registration, laboratory chemical/microbiological analysis, ingredient list, batch number, production/expiry dates, and net volume." }
        ]
      },
      {
        title: "Industrial Biotechnology & Bioprocess Engineering",
        code: "BFT501",
        level: 500,
        qs: [
          { q: "What bioreactor vessel design provides mechanical agitation and sparged aeration for aerobic microbes?", a: "Fixed-Bed Reactor", b: "Stirred Tank Bioreactor", c: "Trickling Filter", d: "Plug Flow Pipe", ans: "B", exp: "Stirred-tank reactors use impellers and spargers to maintain homogeneous dissolved oxygen and substrate." },
          { q: "What recombinant technology technique amplifies millions of specific DNA segment copies in vitro?", a: "Gel Electrophoresis", b: "Polymerase Chain Reaction (PCR)", c: "Western Blotting", d: "Southern Hybridization", ans: "B", exp: "PCR uses thermal cycling with Taq polymerase to exponentially amplify targeted nucleotide sequences." },
          { q: "What term describes the extraction and purification of biological products from fermentation broths?", a: "Upstream Processing", b: "Downstream Processing", c: "Metabolic Flux", d: "Inoculation", ans: "B", exp: "Downstream processing involves cell harvesting, filtration, centrifugation, and chromatographic purification." },
          { q: "Explain the differences between batch, fed-batch, and continuous bioprocess fermentation modes.", exp: "Batch operates as a closed system with fixed nutrients; fed-batch adds limiting substrates incrementally to extend growth phase; continuous culture feeds fresh medium and harvests product indefinitely at steady state." }
        ]
      }
    ]
  }
];
