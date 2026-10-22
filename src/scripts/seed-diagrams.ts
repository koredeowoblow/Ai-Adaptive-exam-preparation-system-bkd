/**
 * Standard vector SVG diagrams for university exam questions and subparts.
 * Embedded directly as base64 data URIs so they render offline without network dependencies.
 */

function toSvgDataUri(svg: string): string {
  const base64 = Buffer.from(svg.trim()).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

// 1. Digital Logic Gate Full Adder Circuit
const FULL_ADDER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 740 360" width="740" height="360" style="background:#0f172a; border-radius:12px; font-family:system-ui, -apple-system, sans-serif;">
  <defs>
    <linearGradient id="gateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Title & Frame -->
  <text x="370" y="32" fill="#f8fafc" font-size="16" font-weight="700" text-anchor="middle" letter-spacing="1">FIGURE 1.1: 1-BIT FULL ADDER LOGIC GATE SCHEMATIC</text>
  <rect x="20" y="45" width="700" height="295" rx="8" fill="none" stroke="#334155" stroke-width="1.5" stroke-dasharray="4 4"/>

  <!-- Input Lines & Labels -->
  <line x1="40" y1="90" x2="170" y2="90" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
  <circle cx="40" cy="90" r="5" fill="#38bdf8"/>
  <text x="30" y="95" fill="#38bdf8" font-size="16" font-weight="bold" text-anchor="end">A</text>

  <line x1="40" y1="130" x2="170" y2="130" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
  <circle cx="40" cy="130" r="5" fill="#38bdf8"/>
  <text x="30" y="135" fill="#38bdf8" font-size="16" font-weight="bold" text-anchor="end">B</text>

  <line x1="40" y1="210" x2="390" y2="210" stroke="#a78bfa" stroke-width="3" stroke-linecap="round"/>
  <circle cx="40" cy="210" r="5" fill="#a78bfa"/>
  <text x="30" y="215" fill="#a78bfa" font-size="16" font-weight="bold" text-anchor="end">Cin</text>

  <!-- Tap points for B & A into AND 1 -->
  <circle cx="90" cy="90" r="4" fill="#38bdf8"/>
  <line x1="90" y1="90" x2="90" y2="260" stroke="#38bdf8" stroke-width="2"/>
  <line x1="90" y1="260" x2="170" y2="260" stroke="#38bdf8" stroke-width="2"/>

  <circle cx="120" cy="130" r="4" fill="#38bdf8"/>
  <line x1="120" y1="130" x2="120" y2="290" stroke="#38bdf8" stroke-width="2"/>
  <line x1="120" y1="290" x2="170" y2="290" stroke="#38bdf8" stroke-width="2"/>

  <!-- GATE 1: XOR (A XOR B) -->
  <g transform="translate(170, 75)" filter="url(#shadow)">
    <rect width="90" height="70" rx="10" fill="url(#gateGrad)" stroke="#38bdf8" stroke-width="2"/>
    <text x="45" y="42" fill="#f8fafc" font-size="15" font-weight="bold" text-anchor="middle">XOR 1</text>
  </g>
  <line x1="260" y1="110" x2="390" y2="110" stroke="#f43f5e" stroke-width="2.5"/>
  <text x="320" y="102" fill="#f43f5e" font-size="12" font-weight="600" text-anchor="middle">A ⊕ B</text>

  <!-- Tap A XOR B down to AND 2 -->
  <circle cx="320" cy="110" r="4" fill="#f43f5e"/>
  <line x1="320" y1="110" x2="320" y2="165" stroke="#f43f5e" stroke-width="2"/>
  <line x1="320" y1="165" x2="390" y2="165" stroke="#f43f5e" stroke-width="2"/>

  <!-- Tap Cin into AND 2 & XOR 2 -->
  <circle cx="350" cy="210" r="4" fill="#a78bfa"/>
  <line x1="350" y1="210" x2="350" y2="135" stroke="#a78bfa" stroke-width="2"/>
  <line x1="350" y1="135" x2="390" y2="135" stroke="#a78bfa" stroke-width="2"/>

  <line x1="350" y1="210" x2="350" y2="185" stroke="#a78bfa" stroke-width="2"/>
  <line x1="350" y1="185" x2="390" y2="185" stroke="#a78bfa" stroke-width="2"/>

  <!-- GATE 2: XOR 2 -> SUM -->
  <g transform="translate(390, 95)" filter="url(#shadow)">
    <rect width="90" height="60" rx="10" fill="url(#gateGrad)" stroke="#34d399" stroke-width="2"/>
    <text x="45" y="36" fill="#f8fafc" font-size="14" font-weight="bold" text-anchor="middle">XOR 2</text>
  </g>
  <line x1="480" y1="125" x2="650" y2="125" stroke="#34d399" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="650" cy="125" r="5" fill="#34d399"/>
  <text x="665" y="131" fill="#34d399" font-size="16" font-weight="bold">SUM = A ⊕ B ⊕ Cin</text>

  <!-- GATE 3: AND 2 (Cin AND (A XOR B)) -->
  <g transform="translate(390, 155)" filter="url(#shadow)">
    <rect width="90" height="50" rx="8" fill="url(#gateGrad)" stroke="#fbbf24" stroke-width="1.5"/>
    <text x="45" y="31" fill="#f8fafc" font-size="13" font-weight="bold" text-anchor="middle">AND 2</text>
  </g>

  <!-- GATE 4: AND 1 (A AND B) -->
  <g transform="translate(170, 245)" filter="url(#shadow)">
    <rect width="90" height="60" rx="8" fill="url(#gateGrad)" stroke="#fbbf24" stroke-width="1.5"/>
    <text x="45" y="36" fill="#f8fafc" font-size="13" font-weight="bold" text-anchor="middle">AND 1</text>
  </g>

  <!-- Wire AND 1 output to OR -->
  <line x1="260" y1="275" x2="520" y2="275" stroke="#fbbf24" stroke-width="2"/>
  <line x1="520" y1="275" x2="520" y2="225" stroke="#fbbf24" stroke-width="2"/>
  <line x1="520" y1="225" x2="550" y2="225" stroke="#fbbf24" stroke-width="2"/>

  <!-- Wire AND 2 output to OR -->
  <line x1="480" y1="180" x2="520" y2="180" stroke="#fbbf24" stroke-width="2"/>
  <line x1="520" y1="180" x2="520" y2="205" stroke="#fbbf24" stroke-width="2"/>
  <line x1="520" y1="205" x2="550" y2="205" stroke="#fbbf24" stroke-width="2"/>

  <!-- GATE 5: OR Gate -> Cout -->
  <g transform="translate(550, 190)" filter="url(#shadow)">
    <rect width="90" height="55" rx="10" fill="url(#gateGrad)" stroke="#f43f5e" stroke-width="2"/>
    <text x="45" y="33" fill="#f8fafc" font-size="14" font-weight="bold" text-anchor="middle">OR 1</text>
  </g>
  <line x1="640" y1="217" x2="680" y2="217" stroke="#f43f5e" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="680" cy="217" r="5" fill="#f43f5e"/>
  <text x="690" y="222" fill="#f43f5e" font-size="15" font-weight="bold">Cout</text>

  <!-- Status / legend -->
  <text x="40" y="325" fill="#94a3b8" font-size="12">Boolean equations: Sum = A ⊕ B ⊕ Cin  |  Cout = (A · B) + (Cin · (A ⊕ B))</text>
</svg>
`;

// 2. Logic Gate Timing Glitch Waveform
const TIMING_WAVEFORM_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 280" width="720" height="280" style="background:#0f172a; border-radius:12px; font-family:system-ui, -apple-system, sans-serif;">
  <text x="360" y="28" fill="#f8fafc" font-size="15" font-weight="700" text-anchor="middle">FIGURE 1.2: GATE PROPAGATION DELAY &amp; HAZARD GLITCH WAVEFORM</text>
  <rect x="20" y="42" width="680" height="220" rx="8" fill="none" stroke="#334155" stroke-width="1.5" stroke-dasharray="4 4"/>

  <!-- Grid lines -->
  <line x1="160" y1="55" x2="160" y2="245" stroke="#1e293b" stroke-width="2" stroke-dasharray="2 4"/>
  <line x1="300" y1="55" x2="300" y2="245" stroke="#1e293b" stroke-width="2" stroke-dasharray="2 4"/>
  <line x1="440" y1="55" x2="440" y2="245" stroke="#1e293b" stroke-width="2" stroke-dasharray="2 4"/>
  <line x1="580" y1="55" x2="580" y2="245" stroke="#1e293b" stroke-width="2" stroke-dasharray="2 4"/>

  <!-- Signal 1: Clock / Input Transition -->
  <text x="130" y="85" fill="#38bdf8" font-size="14" font-weight="bold" text-anchor="end">Input A</text>
  <path d="M 150 95 L 260 95 L 280 65 L 500 65 L 520 95 L 670 95" fill="none" stroke="#38bdf8" stroke-width="3"/>

  <!-- Signal 2: Internal Wire (Delayed) -->
  <text x="130" y="145" fill="#fbbf24" font-size="14" font-weight="bold" text-anchor="end">Node X (t_pd)</text>
  <path d="M 150 155 L 300 155 L 320 125 L 540 125 L 560 155 L 670 155" fill="none" stroke="#fbbf24" stroke-width="3"/>
  <text x="290" y="120" fill="#fbbf24" font-size="11">Δt = 4.2ns</text>

  <!-- Signal 3: Output with Glitch -->
  <text x="130" y="205" fill="#f43f5e" font-size="14" font-weight="bold" text-anchor="end">Output Y</text>
  <path d="M 150 215 L 280 215 L 285 185 L 315 185 L 320 215 L 670 215" fill="none" stroke="#f43f5e" stroke-width="3"/>
  <rect x="278" y="178" width="50" height="42" fill="#f43f5e" fill-opacity="0.2" rx="4" stroke="#f43f5e" stroke-dasharray="2 2"/>
  <text x="303" y="172" fill="#f43f5e" font-size="11" font-weight="bold" text-anchor="middle">Static-1 Hazard Glitch</text>

  <text x="360" y="250" fill="#94a3b8" font-size="12" text-anchor="middle">Dynamic race condition caused by asymmetric XOR vs AND path propagation times</text>
</svg>
`;

// 3. Relational Database Entity Relationship Diagram (ERD)
const RELATIONAL_ERD_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 390" width="780" height="390" style="background:#090d16; border-radius:12px; font-family:system-ui, -apple-system, sans-serif;">
  <text x="390" y="30" fill="#f8fafc" font-size="16" font-weight="700" text-anchor="middle">FIGURE 2.1: RELATIONAL DATABASE ENTITY RELATIONSHIP DIAGRAM (ERD)</text>
  <rect x="20" y="45" width="740" height="330" rx="8" fill="none" stroke="#1e293b" stroke-width="1.5"/>

  <!-- Table 1: DEPARTMENT -->
  <g transform="translate(40, 70)">
    <rect width="190" height="130" rx="8" fill="#1e1b4b" stroke="#6366f1" stroke-width="2"/>
    <rect width="190" height="32" rx="8" fill="#4338ca"/>
    <text x="95" y="22" fill="#ffffff" font-size="13" font-weight="bold" text-anchor="middle">DEPARTMENT</text>
    <text x="15" y="55" fill="#fbcfe8" font-size="12" font-family="monospace">🔑 dept_id (PK)</text>
    <text x="15" y="78" fill="#e2e8f0" font-size="12" font-family="monospace">   dept_name</text>
    <text x="15" y="101" fill="#e2e8f0" font-size="12" font-family="monospace">   faculty_name</text>
    <text x="15" y="121" fill="#e2e8f0" font-size="12" font-family="monospace">   head_of_dept</text>
  </g>

  <!-- Table 2: STUDENT -->
  <g transform="translate(300, 70)">
    <rect width="200" height="150" rx="8" fill="#0f2b38" stroke="#0ea5e9" stroke-width="2"/>
    <rect width="200" height="32" rx="8" fill="#0284c7"/>
    <text x="100" y="22" fill="#ffffff" font-size="13" font-weight="bold" text-anchor="middle">STUDENT</text>
    <text x="15" y="55" fill="#bae6fd" font-size="12" font-family="monospace">🔑 student_id (PK)</text>
    <text x="15" y="78" fill="#e2e8f0" font-size="12" font-family="monospace">   matric_no (UK)</text>
    <text x="15" y="101" fill="#e2e8f0" font-size="12" font-family="monospace">   full_name</text>
    <text x="15" y="124" fill="#cbd5e1" font-size="12" font-family="monospace">   level [100-500]</text>
    <text x="15" y="144" fill="#a7f3d0" font-size="12" font-family="monospace">🔗 dept_id (FK)</text>
  </g>

  <!-- Table 3: COURSE -->
  <g transform="translate(40, 230)">
    <rect width="190" height="130" rx="8" fill="#143324" stroke="#10b981" stroke-width="2"/>
    <rect width="190" height="32" rx="8" fill="#059669"/>
    <text x="95" y="22" fill="#ffffff" font-size="13" font-weight="bold" text-anchor="middle">COURSE</text>
    <text x="15" y="55" fill="#a7f3d0" font-size="12" font-family="monospace">🔑 course_id (PK)</text>
    <text x="15" y="78" fill="#e2e8f0" font-size="12" font-family="monospace">   course_code (UK)</text>
    <text x="15" y="101" fill="#e2e8f0" font-size="12" font-family="monospace">   title</text>
    <text x="15" y="121" fill="#cbd5e1" font-size="12" font-family="monospace">   credit_units</text>
  </g>

  <!-- Table 4: ENROLLMENT (Junction) -->
  <g transform="translate(550, 150)">
    <rect width="190" height="160" rx="8" fill="#2d1537" stroke="#ec4899" stroke-width="2"/>
    <rect width="190" height="32" rx="8" fill="#db2777"/>
    <text x="95" y="22" fill="#ffffff" font-size="13" font-weight="bold" text-anchor="middle">ENROLLMENT</text>
    <text x="15" y="55" fill="#fbcfe8" font-size="12" font-family="monospace">🔑 enrollment_id (PK)</text>
    <text x="15" y="78" fill="#bae6fd" font-size="12" font-family="monospace">🔗 student_id (FK)</text>
    <text x="15" y="101" fill="#a7f3d0" font-size="12" font-family="monospace">🔗 course_id (FK)</text>
    <text x="15" y="124" fill="#e2e8f0" font-size="12" font-family="monospace">   semester</text>
    <text x="15" y="147" fill="#fef08a" font-size="12" font-family="monospace">   grade_point [0-5]</text>
  </g>

  <!-- Relationship Connectors -->
  <!-- Dept -> Student (1:M) -->
  <line x1="230" y1="120" x2="300" y2="120" stroke="#6366f1" stroke-width="2.5"/>
  <text x="265" y="112" fill="#818cf8" font-size="12" font-weight="bold" text-anchor="middle">1 : N</text>

  <!-- Student -> Enrollment (1:M) -->
  <line x1="500" y1="160" x2="550" y2="180" stroke="#0ea5e9" stroke-width="2.5"/>
  <text x="525" y="165" fill="#38bdf8" font-size="12" font-weight="bold" text-anchor="middle">1 : N</text>

  <!-- Course -> Enrollment (1:M) -->
  <path d="M 230 295 L 530 295 L 550 250" fill="none" stroke="#10b981" stroke-width="2.5"/>
  <text x="380" y="288" fill="#34d399" font-size="12" font-weight="bold" text-anchor="middle">1 : N (Composite Many-to-Many via Enrollment)</text>
</svg>
`;

// 4. 5-Stage CPU Instruction Pipeline Architecture
const CPU_PIPELINE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 320" width="760" height="320" style="background:#0b1120; border-radius:12px; font-family:system-ui, -apple-system, sans-serif;">
  <text x="380" y="30" fill="#f8fafc" font-size="16" font-weight="700" text-anchor="middle">FIGURE 3.1: CLASSICAL 5-STAGE RISC INSTRUCTION PIPELINE</text>
  <rect x="20" y="45" width="720" height="260" rx="8" fill="none" stroke="#334155" stroke-width="1.5"/>

  <!-- Stages Boxes -->
  <!-- 1. IF -->
  <g transform="translate(40, 80)">
    <rect width="105" height="110" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
    <text x="52" y="30" fill="#38bdf8" font-size="15" font-weight="bold" text-anchor="middle">1. IF</text>
    <text x="52" y="55" fill="#e2e8f0" font-size="11" text-anchor="middle">Instruction</text>
    <text x="52" y="70" fill="#e2e8f0" font-size="11" text-anchor="middle">Fetch</text>
    <text x="52" y="95" fill="#94a3b8" font-size="10" font-family="monospace" text-anchor="middle">PC / I-Mem</text>
  </g>

  <!-- Register IF/ID -->
  <rect x="155" y="65" width="16" height="140" fill="#475569" rx="3"/>

  <!-- 2. ID -->
  <g transform="translate(180, 80)">
    <rect width="105" height="110" rx="8" fill="#1e293b" stroke="#818cf8" stroke-width="2"/>
    <text x="52" y="30" fill="#818cf8" font-size="15" font-weight="bold" text-anchor="middle">2. ID</text>
    <text x="52" y="55" fill="#e2e8f0" font-size="11" text-anchor="middle">Instruction</text>
    <text x="52" y="70" fill="#e2e8f0" font-size="11" text-anchor="middle">Decode</text>
    <text x="52" y="95" fill="#94a3b8" font-size="10" font-family="monospace" text-anchor="middle">RegFile Read</text>
  </g>

  <!-- Register ID/EX -->
  <rect x="295" y="65" width="16" height="140" fill="#475569" rx="3"/>

  <!-- 3. EX -->
  <g transform="translate(320, 80)">
    <rect width="105" height="110" rx="8" fill="#1e293b" stroke="#fbbf24" stroke-width="2"/>
    <text x="52" y="30" fill="#fbbf24" font-size="15" font-weight="bold" text-anchor="middle">3. EX</text>
    <text x="52" y="55" fill="#e2e8f0" font-size="11" text-anchor="middle">Execution</text>
    <text x="52" y="70" fill="#e2e8f0" font-size="11" text-anchor="middle">ALU Calc</text>
    <text x="52" y="95" fill="#94a3b8" font-size="10" font-family="monospace" text-anchor="middle">ALU / Target</text>
  </g>

  <!-- Register EX/MEM -->
  <rect x="435" y="65" width="16" height="140" fill="#475569" rx="3"/>

  <!-- 4. MEM -->
  <g transform="translate(460, 80)">
    <rect width="105" height="110" rx="8" fill="#1e293b" stroke="#34d399" stroke-width="2"/>
    <text x="52" y="30" fill="#34d399" font-size="15" font-weight="bold" text-anchor="middle">4. MEM</text>
    <text x="52" y="55" fill="#e2e8f0" font-size="11" text-anchor="middle">Memory</text>
    <text x="52" y="70" fill="#e2e8f0" font-size="11" text-anchor="middle">Access</text>
    <text x="52" y="95" fill="#94a3b8" font-size="10" font-family="monospace" text-anchor="middle">D-Cache / RAM</text>
  </g>

  <!-- Register MEM/WB -->
  <rect x="575" y="65" width="16" height="140" fill="#475569" rx="3"/>

  <!-- 5. WB -->
  <g transform="translate(600, 80)">
    <rect width="105" height="110" rx="8" fill="#1e293b" stroke="#f43f5e" stroke-width="2"/>
    <text x="52" y="30" fill="#f43f5e" font-size="15" font-weight="bold" text-anchor="middle">5. WB</text>
    <text x="52" y="55" fill="#e2e8f0" font-size="11" text-anchor="middle">Write</text>
    <text x="52" y="70" fill="#e2e8f0" font-size="11" text-anchor="middle">Back</text>
    <text x="52" y="95" fill="#94a3b8" font-size="10" font-family="monospace" text-anchor="middle">RegFile Write</text>
  </g>

  <!-- Forwarding Path Line -->
  <path d="M 512 200 L 512 245 L 372 245 L 372 200" fill="none" stroke="#ec4899" stroke-width="2.5" stroke-dasharray="3 3"/>
  <text x="442" y="262" fill="#ec4899" font-size="12" font-weight="bold" text-anchor="middle">MEM -> EX Data Forwarding Bypass (RAW Hazard Mitigation)</text>

  <path d="M 652 200 L 652 275 L 350 275 L 350 200" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="3 3"/>
  <text x="500" y="292" fill="#f59e0b" font-size="11" text-anchor="middle">WB -> EX Forwarding Path</text>
</svg>
`;

// 5. AVL Balanced Binary Search Tree Rotation
const AVL_ROTATION_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 740 320" width="740" height="320" style="background:#0f172a; border-radius:12px; font-family:system-ui, -apple-system, sans-serif;">
  <text x="370" y="28" fill="#f8fafc" font-size="16" font-weight="700" text-anchor="middle">FIGURE 4.1: AVL TREE LEFT-RIGHT (LR) DOUBLE ROTATION</text>
  <rect x="20" y="42" width="700" height="265" rx="8" fill="none" stroke="#334155" stroke-width="1.5"/>

  <!-- Unbalanced Side -->
  <text x="170" y="70" fill="#f43f5e" font-size="13" font-weight="bold" text-anchor="middle">UNBALANCED (BF = +2)</text>
  
  <line x1="170" y1="100" x2="110" y2="150" stroke="#94a3b8" stroke-width="2"/>
  <line x1="110" y1="150" x2="140" y2="210" stroke="#94a3b8" stroke-width="2"/>

  <!-- Root Node 50 -->
  <circle cx="170" cy="100" r="22" fill="#1e293b" stroke="#f43f5e" stroke-width="2.5"/>
  <text x="170" y="106" fill="#f8fafc" font-size="14" font-weight="bold" text-anchor="middle">50</text>
  <text x="210" y="100" fill="#f43f5e" font-size="11" font-weight="bold">BF=+2</text>

  <!-- Left Child 20 -->
  <circle cx="110" cy="150" r="22" fill="#1e293b" stroke="#fbbf24" stroke-width="2.5"/>
  <text x="110" y="156" fill="#f8fafc" font-size="14" font-weight="bold" text-anchor="middle">20</text>
  <text x="65" y="155" fill="#fbbf24" font-size="11" font-weight="bold">BF=-1</text>

  <!-- Child's Right Child 35 -->
  <circle cx="140" cy="210" r="22" fill="#1e293b" stroke="#38bdf8" stroke-width="2.5"/>
  <text x="140" y="216" fill="#f8fafc" font-size="14" font-weight="bold" text-anchor="middle">35</text>
  <text x="140" y="250" fill="#38bdf8" font-size="11" font-weight="bold" text-anchor="middle">Inserted Key</text>

  <!-- Rotation Arrow -->
  <g transform="translate(320, 140)">
    <line x1="0" y1="0" x2="70" y2="0" stroke="#a78bfa" stroke-width="4"/>
    <polygon points="70,-7 85,0 70,7" fill="#a78bfa"/>
    <text x="40" y="-14" fill="#a78bfa" font-size="12" font-weight="bold" text-anchor="middle">1. Left Rotate (20)</text>
    <text x="40" y="22" fill="#a78bfa" font-size="12" font-weight="bold" text-anchor="middle">2. Right Rotate (50)</text>
  </g>

  <!-- Balanced Result Side -->
  <text x="560" y="70" fill="#34d399" font-size="13" font-weight="bold" text-anchor="middle">BALANCED AVL (BF = 0)</text>

  <line x1="560" y1="100" x2="490" y2="160" stroke="#34d399" stroke-width="2"/>
  <line x1="560" y1="100" x2="630" y2="160" stroke="#34d399" stroke-width="2"/>

  <!-- New Root 35 -->
  <circle cx="560" cy="100" r="24" fill="#064e3b" stroke="#34d399" stroke-width="3"/>
  <text x="560" y="106" fill="#f8fafc" font-size="15" font-weight="bold" text-anchor="middle">35</text>
  <text x="600" y="100" fill="#34d399" font-size="11" font-weight="bold">BF=0</text>

  <!-- Left 20 -->
  <circle cx="490" cy="160" r="22" fill="#1e293b" stroke="#34d399" stroke-width="2"/>
  <text x="490" y="166" fill="#f8fafc" font-size="14" font-weight="bold" text-anchor="middle">20</text>
  <text x="450" y="160" fill="#34d399" font-size="11" font-weight="bold">BF=0</text>

  <!-- Right 50 -->
  <circle cx="630" cy="160" r="22" fill="#1e293b" stroke="#34d399" stroke-width="2"/>
  <text x="630" y="166" fill="#f8fafc" font-size="14" font-weight="bold" text-anchor="middle">50</text>
  <text x="670" y="160" fill="#34d399" font-size="11" font-weight="bold">BF=0</text>

  <text x="370" y="290" fill="#94a3b8" font-size="11" text-anchor="middle">Double rotation restores strictly balanced logarithmic search complexity O(log n)</text>
</svg>
`;

// 6. Finite Automaton (DFA) Transition Graph
const DFA_AUTOMATON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 280" width="700" height="280" style="background:#090d16; border-radius:12px; font-family:system-ui, -apple-system, sans-serif;">
  <text x="350" y="28" fill="#f8fafc" font-size="16" font-weight="700" text-anchor="middle">FIGURE 6.1: DFA STATE TRANSITION GRAPH (LANGUAGE L: ENDS WITH '01')</text>
  <rect x="20" y="42" width="660" height="225" rx="8" fill="none" stroke="#1e293b" stroke-width="1.5"/>

  <!-- Start Arrow into q0 -->
  <line x1="50" y1="130" x2="120" y2="130" stroke="#38bdf8" stroke-width="3"/>
  <polygon points="120,124 135,130 120,136" fill="#38bdf8"/>
  <text x="75" y="118" fill="#38bdf8" font-size="13" font-weight="bold">Start</text>

  <!-- State q0 -->
  <circle cx="170" cy="130" r="32" fill="#1e293b" stroke="#38bdf8" stroke-width="2.5"/>
  <text x="170" y="137" fill="#f8fafc" font-size="16" font-weight="bold" text-anchor="middle">q0</text>

  <!-- Self loop on q0 (input 1) -->
  <path d="M 155 100 C 140 50, 200 50, 185 100" fill="none" stroke="#94a3b8" stroke-width="2"/>
  <polygon points="187,97 185,107 177,100" fill="#94a3b8"/>
  <text x="170" y="55" fill="#e2e8f0" font-size="13" font-weight="bold" text-anchor="middle">1</text>

  <!-- Transition q0 -> q1 on 0 -->
  <line x1="202" y1="130" x2="310" y2="130" stroke="#34d399" stroke-width="2.5"/>
  <polygon points="310,124 325,130 310,136" fill="#34d399"/>
  <text x="260" y="120" fill="#34d399" font-size="14" font-weight="bold" text-anchor="middle">0</text>

  <!-- State q1 -->
  <circle cx="360" cy="130" r="32" fill="#1e293b" stroke="#34d399" stroke-width="2.5"/>
  <text x="360" y="137" fill="#f8fafc" font-size="16" font-weight="bold" text-anchor="middle">q1</text>

  <!-- Self loop on q1 (input 0) -->
  <path d="M 345 100 C 330 50, 390 50, 375 100" fill="none" stroke="#94a3b8" stroke-width="2"/>
  <polygon points="377,97 375,107 367,100" fill="#94a3b8"/>
  <text x="360" y="55" fill="#e2e8f0" font-size="13" font-weight="bold" text-anchor="middle">0</text>

  <!-- Transition q1 -> q2 on 1 -->
  <line x1="392" y1="130" x2="500" y2="130" stroke="#f43f5e" stroke-width="2.5"/>
  <polygon points="500,124 515,130 500,136" fill="#f43f5e"/>
  <text x="450" y="120" fill="#f43f5e" font-size="14" font-weight="bold" text-anchor="middle">1</text>

  <!-- State q2 (Accepting - Double Circle) -->
  <circle cx="550" cy="130" r="32" fill="#1e293b" stroke="#f43f5e" stroke-width="2.5"/>
  <circle cx="550" cy="130" r="26" fill="none" stroke="#f43f5e" stroke-width="2"/>
  <text x="550" y="137" fill="#f8fafc" font-size="16" font-weight="bold" text-anchor="middle">q2</text>
  <text x="550" y="180" fill="#f43f5e" font-size="11" font-weight="bold" text-anchor="middle">(Accept)</text>

  <!-- Arc q2 -> q1 on 0 -->
  <path d="M 530 155 C 470 220, 420 220, 375 160" fill="none" stroke="#34d399" stroke-width="2"/>
  <polygon points="370,165 378,155 382,165" fill="#34d399"/>
  <text x="450" y="225" fill="#34d399" font-size="13" font-weight="bold" text-anchor="middle">0</text>

  <!-- Arc q2 -> q0 on 1 -->
  <path d="M 550 98 C 500 20, 240 20, 185 98" fill="none" stroke="#38bdf8" stroke-width="2"/>
  <polygon points="183,93 183,105 192,98" fill="#38bdf8"/>
  <text x="350" y="32" fill="#38bdf8" font-size="13" font-weight="bold" text-anchor="middle">1</text>
</svg>
`;

export const SeedDiagrams = {
  fullAdderCircuit: toSvgDataUri(FULL_ADDER_SVG),
  timingWaveform: toSvgDataUri(TIMING_WAVEFORM_SVG),
  relationalErd: toSvgDataUri(RELATIONAL_ERD_SVG),
  cpuPipeline: toSvgDataUri(CPU_PIPELINE_SVG),
  avlRotation: toSvgDataUri(AVL_ROTATION_SVG),
  dfaAutomaton: toSvgDataUri(DFA_AUTOMATON_SVG),
};
