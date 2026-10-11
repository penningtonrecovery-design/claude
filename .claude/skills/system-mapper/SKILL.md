---
name: system-mapper
description: Map any system, process, or workflow into visualizations with bottleneck analysis and optimization suggestions. Use when the user needs to visualize a workflow, map a process, diagram a system, understand how something works, document a workflow, analyze a business process, optimize a workflow, find bottlenecks, improve efficiency, visualize data flow, create swimlanes, diagram technical architecture, or see the big picture of any system.
triggers:
  - visualize this workflow
  - map this system
  - diagram my process
  - how does this work
  - workflow diagram
  - process map
  - system architecture
  - data flow
  - visualize process
  - optimize workflow
  - find bottlenecks
  - swimlane diagram
  - dependency diagram
  - workflow bottleneck
---

# System Mapper

Transform any system or workflow description into interactive visualizations with bottleneck analysis and optimization suggestions. Supports flowcharts, swimlanes, dependency graphs, state machines, and generates both interactive HTML and static SVG.

## Why This Matters

Most people understand systems through conversations and documentation. Visuals:
- Make invisible processes visible
- Identify bottlenecks, single points of failure, and redundancies
- Enable teams to align on actual vs intended process
- Surface optimization opportunities
- Create a shared mental model

This skill does that across ANY system type.

## Instructions

### Step 1: Parse the System Description

Extract all components from the user's description:

| Component | What to Look For | Example |
|-----------|-----------------|---------|
| **Triggers/Initiators** | What starts the workflow | "When customer submits form", "Daily at 9am", "After payment received" |
| **Inputs** | Data entering the system | "Customer info, payment details, file upload" |
| **Processing Steps** | Actions that transform data | "Validate email, calculate quote, send confirmation" |
| **Tools/Services** | External systems involved | "Stripe, Salesforce, Gmail, Zapier, Claude" |
| **Decision Points** | Conditional branches | "If amount > $1000", "If customer is repeat client" |
| **Data Stores** | Where data persists | "Database, spreadsheet, cache, queue" |
| **Outputs/Results** | Final deliverables | "Invoice, Slack notification, database entry" |
| **Loops/Recursion** | Repeating patterns | "For each item in list", "Retry until success" |
| **Handoffs** | Where work moves between people/teams | "Handed to QA", "Escalated to manager" |
| **Delays/Waits** | Time-based pauses | "Wait 24 hours", "In queue for 2 days" |

Ask clarifying questions if unclear:
- "Who owns each step?"
- "What happens if [decision] fails?"
- "Are there parallel or sequential steps?"
- "Where do bottlenecks currently happen?"

### Step 2: Auto-Detect Best Visualization Type

Choose the visualization that best matches the system:

| Type | Best For | Example |
|------|----------|---------|
| **Flowchart** | Linear processes with decisions | Order processing, customer onboarding |
| **Swimlane** | Multi-team handoffs, parallel work | Marketing → Sales → Support workflow |
| **Dependency Graph** | Task sequencing, critical path | Project planning, build pipelines |
| **State Machine** | Status transitions, finite states | User lifecycle, order status changes |
| **Hub & Spoke** | Centralized service with many integrations | API ecosystem, data platform |
| **Timeline** | Sequential evolution | Product launch phases, project milestones |
| **Entity Relationship** | Data connections | Database schema, system architecture |
| **Circular/Loop** | Recurring cycles, feedback loops | Continuous improvement, monitoring |

Ask: "Is this linear (flowchart), multi-team (swimlane), parallel work (dependency), or status-based (state machine)?" Usually you can infer from description.

### Step 3: Build Interactive HTML Visualization

Generate a self-contained HTML file with:

**Node Types & Visual Coding:**

| Node Type | Icon | Color | Use For |
|-----------|------|-------|---------|
| **Start** | ▶ | Blue | Process trigger |
| **Step** | ⚙ | Green | Action/processing |
| **Tool** | 🔧 | Amber | External service |
| **Decision** | ◇ | Purple | Conditional branch |
| **Data Store** | 💾 | Indigo | Database/file |
| **Output** | ✓ | Red | Final deliverable |
| **End** | ⏹ | Gray | Process conclusion |
| **Handoff** | 👤 | Teal | Person/team change |
| **Delay** | ⏱ | Orange | Wait/queue |

**Interactive Features:**
- Hover: Node enlarges, border glows, shows full description
- Click: Highlights node and connected paths, dims unrelated nodes
- Zoom: Pinch or scroll wheel
- Pan: Drag to move around
- Color legend: Shows what each node type means
- Responsive: Adapts to screen size

**Node Content:**
Each node displays:
- Icon (emoji or SVG)
- Label (2-4 words, concise)
- Subtitle (one line describing the action)
- Time estimate if available
- Owner/team if applicable

**Connections:**
- Solid arrows between nodes
- Arrow labels: show data being passed or conditions (e.g., "if approved", "customer data")
- Color matches source node type
- Animated on hover

**Performance Metrics** (if provided):
- Time per step (SLA, actual average)
- Success/failure rates at decision points
- Queue depth or wait times
- Error rate or rework percentage

