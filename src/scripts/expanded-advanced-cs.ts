import { SeedQuestion } from "./lasustech-data";
import { SeedDiagrams } from "./seed-diagrams";

export const csc301ExpandedQuestions: SeedQuestion[] = [
  {
    q: "Examine the classical 5-stage RISC instruction pipeline and data forwarding path depicted in Figure 3.1.",
    exp: "Comprehensive computer architecture analysis of a 5-stage RISC CPU pipeline covering hazard detection, data forwarding, branch prediction, and throughput speedup.",
    type: "THEORY",
    diagramUrl: SeedDiagrams.cpuPipeline,
    diagramCaption: "Figure 3.1: Classical 5-Stage RISC Instruction Pipeline Architecture",
    hasSubParts: true,
    subParts: [
      {
        id: "part-pipe-1a",
        label: "1(a)",
        prompt: "Name each of the 5 pipeline stages and define the exact computational task executed in each stage.",
        maxMarks: 5,
        modelAnswer: "1) IF (Instruction Fetch): Retrieves instruction from instruction cache/RAM using Program Counter (PC). 2) ID (Instruction Decode / Register Read): Decodes opcode in control unit and reads source registers from Register File. 3) EX (Execute / ALU): Computes ALU arithmetic/logic or memory target effective address. 4) MEM (Memory Access): Performs read/write access to data cache for load/store instructions. 5) WB (Write Back): Writes computed result or loaded data back into the destination register in the Register File.",
        rubric: [
          { point: "All 5 stages correctly enumerated (IF, ID, EX, MEM, WB)", weight: 2.5 },
          { point: "Accurate description of operational task executed within each stage", weight: 2.5 }
        ],
        order: 1
      },
      {
        id: "part-pipe-1a-i",
        label: "1(a)(i)",
        prompt: "Distinguish between Structural Hazards, Data Hazards (RAW, WAR, WAW), and Control Hazards in pipelined execution.",
        maxMarks: 4,
        modelAnswer: "Structural Hazards occur when hardware resources cannot support all concurrent stage combinations (e.g. single-ported memory accessed by both IF and MEM). Data Hazards occur when an instruction depends on the result of an antecedent instruction still in flight (Read-After-Write, Write-After-Read, Write-After-Write). Control Hazards arise from pipelining branch and jump instructions where the target PC is not determined until decode or execute.",
        rubric: [
          { point: "Accurate definitions of Structural, Data, and Control hazards", weight: 2 },
          { point: "Distinction of RAW, WAR, and WAW data hazard dependencies", weight: 2 }
        ],
        order: 2
      },
      {
        id: "part-pipe-1a-ii",
        label: "1(a)(ii)",
        prompt: "Explain how the MEM -> EX data forwarding bypass illustrated in the diagram resolves a Read-After-Write (RAW) data hazard without inserting pipeline stall bubbles.",
        maxMarks: 4,
        modelAnswer: "In a standard pipeline, the result of an ALU instruction is computed in EX and written to the register file during WB (stage 5). A succeeding instruction needing this value in EX (stage 3) would ordinarily stall for 2 cycles. The MEM -> EX forwarding multiplexer extracts the result directly from the EX/MEM pipeline register and feeds it back into the ALU input multiplexer at the start of EX, allowing back-to-back execution with zero stall bubbles.",
        rubric: [
          { point: "Explanation of ALU result availability in pipeline register before WB", weight: 2 },
          { point: "Mechanism of forwarding multiplexers routing data directly into EX ALU inputs", weight: 2 }
        ],
        order: 3
      },
      {
        id: "part-pipe-1a-iii",
        label: "1(a)(iii)",
        prompt: "Describe the Load-Use Data Hazard and explain why forwarding alone cannot eliminate a stall when an instruction immediately uses the result of a preceding LOAD instruction.",
        maxMarks: 4,
        modelAnswer: "In a LOAD instruction, data is not retrieved from the data cache until the end of the MEM stage (stage 4). If the immediately subsequent instruction requires this data in EX (stage 3), the required data does not physically exist in time (it would require forwarding backward in time). Therefore, the Hazard Detection Unit must insert one pipeline stall bubble (NOP) and freeze the PC/IF/ID stages, after which forwarding from MEM/WB can supply the operand.",
        rubric: [
          { point: "Data availability timing: Load data only arrives at end of MEM stage", weight: 2 },
          { point: "Necessity of inserting one hardware stall cycle / bubble before forwarding", weight: 2 }
        ],
        order: 4
      },
      {
        id: "part-pipe-1b-i",
        label: "1(b)(i)",
        prompt: "Calculate the theoretical speedup of an ideal 5-stage pipeline executing 1,000 instructions compared to a non-pipelined processor, assuming equal clock cycle duration.",
        maxMarks: 4,
        modelAnswer: "Non-pipelined execution takes T_nonpipe = 1000 * 5 cycles = 5,000 cycles. An ideal 5-stage pipeline takes T_pipe = k + (N - 1) = 5 + 999 = 1,004 cycles. Theoretical Speedup S = 5,000 / 1,004 ≈ 4.98x (approaching the theoretical maximum k = 5x).",
        rubric: [
          { point: "Correct formulas for non-pipelined cycles and pipelined cycles k + N - 1", weight: 2 },
          { point: "Accurate speedup calculation of approximately 4.98x", weight: 2 }
        ],
        order: 5
      },
      {
        id: "part-pipe-1b-ii",
        label: "1(b)(ii)",
        prompt: "Discuss modern dynamic branch prediction techniques (2-bit saturating counter and Branch Target Buffers) used to mitigate control hazard stalls during conditional jumps.",
        maxMarks: 4,
        modelAnswer: "A 2-bit saturating counter state machine (Strongly Not Taken, Weakly Not Taken, Weakly Taken, Strongly Taken) requires two consecutive mispredictions to flip the prediction direction, preventing loop exit penalties from polluting predictions. A Branch Target Buffer (BTB) caches the target jump address indexed by instruction PC, allowing the pipeline to fetch target instructions in the very next cycle without waiting for branch decode.",
        rubric: [
          { point: "Operation of 2-bit saturating counter and hysteresis benefit", weight: 2 },
          { point: "Role of Branch Target Buffer (BTB) in zero-cycle target address retrieval", weight: 2 }
        ],
        order: 6
      }
    ]
  },
  { q: "What is the primary difference between a process and a thread in modern operating systems?", a: "Threads cannot execute code concurrently", b: "A process has its own address space, while threads of the same process share an address space", c: "Processes do not require CPU scheduling", d: "Threads have isolated file descriptors", ans: "B", exp: "Processes have independent virtual address spaces and resources, whereas threads share the process's code, data, and heap but retain independent stacks and registers." },
  { q: "Which CPU scheduling algorithm gives the lowest average waiting time for a given set of processes?", a: "First-Come First-Served (FCFS)", b: "Shortest Job First (SJF)", c: "Round Robin (RR)", d: "Priority Scheduling", ans: "B", exp: "Shortest Job First is provably optimal in terms of minimizing average waiting time." },
  { q: "What problem can occur in Priority Scheduling where low-priority processes wait indefinitely?", a: "Thrashing", b: "Starvation (indefinite blocking)", c: "Deadlock", d: "Belady's Anomaly", ans: "B", exp: "Starvation occurs when ready low-priority processes are continuously preempted by incoming higher-priority processes. Aging solves this." },
  { q: "Explain the concept of 'Aging' as a solution to process starvation.", exp: "Aging is a technique of gradually increasing the priority of processes that wait in the system for a long time, guaranteeing that even low-priority jobs eventually achieve the highest priority and execute." },
  { q: "Which condition is NOT one of the four necessary Coffman conditions for a deadlock?", a: "Mutual Exclusion", b: "Hold and Wait", c: "Preemption allowed", d: "Circular Wait", ans: "C", exp: "No Preemption (resources cannot be forcibly taken) is required for deadlock; allowing preemption prevents deadlocks." },
  { q: "What algorithm is used in operating systems for deadlock avoidance when multiple instances of each resource type exist?", a: "Peterson's Algorithm", b: "Banker's Algorithm", c: "Dijkstra's Shortest Path", d: "Dekker's Algorithm", ans: "B", exp: "Dijkstra's Banker's Algorithm tests for safety by simulating resource allocation for maximum possible claims." },
  { q: "What is the function of the Translation Lookaside Buffer (TLB)?", a: "Caching disk blocks", b: "A hardware cache for virtual-to-physical page table address translations", c: "Scheduling CPU registers", d: "Handling network sockets", ans: "B", exp: "The TLB is a high-speed associative hardware cache that speeds up virtual-to-physical address mapping by avoiding memory lookups." },
  { q: "Describe the phenomenon of 'Thrashing' in virtual memory systems.", exp: "Thrashing occurs when a computer's processor spends more time swapping pages into and out of virtual memory than executing actual instructions, caused by insufficient physical RAM to accommodate the working sets of active processes." },
  { q: "Which page replacement algorithm replaces the page that will not be used for the longest period of time?", a: "First-In First-Out (FIFO)", b: "Least Recently Used (LRU)", c: "Optimal Page Replacement (OPT / MIN)", d: "Clock algorithm", ans: "C", exp: "The Optimal page replacement algorithm produces the lowest possible page fault rate, serving as an impossible-to-implement theoretical benchmark." },
  { q: "What anomalous behavior can occur in FIFO page replacement where increasing the number of page frames results in more page faults?", a: "Amdahl's Law", b: "Belady's Anomaly", c: "Moore's Anomaly", d: "Little's Law", ans: "B", exp: "Belady's Anomaly shows that for FIFO, allocating more memory frames can counterintuitively cause more page faults." },
  { q: "What is a Race Condition in concurrent programming?", a: "A CPU overclocking competition", b: "A situation where multiple threads access shared data concurrently and the outcome depends on the execution order", c: "A network interface buffer overflow", d: "A compilation failure", ans: "B", exp: "A race condition occurs when concurrent operations on shared state produce non-deterministic results based on thread scheduling." },
  { q: "Which synchronization primitive consists of an integer counter and two atomic operations: wait() and signal()?", a: "Spinlock", b: "Semaphore", c: "Condition Variable", d: "Pipe", ans: "B", exp: "Dijkstra defined counting semaphores with P() [wait] and V() [signal] operations to coordinate access to shared finite resources." },
  { q: "Explain the difference between a Monolithic Kernel and a Microkernel architecture.", exp: "In a Monolithic kernel, all core OS services (file systems, drivers, memory management, scheduling) run in kernel space with maximum performance. In a Microkernel, only minimal essential primitives run in privileged mode while servers and drivers run in user space for modularity and fault isolation." },
  { q: "Which disk scheduling algorithm services requests by moving the disk head back and forth across cylinders like an elevator?", a: "First-Come First-Served (FCFS)", b: "Shortest Seek Time First (SSTF)", c: "SCAN (Elevator algorithm)", d: "C-SCAN", ans: "C", exp: "The SCAN algorithm sweeps the disk arm from one end to the other, servicing pending tracks, then reverses direction." },
  { q: "What system call is used in Unix-like operating systems to create a new child process that duplicates the parent?", a: "exec()", b: "fork()", c: "clone()", d: "spawn()", ans: "B", exp: "fork() creates an exact duplicate of the calling process with a distinct Process ID (PID) and copy-on-write memory." },
  { q: "What happens to a Unix process when it terminates but its parent has not yet called wait()?", a: "It becomes an orphan process", b: "It becomes a zombie process (defunct)", c: "It is automatically restarted", d: "It causes a kernel panic", ans: "B", exp: "A zombie process has finished execution but still holds an entry in the process table until its exit status is read by wait()." },
  { q: "What is Copy-on-Write (COW) in modern operating system process management?", a: "A file backup system", b: "A technique where parent and child processes share physical pages until one writes to a page, at which point a private copy is made", c: "A disk encryption algorithm", d: "A network packet mirroring protocol", ans: "B", exp: "COW optimizes fork() by deferring memory duplication until modification occurs, saving memory and CPU cycles." },
  { q: "Describe the Critical Section problem and identify the three essential requirements for any valid solution.", exp: "The Critical Section is code accessing shared mutable resources. Any valid synchronization solution must satisfy: 1) Mutual Exclusion (only one process in critical section at a time), 2) Progress (selection of next entrant cannot be postponed indefinitely), and 3) Bounded Waiting (a bound exists on the number of times others can enter before a waiting process)." },
  { q: "Which CPU mode switch occurs when user software executes a system call?", a: "Switch from User Mode to Kernel Mode (Supervisor Mode)", b: "Switch from Kernel Mode to Real Mode", c: "Switch from Protected Mode to Virtual 8086", d: "Switch from Ring 0 to Ring 3", ans: "A", exp: "A system call triggers a software interrupt (trap) transitioning the hardware from unprivileged User Mode (Ring 3) to privileged Kernel Mode (Ring 0)." },
  { q: "What mechanism provides inter-process communication via unidirectional byte streams between related processes in Unix?", a: "Message Queue", b: "Pipe", c: "Shared Memory", d: "Socket", ans: "B", exp: "Pipes provide unidirectional FIFO data streams connected between processes using file descriptors." },
  { q: "What is Internal Fragmentation in memory allocation?", a: "Unused memory between allocated partitions", b: "Wasted allocated memory space inside a partition or page frame because the requested data is smaller than the block size", c: "Disk sector corruption", d: "Cache miss penalty", ans: "B", exp: "Internal fragmentation happens when fixed-sized blocks (e.g., 4KB pages) exceed the requested process size, leaving unused space inside the block." },
  { q: "What is External Fragmentation and what technique eliminates it in dynamic partitioning?", a: "Free memory scattered in tiny unusable holes between allocations; eliminated via Compaction", b: "Memory leaks within functions", c: "Page faults in virtual memory", d: "Buffer overflows", ans: "A", exp: "External fragmentation occurs when total free space is sufficient but fragmented into non-contiguous blocks; compaction relocates active blocks together." },
  { q: "Explain how Mutex locks differ from Counting Semaphores.", exp: "A Mutex (mutual exclusion lock) is a binary lock with ownership semantics: only the thread that locked it may unlock it. A Counting Semaphore maintains an integer counter initialized to N, can be signaled by any thread, and controls access to a pool of N identical resources." },
  { q: "Which file allocation method allows fast random access to file blocks by maintaining an index block with direct pointers?", a: "Contiguous Allocation", b: "Linked Allocation", c: "Indexed Allocation", d: "Sequential Allocation", ans: "C", exp: "Indexed allocation brings all disk block pointers together into an index block (like Unix inodes), supporting direct access without external fragmentation." },
  { q: "What is an Inode in Unix file systems?", a: "A network interface descriptor", b: "A data structure storing file metadata, permissions, ownership, and disk block pointers", c: "A user login credential", d: "A RAM disk driver", ans: "B", exp: "An inode stores all metadata and data block pointers for a file, excluding its filename which resides in the directory." },
  { q: "In Round Robin scheduling, what happens if the time quantum is chosen to be excessively large?", a: "CPU utilization drops to zero", b: "Round Robin degenerates into First-Come First-Served (FCFS)", c: "Context switches increase exponentially", d: "Processes starve", ans: "B", exp: "If the time quantum exceeds the longest CPU burst, every process finishes before preemption, behaving identically to FCFS." },
  { q: "What is the primary benefit of asymmetric multiprocessing (AMP) compared to symmetric multiprocessing (SMP)?", a: "All processors share identical tasks", b: "A master processor schedules and manages system tasks while slaves run user code, simplifying OS control", c: "Eliminates cache coherence", d: "Requires fewer CPU registers", ans: "B", exp: "AMP uses a master-slave design where one core handles OS logic and delegates user computation to other cores." },
  { q: "Describe the concept of Context Switching and why it represents computational overhead.", exp: "Context switching is the process of saving the execution state (program counter, registers, memory maps) of an active task and loading the saved state of another. It represents pure overhead because no productive application computation occurs during the switch." },
  { q: "Which register in the CPU points to the current active top of the execution call stack?", a: "Instruction Register (IR)", b: "Stack Pointer (SP)", c: "Base Pointer (BP)", d: "Memory Address Register (MAR)", ans: "B", exp: "The Stack Pointer register holds the memory address of the current top of the call stack." },
  { q: "What does the POSIX standard provide for operating systems?", a: "A GUI windowing framework", b: "A standardized API specification ensuring source code portability across Unix-like systems", c: "A disk partition scheme", d: "A binary package manager", ans: "B", exp: "Portable Operating System Interface (POSIX) defines standard system calls and shells to allow applications to compile across OS platforms." },
  { q: "What is the Purpose of the Swapper (Mid-term Scheduler)?", a: "Assigning CPU time slices", b: "Moving processes between physical RAM and swap disk to regulate the degree of multiprogramming", c: "Compiling C code", d: "Flushing GPU frames", ans: "B", exp: "The mid-term scheduler swaps idle or memory-heavy processes to disk to alleviate RAM pressure and reduce thrashing." },
  { q: "What is a Spinlock and when is it preferred over a sleeping mutex?", a: "A lock that spins in a busy loop; preferred when lock hold times are shorter than a context switch", b: "A lock that puts threads to sleep", c: "A distributed network lock", d: "A hardware watchdog timer", ans: "A", exp: "Spinlocks avoid the heavy overhead of thread context switching when the critical section is extremely brief (common in multiprocessor kernels)." },
  { q: "Discuss the difference between Preemptive and Non-Preemptive CPU scheduling.", exp: "In non-preemptive scheduling, once a process gets the CPU, it holds it until termination or voluntary I/O waiting. In preemptive scheduling, the OS timer interrupt can forcibly interrupt a running process to allocate the CPU to a higher-priority task." },
  { q: "What does the dirty bit (modify bit) in a page table entry indicate?", a: "The page has experienced a parity error", b: "The page has been written to in RAM and must be written back to disk upon replacement", c: "The page is read-only", d: "The page belongs to kernel space", ans: "B", exp: "The dirty bit tracks whether a memory page has been modified since being loaded from secondary storage." },
  { q: "Which memory allocation strategy allocates the smallest hole that is big enough to satisfy the request?", a: "First-Fit", b: "Best-Fit", c: "Worst-Fit", d: "Next-Fit", ans: "B", exp: "Best-Fit searches the entire list of free holes to find the smallest partition that fits, leaving the smallest leftover fragment." },
  { q: "What is an Orphan process in Unix?", a: "A process whose execution was terminated by SIGKILL", b: "A running process whose parent process terminated before calling wait()", c: "A process without CPU affinity", d: "A thread that escaped its thread pool", ans: "B", exp: "When a parent dies before its child, the child is orphaned and automatically adopted by the root `init` or `systemd` process (PID 1)." },
  { q: "What is the function of the cron daemon in Unix-like systems?", a: "Kernel logging", b: "Executing scheduled commands and scripts at specified recurring times and intervals", c: "Compressing memory pages", d: "Managing user passwords", ans: "B", exp: "Cron is a background daemon that triggers automated jobs based on crontab time expressions." },
  { q: "Explain the role of Device Drivers and the Hardware Abstraction Layer (HAL).", exp: "Device drivers translate OS generic I/O requests into hardware-specific controller commands. The HAL abstracts platform-specific motherboard differences, enabling the OS kernel to interact with uniform interfaces." },
  { q: "Which RAID level provides pure disk mirroring without parity calculations?", a: "RAID 0", b: "RAID 1", c: "RAID 5", d: "RAID 6", ans: "B", exp: "RAID 1 mirrors identical data onto two or more drives, providing 100% redundancy at the cost of 50% capacity overhead." },
  { q: "What is the Primary Purpose of the fork-exec pattern in Unix?", a: "Creating multi-threaded loops", b: "Fork creates an identical child process, and exec replaces the child's address space with a new program executable", c: "Encrypting file systems", d: "Handling networking timeouts", ans: "B", exp: "Unix separates process instantiation (fork) from new executable loading (exec), enabling redirection and permission setup before execution." }
];

