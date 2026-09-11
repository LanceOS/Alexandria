# Application-track research ledger

Consulted: 2026-09-11.

These 13 topic roots separate application disciplines from C++ language instruction. Each root has two populated subunits, and each subunit has one complete original module. Every module follows the existing reader layout: objectives, three ordered lesson parts, a worked example and an explained reflection, followed by sources. Prerequisites and subject boundaries are explicit. These are focused foundational modules, not claims that two lessons exhaust an application discipline.

Evidence was checked against actual primary documentation and selected peer-reviewed research. Documentation is labeled as documentation, specifications as specifications, and research papers separately from scholarly practice guidance. No textbooks were cited from an uninspected local copy. Numerical examples and execution traces are original authored examples with stated finite assumptions; they are not copied source examples or hardware test results.

All worked examples use text traces rather than executable platform fragments. They deliberately isolate the taught contract. No kernel, device, game engine, database, GUI, Python-binding or ML runtime was installed or exercised for these lessons. Arithmetic and trace consistency were checked separately; schema validation does not prove factual accuracy.

## Module coverage

Lesson words use whitespace splitting of block text, worked traces, and reflection prompts and explanations; titles, captions, objectives, summaries, and sources are excluded.

| Topic / subunit | Module | Lesson words | Evidence keys |
| --- | --- | ---: | --- |
| systems-programming / descriptor-io | Read the bytes that actually arrived | 468 | read, termios |
| systems-programming / process-resources | Separate process memory from shared resources | 441 | fork |
| embedded-realtime / task-timing | Separate release time from completion deadline | 418 | threads |
| embedded-realtime / bounded-events | Design a bounded interrupt-to-worker queue | 438 | queue |
| game-development / simulation-time | Separate simulation updates from rendered frames | 430 | gameloop |
| game-development / scene-composition | Compose reusable entities without sharing their state | 452 | scene |
| graphics-gpu / rendering-pipeline | Follow geometry through a graphics pipeline | 425 | pipeline |
| graphics-gpu / resource-dependencies | Make GPU producer and consumer dependencies explicit | 432 | sync, syncspec, bufferlife |
| scientific-computing / experiment-provenance | Make a computational result reproducible | 428 | provenance |
| scientific-computing / linear-systems | Solve a linear system and check its residual | 446 | eigen, lapack |
| network-distributed-systems / stream-protocols | Recover messages from a byte stream | 415 | tcp |
| network-distributed-systems / replicated-state | Reason about a replicated log commitment | 431 | raft |
| compilers-language-tools / lexical-analysis | Turn characters into a token stream | 403 | lexer |
| compilers-language-tools / syntax-trees | Build an expression tree that preserves precedence | 411 | parser |
| robotics / coordinate-frames | Transform an observation with its frame and time | 415 | tf2 |
| robotics / sensor-communication | Specify freshness and delivery expectations | 410 | qos |
| databases-storage / transaction-boundaries | Keep a multi-step database change within one transaction | 431 | transaction |
| databases-storage / logging-snapshots | Trace readers across a write-ahead log commit | 422 | wal |
| audio-signal-processing / callback-deadlines | Budget work inside an audio callback | 430 | callback |
| audio-signal-processing / discrete-transforms | Interpret a discrete Fourier transform convention | 388 | dft |
| gui-development / event-driven-state | Connect user actions to observable state changes | 427 | signals |
| gui-development / responsive-work | Return background results to the GUI thread | 427 | qtthreads |
| machine-learning-infrastructure / tensor-execution | Map a tensor computation onto an execution graph | 393 | tensorflow |
| machine-learning-infrastructure / inference-contracts | Separate model evaluation behavior from gradient recording | 445 | autograd |
| language-interoperability / cross-runtime-ownership | Define ownership when C++ objects cross into Python | 447 | policies |
| language-interoperability / runtime-coordination | Separate Python access from independent native work | 421 | gil |

## Inspected evidence

