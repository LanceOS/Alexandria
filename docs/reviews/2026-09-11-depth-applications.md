# Application tutorial depth revision — 2026-09-11

Scope: all 26 modules in the 13 application tracks. This revision implements the detailed tutorial structure described in [notes/modules.md](../../notes/modules.md) and follows the [evidence policy](../curriculum-evidence.md). It preserves each module's identity, discovery metadata, three existing part identities, original worked trace and previously applied accuracy corrections. Publication version assignment and database installation belong to the integration step.

The revised lessons contain **29,448 explanatory words**, with **1,065–1,212 words per module**, excluding code listings, titles and bibliographic references. Word count is a depth check, not a claim that length establishes learning quality. Each tutorial develops terminology and mechanism before the original worked trace, explains that trace step by step, adds a contrasting worked case, supplies two additional explained practice tasks, and ends with a transfer recap. There are now **78 explained reflections**, with one in each of the 78 lesson parts. The two added checkpoints follow their required concepts in parts one and two; their prompts include all inputs needed without requiring an unread trace. Each original reflection remains in part three.

All examples remain finite conceptual traces in text blocks and original mathematical deductions with stated assumptions. No incomplete platform code is presented as a runnable C++ example. The lessons do not claim execution of Godot, Qt, Zephyr, ROS, Vulkan, PyTorch, pybind11 or other domain runtimes. The two research papers support protocol or historical systems principles, not measured performance of the invented examples.

## Per-module walkthrough and practice review

Each linked lesson contains the full walkthrough and explained solutions. The entries below identify the conceptual development, contrasting case, new exercises and exact reference set used for review.

### [Budget work inside an audio callback](../../content/units/audio-signal-processing/callback-deadlines/01-buffer-budget.json) — 1,202 words

**Walkthrough:** Frame/sample distinction; duration units; buffer pool states and last-use ownership; explicit silence fallback. Hypothetical delays distinguish processing time from full response time.

**Contrasting case:** Contrasting timing model: suppose a 240-frame callback needs 3.6 ms for processing, with a prescribed 0.8 ms scheduling delay before it starts. For this hypothetical cycle, assume exactly 5 ms from release until the output is needed.