export const csc303ExpandedQuestions: SeedQuestion[] = [
  {
    q: "Figure 2.1 illustrates the conceptual Entity-Relationship Diagram (ERD) for a university academic portal managing students, departments, courses, and examination enrollments.",
    exp: "Comprehensive database design analysis of a relational schema covering 3NF/BCNF normalization, primary/foreign key constraints, SQL aggregation queries, and index optimization.",
    type: "THEORY",
    diagramUrl: SeedDiagrams.relationalErd,
    diagramCaption: "Figure 2.1: Relational Database Entity Relationship Diagram (ERD)",
    hasSubParts: true,
    subParts: [
      {
        id: "part-erd-2a",
        label: "2(a)",
        prompt: "Define Third Normal Form (3NF) and Boyce-Codd Normal Form (BCNF). Explain why associative entities like ENROLLMENT are essential when resolving many-to-many relationships.",
        maxMarks: 4,
        modelAnswer: "A relation is in 3NF if it is in 2NF and no non-prime attribute is transitively dependent on any candidate key (for every X -> Y, either X is a superkey or Y is prime). BCNF is stricter: for every non-trivial functional dependency X -> Y, X must be a superkey. Associative tables resolve many-to-many relationships into two 1:N relationships, preventing duplicate data and update anomalies.",
        rubric: [
          { point: "Precise definitions of 3NF and BCNF transitive/superkey criteria", weight: 2 },
          { point: "Role of associative entities in resolving M:N cardinalities", weight: 2 }
        ],
        order: 1
      },
      {
        id: "part-erd-2a-i",
        label: "2(a)(i)",
        prompt: "Identify all primary keys, candidate keys, and foreign keys in the ENROLLMENT entity from the ERD.",
        maxMarks: 3,
        modelAnswer: "Primary Key: enrollment_id (surrogate key). Candidate Key: Composite key (student_id, course_id, semester). Foreign Keys: student_id references STUDENT(student_id); course_id references COURSE(course_id).",
        rubric: [
          { point: "Correct identification of primary key enrollment_id", weight: 1 },
          { point: "Correct identification of foreign keys student_id and course_id", weight: 2 }
        ],
        order: 2
      },
      {
        id: "part-erd-2a-ii",
        label: "2(a)(ii)",
        prompt: "Explain the referential integrity behavior of ON DELETE CASCADE versus ON DELETE RESTRICT for the foreign key link between DEPARTMENT and STUDENT.",
        maxMarks: 4,
        modelAnswer: "ON DELETE RESTRICT aborts and rejects any attempt to delete a DEPARTMENT record if any STUDENT tuple references its dept_id, protecting against accidental student data loss. ON DELETE CASCADE automatically deletes all associated STUDENT records (and subsequently their enrollments) when the parent DEPARTMENT is removed.",
        rubric: [
          { point: "Clear explanation of ON DELETE RESTRICT blocking deletion", weight: 2 },
          { point: "Clear explanation of ON DELETE CASCADE propagating deletion", weight: 2 }
        ],
        order: 3
      },
      {
        id: "part-erd-2a-iii",
        label: "2(a)(iii)",
        prompt: "Analyze potential update, insertion, and deletion anomalies if the attributes from COURSE were denormalized and merged directly into the STUDENT table.",
        maxMarks: 4,
        modelAnswer: "1) Insertion anomaly: Cannot store a newly created course without registering at least one student in it. 2) Deletion anomaly: Deleting the sole student enrolled in a course permanently destroys the course's metadata. 3) Update anomaly: Changing credit units for a course requires updating every enrolled student row, risking data inconsistency.",
        rubric: [
          { point: "Identification of insertion anomaly regarding unassigned courses", weight: 1.5 },
          { point: "Identification of deletion and update inconsistency anomalies", weight: 2.5 }
        ],
        order: 4
      },
      {
        id: "part-erd-2b-i",
        label: "2(b)(i)",
        prompt: "Write an ANSI SQL query calculating the Cumulative Grade Point Average (CGPA) for every student in the 'Computer Science' department who has completed at least 5 courses.",
        maxMarks: 5,
        modelAnswer: "SELECT s.student_id, s.matric_no, s.full_name, ROUND(SUM(e.grade_point * c.credit_units) / SUM(c.credit_units), 2) AS cgpa FROM STUDENT s JOIN DEPARTMENT d ON s.dept_id = d.dept_id JOIN ENROLLMENT e ON s.student_id = e.student_id JOIN COURSE c ON e.course_id = c.course_id WHERE d.dept_name = 'Computer Science' GROUP BY s.student_id, s.matric_no, s.full_name HAVING COUNT(e.course_id) >= 5 ORDER BY cgpa DESC;",
        rubric: [
          { point: "Correct multi-table JOINs linking STUDENT, DEPARTMENT, ENROLLMENT, COURSE", weight: 2 },
          { point: "Accurate weighted CGPA formula SUM(points*units)/SUM(units)", weight: 1.5 },
          { point: "Proper GROUP BY and HAVING COUNT() >= 5 condition", weight: 1.5 }
        ],
        order: 5
      },
      {
        id: "part-erd-2b-ii",
        label: "2(b)(ii)",
        prompt: "Design a composite indexing strategy to optimize the query execution plan for the above query on a database containing 2 million enrollment tuples.",
        maxMarks: 4,
        modelAnswer: "1) Composite index on ENROLLMENT(student_id, course_id) INCLUDE (grade_point) to allow index-only access. 2) Index on DEPARTMENT(dept_name) to instantly retrieve the CS dept_id. 3) Index on STUDENT(dept_id, student_id) to rapidly filter CS students. 4) Clustered primary key index on COURSE(course_id).",
        rubric: [
          { point: "Creation of covering composite index on ENROLLMENT", weight: 2 },
          { point: "Index on filter columns DEPARTMENT(dept_name) and foreign keys", weight: 2 }
        ],
        order: 6
      }
    ]
  },
  { q: "What does ACID stand for in database transaction management?", a: "Accuracy, Consistency, Integrity, Durability", b: "Atomicity, Consistency, Isolation, Durability", c: "Aggregation, Concurrency, Indexing, Distribution", d: "Availability, Correctness, Isolation, Durability", ans: "B", exp: "ACID represents the core transactional guarantees: Atomicity (all-or-nothing), Consistency (state validity), Isolation (concurrency control), and Durability (permanence)." },
  { q: "Which SQL clause is used to filter records resulting from an aggregate GROUP BY operation?", a: "WHERE", b: "HAVING", c: "ORDER BY", d: "LIMIT", ans: "B", exp: "WHERE filters individual rows prior to grouping, whereas HAVING filters aggregated groups after aggregation." },
  { q: "What normal form requires eliminating partial functional dependencies on a composite primary key?", a: "First Normal Form (1NF)", b: "Second Normal Form (2NF)", c: "Third Normal Form (3NF)", d: "Boyce-Codd Normal Form (BCNF)", ans: "B", exp: "2NF requires 1NF compliance and that every non-prime attribute is fully functionally dependent on the entire candidate key." },
  { q: "Explain the difference between 2NF and 3NF in relational database design.", exp: "2NF eliminates partial dependencies on composite keys. 3NF goes further by eliminating transitive dependencies, ensuring every non-key attribute depends directly on the primary key and nothing else ('the key, the whole key, and nothing but the key')." },
  { q: "Which type of database JOIN returns all rows from the left table and matched rows from the right table, with NULLs for unmatched right rows?", a: "INNER JOIN", b: "LEFT (OUTER) JOIN", c: "CROSS JOIN", d: "FULL OUTER JOIN", ans: "B", exp: "A LEFT OUTER JOIN preserves all records from the left relation, padding right attributes with NULL when no join match exists." },
  { q: "What is a Foreign Key constraint?", a: "An encrypted primary key", b: "A column that references the primary key of another table, enforcing referential integrity", c: "A temporary database view", d: "An index for full-text search", ans: "B", exp: "Foreign keys enforce referential integrity between child and parent tables, preventing orphaned records." },
  { q: "Which index structure is most widely used in relational databases for efficient range queries and logarithmic lookups?", a: "Hash index", b: "B+ Tree", c: "Bitmap index", d: "Skip List", ans: "B", exp: "B+ Trees keep data balanced with high fan-out, storing records in linked leaves which facilitates fast equality and range scans." },
  { q: "Describe the Two-Phase Locking (2PL) protocol and how it guarantees Serializability.", exp: "2PL enforces two strict phases: 1) Growing Phase (locks may be acquired but not released), and 2) Shrinking Phase (locks may be released but no new locks acquired). This prevents conflicting interleaved transactions, mathematically guaranteeing serializable schedules." },
  { q: "What transaction isolation level prevents dirty reads, non-repeatable reads, and phantom reads?", a: "Read Uncommitted", b: "Read Committed", c: "Repeatable Read", d: "Serializable", ans: "D", exp: "Serializable is the highest ANSI SQL isolation level, executing transactions as if they occurred in a strict serial order." },
  { q: "What is a 'Dirty Read' in database concurrency?", a: "A query executed without an index", b: "A transaction reads uncommitted data modified by another concurrent transaction that may later rollback", c: "Reading data from a corrupted sector", d: "Reading cached data that has expired", ans: "B", exp: "A dirty read occurs when Transaction A reads data written by Transaction B before B commits; if B rolls back, A holds bogus data." },
  { q: "Which SQL command is used to remove an entire table structure and its data permanently from the database?", a: "DELETE TABLE", b: "DROP TABLE", c: "TRUNCATE TABLE", d: "REMOVE TABLE", ans: "B", exp: "DROP TABLE deletes the table schema definition and all stored tuples from the database catalog." },
  { q: "What is the difference between DELETE and TRUNCATE in SQL?", a: "DELETE drops the table, TRUNCATE renames it", b: "DELETE removes rows one-by-one logging each deletion and firing triggers, while TRUNCATE deallocates data pages as a minimal-logged DDL operation", c: "TRUNCATE allows WHERE clauses, DELETE does not", d: "There is no difference", ans: "B", exp: "DELETE is a DML statement supporting WHERE clauses and row-level logging; TRUNCATE is faster DDL that resets the entire table without firing triggers." },
  { q: "Explain the CAP Theorem and its implications for distributed databases.", exp: "The CAP Theorem states that a distributed data store can simultaneously provide at most two of three guarantees: Consistency (every read receives the most recent write or error), Availability (every non-failing request receives a response), and Partition Tolerance (system operates despite arbitrary network message losses). Because networks inevitably partition, systems must choose CP or AP." },
  { q: "What type of NoSQL database is MongoDB categorized as?", a: "Graph database", b: "Document store", c: "Key-Value store", d: "Column-Family store", ans: "B", exp: "MongoDB is a document database storing records as flexible, hierarchical BSON documents with dynamic schemas." },
  { q: "What is a Database View and what are its primary architectural benefits?", a: "A physical copy of table data on SSD", b: "A virtual table defined by an underlying SQL query, providing security abstraction and simplifying complex queries", c: "A graphical diagram tool", d: "A database transaction log", ans: "B", exp: "Views are virtual relations presenting customized projections or aggregations without storing redundant physical data, enforcing column-level security." },
  { q: "What is the purpose of the Write-Ahead Logging (WAL) protocol in database engines?", a: "Speeding up SELECT queries", b: "Ensuring transaction modifications are written to non-volatile log storage before changing data files, guaranteeing Durability", c: "Formatting table reports", d: "Compressing indexes", ans: "B", exp: "WAL guarantees that log records are flushed to disk before corresponding memory pages are written, enabling crash recovery via REDO/UNDO." },
  { q: "Which normal form requires that every determinant in a functional dependency is a superkey?", a: "1NF", b: "2NF", c: "3NF", d: "Boyce-Codd Normal Form (BCNF)", ans: "D", exp: "BCNF is a stricter variant of 3NF where for every functional dependency X -> Y, X must strictly be a candidate key." },
  { q: "Explain the purpose and function of Database Sharding.", exp: "Sharding is horizontal partitioning that divides a large dataset across multiple independent database servers (shards) based on a shard key, enabling horizontal scale-out for storage capacity and query throughput beyond single-machine limits." },
  { q: "Which SQL constraint ensures that all values in a column are distinct from one another?", a: "CHECK", b: "DEFAULT", c: "UNIQUE", d: "NOT NULL", ans: "C", exp: "The UNIQUE constraint prevents duplicate entries across rows for specified columns while permitting a single NULL value in standard SQL." },
  { q: "What is a Database Deadlock and how does the database engine detect and resolve it?", a: "A hardware crash; resolved by rebooting", b: "A cycle of transactions each waiting for locks held by others; resolved by Wait-For Graph cycle detection and aborting a victim transaction", c: "A slow query; resolved by adding RAM", d: "An unauthorized query; resolved by firewall", ans: "B", exp: "The DBMS maintains a Wait-For Graph; when a directed cycle is detected, it selects and rolls back a 'victim' transaction to break the cycle." },
  { q: "What is the difference between Clustered and Non-Clustered indexes?", a: "Clustered indexes store data in memory, non-clustered on disk", b: "A clustered index determines the physical storage order of rows in the table (only 1 per table); non-clustered indexes store sorted keys with pointers back to rows", c: "Non-clustered indexes cannot be used for equality searches", d: "Clustered indexes only work on text fields", ans: "B", exp: "Because table rows can only be physically sorted one way, a table can have only one Clustered index, while having multiple secondary non-clustered indexes." },
  { q: "What does the SQL statement 'ROLLBACK' accomplish?", a: "Permanently saves changes", b: "Reverts all modifications made during the current uncommitted transaction", c: "Drops the active database schema", d: "Restarts the database server", ans: "B", exp: "ROLLBACK undoes all changes since the start of the transaction or savepoint, returning the database to its prior consistent state." },
  { q: "Describe the role of a Database Query Optimizer.", exp: "The Query Optimizer analyzes an incoming SQL query parse tree, evaluates multiple alternative execution plans using catalog statistics (data cardinality, histograms, index costs), and selects the plan with the lowest estimated I/O and CPU cost." },
  { q: "Which SQL function counts the total number of non-null records in a column?", a: "SUM()", b: "TOTAL()", c: "COUNT()", d: "LENGTH()", ans: "C", exp: "COUNT(column) counts rows where the column is not NULL, whereas COUNT(*) counts all rows regardless of nullability." },
  { q: "What is Entity-Relationship (ER) modeling used for in database design?", a: "Optimizing disk read speeds", b: "Conceptual modeling of real-world entities, their attributes, and relationships before physical schema creation", c: "Generating SQL queries automatically", d: "Managing user privileges", ans: "B", exp: "ER diagrams provide an abstract conceptual schema mapping real-world business domains into entities, attributes, and cardinality constraints." },
  { q: "What is an Anonymous PL/SQL or stored procedure block?", a: "A procedure without parameters", b: "An unnamed block of executable procedural code compiled and run on the database server", c: "An unindexed view", d: "A public database table", ans: "B", exp: "In database procedural extensions (like PL/SQL or PL/pgSQL), anonymous blocks execute without being persisted in the schema catalog." },
  { q: "Explain the role of Database Replication and distinguish Synchronous vs Asynchronous replication.", exp: "Replication copies data across multiple servers for fault tolerance and read scaling. Synchronous replication commits writes on the primary only after replica confirmation (zero data loss, higher latency). Asynchronous replication commits locally first and streams logs to replicas in background (lower latency, risk of data loss on primary crash)." },
  { q: "Which NoSQL category is best suited for social networks, fraud detection, and recommendation engines?", a: "Key-Value store", b: "Document store", c: "Graph database (e.g., Neo4j)", d: "Time-series store", ans: "C", exp: "Graph databases model nodes, edges, and properties directly, enabling high-performance relationship traversal without costly SQL joins." },
  { q: "What is a SQL Injection vulnerability and how is it fundamentally mitigated?", a: "A buffer overflow; mitigated with ASLR", b: "Malicious SQL commands injected via untrusted input; mitigated by Parameterized Queries / Prepared Statements", c: "Hardware memory corruption; mitigated by ECC RAM", d: "Network packet sniffing; mitigated by TLS", ans: "B", exp: "SQL injection occurs when user strings are concatenated into queries; Prepared Statements pre-compile the SQL template, treating user input purely as literals." },
  { q: "What does the SQL 'CASCADE' option do when specified in an ON DELETE foreign key clause?", a: "Prevents parent deletion", b: "Automatically deletes child rows when the referenced parent row is deleted", c: "Sets child foreign keys to NULL", d: "Throws a runtime warning", ans: "B", exp: "ON DELETE CASCADE propagates parent deletions down to all dependent child records, maintaining referential integrity automatically." }
];

