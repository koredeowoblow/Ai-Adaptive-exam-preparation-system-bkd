import { SeedQuestion } from "./lasustech-data";
import { SeedDiagrams } from "./seed-diagrams";

export const csc101ExpandedQuestions: SeedQuestion[] = [
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
      },
      {
        id: "part-1c",
        label: "1(c)",
        prompt: "Discuss the latency bottleneck of cascading 32 such 1-bit Full Adders into a 32-bit Ripple Carry Adder, and explain how Carry Lookahead Adders (CLA) overcome this limitation.",
        maxMarks: 4,
        modelAnswer: "In a 32-bit Ripple Carry Adder, the carry bit must sequentially propagate through all 32 stages, resulting in an O(n) delay (32 * 2 gate delays = 64 gate delays). Carry Lookahead Adders overcome this by precomputing carry generate (Gi = Ai · Bi) and carry propagate (Pi = Ai ⊕ Bi) signals in parallel using two-level Boolean logic, cutting addition latency to O(log n).",
        rubric: [
          { point: "Accurate analysis of O(n) carry chain ripple delay bottleneck", weight: 2 },
          { point: "Explanation of parallel generate (G) and propagate (P) logic in CLA", weight: 2 }
        ],
        order: 7
      }
    ]
  },
  { q: "What is the primary function of the Central Processing Unit (CPU)?", a: "Storing long-term files", b: "Executing instructions and processing data", c: "Managing network routing", d: "Rendering sound signals", ans: "B", exp: "The CPU performs arithmetic, logical, and control operations to execute program instructions." },
  { q: "Which number system is native to digital computer hardware?", a: "Decimal", b: "Binary", c: "Octal", d: "Hexadecimal", ans: "B", exp: "Digital electronics operate on high and low voltage states representing binary 1 and 0." },
  { q: "What is the role of an operating system kernel?", a: "Translating HTML", b: "Core resource management and hardware abstraction", c: "Scanning malware", d: "Compiling Python", ans: "B", exp: "The kernel manages CPU, memory, and device drivers at the lowest privilege level." },
  { q: "Explain the fundamental difference between volatile and non-volatile computer memory.", exp: "Volatile memory like RAM loses its contents when power is disconnected, whereas non-volatile storage like SSDs and ROM retains data permanently without electrical power." },
  { q: "What does the acronym ALU stand for in computer architecture?", a: "Advanced Logical Unit", b: "Arithmetic Logic Unit", c: "Array Level Utility", d: "Automated Linkage Unit", ans: "B", exp: "The ALU is the digital circuit within the CPU that handles integer arithmetic and bitwise logic operations." },
  { q: "Which register holds the memory address of the next instruction to be fetched from RAM?", a: "Instruction Register (IR)", b: "Memory Data Register (MDR)", c: "Program Counter (PC)", d: "Accumulator (ACC)", ans: "C", exp: "The Program Counter tracks the memory address of the next instruction in sequence." },
  { q: "How many distinct values can be represented with an 8-bit byte?", a: "128", b: "256", c: "512", d: "1024", ans: "B", exp: "With 8 binary bits, 2^8 = 256 unique patterns (0 through 255) can be represented." },
  { q: "What is the two's complement binary representation of the decimal value -5 using 8 bits?", a: "11111011", b: "10000101", c: "11111010", d: "11110101", ans: "A", exp: "5 in 8 bits is 00000101. Inverting bits gives 11111010, and adding 1 gives 11111011." },
  { q: "Describe the four stages of the classical Von Neumann CPU instruction cycle.", exp: "The Von Neumann machine cycle consists of Fetch (retrieving instruction from memory), Decode (interpreting opcode in control unit), Execute (performing operation via ALU/registers), and Store (writing results back to register or RAM)." },
  { q: "Which of the following is considered system software rather than application software?", a: "Spreadsheet software", b: "Web browser", c: "Device driver", d: "Photo editor", ans: "C", exp: "Device drivers and operating system kernels are system software that manage hardware." },
  { q: "What type of computer port transfers data serially one bit at a time and provides peripheral power?", a: "Parallel LPT", b: "Universal Serial Bus (USB)", c: "VGA", d: "IDE", ans: "B", exp: "USB is a high-speed serial bus interface widely used for hot-pluggable peripherals." },
  { q: "Which memory level is situated closest to the CPU execution units with the lowest access latency?", a: "RAM", b: "L1 Cache", c: "L3 Cache", d: "Solid State Drive", ans: "B", exp: "L1 cache is integrated directly on the processor core and operates at CPU clock speeds." },
  { q: "What is the primary role of the BIOS / UEFI firmware during system startup?", a: "Partitioning disks", b: "Power-On Self-Test (POST) and bootstrapping the OS loader", c: "Rendering desktop graphics", d: "Encrypting user passwords", ans: "B", exp: "Firmware initializes motherboard hardware, performs POST tests, and transfers execution to the OS bootloader." },
  { q: "Discuss the architectural trade-offs between RISC and CISC processor designs.", exp: "RISC (Reduced Instruction Set Computer) utilizes simple, uniform single-cycle instructions with heavy register usage for high clock rates, while CISC (Complex Instruction Set Computer) provides rich, multi-cycle instructions with memory operands to reduce program code size." },
  { q: "What does ASCII stand for in data representation?", a: "American Standard Code for Information Interchange", b: "Automated Symbolic Code for Internet Interchange", c: "Advanced System Code for Industrial Integration", d: "Applied Standard Cipher for International Interfaces", ans: "A", exp: "ASCII is a character encoding standard using 7 or 8 bits to map numbers to characters." },
  { q: "Which logic gate outputs a binary 1 if and only if both of its inputs are 1?", a: "OR gate", b: "AND gate", c: "XOR gate", d: "NAND gate", ans: "B", exp: "An AND gate computes Boolean conjunction, outputting true solely when all inputs are true." },
  { q: "What logic gate produces a 1 whenever its two inputs differ from each other?", a: "AND", b: "NOR", c: "XOR (Exclusive OR)", d: "XNOR", ans: "C", exp: "XOR yields 1 when odd parity exists (inputs are distinct: 0,1 or 1,0)." },
  { q: "Which storage technology has no mechanical moving parts and stores data via floating-gate transistors?", a: "Hard Disk Drive (HDD)", b: "Solid State Drive (SSD)", c: "Magnetic Tape", d: "CD-ROM", ans: "B", exp: "SSDs use NAND flash non-volatile memory with no moving platters, offering higher IOPS." },
  { q: "Explain the role of the System Bus and distinguish its three constituent buses.", exp: "The System Bus connects the CPU, memory, and I/O. It consists of the Data Bus (bidirectional path carrying actual operands and instructions), the Address Bus (unidirectional path specifying memory locations), and the Control Bus (transmitting clock and read/write signals)." },
  { q: "What is the decimal equivalent of the hexadecimal number 2F?", a: "42", b: "47", c: "31", d: "58", ans: "B", exp: "2 * 16^1 + 15 * 16^0 = 32 + 15 = 47." },
  { q: "Which utility translates human-readable source code entirely into machine code before execution?", a: "Interpreter", b: "Compiler", c: "Assembler", d: "Linker", ans: "B", exp: "Compilers translate entire programs ahead-of-time into executable object files." },
  { q: "What protocol is responsible for reliably delivering packets across interconnected IP networks?", a: "UDP", b: "TCP", c: "DNS", d: "ARP", ans: "B", exp: "TCP guarantees connection-oriented, in-order, error-checked delivery of byte streams." },
  { q: "What layer of the OSI model does a network router primarily operate at?", a: "Layer 1 (Physical)", b: "Layer 2 (Data Link)", c: "Layer 3 (Network)", d: "Layer 4 (Transport)", ans: "C", exp: "Routers inspect Layer 3 IP headers to route packets between different subnets." },
  { q: "Describe the concept of Virtual Memory and how paging enables multi-tasking.", exp: "Virtual memory maps isolated per-process virtual address spaces to physical RAM frames through page tables, allowing processes to execute safely without memory conflicts and utilizing secondary storage as swap space when physical RAM is exhausted." },
  { q: "Which type of malware replicates itself across network connections without requiring a host program?", a: "Trojan horse", b: "Worm", c: "Macro virus", d: "Adware", ans: "B", exp: "Computer worms are self-contained standalone programs that self-propagate across networks." },
  { q: "What is the primary benefit of asymmetric (public-key) cryptography over symmetric cryptography?", a: "Faster execution speed", b: "Eliminates the need for a shared secret during key exchange", c: "Requires smaller keys", d: "Does not require mathematical algorithms", ans: "B", exp: "Public-key cryptography uses paired public and private keys, solving the secure key distribution problem." },
  { q: "Which metric measures the clock speed of modern computer processors?", a: "Megabits per second (Mbps)", b: "Gigahertz (GHz)", c: "Nanoseconds (ns)", d: "Dots per inch (DPI)", ans: "B", exp: "Processor clock frequency is measured in cycles per second (Gigahertz)." },
  { q: "What does pipelining achieve in modern CPU architectures?", a: "Doubles the storage capacity of RAM", b: "Overlaps execution stages of multiple instructions to improve throughput", c: "Prevents overclocking heat", d: "Eliminates the need for cache memory", ans: "B", exp: "Pipelining breaks instruction execution into discrete stages so consecutive instructions execute concurrently." },
  { q: "What is an interrupt in computer systems?", a: "A hardware crash", b: "A signal to the CPU indicating an event needing immediate attention", c: "A network timeout", d: "A syntax error in source code", ans: "B", exp: "Hardware and software interrupts temporarily suspend current CPU routines to execute an Interrupt Service Routine (ISR)." },
  { q: "What mechanism allows high-speed I/O devices to transfer data directly to RAM without continuous CPU intervention?", a: "Direct Memory Access (DMA)", b: "Programmed I/O", c: "Interrupt Polling", d: "Pipelining", ans: "A", exp: "DMA controllers coordinate direct bus transfers between secondary peripherals and system memory, bypassing the CPU core." },
  { q: "What is the primary role of the Domain Name System (DNS)?", a: "Encrypting web packets", b: "Translating human-readable domain names into numerical IP addresses", c: "Formatting HTML web pages", d: "Allocating private IP addresses dynamically", ans: "B", exp: "DNS acts as the internet directory, resolving human hostnames (e.g. example.com) to machine IP routing endpoints." },
  { q: "Which RAID configuration provides disk striping with distributed parity for fault tolerance?", a: "RAID 0", b: "RAID 1", c: "RAID 5", d: "RAID 10", ans: "C", exp: "RAID 5 stripes data and parity blocks across a minimum of three drives, surviving a single disk failure without data loss." },
  { q: "Explain the four Coffman conditions necessary for a system Deadlock to occur.", exp: "A deadlock requires Mutual Exclusion (exclusive resource control), Hold and Wait (processes holding resources while awaiting others), No Preemption (resources cannot be forcibly taken), and Circular Wait (a closed loop of processes each waiting for a resource held by the next)." },
  { q: "How many bits are used in an IPv6 address compared to an IPv4 address?", a: "32 bits vs 16 bits", b: "128 bits vs 32 bits", c: "64 bits vs 32 bits", d: "256 bits vs 64 bits", ans: "B", exp: "IPv4 uses 32-bit addresses (approx 4.3 billion), whereas IPv6 provides 128-bit addresses (2^128 unique addresses)." },
  { q: "Which cloud computing deployment model provides consumers with raw compute, storage, and networking hardware virtualization?", a: "Software as a Service (SaaS)", b: "Platform as a Service (PaaS)", c: "Infrastructure as a Service (IaaS)", d: "Function as a Service (FaaS)", ans: "C", exp: "IaaS offers foundational virtual machines, storage, and software-defined networks upon which operating systems are installed." },
  { q: "What is the function of the Lexical Analyzer (Scanner) in a programming language compiler?", a: "Generating assembly instructions", b: "Converting input character streams into a sequence of meaningful tokens", c: "Allocating runtime stack frames", d: "Linking dynamic libraries", ans: "B", exp: "The lexical analyzer reads raw source code and categorizes substrings into tokens (keywords, identifiers, literals, operators)." },
  { q: "Describe the function of the Memory Management Unit (MMU) in modern computers.", exp: "The MMU is hardware within or adjacent to the CPU that translates virtual addresses generated by software into physical RAM addresses using translation lookaside buffers (TLB) and page tables, while enforcing memory protection and privilege levels." },
  { q: "Why is UTF-8 the predominant character encoding standard for the World Wide Web?", a: "It only supports English characters", b: "It is variable-length, backwards-compatible with 7-bit ASCII, and efficiently represents all Unicode code points", c: "It uses fixed 32-bit words for every character", d: "It compresses files automatically", ans: "B", exp: "UTF-8 encodes ASCII characters in 1 byte while dynamically using up to 4 bytes for other global scripts and symbols." }
];