**New explained practice:** At 48,000 frames/s, what do 96 stereo frames represent in time and sample count? What is the risk of using sample count in the duration formula? The callback has finished copying A into the output buffer but still plans to read A for a meter calculation. May it publish A as free first? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [PortAudio: Writing a Callback Function](https://portaudio.com/docs/v19-doxydocs/writing_a_callback.html) — Primary documentation: Callback responsibilities and operations with unbounded execution time; consulted 2026-09-11

### [Interpret a discrete Fourier transform convention](../../content/units/audio-signal-processing/discrete-transforms/01-dft-conventions.json) — 1,065 words

**Walkthrough:** Four roots of unity; explicit forward/backward cancellation; sample-grid period; normalization; phase versus magnitude. Shifted impulse and constant sequences check different properties.

**Contrasting case:** Contrasting sequence: shift the impulse one sample to x=[0,1,0,0], keeping N=4 and fs=8 Hz.

**New explained practice:** For a length-four DFT, forward bin k sums x[n] times exp(-2*pi*i*k*n/4) over n=0,1,2,3. The unnormalized backward transform uses the positive exponent and no division. For x=[2,2,2,2], compute both results and explain each scale factor. If the sample rate changes from 8 Hz to 12 Hz while the four sample values stay identical, which outputs change? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [FFTW: The 1d Discrete Fourier Transform (DFT)](https://www.fftw.org/fftw3_doc/The-1d-Discrete-Fourier-Transform-_0028DFT_0029.html) — Primary documentation: Section 4.8.1; sign, bin order and unnormalized forward/backward transforms; consulted 2026-09-11

### [Turn characters into a token stream](../../content/units/compilers-language-tools/lexical-analysis/01-token-boundaries.json) — 1,170 words

**Walkthrough:** Cursor progress; token category, spelling and half-open range; recognition versus numeric conversion. Unsupported characters remain distinct from grammatical errors.

**Contrasting case:** Contrasting input: tokenize rate_2 + 12 under exactly the original rules, without adding underscore to the identifier grammar.

**New explained practice:** Use zero-based half-open positions. Identifiers start with an ASCII letter and continue with letters or digits; integers contain decimal digits; *, + and parentheses are individual tokens. Tokenize a7*(3+20), then identify which later phase decides the multiplication grouping. Suppose the implementation permits integer values only through 255. How should it handle 256+1, and why is returning Integer(25) incorrect? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [LLVM Kaleidoscope: Introduction and the Lexer](https://llvm.org/docs/tutorial/MyFirstLanguageFrontend/LangImpl01.html) — Primary documentation: Section 1.2 The Lexer; tokenization and lexical information; consulted 2026-09-11

### [Build an expression tree that preserves precedence](../../content/units/compilers-language-tools/syntax-trees/01-precedence-tree.json) — 1,102 words

**Walkthrough:** Expression/term/primary grammar; lookahead; nested parsing and pure child-before-parent evaluation; left associativity and whole-input validation.

**Contrasting case:** Contrasting failure: parse 4+(2*3 without a closing parenthesis, and compare it with 4+2*3 9 containing an unexpected trailing literal.

**New explained practice:** Construct and evaluate the tree for 2*(3+4*5). Show the return values from each nested level. Extend the toy language with left-associative subtraction at the addition level. How would 8-3-1 differ from 8-(3-1)? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [LLVM Kaleidoscope: Implementing a Parser and AST](https://llvm.org/docs/tutorial/MyFirstLanguageFrontend/LangImpl02.html) — Primary documentation: Sections 2.2, 2.4 and 2.5; AST representation and expression precedence; consulted 2026-09-11

### [Trace readers across a write-ahead log commit](../../content/units/databases-storage/logging-snapshots/01-wal-readers.json) — 1,144 words

**Walkthrough:** End marks; logical visibility versus physical storage; read-transaction lifetime; checkpoint and durability distinctions. New transactions are distinguished from new queries in old snapshots.

**Contrasting case:** Contrasting schedule: leave R1 open while two additional transactions commit stock values four at E2 and three at E3.

**New explained practice:** A read transaction R2 began at end mark E1, where stock is five. It stays open while a later writer commits stock four at E2. What value does R2 read, and what must it do to observe E2? An operator sees a large WAL but new readers correctly see recent commits. Does deleting the WAL solve a demonstrated corruption problem? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [SQLite: Write-Ahead Logging](https://sqlite.org/wal.html) — Primary documentation: Sections 2, 2.1 and 2.2; committed records, reader end marks and checkpoints; consulted 2026-09-11

### [Keep a multi-step database change within one transaction](../../content/units/databases-storage/transaction-boundaries/01-atomic-change.json) — 1,164 words

**Walkthrough:** Business invariants; active transaction; statement completion versus commitment; explicit rollback outcomes. Busy COMMIT retry remains distinct from replaying updates.

**Contrasting case:** Contrasting retry: both stock updates finish, producing A=5 and B=5 within the active transaction, but COMMIT reports SQLITE_BUSY.

**New explained practice:** Bins initially contain A=8 and B=2. Attempt to transfer nine items from A to B. What should validation establish before either update, and what committed state should remain after rejection? Why does a destructor that attempts rollback not prove a successful transfer, and what additional outcome does the caller need? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [SQLite: Transaction](https://sqlite.org/lang_transaction.html) — Primary documentation: sections 2 Transactions, 2.1 Read transactions versus write transactions, 2.2 DEFERRED, IMMEDIATE, and EXCLUSIVE transactions, 2.3 Implicit versus explicit transactions (including busy COMMIT and retry), and 3 Response To Errors Within A Transaction; consulted 2026-09-11

### [Design a bounded interrupt-to-worker queue](../../content/units/embedded-realtime/bounded-events/01-queue-capacity.json) — 1,154 words

**Walkthrough:** Produced/accepted/consumed/rejected accounting; copied values versus addresses; pool memory; burst service versus sustained throughput.

**Contrasting case:** Contrasting burst schedule: retain capacity three, but let the worker consume one event immediately after each pair of arrivals.

**New explained practice:** With capacity four and initially empty storage, events A,B,C,D,E arrive in that order before any worker runs. Under reject-new policy, what are the accepted sequence, occupancy and rejected count? The queue stores pointers to one scratch record. The producer writes 10, enqueues its address, writes 20 and enqueues the same address. What history has actually been preserved? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [Zephyr: Message Queues](https://docs.zephyrproject.org/latest/kernel/services/data_passing/message_queues.html) — Primary documentation: Concepts; fixed-size copied messages, capacity and ISR restrictions; consulted 2026-09-11

### [Separate release time from completion deadline](../../content/units/embedded-realtime/task-timing/01-release-and-deadline.json) — 1,111 words

**Walkthrough:** Release/start/finish, relative and absolute deadlines, response, processor demand, preemption and slack. Finite schedules remain distinct from proved worst-case bounds.

**Contrasting case:** Contrasting preemption: release Job 1 at 10, let it execute during [10,11), preempt it during [11,14), and then resume it during [14,15).

**New explained practice:** A job releases at 30 ms, has relative deadline 5 ms, waits 2 ms, and executes for 2 ms without further interruption. Compute finish, response and slack. A trace reports a 2 ms body time for every observed job. What evidence is still missing before claiming every job meets a 6 ms relative deadline? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [Zephyr: Threads](https://docs.zephyrproject.org/latest/kernel/services/threads/index.html) — Primary documentation: Thread States, Thread Priorities and Thread Suspension; readiness and execution eligibility; consulted 2026-09-11

### [Compose reusable entities without sharing their state](../../content/units/game-development/scene-composition/01-instance-state.json) — 1,212 words

**Walkthrough:** Definition, instance and shared resource identities; authoritative health; internal path maintenance; logical inactivity versus deferred destruction.

**Contrasting case:** Contrasting ownership bug: suppose both targets refer to one mutable HealthData resource H, initially holding ten, instead of owning independent health values.

**New explained practice:** Target A has health five. The proposed damage contract rejects negative amounts and clamps health at zero. Trace requests -2 and then 9. How would you verify that a health resource is independent without relying only on two identical starting labels? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [Godot: Nodes and scene instances](https://docs.godotengine.org/en/stable/tutorials/scripting/nodes_and_scene_instances.html) — Primary documentation: Getting nodes, Node paths, Creating nodes and Instancing scenes; tree composition and deferred deletion; consulted 2026-09-11

### [Separate simulation updates from rendered frames](../../content/units/game-development/simulation-time/01-fixed-updates.json) — 1,129 words

**Walkthrough:** Fixed-step accumulator invariant; movement units; presentation authority; input ordering and pause policy. Equal step count is not universal replay equivalence.

**Contrasting case:** Contrasting frame sequence: use elapsed intervals 4 ms, 4 ms and 27 ms, still totaling 35 ms.

**New explained practice:** A constant-motion simulation has completed three 10 ms updates at 2 units/s from position zero, leaving 5 ms in its accumulator. Another frame adds 8 ms. Compute new updates, remainder, total simulated time and position. Two runs have identical elapsed time and step size, but one applies a movement input before step two and the other after step two. Must their positions match? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [Godot: Idle and Physics Processing](https://docs.godotengine.org/en/stable/tutorials/scripting/idle_and_physics_processing.html) — Primary documentation: Processing types and delta; variable rendering frequency and fixed physics updates; consulted 2026-09-11

### [Follow geometry through a graphics pipeline](../../content/units/graphics-gpu/rendering-pipeline/01-triangle-stages.json) — 1,092 words

**Walkthrough:** Stage input/output quantities; coordinate spaces; conceptual versus actual execution; explicit tests and attachment writes. Coverage is stipulated rather than fabricated.

**Contrasting case:** Contrasting diagnostic model: stipulate an opaque red attachment initially, blending disabled, color writes enabled, and a simple LESS depth test. The existing depth at F is 0.4.

**New explained practice:** Translate vertices (0,0), (2,0) and (0,2) by (-1,0) in the same coordinate system. Which facts can you conclude without specifying the rest of the pipeline? Under the second scenario's LESS comparison, what happens at candidate depth 0.4, and why must the comparison name be recorded? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [Vulkan specification: Pipelines](https://docs.vulkan.org/spec/latest/chapters/pipelines.html) — Primary specification: Pipelines introduction, Primitive Shading and Common; vertex transformation, rasterization and fragment processing; consulted 2026-09-11; [Vulkan reference: VkCompareOp](https://docs.vulkan.org/refpages/latest/refpages/source/VkCompareOp.html) — Primary specification: Comparison operators, especially VK_COMPARE_OP_LESS and VK_COMPARE_OP_LESS_OR_EQUAL; finite depth-comparison examples use explicitly stated reference and test values; consulted 2026-09-11.

### [Make GPU producer and consumer dependencies explicit](../../content/units/graphics-gpu/resource-dependencies/01-producer-consumer.json) — 1,182 words

**Walkthrough:** Overlapping access hazards; execution and memory scopes; visibility; submitted use and host reclamation. Later device reuse is not conflated with a host wait.

**Contrasting case:** Contrasting reuse: a later compute dispatch W2 will overwrite R for a second draw. The first draw D1 still reads the earlier records.

**New explained practice:** W writes bytes [0,64) and D reads [32,96). What overlap must the dependency analysis consider, and what else must be established? The host waits for completion covering W but not the later submitted draw D. May it destroy R because the writer is finished? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [Vulkan Guide: Synchronization](https://docs.vulkan.org/guide/latest/synchronization.html) — Primary documentation: Synchronization, Validation and Pipeline Barriers; application-managed synchronization; consulted 2026-09-11; [Vulkan specification: Synchronization and Cache Control](https://docs.vulkan.org/spec/latest/chapters/synchronization.html) — Primary specification: Execution and memory dependencies, availability, visibility and access scopes; consulted 2026-09-11; [Vulkan reference: vkDestroyBuffer](https://docs.vulkan.org/refpages/latest/refpages/source/vkDestroyBuffer.html) — Primary specification: Valid Usage VUID-vkDestroyBuffer-buffer-00922; completion of submitted buffer users; consulted 2026-09-11

### [Connect user actions to observable state changes](../../content/units/gui-development/event-driven-state/01-signals-and-state.json) — 1,132 words

**Walkthrough:** Request, accepted state and notification; equality guard; storing before synchronous notification; draft input and accepted model value.

**Contrasting case:** Contrasting invalid input: choose rejection as the model policy and begin at speed 125. A keyboard entry requests 300.

**New explained practice:** Starting at 100, trace requests 125,125,80 under the change-only policy. How many state-change notifications occur? A second label is added after the model is already 125. Why is connecting it only to future changes insufficient, and how can initialization be made explicit? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [Qt: Signals & Slots](https://doc.qt.io/qt-6/signalsandslots.html) — Primary documentation: Signals, Slots and A Small Example; connections and change detection; consulted 2026-09-11

### [Return background results to the GUI thread](../../content/units/gui-development/responsive-work/01-queued-results.json) — 1,123 words

**Walkthrough:** Event delivery, thread affinity, owned result values, relevance at delivery time, cancellation races and receiver closure.

**Contrasting case:** Contrasting delivery race: worker 41 finishes and queues its result while request 41 is still current. Before the GUI handles that event, the user submits request 42.

**New explained practice:** Requests 5,6,7 are submitted in order. Results arrive 6,5,7 while 7 remains current. Which results are shown? A worker returns a pointer into a temporary result buffer, then destroys that buffer before the queued slot runs. Does correct thread affinity or request identity fix this? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [Qt: Threads and QObjects](https://doc.qt.io/qt-6/threads-qobject.html) — Primary documentation: QObject Reentrancy, Per-Thread Event Loop, Signals and Slots Across Threads; GUI affinity and queued delivery; consulted 2026-09-11

### [Define ownership when C++ objects cross into Python](../../content/units/language-interoperability/cross-runtime-ownership/01-return-policies.json) — 1,190 words

**Walkthrough:** Python wrapper versus C++ storage; copy, borrow and delete responsibility; stable parent relationships versus mutation invalidation.

**Contrasting case:** Contrasting mutation: replace the stable Page member with an element in a vector owned by D. Python obtains a borrowed wrapper for element zero, and the application later erases that element while D remains alive.

**New explained practice:** A process-lifetime immutable singleton is returned by pointer. Why could take_ownership be wrong even though the pointer stays valid for a long time? The application requires a Python Page result to remain unchanged even after the document is edited and deleted. Which semantic choice fits, and what cost must be considered? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [pybind11: Functions](https://pybind11.readthedocs.io/en/stable/advanced/functions.html) — Primary documentation: Return value policies and Additional call policies; copy, reference, reference_internal and ownership; consulted 2026-09-11; [Working Draft, Standard for Programming Language C++ (N4861)](https://timsong-cpp.github.io/cppwp/n4861/vector.modifiers) — Primary C++20 working draft: [vector.modifiers] paragraphs 1, 3 and 4; reallocation invalidation, erase invalidation and assignment of following elements. Draft, not the published ISO edition. Consulted 2026-09-11.

### [Separate Python access from independent native work](../../content/units/language-interoperability/runtime-coordination/01-gil-boundary.json) — 1,142 words

**Walkthrough:** Python/native/Python phases; private copied inputs; wrapper destructor access; exceptional cleanup; native shared-state synchronization.

**Contrasting case:** Contrasting callback: after processing the first two values, the native computation wants to call a Python progress function with the partial sum six.

**New explained practice:** A binding safely copies Python values [2,4,6,8] into private native storage and then sums that copy. The Python list changes to [2,4,6,100] after the copy completes. What result does this model return, and what assumption makes the answer valid? A native cache is shared by two released calls, and both update one ordinary counter. Does reacquiring the GIL only when returning make those earlier writes safe? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [pybind11: Miscellaneous](https://pybind11.readthedocs.io/en/stable/advanced/misc.html) — Primary documentation: Global Interpreter Lock and Common Sources of GIL Errors; scoped release and reacquisition; lesson assumes a conventional GIL-enabled CPython build; consulted 2026-09-11

### [Separate model evaluation behavior from gradient recording](../../content/units/machine-learning-infrastructure/inference-contracts/01-evaluation-and-gradients.json) — 1,121 words

**Walkthrough:** Independent module and gradient modes; tensor gradient requirements; downstream tensor use; preprocessing and mathematical sensitivity.

**Contrasting case:** Contrasting mathematical request: use the differentiable scalar model y=w*x with w=3 and input x=2, and suppose the caller needs both y and the derivative with respect to x.

**New explained practice:** A model currently in training mode contains dropout, its parameters require gradients, and the caller enters no-grad without calling eval. What happens to operation recording, and which module behavior remains selected? For the scalar sensitivity request, what should a test compare beyond the forward value six? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [PyTorch: Autograd mechanics](https://docs.pytorch.org/docs/2.14/notes/autograd.html) — Primary documentation: Locally disabling gradient computation and Evaluation Mode; eval, no-grad and inference distinctions; consulted 2026-09-11

### [Map a tensor computation onto an execution graph](../../content/units/machine-learning-infrastructure/tensor-execution/01-graph-and-data.json) — 1,109 words

**Walkthrough:** Shapes; component arithmetic; direct and indirect dependencies; last consumers; device placement and end-to-end transfer costs.

**Contrasting case:** Contrasting placement model: suppose a CPU executes MatVec, Add and ReLU in 3, 1 and 1 hypothetical time units, respectively. The dependency chain therefore takes five units with no other costs.

**New explained practice:** Let W=[[1,2],[3,4]], b=[-5,1], and y=ReLU(Wx+b), with ReLU applied componentwise. Replace input x=[1,2] with [1,1], preserving W and b. Compute every new intermediate and identify the first changed operation-output edge. Two independent operations each need four hypothetical units and must both finish before a one-unit join operation. Compare ideal separate processors with one shared processor, ignoring overhead. Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [TensorFlow: A System for Large-Scale Machine Learning](https://www.usenix.org/system/files/conference/osdi16/osdi16-abadi.pdf) — Peer-reviewed research: OSDI 2016, pp. 265–283, sections 2.2 and 3.1; graph operations, tensors, state and heterogeneous execution; consulted 2026-09-11

### [Reason about a replicated log commitment](../../content/units/network-distributed-systems/replicated-state/01-quorum-commit.json) — 1,131 words

**Walkthrough:** Stored/committed/applied distinctions; majority intersection and required protocol rules; current term; safety versus progress; client outcome ambiguity.

**Contrasting case:** Contrasting partition: isolate A before either B or C acknowledges index five. Only A stores the current-term proposal, so its replica count stays one.

**New explained practice:** In a fixed five-server cluster, the current-term entry is durably stored on A and B only. Can the leader use majority counting to commit it? What additional acknowledgment changes the count? The leader applies a committed command, then its response is lost. Why should a client avoid assuming a timeout proves the command was not executed? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [In Search of an Understandable Consensus Algorithm](https://www.usenix.org/system/files/conference/atc14/atc14-paper-ongaro.pdf) — Peer-reviewed research: USENIX ATC 2014, pp. 305–319, sections 5.3 and 5.4, especially 5.4.2; current-term commitment and election restrictions; consulted 2026-09-11; [In Search of an Understandable Consensus Algorithm (Extended Version)](https://raft.github.io/raft.pdf) — Primary author technical report: section 8 Client interaction, printed page 13; lost responses, unique client command serial numbers and stored responses for duplicate detection. This supplementary section is omitted from the peer-reviewed conference paper; no separate peer-review claim is made for the extension. Consulted 2026-09-11.

### [Recover messages from a byte stream](../../content/units/network-distributed-systems/stream-protocols/01-message-framing.json) — 1,105 words

**Walkthrough:** Header/payload state; validation before storage commitment; progress across arbitrary chunks; complete records, backlog bounds and timeouts.

**Contrasting case:** Contrasting receive partitions: feed [03,C,A,T,02,O,K] as one chunk, then feed the same seven octets one at a time.

**New explained practice:** A toy protocol uses one unsigned octet for payload length, accepts lengths 1 through 8, and then reads exactly that many ASCII payload bytes. Starting in header state, trace chunks [02,O], [K,03,C,A], [T]. State the parser state after each chunk. A valid header promises eight bytes, but only one arrives and the peer remains connected forever. Has a maximum-length check solved the resource problem? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [RFC 9293: Transmission Control Protocol (TCP)](https://www.rfc-editor.org/rfc/rfc9293.html) — Primary specification: Section 2.2 Key TCP Concepts and section 3.9 interfaces; reliable ordered byte-stream semantics; consulted 2026-09-11

### [Transform an observation with its frame and time](../../content/units/robotics/coordinate-frames/01-transform-observation.json) — 1,083 words

**Walkthrough:** Data direction, units, timestamp and origin check; explicit rotation convention; inverse operation order and missing-transform policy.

**Contrasting case:** Contrasting rotation: at one second let sensor axes be rotated ninety degrees counterclockwise relative to world axes, and let the sensor origin remain at world (4,1). Keep the observed local point (2,3).

**New explained practice:** At the observation timestamp, a sensor with world origin (4,1) measures local point (2,3). A second frame has world origin (1,0). All axes are aligned and units are metres. What coordinates describe the observation in the second frame? A point was measured at one second, but the available buffer contains only a transform at two seconds. Is substituting it equivalent to a successful exact-time lookup? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [ROS 2 Jazzy: Tf2](https://raw.githubusercontent.com/ros2/ros2_documentation/jazzy/source/Concepts/Intermediate/About-Tf2.rst) — Primary documentation: Overview, Publishing transforms and Position; official documentation source, coordinate frames and time; consulted 2026-09-11

### [Specify freshness and delivery expectations](../../content/units/robotics/sensor-communication/01-freshness-contract.json) — 1,111 words

**Walkthrough:** Retention count versus duration; observation versus publication age; clock assumptions; application rule versus middleware lifespan.

**Contrasting case:** Contrasting consumer delay: let no new samples appear and move the consumer time to 35 ms while the same two samples remain available for this application-level trace.

**New explained practice:** Samples are produced at 0,100,200 ms with depth two, and the consumer reads at 205 ms under a twelve-millisecond observation-age limit. Assume shared timestamps, immediate delivery and no earlier consumption. Which samples remain and which qualify? What time span does depth two represent here? A measurement observed at 0 ms is published at 20 ms and received at 25 ms. What are its observation age and publication-to-reception delay, and which applies to a twelve-millisecond observation-age rule? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [ROS 2 Jazzy: Quality of Service settings](https://raw.githubusercontent.com/ros2/ros2_documentation/jazzy/source/Concepts/Intermediate/About-Quality-of-Service-Settings.rst) — Primary documentation: QoS policies, profiles and compatibility; history, reliability, deadline and lifespan; consulted 2026-09-11

### [Make a computational result reproducible](../../content/units/scientific-computing/experiment-provenance/01-reproducible-result.json) — 1,091 words

**Walkthrough:** Input identity and units; raw versus derived data; byte identity versus scientific meaning; auditable correction and known-input checks.

**Contrasting case:** Contrasting reproducible error: keep data-A=[2,4,6] millimetres but mistakenly use conversion factor one metre per millimetre.

**New explained practice:** Data-A contains distances [2,4,6] mm and data-B contains [2,4,9] mm. Analysis-v1 converts millimetres to metres and averages. Write the run information needed to distinguish the two computations. What does source-code identity alone omit? A randomized analysis reproduces its result after recording a seed. Does the seed alone establish reproducibility across arbitrary software versions and hardware? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [Good enough practices in scientific computing](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1005510) — Scholarly guidance (journal Perspective): Data management, Software and Keeping track of changes; raw data, processing records, dependencies and version tracking; consulted 2026-09-11

### [Solve a linear system and check its residual](../../content/units/scientific-computing/linear-systems/01-solve-and-check.json) — 1,069 words

**Walkthrough:** Reversible elimination; original-equation substitution; residual versus solution error; defined infinity norm; sensitivity and singularity.

**Contrasting case:** Contrasting sensitivity: use the exact diagonal system x=1 and 0.000001*y=0.000001. Its exact solution is (1,1). Consider the candidate (1,0).

**New explained practice:** The original system 2x+y=5 and x+3y=5 has solution (2,1). Change only the second right-hand side to 5.1. Solve exactly and compare with (2,1). The equations are x+y=2 and 2x+2y=4. Does elimination establish one unique pair, and what changes if the second right-hand side becomes five? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [Eigen: Linear algebra and decompositions](https://libeigen.gitlab.io/eigen/docs-nightly/group__TutorialLinearAlgebra.html) — Primary documentation: Basic linear solving, Checking if a matrix is singular and Computing inverse and determinant; decomposition choice and residual checks; consulted 2026-09-11; [LAPACK Users Guide: How to Measure Errors](https://www.netlib.org/lapack/lug/node75.html) — Primary documentation: Error measures, vector norms and condition number; sensitivity and interpreting numerical errors; consulted 2026-09-11

### [Read the bytes that actually arrived](../../content/units/systems-programming/descriptor-io/01-short-reads.json) — 1,181 words

**Walkthrough:** Signed results; valid-prefix bounds; capacity versus record completeness; EOF, temporary unavailability and deadlines. Terminal exceptions retained.

**Contrasting case:** Contrasting nonblocking schedule: after AB arrives, the next read reports EAGAIN. Later readiness leads to an interrupted call reporting EINTR, and a following call returns CDE.

**New explained practice:** An eight-byte record has accumulated five bytes. The next read returns two. Give the next offset, remaining request size and completeness result. A wrapper sees read return -1 with EINTR after earlier accumulating three bytes. Should it reset the accumulator, add the result to used, or preserve the prefix? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [Linux manual: read(2)](https://man7.org/linux/man-pages/man2/read.2.html) — Primary documentation: DESCRIPTION, RETURN VALUE, ERRORS; short reads, EOF and interrupted calls; consulted 2026-09-11; [Linux manual: termios(3)](https://man7.org/linux/man-pages/man3/termios.3.html) — Primary documentation: Canonical and noncanonical mode, VMIN=0 cases; zero-byte terminal reads may indicate unavailable data or timeout; consulted 2026-09-11

### [Separate process memory from shared resources](../../content/units/systems-programming/process-resources/01-fork-state.json) — 1,133 words

**Walkthrough:** Return branches; private memory, descriptor entries and shared kernel state; read scheduling; independent opens versus inherited offsets.

**Contrasting case:** Contrasting schedule: let the child read first, then the parent, with the same successful two-byte transfers and no other access.

**New explained practice:** A parent and child have private integer values nine and four, respectively, and inherited descriptors share file offset four. The parent privately changes its integer from nine to eleven without file operations. What are the child integer and shared file offset? fork fails and returns -1. How many child processes were created, and why should the program avoid waiting for a successful-child result that it never obtained? Both have worked explanations in the lesson, alongside the retained original reflection.

**Evidence:** [Linux manual: fork(2)](https://man7.org/linux/man-pages/man2/fork.2.html) — Primary documentation: DESCRIPTION and RETURN VALUE; separate address spaces and shared open file descriptions; consulted 2026-09-11; [Linux manual: open(2)](https://man7.org/linux/man-pages/man2/open.2.html) — Primary documentation: DESCRIPTION; each successful open creates a new open file description with its own offset initially at the file beginning; consulted 2026-09-11.

## Source and validation limits

The module source lists contain 34 references: the 30 retained references plus official references for Vulkan comparison operators and independent Linux file opens, a pinned C++20 draft reference for vector invalidation, and the authors’ extended Raft technical report for client retries. Relevant documentation passages were freshly inspected during this revision, including previously corrected facts about scene-path maintenance, indirect graph dependencies, current-term Raft commitment, Vulkan visibility/destruction and noncanonical terminal zero reads. Long documents were inspected at the governing passages, not represented as having been read exhaustively.

The TensorFlow and Raft conference papers were accessible through their official USENIX copies. The Raft conference paper explicitly omits client interaction in section 7; its section 8 is Implementation and evaluation. Client interaction section 8 appears in the authors’ extended technical report (May 20, 2014), printed page 13, freshly inspected for lost responses, command serial numbers and duplicate-result handling. Root's independent review prompted this citation check and the addition of the separate source. That extension is cited as an author technical report without a separate peer-review claim. Their existing verified publication metadata was preserved. The PLOS article remains labeled scholarly guidance, specifically a Perspective. No new research classification or empirical performance claim was invented. Moving latest/stable documentation remains qualified by its recorded consultation date; exact future API behavior is not promised. No inaccessible new source was used as passage-level evidence.

Independent cross-review findings were closed: the ownership tutorial now distinguishes vector erase invalidation from object-lifetime termination and cites N4861 [vector.modifiers] paragraphs 1, 3 and 4; the no-grad exercise explicitly stipulates an initially training model and explains that an already-evaluation model would remain in evaluation; the transaction citation includes section 2.3 for busy COMMIT. These passages were freshly checked in their primary sources.

The curriculum structural check passed after expansion and again after the final practice/citation corrections. A structural comparison verified that all 26 module-level discovery and version fields and all 78 part IDs remain unchanged, and every original lesson block is retained. New worked examples and practice solutions were checked by explicit substitution/accounting. This is author review, not external peer review or formal correctness proof. No full build/test suite, database import, commit or platform runtime execution was performed by this authoring subtask.