export const csc401ExpandedQuestions: SeedQuestion[] = [
  { q: "In artificial intelligence search algorithms, what property guarantees that an algorithm will find the optimal solution if one exists?", a: "Completeness", b: "Optimality / Admissibility", c: "Time complexity", d: "Space complexity", ans: "B", exp: "An algorithm is optimal if it finds the highest quality solution. For A* search, heuristic admissibility (never overestimating remaining cost) guarantees optimality." },
  { q: "What heuristic condition must be satisfied for A* graph search to guarantee finding the shortest path without revisiting closed nodes?", a: "Heuristic must be non-zero", b: "Consistency (monotonicity)", c: "Inadmissibility", d: "Exponential growth", ans: "B", exp: "A consistent heuristic satisfies the triangle inequality h(n) <= c(n, a, n') + h(n'), ensuring f-values along any path never decrease." },
  { q: "What is the primary role of the Inference Engine in an Expert System?", a: "Storing factual domain knowledge", b: "Applying logical rules to known facts to deduce new conclusions and answer queries", c: "Rendering user interface buttons", d: "Compiling Python scripts", ans: "B", exp: "The Inference Engine is the brain of an expert system that executes forward or backward chaining over the rule base." },
  { q: "Contrast Forward Chaining and Backward Chaining inference strategies.", exp: "Forward Chaining (data-driven) starts with known facts and applies rules to infer new facts until a goal is reached. Backward Chaining (goal-driven) starts with a hypothesis or goal and works backward to see if supporting facts exist in the knowledge base." },
  { q: "Which adversarial game-playing algorithm prunes game-tree branches that cannot possibly influence the final decision?", a: "Breadth-First Search", b: "Minimax with Alpha-Beta Pruning", c: "Dijkstra's Algorithm", d: "Genetic Algorithm", ans: "B", exp: "Alpha-Beta pruning eliminates subtrees when Alpha (best score for max) exceeds Beta (best score for min), achieving up to 2x depth improvement." },
  { q: "What activation function maps real-valued numbers into a probability distribution between 0 and 1?", a: "ReLU", b: "Sigmoid (Logistic)", c: "Linear", d: "Step function", ans: "B", exp: "The Sigmoid function sigma(z) = 1 / (1 + e^-z) squashes inputs to (0, 1), widely used for binary classification probabilities." },
  { q: "What is the Vanishing Gradient problem in training deep neural networks?", a: "Weights grow to infinity", b: "Gradients shrink exponentially as they propagate backward through layers, halting weight updates in early layers", c: "The network runs out of GPU memory", d: "Training data is lost", ans: "B", exp: "In deep networks with saturating activations like sigmoid/tanh, gradients approach zero during backpropagation, preventing early layers from learning." },
  { q: "Explain the architecture and learning mechanism of the Perceptron.", exp: "A single-layer Perceptron computes a weighted sum of inputs plus a bias and applies a step threshold activation function. It updates weights via the Perceptron Learning Rule upon misclassification, provably converging if and only if the data is linearly separable." },
  { q: "Why was the single-layer Perceptron historically criticized by Minsky and Papert in 1969?", a: "It required too much memory", b: "It could not solve non-linearly separable problems like the XOR function", c: "It could not process integers", d: "It was too slow for CPUs", ans: "B", exp: "Minsky and Papert proved single-layer perceptrons cannot learn non-linear decision boundaries like XOR, motivating multi-layer networks with backpropagation." },
  { q: "What algorithm is universally used to compute gradients of the loss function with respect to weights in multi-layer neural networks?", a: "A* Search", b: "Backpropagation (Chain Rule of Calculus)", c: "Simulated Annealing", d: "K-Means", ans: "B", exp: "Backpropagation applies the calculus chain rule backwards from output to input layers to compute partial derivatives of error for gradient descent." },
  { q: "Which regularizer technique randomly drops a percentage of neuron activations during training to prevent overfitting?", a: "L1 Lasso", b: "Dropout", c: "Batch Normalization", d: "Early Stopping", ans: "B", exp: "Dropout randomly zeroes out a fraction p of hidden unit outputs during each forward pass, preventing co-adaptation of feature detectors." },
  { q: "What is the Turing Test designed to evaluate?", a: "A computer's floating-point performance", b: "A machine's ability to exhibit intelligent behavior indistinguishable from that of a human", c: "The computational complexity of algorithms", d: "The correctness of mathematical proofs", ans: "B", exp: "Alan Turing proposed that if a human judge cannot reliably distinguish text conversation with a machine from a human, the machine exhibits intelligence." },
  { q: "Describe the differences between Supervised, Unsupervised, and Reinforcement Learning.", exp: "Supervised Learning trains on labeled (input, target) pairs to learn a mapping function. Unsupervised Learning discovers hidden patterns, clusters, or representations in unlabeled data. Reinforcement Learning trains an agent to make sequential decisions by interacting with an environment to maximize cumulative reward." },
  { q: "In Reinforcement Learning, what formula models the expected discounted cumulative future reward?", a: "Bellman Equation", b: "Bayes Theorem", c: "Coulomb's Law", d: "Fourier Transform", ans: "A", exp: "The Bellman Equation decomposes value functions into immediate reward plus the discounted value of successor states." },
  { q: "What does the Exploration vs Exploitation dilemma in Reinforcement Learning describe?", a: "Choosing between CPU and GPU hardware", b: "Balancing the need to gather new information about untested actions vs choosing the best-known action to maximize current reward", c: "Balancing memory vs disk usage", d: "Choosing between Python and C++", ans: "B", exp: "Agents must balance exploring unfamiliar state-actions to find superior policies with exploiting established high-reward actions (e.g., epsilon-greedy)." },
  { q: "Which search algorithm uses biological concepts like crossover, mutation, and natural selection to optimize candidate solutions?", a: "Simulated Annealing", b: "Genetic Algorithm", c: "Hill Climbing", d: "Depth-Limited Search", ans: "B", exp: "Genetic algorithms evolve a population of candidate chromosome solutions across generations using fitness evaluation, crossover, and mutation." },
  { q: "What heuristic search problem occurs in Hill Climbing when search stops at an elevated state that is lower than the global maximum?", a: "Ridge", b: "Local Maximum", c: "Plateau", d: "Horizon effect", ans: "B", exp: "Hill climbing gets trapped in local maxima where all immediate neighboring states have lower fitness, failing to reach the global peak." },
  { q: "Explain the role of Knowledge Representation in AI and name two formal representation formalisms.", exp: "Knowledge Representation structures domain facts and rules in a computable format that reasoning algorithms can process. Two formal formalisms are: 1) First-Order Predicate Logic (using quantifiers, predicates, and functions), and 2) Semantic Networks / Ontologies (graph structures of concepts and relation edges)." },
  { q: "What natural language processing model architecture introduced the Multi-Head Self-Attention mechanism in 2017?", a: "Recurrent Neural Network (RNN)", b: "Transformer", c: "Convolutional Neural Network (CNN)", d: "Long Short-Term Memory (LSTM)", ans: "B", exp: "Vaswani et al. introduced the Transformer architecture in 'Attention Is All You Need', replacing recurrence with parallel self-attention mechanisms." },
  { q: "What is an Admissible Heuristic in A* search?", a: "A heuristic that is always an integer", b: "A heuristic that never overestimates the true cost to reach the goal", c: "A heuristic that guarantees zero runtime", d: "A heuristic based on random numbers", ans: "B", exp: "An admissible heuristic h(n) satisfies h(n) <= h*(n) for all nodes n, where h*(n) is the true optimal cost to the nearest goal state." }
];