export const csc102ExpandedQuestions: SeedQuestion[] = [
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
  },
  { q: "What is an algorithm in computing?", a: "A programming language syntax", b: "Step-by-step sequence of instructions to solve a problem", c: "A hardware component", d: "A database table", ans: "B", exp: "An algorithm is an unambiguous, finite sequence of steps solving a specific computational task." },
  { q: "Which graphical tool represents logic flow with shapes like diamonds and rectangles?", a: "UML Class Diagram", b: "Flowchart", c: "Circuit schematic", d: "Entity Relationship Diagram", ans: "B", exp: "Flowcharts use standardized symbols to trace decision branches and execution flow." },
  { q: "What control structure repeatedly executes a block of code while a condition is true?", a: "Sequence", b: "Selection", c: "Iteration / Loop", d: "Exception", ans: "C", exp: "While and for loops iterate code blocks until termination criteria are met." },
  { q: "Describe the three core control structures used in structured algorithm design.", exp: "Structured programming relies on Sequence (sequential statement execution), Selection (if-then-else decision making), and Iteration (while or for loops)." },
  { q: "What flowchart symbol represents a decision point with conditional branching?", a: "Rectangle", b: "Diamond", c: "Oval / Terminal", d: "Parallelogram", ans: "B", exp: "The diamond symbol indicates a conditional test that branches into two or more alternative paths." },
  { q: "In a flowchart, what shape is universally used to depict input and output operations?", a: "Rectangle", b: "Parallelogram", c: "Circle", d: "Triangle", ans: "B", exp: "Parallelograms represent reading data from input or writing output results to displays/files." },
  { q: "What is pseudocode?", a: "Machine binary instructions", b: "Informal high-level description of an algorithm combining English with programming structures", c: "Compiled assembly code", d: "A markup language for styling pages", ans: "B", exp: "Pseudocode expresses algorithmic logic without being constrained by language-specific compiler syntax." },
  { q: "What is the time complexity of linear search across an unsorted list of n elements in the worst case?", a: "O(1)", b: "O(log n)", c: "O(n)", d: "O(n^2)", ans: "C", exp: "In the worst case, the target element is at the very end or absent, requiring n element inspections." },
  { q: "Explain the prerequisites and operational mechanism of the Binary Search algorithm.", exp: "Binary search requires the input array to be pre-sorted. It repeatedly compares the search target with the middle element; if unequal, it halves the search space by discarding the half where the target cannot exist, achieving logarithmic O(log n) time." },
  { q: "What is the worst-case time complexity of Binary Search on a sorted array of size n?", a: "O(1)", b: "O(log n)", c: "O(n)", d: "O(n log n)", ans: "B", exp: "Each comparison divides the remaining candidate elements by 2, leading to at most ceil(log2(n)) + 1 comparisons." },
  { q: "Which sorting algorithm repeatedly swaps adjacent elements if they are in the wrong order?", a: "Merge Sort", b: "Bubble Sort", c: "Heap Sort", d: "Radix Sort", ans: "B", exp: "Bubble sort bubbles the largest unsorted element to the end of the array through successive adjacent pairwise swaps." },
  { q: "What is the average and worst-case time complexity of Bubble Sort?", a: "O(n log n)", b: "O(n)", c: "O(n^2)", d: "O(2^n)", ans: "C", exp: "Bubble sort uses nested loops making approximately n*(n-1)/2 comparisons in the average and worst cases." },
  { q: "Which sorting technique finds the minimum element from the unsorted part and places it at the beginning?", a: "Selection Sort", b: "Insertion Sort", c: "QuickSort", d: "Counting Sort", ans: "A", exp: "Selection sort divides the array into sorted and unsorted segments, repeatedly selecting the minimum unsorted item." },
  { q: "Explain the algorithmic strategy of Insertion Sort and when it is considered optimal.", exp: "Insertion sort iterates through an array, taking each element and inserting it into its correct position among preceding sorted elements. It is optimal for nearly-sorted data or small inputs (running in O(n) linear time when almost sorted)." },
  { q: "What is recursion in computer programming?", a: "An infinite loop error", b: "A function that solves a problem by calling itself with smaller sub-problems", c: "Converting float variables to integers", d: "Compiling code without linking", ans: "B", exp: "Recursion is a programming technique where a function calls itself until reaching a defined base case." },
  { q: "What essential component prevents a recursive function from causing a stack overflow?", a: "A break statement", b: "A base case (termination condition)", c: "A global counter", d: "A memory leak handler", ans: "B", exp: "The base case establishes the simplest non-recursive condition that halts further recursive invocations." },
  { q: "What mathematical property characterizes the Divide-and-Conquer paradigm?", a: "Greedy local choice at each step", b: "Breaking a problem into independent sub-problems, solving them recursively, and combining results", c: "Exhaustive brute-force search", d: "Randomized probabilistic trials", ans: "B", exp: "Divide and conquer divides the problem into sub-problems (Divide), solves them recursively (Conquer), and merges solutions (Combine)." },
  { q: "Which sorting algorithm exemplifies the divide-and-conquer paradigm with guaranteed O(n log n) worst-case performance?", a: "Bubble Sort", b: "Insertion Sort", c: "Merge Sort", d: "Selection Sort", ans: "C", exp: "Merge sort recursively halves arrays into sub-arrays and merges the sorted sub-arrays in O(n log n) guaranteed time." },
  { q: "Describe the Difference between Pass-by-Value and Pass-by-Reference parameter passing.", exp: "In pass-by-value, a copy of the actual argument's value is passed into the function; modifications inside do not affect the caller's original variable. In pass-by-reference, the memory address of the argument is passed, allowing direct modification of the caller's variable." },
  { q: "What is Big O notation used for in algorithm analysis?", a: "Estimating electrical power consumption", b: "Classifying the upper bound of algorithm runtime or memory growth relative to input size", c: "Measuring program line count", d: "Calculating disk storage capacity", ans: "B", exp: "Big O notation models the asymptotic upper bound of time or space complexity as input size n approaches infinity." },
  { q: "Which of the following time complexities grows the slowest as input size n increases?", a: "O(n)", b: "O(n^2)", c: "O(log n)", d: "O(n!)", ans: "C", exp: "Logarithmic time O(log n) increases much more slowly than linear O(n), quadratic O(n^2), or factorial O(n!)." },
  { q: "What does the modulo operator (%) compute in algorithmic arithmetic?", a: "The quotient of integer division", b: "The remainder after integer division", c: "The square root of a number", d: "The percentage value of an integer", ans: "B", exp: "The modulo operator returns the remainder; e.g., 17 % 5 returns 2." },
  { q: "In structured problem solving, what is the purpose of a trace table (dry run)?", a: "Generating visual graphs", b: "Manually tracking variable values step-by-step through an algorithm to verify logic", c: "Testing network throughput", d: "Validating user input passwords", ans: "B", exp: "A trace table records variable states at each execution step to identify semantic or logical errors before coding." },
  { q: "Discuss the trade-offs between an Iterative algorithm and its Recursive counterpart.", exp: "Iterative algorithms use loop constructs with constant O(1) stack space and no function call overhead. Recursive algorithms offer cleaner, mathematically elegant formulations for self-similar problems (e.g., trees) but consume O(n) call stack memory and risk stack overflow." },
  { q: "What is a Sentinel value in loop processing?", a: "A CPU security flag", b: "A special pre-defined data value used to signal the end of input or loop termination", c: "The maximum integer value", d: "A variable incremented by two", ans: "B", exp: "A sentinel value (like -1 or NULL) marks the termination boundary for dynamic or stream input." },
  { q: "What is an invariant in computer science algorithm design?", a: "A variable that cannot be changed by the user", b: "A logical condition that remains true before and after each iteration of a loop", c: "A hardware glitch", d: "An unhandled exception", ans: "B", exp: "A loop invariant is a formal predicate that holds true across every loop iteration, used to prove correctness." },
  { q: "Which algorithm design strategy makes the locally optimal choice at each stage with the hope of finding a global optimum?", a: "Dynamic Programming", b: "Greedy Algorithm", c: "Backtracking", d: "Brute Force", ans: "B", exp: "Greedy algorithms make short-sighted, locally best decisions without reconsidering earlier choices." },
  { q: "What is the primary difference between a syntax error and a semantic (logic) error?", a: "Syntax errors crash the OS; logic errors do not", b: "Syntax errors violate language grammatical rules detected at compile time; logic errors compile but produce incorrect output", c: "Logic errors are detected by code linters automatically", d: "There is no difference", ans: "B", exp: "Syntax errors prevent compilation; logic errors yield erroneous computations despite successful execution." },
  { q: "Explain how Modular Programming improves software maintainability and team collaboration.", exp: "Modular programming decomposes a monolithic system into discrete, loosely coupled, highly cohesive sub-modules or functions. This enables independent development, targeted unit testing, code reusability, and localized bug fixes without unintended side effects." },
  { q: "What is the worst-case space complexity of the standard recursive implementation of the Fibonacci sequence?", a: "O(1)", b: "O(n)", c: "O(2^n)", d: "O(log n)", ans: "B", exp: "The recursion tree has a maximum depth of n stack frames before reaching the base case, requiring O(n) auxiliary memory." },
  { q: "Which mathematical algorithm finds the Greatest Common Divisor (GCD) of two integers using successive remainders?", a: "Sieve of Eratosthenes", b: "Euclidean Algorithm", c: "Newton-Raphson method", d: "Dijkstra's algorithm", ans: "B", exp: "The Euclidean algorithm computes GCD(a, b) = GCD(b, a % b) until the remainder reaches zero." },
  { q: "What is an 'off-by-one' error commonly known as in algorithm loops?", a: "Syntax fault", b: "Fencepost error", c: "Stack corruption", d: "Deadlock", ans: "B", exp: "Off-by-one or fencepost errors occur when an iterative loop executes one time too many or too few (e.g. <= instead of <)." },
  { q: "What is short-circuit evaluation in Boolean expressions?", a: "Halting the program immediately on any error", b: "Stopping evaluation of logical expressions as soon as the outcome is definitively determined", c: "Compressing Boolean values into single bits", d: "Bypassing hardware logic gates", ans: "B", exp: "In expressions like (A && B), if A is false, B is not evaluated because the conjunction must be false." },
  { q: "Explain the Euclidean algorithm for computing the Greatest Common Divisor (GCD) of two integers.", exp: "The Euclidean algorithm repeatedly replaces the larger number with the remainder of dividing the larger by the smaller: GCD(a, b) = GCD(b, a mod b). The process terminates when the remainder becomes 0, with the remaining divisor being the GCD." },
  { q: "What does it mean for a sorting algorithm to be 'stable'?", a: "It never crashes on negative numbers", b: "It preserves the relative order of elements with equal keys", c: "It uses O(1) auxiliary memory", d: "It runs in guaranteed O(n log n) time", ans: "B", exp: "A stable sort guarantees that items with duplicate keys maintain their original relative input order." },
  { q: "What is Tail Recursion?", a: "A recursive call situated at the beginning of a function", b: "A recursive call where the function call is the very last operation executed before returning", c: "A recursive function without a base case", d: "A function that calls another function", ans: "B", exp: "In tail recursion, the recursive invocation is the final statement, enabling compiler tail-call optimization into a loop." },
  { q: "Which algorithmic technique systematically explores all possible candidates and abandons a candidate ('backtracks') as soon as it determines it cannot yield a valid solution?", a: "Divide and Conquer", b: "Backtracking", c: "Greedy heuristic", d: "Brute force", ans: "B", exp: "Backtracking incrementally builds candidates and prunes invalid search branches (e.g., N-Queens, Sudoku solver)." },
  { q: "In algorithm design, what is a Precondition?", a: "The expected output format of a function", b: "A condition that must be true prior to invoking an algorithm or routine for it to work correctly", c: "A compiler directive", d: "A CPU register flag", ans: "B", exp: "Preconditions define the assumptions and valid input state required before a function can execute safely." },
  { q: "Explain the difference between Top-Down and Bottom-Up problem solving approaches.", exp: "Top-Down design breaks a complex system down into smaller conceptual subsystems iteratively until each is trivial. Bottom-Up design constructs foundational low-level utility components first and aggregates them into larger systems." },
  { q: "What is the Sieve of Eratosthenes used for in computational mathematics?", a: "Factoring large polynomials", b: "Efficiently finding all prime numbers up to a specified integer limit", c: "Computing matrix inverses", d: "Calculating trigonometric sine values", ans: "B", exp: "The Sieve of Eratosthenes progressively marks composite multiples of each prime starting from 2 up to sqrt(n)." },
  { q: "How many passes are required in Bubble Sort to sort an array of n elements in the worst case?", a: "log2(n)", b: "n - 1 passes", c: "2n passes", d: "n^2 passes", ans: "B", exp: "Bubble sort requires at most n - 1 outer passes, each placing the next largest element into its terminal position." },
  { q: "What is the outcome of attempting to access an array element outside its allocated index bounds in memory-safe languages?", a: "Automatic array expansion", b: "IndexOutOfBoundsException / runtime error", c: "Conversion to null", d: "Silent zero return", ans: "B", exp: "Boundary checks detect invalid indices and throw exceptions to prevent memory corruption." },
  { q: "Describe the concept of Asymptotic Notation and differentiate Big O, Big Omega, and Big Theta.", exp: "Big O describes the asymptotic upper bound (worst case); Big Omega describes the asymptotic lower bound (best case); and Big Theta describes an asymptotically tight bound where upper and lower growth rates coincide." },
  { q: "What is the time complexity of verifying whether an array of n numbers is already sorted?", a: "O(1)", b: "O(n)", c: "O(n log n)", d: "O(n^2)", ans: "B", exp: "Verifying sortedness requires checking n - 1 adjacent pairs in a single linear scan O(n)." }
];