| Key and source | Classification | Inspected material and supported claims | Limits |
| --- | --- | --- | --- |
| read: [Linux manual: read(2)](https://man7.org/linux/man-pages/man2/read.2.html) | Primary documentation | DESCRIPTION, RETURN VALUE, ERRORS; short reads, EOF and interrupted calls | Sections named in locator were read; no platform execution or independent benchmark performed. |
| termios: [Linux manual: termios(3)](https://man7.org/linux/man-pages/man3/termios.3.html) | Primary documentation | Canonical and noncanonical mode, VMIN=0 cases; zero-byte terminal reads can mean unavailable data or timeout | Final review narrowed the lesson and modeled reads to regular files and pipes, with an explicit terminal caveat; no platform execution performed. |
| fork: [Linux manual: fork(2)](https://man7.org/linux/man-pages/man2/fork.2.html) | Primary documentation | DESCRIPTION and RETURN VALUE; separate address spaces and shared open file descriptions | Sections named in locator were read; no platform execution or independent benchmark performed. |
| threads: [Zephyr: Threads](https://docs.zephyrproject.org/latest/kernel/services/threads/index.html) | Primary documentation | Thread States, Thread Priorities and Thread Suspension; readiness and execution eligibility | Sections named in locator were read; no platform execution or independent benchmark performed. |
| queue: [Zephyr: Message Queues](https://docs.zephyrproject.org/latest/kernel/services/data_passing/message_queues.html) | Primary documentation | Concepts; fixed-size copied messages, capacity and ISR restrictions | Sections named in locator were read; no platform execution or independent benchmark performed. |
| gameloop: [Godot: Idle and Physics Processing](https://docs.godotengine.org/en/stable/tutorials/scripting/idle_and_physics_processing.html) | Primary documentation | Processing types and delta; variable rendering frequency and fixed physics updates | Sections named in locator were read; no platform execution or independent benchmark performed. |
| scene: [Godot: Nodes and scene instances](https://docs.godotengine.org/en/stable/tutorials/scripting/nodes_and_scene_instances.html) | Primary documentation | Getting nodes, Node paths, Creating nodes and Instancing scenes; tree composition and deferred deletion | Sections named in locator were read; no platform execution or independent benchmark performed. |
| pipeline: [Vulkan specification: Pipelines](https://docs.vulkan.org/spec/latest/chapters/pipelines.html) | Primary specification | Pipelines introduction, Primitive Shading and Common; vertex transformation, rasterization and fragment processing | Sections named in locator were read; no platform execution or independent benchmark performed. |
| sync: [Vulkan Guide: Synchronization](https://docs.vulkan.org/guide/latest/synchronization.html) | Primary documentation | Synchronization, Validation and Pipeline Barriers; application-managed synchronization | Sections named in locator were read; no platform execution or independent benchmark performed. |
| syncspec: [Vulkan specification: Synchronization and Cache Control](https://docs.vulkan.org/spec/latest/chapters/synchronization.html) | Primary specification | Execution and memory dependencies, availability, visibility and access scopes | Sections named in locator were read; no platform execution or independent benchmark performed. |
| bufferlife: [Vulkan reference: vkDestroyBuffer](https://docs.vulkan.org/refpages/latest/refpages/source/vkDestroyBuffer.html) | Primary specification | Valid Usage VUID-vkDestroyBuffer-buffer-00922; completion of submitted buffer users | Sections named in locator were read; no platform execution or independent benchmark performed. |
| lapack: [LAPACK Users Guide: How to Measure Errors](https://www.netlib.org/lapack/lug/node75.html) | Primary documentation | Error measures, vector norms and condition number; sensitivity and interpreting numerical errors | Sections named in locator were read; no platform execution or independent benchmark performed. |
| provenance: [Good enough practices in scientific computing](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1005510) | Scholarly guidance (journal Perspective) | Data management, Software and Keeping track of changes; raw data, processing records, dependencies and version tracking | Read article text and publication metadata; this is practice guidance, not a controlled causal study or a guarantee of scientific validity. |
| eigen: [Eigen: Linear algebra and decompositions](https://libeigen.gitlab.io/eigen/docs-nightly/group__TutorialLinearAlgebra.html) | Primary documentation | Basic linear solving, Checking if a matrix is singular and Computing inverse and determinant; decomposition choice and residual checks | Read documentation page reached by official Eigen redirect; development documentation is used for mathematical workflow, without version-specific compile claims. |
| tcp: [RFC 9293: Transmission Control Protocol (TCP)](https://www.rfc-editor.org/rfc/rfc9293.html) | Primary specification | Section 2.2 Key TCP Concepts and section 3.9 interfaces; reliable ordered byte-stream semantics | Sections named in locator were read; no platform execution or independent benchmark performed. |
| raft: [In Search of an Understandable Consensus Algorithm](https://www.usenix.org/system/files/conference/atc14/atc14-paper-ongaro.pdf) | Peer-reviewed research | USENIX ATC 2014, sections 5.3 and 5.4, especially 5.4.2; current-term commitment and election restrictions | Read paper text on log replication and safety plus proceedings metadata; lesson traces are original and are not a full implementation or proof. |
| lexer: [LLVM Kaleidoscope: Introduction and the Lexer](https://llvm.org/docs/tutorial/MyFirstLanguageFrontend/LangImpl01.html) | Primary documentation | Section 1.2 The Lexer; tokenization and lexical information | Sections named in locator were read; no platform execution or independent benchmark performed. |
| parser: [LLVM Kaleidoscope: Implementing a Parser and AST](https://llvm.org/docs/tutorial/MyFirstLanguageFrontend/LangImpl02.html) | Primary documentation | Sections 2.2, 2.4 and 2.5; AST representation and expression precedence | Sections named in locator were read; no platform execution or independent benchmark performed. |
| tf2: [ROS 2 Jazzy: Tf2](https://raw.githubusercontent.com/ros2/ros2_documentation/jazzy/source/Concepts/Intermediate/About-Tf2.rst) | Primary documentation | Overview, Publishing transforms and Position; official documentation source, coordinate frames and time | Sections named in locator were read; no platform execution or independent benchmark performed. |
| qos: [ROS 2 Jazzy: Quality of Service settings](https://raw.githubusercontent.com/ros2/ros2_documentation/jazzy/source/Concepts/Intermediate/About-Quality-of-Service-Settings.rst) | Primary documentation | QoS policies, profiles and compatibility; history, reliability, deadline and lifespan | Sections named in locator were read; no platform execution or independent benchmark performed. |
| transaction: [SQLite: Transaction](https://sqlite.org/lang_transaction.html) | Primary documentation | Sections 2, 2.1 and 3; explicit transactions, one writer, error handling | Sections named in locator were read; no platform execution or independent benchmark performed. |
| wal: [SQLite: Write-Ahead Logging](https://sqlite.org/wal.html) | Primary documentation | Sections 2, 2.1 and 2.2; committed records, reader end marks and checkpoints | Sections named in locator were read; no platform execution or independent benchmark performed. |
| callback: [PortAudio: Writing a Callback Function](https://portaudio.com/docs/v19-doxydocs/writing_a_callback.html) | Primary documentation | Callback responsibilities and operations with unbounded execution time | Sections named in locator were read; no platform execution or independent benchmark performed. |
| dft: [FFTW: The 1d Discrete Fourier Transform (DFT)](https://www.fftw.org/fftw3_doc/The-1d-Discrete-Fourier-Transform-_0028DFT_0029.html) | Primary documentation | Section 4.8.1; sign, bin order and unnormalized forward/backward transforms | Sections named in locator were read; no platform execution or independent benchmark performed. |
| signals: [Qt: Signals & Slots](https://doc.qt.io/qt-6/signalsandslots.html) | Primary documentation | Signals, Slots and A Small Example; connections and change detection | Sections named in locator were read; no platform execution or independent benchmark performed. |
| qtthreads: [Qt: Threads and QObjects](https://doc.qt.io/qt-6/threads-qobject.html) | Primary documentation | QObject Reentrancy, Per-Thread Event Loop, Signals and Slots Across Threads; GUI affinity and queued delivery | Sections named in locator were read; no platform execution or independent benchmark performed. |
| autograd: [PyTorch: Autograd mechanics](https://docs.pytorch.org/docs/2.14/notes/autograd.html) | Primary documentation | Locally disabling gradient computation and Evaluation Mode; eval, no-grad and inference distinctions | Sections named in locator were read; no platform execution or independent benchmark performed. |
| tensorflow: [TensorFlow: A System for Large-Scale Machine Learning](https://www.usenix.org/system/files/conference/osdi16/osdi16-abadi.pdf) | Peer-reviewed research | OSDI 2016, sections 2.2 and 3.1; graph operations, tensors, state and heterogeneous execution | Read execution-model and design-principles passages plus proceedings metadata; treated as historical systems research, not current TensorFlow API documentation or a speedup promise. |
| policies: [pybind11: Functions](https://pybind11.readthedocs.io/en/stable/advanced/functions.html) | Primary documentation | Return value policies and Additional call policies; copy, reference, reference_internal and ownership | Sections named in locator were read; no platform execution or independent benchmark performed. |
| gil: [pybind11: Miscellaneous](https://pybind11.readthedocs.io/en/stable/advanced/misc.html) | Primary documentation | Global Interpreter Lock and Common Sources of GIL Errors; scoped release and reacquisition; lesson assumes a conventional GIL-enabled CPython build | Sections named in locator were read; no platform execution or independent benchmark performed. |

## Access and version notes

The Open Group POSIX read/fork pages returned access errors, so the Linux man-pages project was used and those modules explicitly teach Linux semantics. The FreeRTOS queue page returned no readable text and was not cited; the embedded modules instead use inspected Zephyr documentation. ROS documentation HTML was access-blocked; the official ROS 2 documentation repository’s Jazzy source files were read and cited directly.

The Eigen tutorial redirected to its official development documentation. Its citation supports mathematical workflow rather than a version-specific program. PyTorch’s stable URL redirected to 2.14, which was read and cited explicitly. Godot, Qt, Zephyr, Vulkan and pybind11 documentation was consulted on the date above; the modules avoid assuming that the current version is installed locally. The FFTW page exposes its transform scaling and frequency-order text; the original four-point calculations are derived from the definition written explicitly in the lesson.

The Raft and TensorFlow peer-reviewed paper PDFs were read for the cited sections, and their conference landing pages supplied publication metadata. The Raft trace limits the simple majority argument to a current-term entry in a fixed-membership cluster with the remaining protocol assumptions stated. The TensorFlow paper is treated as a historical design study. The PLOS article is labeled as scholarly practice guidance (a journal Perspective), rather than an experimental research result. Its data and workflow recommendations support the provenance lesson. Numerical-error instruction is kept in the separate numerical-computing topic.

## Review boundaries

Real-time timing examples are finite arithmetic models, not schedulability certifications. The GPU examples name dependencies without pretending to provide complete API setup. Scientific examples specify exact or toy arithmetic rather than asserting platform floating-point output. The robotics examples distinguish frame direction, measurement time and communication age. The Python interoperability module explicitly assumes GIL-enabled CPython and does not extend that model to free-threaded builds.

## Validation completed

`npm run content:check` passed after these modules were written. A separate one-off audit checked the 13 root category positions, two populated child units per root, three parts and three objectives per module, one explained reflection per module, valid source dates, schema paths and globally distinct identities within this application set. Independent arithmetic checks covered the read accumulator, timing timeline, fixed-step accumulator, measurement means, linear-system residual, expression trees, audio block interval, four-point DFT round trip and tensor graph result. These checks validate the stated finite examples; they do not claim execution on the referenced platforms.