export const csc403ExpandedQuestions: SeedQuestion[] = [
  { q: "Which software development lifecycle model follows a rigid, linear-sequential progression of phases without iteration?", a: "Agile Scrum", b: "Waterfall Model", c: "Spiral Model", d: "Extreme Programming", ans: "B", exp: "The classical Waterfall model moves sequentially through Requirements, Design, Implementation, Testing, Deployment, and Maintenance." },
  { q: "What is the primary role of a Scrum Master in an Agile software development team?", a: "Writing product code", b: "Facilitating Scrum ceremonies and removing impediments for the team", c: "Managing client contracts", d: "Assigning daily tasks to developers", ans: "B", exp: "The Scrum Master is a servant-leader who coaches the team on Agile practices and shields them from external blockers." },
  { q: "In UML Class Diagrams, what relationship represents 'has-a' where the child component cannot exist independently of the parent?", a: "Association", b: "Aggregation", c: "Composition", d: "Generalization", ans: "C", exp: "Composition is strong ownership (depicted with a filled diamond) where lifecycle is bound: destroying the parent destroys the child." },
  { q: "Explain the difference between Functional and Non-Functional requirements in software engineering.", exp: "Functional requirements define specific behaviors, features, and calculations the software must perform (e.g., 'system shall send an SMS receipt'). Non-functional requirements specify quality attributes and constraints, such as performance, security, availability, and scalability (e.g., 'API response time < 200ms')." },
  { q: "Which design pattern ensures a class has only one single instance throughout the application lifecycle and provides a global access point to it?", a: "Factory Pattern", b: "Singleton Pattern", c: "Observer Pattern", d: "Decorator Pattern", ans: "B", exp: "The Singleton pattern restricts class instantiation to a single static instance with a private constructor and global getInstance() accessor." },
  { q: "What design pattern defines a one-to-many dependency between objects so that when one object changes state, all its dependents are notified automatically?", a: "Strategy Pattern", b: "Observer Pattern", c: "Adapter Pattern", d: "Composite Pattern", ans: "B", exp: "The Observer pattern (Pub-Sub) decouples subjects from observers, broadcasting state change events to registered listeners." },
  { q: "In software testing, what is Regression Testing?", a: "Testing the performance under extreme load", b: "Re-running existing test suites after code modifications to ensure prior functionality was not broken", c: "Initial testing by client stakeholders", d: "Testing without looking at source code", ans: "B", exp: "Regression testing verifies that recent bug fixes or feature additions have not inadvertently introduced new defects into working features." },
  { q: "Discuss the difference between Black-Box Testing and White-Box Testing.", exp: "Black-Box testing evaluates software functionality from an external perspective against requirements without knowledge of internal code logic or data structures. White-Box testing examines internal code paths, branches, statements, and conditions using knowledge of source implementation." },
  { q: "What metric measures the degree of interdependence and coupling between software modules?", a: "Cohesion", b: "Coupling", c: "Cyclomatic Complexity", d: "Code Churn", ans: "B", exp: "Coupling measures module interdependence. Software engineering best practices advocate Low Coupling and High Cohesion." },
  { q: "What does High Cohesion in a software module mean?", a: "The module depends on dozens of external libraries", b: "The elements and responsibilities inside the module are closely focused on a single well-defined task", c: "The module executes concurrently on multiple threads", d: "The code is compiled into assembly", ans: "B", exp: "High cohesion means a module encapsulates related logic, supporting single responsibility and maintainability." },
  { q: "What does the Single Responsibility Principle (SRP) in SOLID software design state?", a: "Every function must have only one argument", b: "A class should have one, and only one, reason to change", c: "A software project must only use one programming language", d: "A database table must have one primary key", ans: "B", exp: "SRP dictates that a class should encapsulate a single responsibility, reducing ripple effects when business requirements evolve." },
  { q: "What is Continuous Integration (CI) in modern DevOps practices?", a: "Deploying code to production once per year", b: "Automated merging, building, and automated test execution each time code is committed to a shared repository", c: "Manually copying files to an FTP server", d: "Rewriting legacy code into microservices", ans: "B", exp: "CI automates build verification and test suites on every pull request to detect integration defects early." },
  { q: "Explain the architectural differences between Monolithic and Microservices architectures.", exp: "A Monolithic architecture packages all application business domains into a single unified deployment unit with a shared codebase and database. A Microservices architecture breaks the application into independent, loosely coupled services communicating via lightweight network APIs (HTTP/gRPC), each managing its own database and scalable independently." },
  { q: "What is Cyclomatic Complexity and why is it monitored in code quality reviews?", a: "The number of lines of code in a file", b: "A quantitative measure of the number of linearly independent paths through program source code", c: "The number of bugs reported per sprint", d: "The CPU cycle count per loop", ans: "B", exp: "Developed by Thomas McCabe, Cyclomatic Complexity M = E - N + 2P indicates the minimum number of test cases required for complete branch coverage." },
  { q: "In Git version control, what does 'git rebase' do compared to 'git merge'?", a: "Rebase permanently deletes branches", b: "Rebase reapplies commits on top of another base tip, creating a linear history; merge combines branches with a merge commit", c: "Rebase encrypts commits", d: "Merge creates copies of all files", ans: "B", exp: "Rebasing rewrites commit history by transplanting branch commits sequentially onto the target branch, keeping Git logs clean and linear." },
  { q: "What is a 'Code Smell' in software maintenance?", a: "A compiler syntax error", b: "A surface symptom in code that indicates a deeper design flaw or technical debt", c: "A memory leak detected by profilers", d: "Corrupted source files on disk", ans: "B", exp: "Code smells (e.g., God Objects, Long Methods, Duplicate Code) are not bugs but design anti-patterns that hinder long-term maintainability." },
  { q: "What is Technical Debt in software project management?", a: "The financial cost of cloud servers", b: "The implied future rework cost caused by choosing an easy, fast suboptimal solution now instead of a better approach", c: "Unpaid contractor invoices", d: "Software licensing fees", ans: "B", exp: "Coined by Ward Cunningham, technical debt compounds interest over time in the form of increased maintenance overhead and slowed development velocity." },
  { q: "Explain the role of User Stories and Acceptance Criteria in Agile development.", exp: "A User Story captures a feature from an end-user perspective: 'As a [user], I want [action] so that [benefit]'. Acceptance Criteria define the specific conditions and boundary checks that must be satisfied for the user story to be marked as complete (Definition of Done)." },
  { q: "What is the primary objective of a Software Architecture Review?", a: "Fixing spelling mistakes in documentation", b: "Evaluating whether architectural decisions satisfy critical quality attributes, scalability requirements, and risk boundaries", c: "Calculating developer payroll", d: "Testing network cables", ans: "B", exp: "Architecture evaluation methods (like ATAM) analyze architectural choices against trade-offs, security, resilience, and business goals." },
  { q: "Which testing level verifies that individual functions, procedures, or classes operate correctly in isolation?", a: "Unit Testing", b: "Integration Testing", c: "System Testing", d: "User Acceptance Testing (UAT)", ans: "A", exp: "Unit testing tests individual atomic software units in isolation, frequently utilizing mocks and stubs for external dependencies." }
];