export const csc201ExpandedQuestions: SeedQuestion[] = [
  {
    q: "Figure 4.1 shows an unbalanced binary search tree undergoing an AVL Left-Right (LR) double rotation after the insertion of key 35.",
    exp: "Advanced data structure analysis of AVL self-balancing binary search trees, rotation mechanics, height invariants, and logarithmic complexity guarantees.",
    type: "THEORY",
    diagramUrl: SeedDiagrams.avlRotation,
    diagramCaption: "Figure 4.1: AVL Tree Left-Right (LR) Double Rotation",
    hasSubParts: true,
    subParts: [
      {
        id: "part-avl-1a",
        label: "1(a)",
        prompt: "Define an AVL tree and state its fundamental height-balance invariant in terms of subtree heights and balance factors (BF).",
        maxMarks: 3,
        modelAnswer: "An AVL tree is a strictly self-balancing binary search tree where the heights of the left and right subtrees of any node differ by at most 1. The balance factor is defined as BF(node) = height(left_subtree) - height(right_subtree), and must satisfy BF(node) ∈ {-1, 0, +1} for all nodes in the tree.",
        rubric: [
          { point: "Exact mathematical definition of balance factor BF = h_left - h_right", weight: 1.5 },
          { point: "Permitted balance factor range {-1, 0, +1} invariant", weight: 1.5 }
        ],
        order: 1
      },
      {
        id: "part-avl-1a-i",
        label: "1(a)(i)",
        prompt: "Calculate the balance factor of nodes 50, 20, and 35 in the unbalanced tree of Figure 4.1, and explain why a single Right (LL) rotation on node 50 is insufficient to restore balance.",
        maxMarks: 4,
        modelAnswer: "In the unbalanced tree: Node 35 has BF = 0 (leaf node); Node 20 has BF = -1 (left height 0, right height 1); Node 50 has BF = +2 (left height 2, right height 0). A single Right rotation on node 50 fails because the left child (node 20) is right-heavy (BF = -1), which would merely transfer the imbalance rather than resolve it, necessitating a double LR rotation.",
        rubric: [
          { point: "Correct calculation of BF for nodes 50 (+2), 20 (-1), and 35 (0)", weight: 2 },
          { point: "Identification that the zig-zag (LR) pattern requires two opposing rotations", weight: 2 }
        ],
        order: 2
      },
      {
        id: "part-avl-1a-ii",
        label: "1(a)(ii)",
        prompt: "Step through the two sequential rotation phases (Left rotation on node 20 followed by Right rotation on node 50), showing intermediate pointers and the final balanced root.",
        maxMarks: 4,
        modelAnswer: "Phase 1: Left rotation on child node 20 elevates node 35 to become the left child of node 50, with node 20 becoming the left child of node 35 (transforming the LR zig-zag into an LL line: 50 -> 35 -> 20). Phase 2: Right rotation on root node 50 elevates node 35 to the new tree root, with node 20 as its left child and node 50 as its right child. All nodes now have BF = 0.",
        rubric: [
          { point: "Accurate trace of Phase 1 left rotation on node 20", weight: 2 },
          { point: "Accurate trace of Phase 2 right rotation on node 50 and final root 35", weight: 2 }
        ],
        order: 3
      },
      {
        id: "part-avl-1a-iii",
        label: "1(a)(iii)",
        prompt: "Prove that the worst-case search, insertion, and deletion time complexities in an AVL tree containing n keys remain strictly O(log n).",
        maxMarks: 4,
        modelAnswer: "The maximum height h of an AVL tree of n nodes is bounded by Fibonacci tree growth: n(h) = n(h-1) + n(h-2) + 1 >= F_{h+2} - 1. Solving the recurrence yields h < 1.4404 log2(n + 2) - 0.328. Because binary search tree traversal time is proportional to height, search, insertion, and deletion (which each require at most O(h) rotations) are strictly bounded by O(log n).",
        rubric: [
          { point: "Mathematical connection between minimum AVL nodes and Fibonacci growth", weight: 2 },
          { point: "Derivation of maximum height bound h <= 1.44 log2(n) and O(log n) complexity", weight: 2 }
        ],
        order: 4
      },
      {
        id: "part-avl-1b-i",
        label: "1(b)(i)",
        prompt: "Compare the structural overhead and rebalancing frequencies between AVL Trees and Red-Black Trees in real-world operating system kernel schedulers (e.g., Linux CFS) and database indexes.",
        maxMarks: 4,
        modelAnswer: "AVL trees are more strictly balanced than Red-Black trees (max height ~1.44 log n vs ~2 log n), making AVL trees faster for read-heavy lookup workloads. However, insertions in AVL trees may require rebalancing up the spine, whereas Red-Black trees require at most 2 rotations per insertion and 3 rotations per deletion. Therefore, write-heavy kernel schedulers and general associative maps (e.g. C++ std::map, Linux CFS) prefer Red-Black trees for lower rebalancing overhead.",
        rubric: [
          { point: "Strict balance vs looser balance comparison (read performance)", weight: 2 },
          { point: "Rotation count overhead comparison on frequent writes (Red-Black advantage)", weight: 2 }
        ],
        order: 5
      },
      {
        id: "part-avl-1b-ii",
        label: "1(b)(ii)",
        prompt: "Write pseudocode or TypeScript algorithm for detecting height imbalance and triggering the appropriate rotation (LL, RR, LR, RL) upon inserting a new key into an AVL tree.",
        maxMarks: 5,
        modelAnswer: "function rebalance(node: AVLNode): AVLNode {\n  updateHeight(node);\n  const balance = getBalance(node);\n  if (balance > 1) {\n    if (getBalance(node.left) < 0) node.left = rotateLeft(node.left); // LR\n    return rotateRight(node); // LL\n  }\n  if (balance < -1) {\n    if (getBalance(node.right) > 0) node.right = rotateRight(node.right); // RL\n    return rotateLeft(node); // RR\n  }\n  return node;\n}",
        rubric: [
          { point: "Correct calculation and branch conditions for balance > 1 and balance < -1", weight: 2.5 },
          { point: "Accurate double-rotation triggers (LR and RL) before outer rotation", weight: 2.5 }
        ],
        order: 6
      }
    ]
  },
  { q: "What is the average lookup time complexity of a hash table with good distribution?", a: "O(n)", b: "O(1)", c: "O(log n)", d: "O(n^2)", ans: "B", exp: "Hash tables map keys directly to array buckets in constant expected time." },
  { q: "Which data structure operates on a Last-In First-Out (LIFO) discipline?", a: "Queue", b: "Stack", c: "Binary Tree", d: "Linked List", ans: "B", exp: "Stacks push and pop elements from the same end, enforcing LIFO behavior." },
  { q: "What is the worst-case time complexity of QuickSort?", a: "O(n)", b: "O(n log n)", c: "O(n^2)", d: "O(1)", ans: "C", exp: "QuickSort degrades to quadratic time when pivots produce maximally unbalanced partitions." },
  { q: "Explain how a binary search tree maintains its ordering invariant during node insertion.", exp: "During insertion, values smaller than the current node traverse left, while values greater traverse right until an available empty child pointer is found." },
  { q: "Which data structure operates on a First-In First-Out (FIFO) discipline?", a: "Stack", b: "Queue", c: "Heap", d: "Binary Search Tree", ans: "B", exp: "Queues insert elements at the rear and remove them from the front, strictly enforcing FIFO processing." },
  { q: "What is the time complexity to insert a new node at the head of a singly linked list?", a: "O(1)", b: "O(n)", c: "O(log n)", d: "O(n^2)", ans: "A", exp: "Inserting at the head requires simply pointing the new node's next pointer to the current head and updating head." },
  { q: "In a doubly linked list, each node contains how many pointer fields?", a: "One pointer", b: "Two pointers (prev and next)", c: "Three pointers", d: "No pointers", ans: "B", exp: "Doubly linked list nodes store pointers to both the subsequent node (next) and the antecedent node (prev)." },
  { q: "What is the maximum number of children any node can possess in a Binary Tree?", a: "1", b: "2", c: "3", d: "Arbitrary number", ans: "B", exp: "By definition, binary tree nodes can have at most two child branches: left child and right child." },
  { q: "Compare and contrast Arrays and Linked Lists in terms of memory layout and access performance.", exp: "Arrays allocate contiguous blocks of memory allowing instantaneous O(1) random index access but have fixed capacity and costly O(n) insertions. Linked lists use dynamic heap nodes with pointers, offering O(1) insertions/deletions at known positions but requiring O(n) sequential traversal." },
  { q: "Which tree traversal algorithm visits nodes in the order: Left Subtree, Root Node, Right Subtree?", a: "Pre-order", b: "In-order", c: "Post-order", d: "Level-order", ans: "B", exp: "In-order traversal visits left child, parent node, then right child; on a BST, this yields strictly ascending values." },
  { q: "What is the worst-case time complexity to search for a value in a degenerate (skewed) binary search tree?", a: "O(1)", b: "O(log n)", c: "O(n)", d: "O(n log n)", ans: "C", exp: "When a BST is unbalanced (resembling a singly linked list), search degrades to linear scan O(n)." },
  { q: "Which self-balancing binary search tree maintains strict height balance where subtree heights differ by at most 1?", a: "B-Tree", b: "AVL Tree", c: "Trie", d: "Binary Heap", ans: "B", exp: "AVL trees strictly enforce that the balance factor (-1, 0, or +1) of every node is restored via rotations." },
  { q: "What data structure is typically employed to implement Breadth-First Search (BFS) graph traversal?", a: "Stack", b: "Queue", c: "Priority Queue", d: "Hash Map", ans: "B", exp: "BFS explores neighbor vertices layer-by-layer using a FIFO queue to sequence discovered nodes." },
  { q: "What data structure is utilized in Depth-First Search (DFS) graph traversal?", a: "Queue", b: "Stack (or call stack recursion)", c: "Circular Buffer", d: "Min-Heap", ans: "B", exp: "DFS traverses as deep as possible along each path before backtracking, naturally implemented via a LIFO stack." },
  { q: "Explain the two primary collision resolution techniques in Hash Tables: Chaining vs Open Addressing.", exp: "Chaining stores colliding elements in a secondary linked list or dynamic array attached to each bucket. Open addressing resolves collisions by probing alternative array slots (via linear probing, quadratic probing, or double hashing) until an empty cell is found." },
  { q: "What is the primary condition that defines a Max-Heap?", a: "Every node's value must be less than or equal to its children", b: "Every node's value must be greater than or equal to its children", c: "All leaf nodes reside on different levels", d: "Nodes are sorted in alphabetical order", ans: "B", exp: "In a Max-Heap, the root element possesses the greatest key, and every ancestor is greater than or equal to its descendants." },
  { q: "What is the time complexity to extract the minimum element from a binary Min-Heap of n elements?", a: "O(1) lookup + O(log n) heapify restore", b: "O(n)", c: "O(n^2)", d: "O(n log n)", ans: "A", exp: "The min item is at root O(1); removing it and restoring the heap property takes O(log n) via sift-down." },
  { q: "What graph representation is most space-efficient for a sparse graph with V vertices and E edges where E << V^2?", a: "Adjacency Matrix", b: "Adjacency List", c: "Incidence Matrix", d: "Distance Matrix", ans: "B", exp: "Adjacency lists consume O(V + E) space, whereas an adjacency matrix always allocates O(V^2) cells." },
  { q: "Which algorithm finds the shortest path between a source vertex and all other vertices in a weighted graph with non-negative edge weights?", a: "Kruskal's algorithm", b: "Dijkstra's algorithm", c: "Prim's algorithm", d: "Floyd-Warshall algorithm", ans: "B", exp: "Dijkstra's algorithm uses a priority queue to iteratively explore minimum-distance frontier vertices in O((V + E) log V)." },
  { q: "Explain the concept of Minimum Spanning Tree (MST) and outline Kruskal's algorithm.", exp: "An MST is a subset of graph edges connecting all vertices without cycles while minimizing total edge weight. Kruskal's algorithm sorts all edges by weight and iteratively adds the lightest edge that does not form a cycle, using Disjoint Set Union (Union-Find) to detect cycles in O(E log E)." }
];