### Step 4: Bottleneck Analysis Engine

Automatically identify and report:

**Bottlenecks:**
- Steps with longest duration
- Single points of failure (if this one step fails, whole system breaks)
- High-error/rework steps
- Queued/waiting steps
- Manual approval gates that slow throughput

```markdown
## Bottlenecks Identified

### 1. [Step Name] — HIGH IMPACT
- **Why it's a bottleneck:** [Specific reason — is it slow, error-prone, single point of failure?]
- **Current impact:** [Time added, % of errors, team count waiting]
- **Recommended fix:** [Specific action to resolve]
- **Impact of fix:** [How much faster/more reliable]

### 2. [Step Name] — MEDIUM
[Same structure]
```

**Common Patterns That Cause Bottlenecks:**
- Manual steps (automate?)
- Single person dependency (cross-train or add capacity?)
- Rework loops (fix root cause instead of reworking?)
- Approval gates (can criteria be automated or batched?)
- Integration delays (use webhooks instead of polling?)
- Tool switching (consolidate tools?)
- Unclear handoffs (define RACI more clearly?)

### Step 5: Optimization Suggestions

Generate improvement ideas based on common workflow patterns:

```markdown
## Optimization Opportunities

### Quick Wins (Easy, High Impact)
1. [Specific change] → [Expected impact]
2. [Specific change] → [Expected impact]

### Structural Improvements (Medium effort, High impact)
1. [Process redesign] → [Expected impact]
2. [Tool/automation change] → [Expected impact]

### Long-Term Improvements (High effort, Strategic)
1. [Major process redesign] → [Expected impact]
2. [System consolidation] → [Expected impact]
```

Examples:
- "Batch approvals from 1 per item to 1 per hour → 90% faster approval"
- "Automate email validation → 50% fewer rejections"
- "Add API integration instead of manual file exchange → eliminate 2-hour delay"
- "Create RACI matrix for Sales → Support handoff → eliminate confusion"

### Step 6: Export Formats

**Interactive HTML:**
- Self-contained, no dependencies
- Works offline
- Responsive and clickable
- Best for sharing, presentations, documentation

**Static SVG:**
- Clean vector format
- Can be embedded in docs
- Printable and scalable
- Good for final documentation

**Markdown with ASCII:**
- Text-based fallback
- Version control friendly
- Include if no visual tools available

### Step 7: Deliver

Provide:
1. Interactive HTML (primary deliverable)
2. Static SVG export
3. Bottleneck analysis report
4. Optimization suggestions
5. Offer: "Want me to create an implementation roadmap for these optimizations? Should we add timing/SLA targets? Need a RACI matrix for team ownership?"

## Diagram Rules

1. **Every node must be specific.** "Process data" is bad. "Validate customer email address" is good.
2. **Show data flowing, not just connections.** Label arrows with what moves between nodes (customer data, payment details, etc.).
3. **Label decision branches clearly.** Not just a diamond, but "If amount > $1000?" with "Yes/No" or "Approved/Rejected" labels.
4. **No floating nodes.** Every node connects to at least one other node.
5. **Max 25 nodes per diagram.** If larger, split into sub-diagrams or phases.
6. **Separate swimlanes by team/system.** Visual clarity on who owns what.
7. **Include start/end clearly.** Process shouldn't be ambiguous about beginning or conclusion.
8. **Time annotations help.** If you know "approval takes 2 days", include it.
9. **Color is systematic.** Same node type = same color. No rainbow diagrams.
10. **Self-contained.** HTML works offline, includes all styling and interaction.

## System Types Supported

### Business Processes
- Customer onboarding
- Order-to-cash
- Hiring and recruitment
- Expense approval
- Content publishing

### Technical Systems
- API architecture
- Data pipeline
- Deployment process
- Database replication
- Microservice communication

### Cross-Functional Workflows
- Product development
- Sales → Fulfillment
- Marketing → Sales handoff
- Support escalation
- Finance closing

### Operational Cycles
- Daily standup process
- Weekly planning
- Monthly reporting
- Quarterly reviews
- Release cadence

## Example Outputs

User: "Map out our customer onboarding workflow: form submission → email verification → create account → send welcome kit → assign account manager → first check-in call"

System generates:
1. **Flowchart visualization** with 6 nodes, decision point for email verification, handoff to account manager
2. **Bottleneck analysis:** Email verification has 5% failure rate, account manager assignment delayed by 24-48 hours
3. **Suggestions:** Automate email resend, batch account manager assignments hourly instead of daily
4. **Interactive HTML** showing full flow, hover descriptions, click interactions
5. **SVG export** for documentation

## Why This Approach Works

- **Auto-detection saves time:** You don't need to pick the visualization type, we infer it
- **Bottleneck analysis is systematic:** Not subjective opinions, but identifying actual slow points
- **Optimization is specific:** Not vague "improve this," but concrete actions with expected impact
- **Interactive and static:** Works for presentations and permanent documentation
- **System-agnostic:** Same approach works for sales, engineering, operations, or support
