var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// ../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// ../../../../.npm/_npx/32026684e21afda6/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// ../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// ../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// ../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// ../../../../.npm/_npx/32026684e21afda6/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// ../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// ../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// ../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// ../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// ../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// ../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// ../../../../.npm/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// ../../../../.npm/_npx/32026684e21afda6/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// ../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// cloud/card/seal.ts
var keys = {
  card: /* @__PURE__ */ __name((asset, monday, sha) => `cards/${asset}/${monday}/${sha}.json`, "card"),
  derived: /* @__PURE__ */ __name((asset, monday, sha) => `derived/${asset}/${monday}/${sha}.json`, "derived"),
  pine: /* @__PURE__ */ __name((asset, monday, sha) => `pine/${asset}/${monday}/${sha}.pine`, "pine"),
  raw: /* @__PURE__ */ __name((source, asset, monday, sha) => `raw/${source}/${asset}/${monday}/${sha}`, "raw"),
  latestCard: /* @__PURE__ */ __name((asset, monday) => `cards/${asset}/${monday}/latest`, "latestCard"),
  latestPine: /* @__PURE__ */ __name((asset, monday) => `pine/${asset}/${monday}/latest`, "latestPine")
};
async function sealBaseCard(r2, d1, args) {
  const key = keys.card(args.asset, args.monday, args.sha);
  await r2.put(key, args.canonicalBody);
  await r2.put(keys.latestCard(args.asset, args.monday), args.sha);
  return key;
}
__name(sealBaseCard, "sealBaseCard");
async function sealDerivedCard(r2, args) {
  const key = keys.derived(args.asset, args.monday, args.sha);
  await r2.put(key, args.canonicalBody);
  return key;
}
__name(sealDerivedCard, "sealDerivedCard");
async function sealPine(r2, args) {
  const key = keys.pine(args.asset, args.monday, args.sha);
  await r2.put(key, args.pine);
  await r2.put(keys.latestPine(args.asset, args.monday), args.sha);
  return key;
}
__name(sealPine, "sealPine");
async function sealRaw(r2, args) {
  const key = keys.raw(args.source, args.asset, args.monday, args.sha);
  await r2.put(key, args.bytes);
  return key;
}
__name(sealRaw, "sealRaw");
function b64Encode(bytes) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = i + 1 < bytes.length ? bytes[i + 1] : 0, c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const n = a << 16 | b << 8 | c;
    out += chars[n >> 18 & 63] + chars[n >> 12 & 63] + (i + 1 < bytes.length ? chars[n >> 6 & 63] : "=") + (i + 2 < bytes.length ? chars[n & 63] : "=");
  }
  return out;
}
__name(b64Encode, "b64Encode");
async function sealBendProof(r2, d1, args) {
  const bytes = typeof args.proofBytes === "string" ? args.proofBytes : b64Encode(args.proofBytes);
  const sha = await digestHex(typeof bytes === "string" ? bytes : b64Encode(args.proofBytes));
  const key = keys.raw("bend-proof", args.asset, args.monday, sha);
  await r2.put(key, bytes);
  d1.insertVerdict({ run_id: args.runId, kind: "bend", verdict: "PROOF_SEALED", score: 1, artifact_sha: sha });
  return { key, sha };
}
__name(sealBendProof, "sealBendProof");
var digestHex = /* @__PURE__ */ __name(async (s) => {
  let h1 = 2166136261, h2 = 2166136261 ^ 57005;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 ^ c + 31, 16777619) >>> 0;
  }
  const h = /* @__PURE__ */ __name((n) => ("00000000" + n.toString(16)).slice(-8), "h");
  return (h(h1) + h(h2) + h(Math.imul(h1 ^ h2, 16777619) >>> 0) + h(Math.imul(h1 + h2, 16777619) >>> 0)).repeat(2).slice(0, 64);
}, "digestHex");

// m1/src/refusals.ts
var E1Refusal = class extends Error {
  constructor(token, detail) {
    super(`${token}: ${detail}`);
    this.token = token;
    this.detail = detail;
  }
  token;
  detail;
  static {
    __name(this, "E1Refusal");
  }
};

// cloud/state.ts
var ORDER = ["RESOLVED", "EVIDENCE", "PILLARS", "ORGANS", "DERIVED", "SEALED", "COMPOSED", "COMPLETE"];
function transition(from, to) {
  if (to === from) return to;
  if (to === "BLOCKED") {
    if (from === "COMPLETE" || from === "BLOCKED")
      throw new E1Refusal("E1_DERIVED_CHAIN_INVALID", `STATE_TERMINAL: ${from} -> BLOCKED refused - terminal states never re-block`);
    return to;
  }
  if (from === "BLOCKED" || from === "COMPLETE")
    throw new E1Refusal("E1_DERIVED_CHAIN_INVALID", `STATE_TERMINAL: ${from} -> ${to} refused - terminal states never advance`);
  if (ORDER.indexOf(to) <= ORDER.indexOf(from))
    throw new E1Refusal("E1_DERIVED_CHAIN_INVALID", `STATE_BACKWARD: ${from} -> ${to} refused - the E1 state machine moves forward only`);
  return to;
}
__name(transition, "transition");
var RealD1 = class {
  static {
    __name(this, "RealD1");
  }
  db;
  rows = /* @__PURE__ */ new Map();
  constructor(db) {
    this.db = db;
  }
  insertRun(row) {
    this.rows.set(row.id, row);
    void this.db.prepare(
      `INSERT OR IGNORE INTO runs (id, asset, monday, state, base_sha, derived_sha, pine_sha, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(row.id, row.asset, row.monday, row.state, row.base_sha ?? null, row.derived_sha ?? null, row.pine_sha ?? null, row.created_at ?? (/* @__PURE__ */ new Date()).toISOString(), row.updated_at ?? (/* @__PURE__ */ new Date()).toISOString()).run().catch(() => void 0);
  }
  getRun(id) {
    return this.rows.get(id) ?? null;
  }
  updateRun(id, patch) {
    const cur = this.rows.get(id);
    if (!cur) throw new Error(`DO_STATE_UNKNOWN_RUN: ${id}`);
    const next = { ...cur, ...patch, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
    this.rows.set(id, next);
    const sets = Object.keys(patch).map((k) => `${k} = ?`).join(", ");
    void this.db.prepare(`UPDATE runs SET ${sets || "updated_at = ?"}, updated_at = ? WHERE id = ? AND state NOT IN ('COMPLETE', 'BLOCKED', 'ABORTED')`).bind(...Object.values(patch), (/* @__PURE__ */ new Date()).toISOString(), id).run().catch(() => void 0);
    return next;
  }
  insertSource(row) {
    void this.db.prepare(`INSERT INTO sources (run_id, source_id, kind, pillar, sha256, cutoff_status, published_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(row.run_id, row.source_id, row.kind, row.pillar, row.sha256, row.cutoff_status, row.published_at ?? null).run().catch(() => void 0);
  }
  listSources(runId) {
    return [];
  }
  // write-through store; reads go to D1 dashboards
  insertZone(row) {
    void this.db.prepare(`INSERT INTO zones (run_id, zone_id, role, degree, score, top, bottom, lifecycle) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(row.run_id, row.zone_id, row.role, row.degree, row.score, row.top, row.bottom, row.lifecycle).run().catch(() => void 0);
  }
  listZones(runId) {
    return [];
  }
  insertVerdict(row) {
    void this.db.prepare(`INSERT INTO verdicts (run_id, kind, verdict, score, artifact_sha) VALUES (?, ?, ?, ?, ?)`).bind(row.run_id, row.kind, row.verdict, row.score ?? null, row.artifact_sha).run().catch(() => void 0);
  }
  listVerdicts(runId) {
    return [];
  }
};
var RealR2 = class {
  constructor(bucket) {
    this.bucket = bucket;
  }
  bucket;
  static {
    __name(this, "RealR2");
  }
  async put(key, bytes) {
    const prev = await this.get(key);
    if (prev !== null) {
      const a = typeof prev === "string" ? new TextEncoder().encode(prev) : prev;
      const b = typeof bytes === "string" ? new TextEncoder().encode(bytes) : bytes;
      if (Buffer?.compare && Buffer.compare(Buffer.from(a), Buffer.from(b)) !== 0)
        throw new Error(`R2_IMMUTABLE_VIOLATION: key ${key} already holds different bytes`);
      return;
    }
    await this.bucket.put(key, bytes);
  }
  async get(key) {
    const obj = await this.bucket.get(key);
    if (!obj) return null;
    const bytes = new Uint8Array(obj.body instanceof ReadableStream ? await new Response(obj.body).arrayBuffer() : obj.body);
    return new TextDecoder().decode(bytes);
  }
  async list(prefix) {
    const r = await this.bucket.list({ prefix });
    return r.objects.map((o) => o.key);
  }
};

// m1/src/window.ts
var DAY = 864e5;
var HOUR = 36e5;
function zoneOffsetMinutes(utcMs, timeZone) {
  const f = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const p = {};
  for (const x of f.formatToParts(new Date(utcMs))) p[x.type] = x.value;
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((asUtc - utcMs) / 6e4);
}
__name(zoneOffsetMinutes, "zoneOffsetMinutes");
function wallClockToUtc(y, m, d, hh, mm, timeZone) {
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const t1 = guess - zoneOffsetMinutes(guess, timeZone) * 6e4;
  return guess - zoneOffsetMinutes(t1, timeZone) * 6e4;
}
__name(wallClockToUtc, "wallClockToUtc");
function runWindow(asset, weekMonday) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(weekMonday);
  if (!m) throw new E1Refusal("E1_IDENTITY_INVALID", `W0_WEEK_INVALID: ${weekMonday}`);
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  const monday = Date.UTC(y, mo - 1, d);
  if (new Date(monday).getUTCDay() !== 1) throw new E1Refusal("E1_IDENTITY_INVALID", `W0_WEEK_NOT_MONDAY: ${weekMonday} - WINDOW_NON_MONDAY_REJECTED`);
  if (!["DXY", "EURUSD", "GBPUSD"].includes(asset)) throw new E1Refusal("E1_ASSET_UNSUPPORTED", `W0_ASSET_UNSUPPORTED: ${asset}`);
  return {
    asset,
    weekMonday,
    openUtc: monday - 2 * HOUR,
    // Sunday 22:00 UTC
    cutoffUtc: wallClockToUtc(y, mo, d, 9, 0, "Europe/London"),
    endUtc: monday + 4 * DAY + 21 * HOUR,
    // Friday 21:00 UTC
    renderFromUtc: monday - 7 * DAY,
    renderToUtc: monday + 4 * DAY + 21 * HOUR
    // R36: Friday 21:00 UTC session end
  };
}
__name(runWindow, "runWindow");

// m1/src/evidence/manifest.ts
import { createHash } from "node:crypto";
function cutoffStatusOf(published_at, cutoffMs) {
  if (published_at === null || published_at === void 0 || typeof published_at === "number" && !Number.isFinite(published_at)) return "MISSING";
  if (typeof published_at !== "number") return "MISSING";
  return published_at <= cutoffMs ? "BEFORE_CUTOFF" : "AFTER_CUTOFF";
}
__name(cutoffStatusOf, "cutoffStatusOf");
function sha256Hex(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
__name(sha256Hex, "sha256Hex");
function buildManifest(sources, identity, cutoffMs) {
  if (!identity || !identity.asset || !identity.week_monday)
    throw new E1Refusal("E1_IDENTITY_INVALID", "MANIFEST_IDENTITY_INVALID: run identity needs asset + week_monday");
  const rows = sources.map((s) => ({
    source_id: s.source_id,
    source_kind: s.source_kind,
    pillar: s.pillar,
    sha: sha256Hex(s.bytes),
    published_at: s.published_at,
    retrieved_at: s.retrieved_at,
    cutoff_status: cutoffStatusOf(s.published_at, cutoffMs),
    raw_key: s.raw_key,
    impact: s.impact
  }));
  const future = rows.filter((r) => r.cutoff_status === "AFTER_CUTOFF" && r.source_kind !== "organ");
  if (future.length)
    throw new E1Refusal("E1_CUTOFF_VIOLATION", `MANIFEST_FUTURE: ${future.map((r) => `${r.source_id} published ${r.published_at === null ? "null" : new Date(r.published_at).toISOString()} > cutoff ${new Date(cutoffMs).toISOString()}`).join("; ")} - post-cutoff records are audit-only, never prediction inputs`);
  return rows;
}
__name(buildManifest, "buildManifest");

// m1/src/derivedCard.ts
import { createHash as createHash2 } from "node:crypto";
function canonicalBytes(value) {
  const sort = /* @__PURE__ */ __name((v) => {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === "object") {
      const out = {};
      for (const k of Object.keys(v).sort()) out[k] = sort(v[k]);
      return out;
    }
    return v;
  }, "sort");
  return JSON.stringify(sort(value));
}
__name(canonicalBytes, "canonicalBytes");
function sha256Hex2(bytes) {
  return createHash2("sha256").update(bytes).digest("hex");
}
__name(sha256Hex2, "sha256Hex");
function deriveCard(base, organs) {
  if (!base || typeof base.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(base.sha256))
    throw new E1Refusal("E1_CARD_INVALID", `DERIVED_BASE_UNSEALED: the base card carries no valid sha256 (${String(base?.sha256).slice(0, 20)}) - a derived card may only seal a sealed base`);
  const { sha256: baseSealed, ...baseRest } = base;
  const baseSha = sha256Hex2(canonicalBytes(baseRest));
  if (baseSha !== baseSealed)
    throw new E1Refusal("E1_BASE_CARD_MUTATED", `DERIVED_BASE_MUTATED: base sha256 says ${baseSealed.slice(0, 16)} but its bytes hash to ${baseSha.slice(0, 16)} - the base card changed after sealing`);
  const derived = {
    ...structuredClone(base),
    schema_version: (base.schema_version ?? 1) + 1,
    supersedes_sha256: base.sha256,
    unassignedPrecision: organs.unassignedLmv,
    zoneMeta: organs.zoneMeta
  };
  delete derived.sha256;
  derived.sha256 = sha256Hex2(canonicalBytes(derived));
  return derived;
}
__name(deriveCard, "deriveCard");

// m1/src/validateCard.ts
function validateBaseCard(card) {
  if (typeof card.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(card.sha256))
    throw new E1Refusal("E1_CARD_INVALID", `BASE_UNSEALED: no valid sha256 (${String(card?.sha256).slice(0, 20)})`);
  const { sha256, ...rest } = card;
  if (sha256Hex2(canonicalBytes(rest)) !== sha256)
    throw new E1Refusal("E1_BASE_CARD_MUTATED", `BASE_MUTATED: bytes hash to ${sha256Hex2(canonicalBytes(rest)).slice(0, 16)} != sealed ${sha256.slice(0, 16)}`);
  for (const z of card.zones ?? []) {
    if (typeof z.score === "number" && (z.score < 0 || z.score > 14))
      throw new E1Refusal("E1_CARD_INVALID", `SCORE_BOUNDS: zone ${z.id} score ${z.score} outside 0..14`);
    if (typeof z.reactionsPreCutoff === "number" && typeof z.reactionState === "string") {
      const want = z.reactionsPreCutoff === 0 ? "Virgin" : z.reactionsPreCutoff <= 2 ? "Active" : "Depleted";
      if (z.reactionState !== want)
        throw new E1Refusal("E1_CARD_INVALID", `REACTION_MAP: zone ${z.id} ${z.reactionsPreCutoff} reactions -> ${z.reactionState}, expected ${want}`);
    }
  }
}
__name(validateBaseCard, "validateBaseCard");
function validateDerivedCard(derived, base) {
  validateBaseCard(base);
  if (typeof derived.supersedes_sha256 !== "string" || derived.supersedes_sha256 !== base.sha256)
    throw new E1Refusal("E1_DERIVED_CHAIN_INVALID", `SUPERSEDES_MISMATCH: derived supersedes ${String(derived.supersedes_sha256).slice(0, 16)} != base ${String(base.sha256).slice(0, 16)}`);
  if (typeof derived.schema_version !== "number" || derived.schema_version <= (base.schema_version ?? 1))
    throw new E1Refusal("E1_DERIVED_CHAIN_INVALID", `SCHEMA_NOT_ADVANCED: derived ${derived.schema_version} <= base ${base.schema_version ?? 1}`);
  const baseZoneIds = new Set((base.zones ?? []).map((z) => z.id));
  for (const id of baseZoneIds) if (!(derived.zones ?? []).some((z) => z.id === id))
    throw new E1Refusal("E1_DERIVED_CHAIN_INVALID", `ZONE_LOST: base zone ${id} absent from the derived card`);
  const { sha256 } = derived;
  if (typeof sha256 === "string" && /^[0-9a-f]{64}$/.test(sha256)) {
    const { sha256: _s, ...rest } = derived;
    if (sha256Hex2(canonicalBytes(rest)) !== sha256)
      throw new E1Refusal("E1_DERIVED_CHAIN_INVALID", `DERIVED_SEAL_BROKEN: bytes hash to ${sha256Hex2(canonicalBytes(rest)).slice(0, 16)} != sealed ${sha256.slice(0, 16)}`);
  }
}
__name(validateDerivedCard, "validateDerivedCard");

// m1/src/p1.ts
var EPS = 1e-9;
var eq = /* @__PURE__ */ __name((a, b) => Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(a), Math.abs(b)), "eq");
function pivotSet(source, timeframe, variant, H, L, C) {
  if (![H, L, C].every((v) => typeof v === "number" && Number.isFinite(v)))
    throw new Error(`P1_OHLC_MALFORMED: ${source} H/L/C not finite (H=${H} L=${L} C=${C})`);
  if (!(H >= L)) throw new Error(`P1_OHLC_MALFORMED: ${source} high ${H} < low ${L}`);
  if (!(C >= L && C <= H)) throw new Error(`P1_OHLC_MALFORMED: ${source} close ${C} outside [${L}, ${H}]`);
  const R = H - L;
  const PP = (H + L + C) / 3;
  let lv;
  if (variant === "classic") lv = { PP, R1: 2 * PP - L, S1: 2 * PP - H, R2: PP + R, S2: PP - R, R3: H + 2 * (PP - L), S3: L - 2 * (H - PP) };
  else if (variant === "fibonacci") lv = { PP, R1: PP + 0.382 * R, S1: PP - 0.382 * R, R2: PP + 0.618 * R, S2: PP - 0.618 * R, R3: PP + R, S3: PP - R };
  else lv = { R4: C + R * 1.1 / 2, S4: C - R * 1.1 / 2, R3: C + R * 1.1 / 4, S3: C - R * 1.1 / 4, R2: C + R * 1.1 / 6, S2: C - R * 1.1 / 6, R1: C + R * 1.1 / 12, S1: C - R * 1.1 / 12 };
  const c = {};
  if (variant === "classic") {
    c.formula = eq(lv.R1 + L, 2 * PP) && eq(lv.S1 + H, 2 * PP) && eq(lv.R2 - PP, R) && eq(PP - lv.S2, R);
    c.range = eq(lv.R2 - lv.S2, 2 * R);
  } else if (variant === "fibonacci") {
    c.formula = eq(lv.R1 - PP, 0.382 * R) && eq(PP - lv.S1, 0.382 * R) && eq(lv.R2 - PP, 0.618 * R) && eq(PP - lv.S2, 0.618 * R);
    c.symmetry = eq(lv.R1 - PP, PP - lv.S1) && eq(lv.R2 - PP, PP - lv.S2);
    c.range = eq(lv.R2 - lv.S2, 1.236 * R);
  } else {
    c.formula = eq(lv.R4 - C, R * 0.55) && eq(C - lv.S4, R * 0.55);
    c.range = eq(lv.R4 - lv.S4, R * 1.1);
  }
  const mid = variant === "camarilla" ? C : PP;
  c.sanity = R > EPS && lv.R1 > mid + EPS && mid > lv.S1 + EPS && lv.R2 > lv.R1 && lv.S1 > lv.S2 && lv.S2 > lv.S3;
  const f = /* @__PURE__ */ __name((x) => x.toFixed(5), "f");
  const audit = `Pivot Verification: ${source} ${variant} - H=${f(H)} L=${f(L)} C=${f(C)} | ` + (variant === "camarilla" ? `R4=${f(lv.R4)} S4=${f(lv.S4)} R4-S4=${f(lv.R4 - lv.S4)} 1.1x(H-L)=${f(1.1 * R)}` : `PP=${f(PP)} R1=${f(lv.R1)} S1=${f(lv.S1)} | R1+L=${f(lv.R1 + L)} 2xPP=${f(2 * PP)} | R2-S2=${f(lv.R2 - lv.S2)}`) + ` | ${Object.entries(c).map(([k, v]) => `${k.toUpperCase()}: ${v ? "PASS" : "FAIL"}`).join(" ")}`;
  return { source, timeframe, variant, H, L, C, levels: lv, checks: c, audit };
}
__name(pivotSet, "pivotSet");
function pillar1(priorWeek, priorDays, historic) {
  const variants = ["classic", "fibonacci", "camarilla"];
  const sets = [];
  const inputs = {};
  const add = /* @__PURE__ */ __name((src, tf, o) => {
    inputs[src] = o;
    for (const v of variants) sets.push(pivotSet(src, tf, v, o.high, o.low, o.close));
  }, "add");
  add(`W:${priorWeek.key}`, "W", priorWeek);
  for (const d of priorDays.slice(-3)) add(`D:${d.key}`, "D", d);
  for (const w of historic) add(`H:${w.key}`, "W", w);
  const failed = sets.filter((s) => !Object.values(s.checks).every(Boolean));
  if (failed.length) throw new Error(`P1_VERIFICATION_FAILED: ${failed.map((s) => s.audit).join(" || ")}`);
  const levels = [];
  for (const s of sets) for (const [name, price] of Object.entries(s.levels))
    levels.push({
      id: `P1|${s.source}|${s.variant}|${name}`,
      pillar: "P1",
      name: `${s.source} ${s.variant} ${name}`,
      price,
      source: s.source,
      timeframe: s.source.startsWith("H:") ? "H" : s.timeframe,
      variant: s.variant,
      legacy: s.source.startsWith("H:")
    });
  return { sets, levels, inputs, audit: sets.map((s) => s.audit) };
}
__name(pillar1, "pillar1");

// m1/src/p2.ts
var PERIODS = [9, 10, 20, 50, 100, 200];
var MA_WEIGHT = { 200: 3, 100: 2, 50: 1.5, 20: 1, 10: 0.5, 9: 0.5 };
function sma(x, n, i) {
  if (i + 1 < n) return NaN;
  let s = 0;
  for (let k = i - n + 1; k <= i; k++) s += x[k];
  return s / n;
}
__name(sma, "sma");
function emaSeries(x, n) {
  const a = 2 / (n + 1);
  const o = [];
  let e = NaN;
  for (let i = 0; i < x.length; i++) {
    if (i + 1 === n) e = sma(x, n, i);
    else if (i + 1 > n) e = a * x[i] + (1 - a) * e;
    o.push(e);
  }
  return o;
}
__name(emaSeries, "emaSeries");
function pillar2(days, unit) {
  if (days.length < 200) throw new Error(`P2_INSUFFICIENT_HISTORY: ${days.length} sessions < 200`);
  const c = days.map((d) => d.close);
  const last = days.length - 1;
  const mas = [];
  for (const n of PERIODS) {
    const s = c.map((_, i) => sma(c, n, i));
    mas.push({ name: `SMA${n}`, n, type: "SMA", v: s[last], series: s });
    const e = emaSeries(c, n);
    mas.push({ name: `EMA${n}`, n, type: "EMA", v: e[last], series: e });
  }
  const recaptures = [];
  for (const m of mas.filter((m2) => [50, 100, 200].includes(m2.n))) {
    for (let k = last; k > last - 3; k--) if (c[k - 1] < m.series[k - 1] && c[k] > m.series[k]) {
      recaptures.push(m.name);
      break;
    }
  }
  const levels = mas.map((m) => ({
    id: `P2|${m.name}`,
    pillar: "P2",
    kind: "ma",
    price: m.v,
    label: `${m.name} (D1)`,
    timeframe: "D",
    source: [`tv-bars D1 closes to ${days[last].key}`],
    tags: recaptures.includes(m.name) ? ["RECAPTURE ZONE"] : [],
    meta: { weight: MA_WEIGHT[m.n], recapture: recaptures.includes(m.name) }
  }));
  const sorted = [...levels].sort((a, b) => a.price - b.price);
  const clusters = [];
  const used = /* @__PURE__ */ new Set();
  for (let i = 0; i < sorted.length; i++) {
    const grp = sorted.filter((l) => l.price >= sorted[i].price && l.price - sorted[i].price <= 0.15 * unit);
    if (grp.length >= 3 && !grp.every((g) => used.has(g.id))) {
      grp.forEach((g) => used.add(g.id));
      clusters.push({
        lo: grp[0].price,
        hi: grp[grp.length - 1].price,
        members: grp.map((g) => g.id),
        weight: grp.reduce((s, g) => s + g.meta.weight, 0),
        recapture: grp.some((g) => g.meta.recapture)
      });
    }
  }
  for (const cl of clusters) levels.push({
    id: `P2|cluster|${cl.lo.toFixed(3)}`,
    pillar: "P2",
    kind: "ma-cluster",
    price: (cl.lo + cl.hi) / 2,
    label: `MA cluster ${cl.members.length}x`,
    timeframe: "D",
    source: cl.members,
    tags: cl.recapture ? ["RECAPTURE ZONE"] : [],
    meta: { ...cl }
  });
  return { levels, clusters, recaptures, asOf: days[last].key };
}
__name(pillar2, "pillar2");

// m1/src/options.ts
var DXY_W = { EURUSD: -0.576, USDJPY: 0.136, GBPUSD: -0.119, USDCAD: 0.091, USDSEK: 0.042, USDCHF: 0.036 };
var R1_QUALIFIED = /* @__PURE__ */ new Set(["EURUSD", "GBPUSD", "AUDUSD"]);
function usdNotional(e, notional, spot) {
  if (e.notional_ccy === "USD") return notional;
  const pair = `${e.notional_ccy}USD`;
  const s = spot[pair];
  if (!s) throw new Error(`P3_NOTIONAL_SPOT_MISSING: ${pair} - add the pair's publication spot to m1/evidence/protocol-a/extraction.json spot_at_publication`);
  return notional * s;
}
__name(usdNotional, "usdNotional");
function tierOf(usd) {
  return usd >= 15e8 ? 1 : usd >= 85e7 ? 2 : 3;
}
__name(tierOf, "tierOf");
var TIER_NAME = { 1: "CRITICAL OPTION WALL", 2: "SIGNIFICANT MAGNET", 3: "EXCLUDED" };
function pillar3and8(inp) {
  const { extraction: x, asset, unit, dxyRef } = inp;
  const spot = x.spot_at_publication;
  if (x.cutoff_status !== "BEFORE_CUTOFF") throw new Error(`P3_EVIDENCE_AFTER_CUTOFF: ${x.published_at} - fetch a Protocol A post published before the run week's Monday 09:00 London cutoff`);
  const native = asset !== "DXY";
  const conversions = [];
  const audit = [];
  const supplementary = /* @__PURE__ */ new Set();
  const K = native ? null : dxyRef * Math.pow(spot.EURUSD, 0.576);
  audit.push(native ? `K factor: n/a for the ${asset} map - the chart's own pair's strikes are native ${asset} prices (identity, no conversion); P3 converts to DXY only and the canon defines no cross-conversion to ${asset}` : `K factor: DXY_ref=${dxyRef} (${inp.dxyRefAt}) x EURUSD_spot^0.576=${spot.EURUSD}^0.576 -> K=${K.toFixed(4)} | spots: ${inp.spotSource} | H.10: ${inp.h10Status}`);
  for (const e of x.expiries) {
    if (native && e.pair !== asset) continue;
    const w = DXY_W[e.pair];
    if (w === void 0) continue;
    const s = spot[e.pair];
    if (!s) throw new Error(`P3_SPOT_MISSING: ${e.pair} - add it to extraction.json spot_at_publication`);
    supplementary.add(e.pair);
    for (const [strike, notional] of e.strikes) {
      const usd = usdNotional(e, notional, spot);
      const tier = e.pair === "EURUSD" ? tierOf(notional) : tierOf(usd);
      const level = native ? strike : dxyRef * Math.pow(strike / s, w);
      const pillar = e.pair === "EURUSD" ? "P8" : "P3";
      const base = pillar === "P8" ? { 1: 0.07, 2: 0.1, 3: 0.15 }[tier] : 0.1;
      const band = (base + 0.03) * unit;
      const a = native ? `${pillar} ${e.date} ${e.pair} ${strike} ${e.notional_ccy}${(notional / 1e6).toFixed(0)}m ($${(usd / 1e6).toFixed(0)}m) T${tier} ${TIER_NAME[tier]} -> ${asset} ${level.toFixed(5)} (native strike) band +/-${band.toFixed(5)}` : `${pillar} ${e.date} ${e.pair} ${strike} ${e.notional_ccy}${(notional / 1e6).toFixed(0)}m ($${(usd / 1e6).toFixed(0)}m) T${tier} ${TIER_NAME[tier]} -> DXY ${level.toFixed(3)} = ${dxyRef} x (${strike}/${s})^${w} band +/-${band.toFixed(2)}`;
      audit.push(a);
      conversions.push({ pair: e.pair, date: e.date, strike, notional, ccy: e.notional_ccy, usd, tier, level, band, pillar, audit: a });
    }
  }
  if (native) {
    const skipped = [...new Set(x.expiries.map((e) => e.pair).filter((p) => p !== asset))];
    if (skipped.length) audit.push(`P3 excluded for this map: ${skipped.join(", ")} strikes - no canon cross-conversion to ${asset} exists (P3 converts to DXY only); recorded not-applicable`);
    if (!conversions.length) audit.push(`P8: no ${asset} strikes published in the ${x.published_at} post - the options dimension will be 0 for every level`);
  }
  const levels = conversions.filter((c) => c.tier <= 2).map((c) => ({
    id: `${c.pillar}|${c.pair}|${c.date}|${c.strike}`,
    pillar: c.pillar,
    kind: "option",
    price: c.level,
    label: `${c.pair} ${c.strike} ${c.ccy === "EUR" ? "EUR" : c.ccy === "AUD" ? "A$" : "$"}${c.notional >= 1e9 ? (c.notional / 1e9).toFixed(1) + "bn" : (c.notional / 1e6).toFixed(0) + "m"} ${c.date.slice(5)}`,
    timeframe: "expiry",
    formedAt: Date.parse(x.published_at),
    source: [x.source_url, `image sha256 ${x.image.sha256}`],
    tags: [TIER_NAME[c.tier]],
    meta: { tier: c.tier, usd: c.usd, band: c.band, pair: c.pair, date: c.date, strike: c.strike, r1: R1_QUALIFIED.has(c.pair) }
  }));
  return { conversions, levels, K, audit, supplementaryPairs: [...supplementary] };
}
__name(pillar3and8, "pillar3and8");

// m1/src/p6p7.ts
var RATIOS = [0.236, 0.382, 0.5, 0.618, 0.786];
function fibLegs(id, hi, lo, label, src, upLeg) {
  return RATIOS.map((r) => {
    const price = upLeg ? hi - r * (hi - lo) : lo + r * (hi - lo);
    return { id: `P6|fib|${id}|${r}`, pillar: "P6", kind: "fib", price, label: `${label} ${r}`, source: [src], meta: { ratio: r, hi, lo } };
  });
}
__name(fibLegs, "fibLegs");
function pillar6(priorWeek, swings, d1Range, pip) {
  const out = [];
  const upWeek = priorWeek.close >= priorWeek.open;
  out.push(...fibLegs(`W:${priorWeek.key}`, priorWeek.high, priorWeek.low, `fib prior week ${priorWeek.key}`, `tv-bars W ${priorWeek.key}`, upWeek));
  const s = [...swings].sort((a, b) => a.t - b.t);
  const lastHi = [...s].reverse().find((x) => x.side === "high"), lastLo = [...s].reverse().find((x) => x.side === "low");
  if (lastHi && lastLo) {
    const up = lastHi.t > lastLo.t;
    out.push(...fibLegs(`swing:${lastLo.date}-${lastHi.date}`, lastHi.price, lastLo.price, `fib swing ${up ? lastLo.date + "->" + lastHi.date : lastHi.date + "->" + lastLo.date}`, `tv-bars D1 swings`, up));
  }
  const quarter = 25 * pip, dec = pip === 0.01 ? 2 : 4;
  for (let q = Math.ceil(d1Range.lo / quarter - 1e-9) * quarter; q <= d1Range.hi + 1e-9; q += quarter) {
    const major = Math.abs(q / (2 * quarter) - Math.round(q / (2 * quarter))) < 1e-9;
    out.push({ id: `P6|round|${q.toFixed(dec)}`, pillar: "P6", kind: "round", price: q, label: `${major ? "big figure" : "quarter"} ${q.toFixed(dec)}`, source: ["arithmetic"], tags: [major ? "MAJOR" : "QUARTER"] });
  }
  return out;
}
__name(pillar6, "pillar6");
function pillar7(conv) {
  const inc = conv.filter((c) => c.tier <= 2 && c.pair === "EURUSD");
  if (!inc.length) return { arena: null, levels: [] };
  const lo = Math.min(...inc.map((c) => c.level)), hi = Math.max(...inc.map((c) => c.level));
  const arena = { lo, hi, basis: "fallback: outermost Tier 1-2 EUR/USD option walls (9-pillar primary mapping)", ice: "MISSING", cme: "MISSING" };
  return { arena, levels: [
    { id: "P7|arena|lo", pillar: "P7", kind: "arena", price: lo, label: "pressure arena floor", source: [arena.basis] },
    { id: "P7|arena|hi", pillar: "P7", kind: "arena", price: hi, label: "pressure arena ceiling", source: [arena.basis] }
  ] };
}
__name(pillar7, "pillar7");
function resolveP7(exchange, conv) {
  if (exchange.arena)
    return {
      arena: { lo: exchange.arena.floor, hi: exchange.arena.ceiling, basis: exchange.arena.basis, ice: "MISSING", cme: "MISSING" },
      levels: exchange.levels,
      basis: "exchange",
      missingToken: null
    };
  const fb = pillar7(conv);
  if (!fb.arena) throw new Error("P7_NO_ARENA: neither exchange evidence nor fallback option walls produced an arena");
  return { arena: fb.arena, levels: fb.levels, basis: "fallback", missingToken: exchange.missingToken ?? "P7_EXCHANGE_SOURCE_MISSING" };
}
__name(resolveP7, "resolveP7");

// m1/src/p7exchange.ts
var TIER1_USD = 15e8;
function pillar7Exchange(input, asset, cutoffMs) {
  const audit = [];
  if (!(input.published_at <= cutoffMs))
    throw new E1Refusal("E1_CUTOFF_VIOLATION", `P7_AFTER_CUTOFF: ${input.source} walls published ${new Date(input.published_at).toISOString()} > cutoff ${new Date(cutoffMs).toISOString()} - supplementary exchange data must predate the cutoff`);
  const matched = (input.walls ?? []).filter((w) => w.pair === asset);
  const skipped = (input.walls ?? []).length - matched.length;
  if (skipped) audit.push(`P7 excluded ${skipped} wall(s) for other pairs (asset ${asset}) - recorded, never silently merged`);
  const bad = matched.find((w) => !Number.isFinite(w.price) || w.price <= 0 || !Number.isFinite(w.notional_usd) || w.notional_usd < 0);
  if (bad) throw new E1Refusal("E1_PILLAR_FAILED", `P7_WALL_INVALID: wall ${JSON.stringify(bad)} is not a finite-positive price with non-negative notional`);
  const included = matched.filter((w) => w.notional_usd >= TIER1_USD);
  audit.push(`P7 ${input.source}: ${matched.length} ${asset} wall(s), ${included.length} tier-1 (>= $${TIER1_USD})`);
  if (!included.length)
    return {
      arena: null,
      levels: [],
      missing: [{ protocol: "P7 exchange arena", reason: `P7_NO_TIER1_WALL: no ${asset} ${input.source} wall >= $1.5bn before the cutoff`, impact: "no exchange arena; blueprint option-wall fallback applies for this M1 run only" }],
      missingToken: "P7_NO_TIER1_WALL",
      audit
    };
  const floor = Math.min(...included.map((w) => w.price));
  const ceiling = Math.max(...included.map((w) => w.price));
  const basis = `exchange arena: ${input.source} ${included.length} tier-1 ${asset} wall(s) ${new Date(input.published_at).toISOString()} floor ${floor} ceiling ${ceiling}`;
  audit.push(`P7 arena: ${basis}`);
  return {
    arena: { floor, ceiling, source: input.source, published_at: input.published_at, walls: included.length, basis },
    levels: [
      { id: `P7|exchange|${input.source}|floor`, pillar: "P7", kind: "arena", price: floor, label: `exchange arena floor ${floor}`, source: [basis] },
      { id: `P7|exchange|${input.source}|ceiling`, pillar: "P7", kind: "arena", price: ceiling, label: `exchange arena ceiling ${ceiling}`, source: [basis] }
    ],
    missing: null,
    missingToken: null,
    audit
  };
}
__name(pillar7Exchange, "pillar7Exchange");

// m1/src/organs/obcv.ts
var DISPLACEMENT_FLOOR = { "4H": 50, "1H": 30, "30m": 20 };
var MOVE_WINDOW = { "4H": 18, "1H": 36, "30m": 24 };
function tr(a, prev) {
  return Math.max(a.high - a.low, Math.abs(a.high - prev.close), Math.abs(a.low - prev.close));
}
__name(tr, "tr");
function atrExcluding(bars, i) {
  const from = Math.max(1, i - 14);
  const vals = [];
  for (let j = from; j < i; j++) vals.push(tr(bars[j], bars[j - 1]));
  if (!vals.length) return 0;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}
__name(atrExcluding, "atrExcluding");
function structureBroken(bars, i, tf, dir3) {
  const from = Math.max(0, i - Math.floor(MOVE_WINDOW[tf] * 0.5));
  if (dir3 === 1) {
    let mx = -Infinity;
    for (let j = from; j < i; j++) if (bars[j].high > mx) mx = bars[j].high;
    return bars[i].close > mx;
  }
  let mn = Infinity;
  for (let j = from; j < i; j++) if (bars[j].low < mn) mn = bars[j].low;
  return bars[i].close < mn;
}
__name(structureBroken, "structureBroken");
function detectObcvCandidates(lanes, unit, cutoff) {
  const audit = [];
  const candidates = [];
  const pip = 0.01 * unit;
  const tfs = ["4H", "1H", "30m"];
  const avail = tfs.filter((t) => (lanes[t] ?? []).length > 0);
  if (!avail.includes("30m")) audit.push("E1_OBCV_30M_DATA_MISSING");
  for (const tf of avail) {
    const bars = lanes[tf].filter((b) => b.time < cutoff);
    for (const b of lanes[tf]) {
      if (b.time >= cutoff) throw new E1Refusal("E1_ORGAN_INPUT_POST_CUTOFF", `obcv ${tf} bar ${b.time} at/after cutoff ${cutoff}`);
    }
    if (!bars.length) continue;
    const k = MOVE_WINDOW[tf];
    for (let i = 4; i < bars.length; i++) {
      const bar = bars[i];
      const body = Math.abs(bar.close - bar.open);
      const prior = bars.slice(i - 4, i).map((b) => Math.abs(b.close - b.open));
      const avg = prior.reduce((s, v) => s + v, 0) / prior.length;
      if (!(avg > 0) || body < 1.5 * avg) continue;
      const atr = atrExcluding(bars, i);
      if (!(atr > 0) || body < 1.5 * atr) continue;
      const end = Math.min(bars.length, i + 1 + k);
      if (end <= i + 1) continue;
      let mx = -Infinity;
      let mn = Infinity;
      for (let j = i + 1; j < end; j++) {
        const c = bars[j].close;
        if (c > mx) mx = c;
        if (c < mn) mn = c;
      }
      const dispPips = (mx - mn) / pip;
      if (dispPips < DISPLACEMENT_FLOOR[tf]) continue;
      const dir3 = bar.close > bar.open ? 1 : -1;
      if (!structureBroken(bars, i, tf, dir3)) continue;
      const o = bars[i - 1];
      const bodyO = Math.abs(o.close - o.open);
      const rng = o.high - o.low;
      if (!(bodyO > 0) || !(rng > 0)) continue;
      const bw = bodyO / Math.max(o.high - Math.max(o.open, o.close), Math.min(o.open, o.close) - o.low, 1e-12);
      const bf = bodyO / rng;
      const dirO = o.close > o.open ? 1 : -1;
      let classification = null;
      if (bw >= 3 && bf >= 0.65) classification = tf === "30m" ? "PHANTOM_BOM" : "BoM";
      else classification = "MoM";
      if (tf === "30m" && classification === "BoM") classification = "MoM";
      const side = dirO === 1 ? "demand" : "supply";
      const id = `OB|${tf}|${o.time}|${o.low.toFixed(5)}`;
      candidates.push({
        id,
        tf,
        side,
        lo: o.low,
        hi: o.high,
        originTime: o.time,
        classification,
        displacementPips: Math.round(dispPips * 10) / 10,
        bodyMult: Math.round(body / avg * 100) / 100
      });
    }
  }
  candidates.sort((a, b) => a.tf.localeCompare(b.tf) || a.lo - b.lo || a.originTime - b.originTime);
  return { candidates, audit };
}
__name(detectObcvCandidates, "detectObcvCandidates");

// m1/src/organs/candlePressure.ts
var MIN_TOUCH_DEPTH_PIPS = 2;
function anatomy(bar) {
  const bodyTop = Math.max(bar.open, bar.close);
  const bodyBottom = Math.min(bar.open, bar.close);
  return {
    bodyTop,
    bodyBottom,
    bodySize: Math.abs(bar.close - bar.open),
    upperWick: bar.high - bodyTop,
    lowerWick: bodyBottom - bar.low
  };
}
__name(anatomy, "anatomy");
function classifyTouch(zone, before, test, after, window, unit, cutoff) {
  if (!(zone.hi > zone.lo)) throw new Error("CANDLE_PRESSURE_ZONE_INVALID: hi must exceed lo");
  for (const b of [before, test, after]) {
    if (b && b.time >= cutoff) throw new E1Refusal("E1_ORGAN_INPUT_POST_CUTOFF", `candle-pressure bar ${b.time} at/after cutoff ${cutoff}`);
  }
  const minDepth = MIN_TOUCH_DEPTH_PIPS * 0.01 * unit;
  const an = anatomy(test);
  const lo = zone.lo;
  const hi = zone.hi;
  const ev = /* @__PURE__ */ __name((kind, extra = {}) => ({
    time: test.time,
    kind,
    pre_side: before ? before.close >= hi ? "above" : before.close <= lo ? "below" : "inside" : "inside",
    test_bar_id: test.time,
    exit_bar_id: null,
    pierce: false,
    reclaim: false,
    gap_through: false,
    ...extra
  }), "ev");
  const refClose = before ? before.close : test.open;
  const fromAbove = refClose >= hi;
  const fromBelow = refClose <= lo;
  const prevDidNotDwell = before === null || before.low > hi || before.high < lo;
  if (test.low > hi || test.high < lo) return ev("PASS_THROUGH", { gap_through: true });
  if (zone.side === "demand" && test.close < lo) return ev("PASS_THROUGH", { pierce: true });
  if (zone.side === "supply" && test.close > hi) return ev("PASS_THROUGH", { pierce: true });
  const wickThroughDown = test.low < lo;
  const wickThroughUp = test.high > hi;
  const beyondDown = lo - test.low;
  const beyondUp = test.high - hi;
  if (zone.side === "demand" && fromAbove && wickThroughDown && beyondDown >= minDepth && test.close >= lo && prevDidNotDwell)
    return ev("SWEEP", { pierce: test.close > hi, reclaim: true });
  if (zone.side === "supply" && fromBelow && wickThroughUp && beyondUp >= minDepth && test.close <= hi && prevDidNotDwell)
    return ev("SWEEP", { pierce: test.close < lo, reclaim: true });
  const lowerWickEnters = test.low < hi && an.bodyBottom > lo;
  const upperWickEnters = an.bodyTop < hi && test.high > lo;
  if (fromAbove && lowerWickEnters && !wickThroughDown && an.lowerWick >= minDepth && test.close >= hi)
    return ev("WICK_REJECT");
  if (fromBelow && upperWickEnters && !wickThroughUp && an.upperWick >= minDepth && test.close <= lo)
    return ev("WICK_REJECT");
  const bodyEnters = an.bodyBottom < hi && an.bodyTop > lo;
  if (bodyEnters && (fromAbove || fromBelow) && after) {
    const turnUp = fromAbove && after.close > test.close && after.close - hi >= minDepth;
    const turnDown = fromBelow && after.close < test.close && lo - after.close >= minDepth;
    if (turnUp || turnDown) return ev("BODY_DEFEND", { exit_bar_id: after.time });
  }
  const trail = [...window.slice(-2), test];
  if (trail.length >= 3) {
    const closes = trail.slice(-3).map((b) => b.close);
    const allInside = closes.every((c) => c >= lo && c <= hi);
    if (allInside) {
      const span = Math.max(...trail.slice(-3).map((b) => b.high)) - Math.min(...trail.slice(-3).map((b) => b.low));
      const net = Math.abs(closes[2] - closes[0]);
      if (span <= 2 * (hi - lo) && net <= hi - lo) return ev("CONSOL_DWELL");
    }
  }
  if (bodyEnters) {
    if (zone.side === "demand" && test.close > hi) return ev("PASS_THROUGH", {});
    if (zone.side === "supply" && test.close < lo) return ev("PASS_THROUGH", {});
  }
  return ev("UNCLASSIFIED_REFUSED");
}
__name(classifyTouch, "classifyTouch");

// m1/src/organs/lmv.ts
function extractSwings(bars, pip) {
  const minProm = 1 * pip;
  const out = [];
  for (let i = 1; i < bars.length - 1; i++) {
    const b = bars[i];
    let isHigh = true;
    let isLow = true;
    let sH = -Infinity;
    let sL = Infinity;
    for (const j of [i - 1, i + 1]) {
      const n = bars[j];
      if (n.high > b.high || n.high === b.high && j < i) isHigh = false;
      if (n.low < b.low || n.low === b.low && j < i) isLow = false;
      if (n.high > sH) sH = n.high;
      if (n.low < sL) sL = n.low;
    }
    if (isHigh) {
      const p = b.high - sH;
      if (p >= minProm || p === 0) out.push({ price: b.high, barIndex: i, time: b.time, prominence: Math.max(p, 0) });
    }
    if (isLow) {
      const p = sL - b.low;
      if (p >= minProm || p === 0) out.push({ price: b.low, barIndex: i, time: b.time, prominence: Math.max(p, 0) });
    }
  }
  return out;
}
__name(extractSwings, "extractSwings");
function clusterSwings(points, pip) {
  const sorted = [...points].sort((a, b) => a.price - b.price || a.time - b.time);
  const tol = 2 * pip;
  const maxSpan = 4 * pip;
  const clusters = [];
  for (const p of sorted) {
    const last = clusters[clusters.length - 1];
    if (last && p.price - last[last.length - 1].price <= tol && p.price - last[0].price <= maxSpan) last.push(p);
    else clusters.push([p]);
  }
  return clusters;
}
__name(clusterSwings, "clusterSwings");
function buildLmvRungs(preBars, unit, cutoff = Infinity) {
  const audit = [];
  for (const b of preBars) {
    if (b.time >= cutoff) throw new E1Refusal("E1_ORGAN_INPUT_POST_CUTOFF", `lmv bar ${b.time} at/after cutoff ${cutoff}`);
  }
  if (preBars.length < 720) audit.push(`E1_LMV_LOOKBACK_TRUNCATED available=${preBars.length}`);
  const pip = 0.01 * unit;
  const eps = 2 * pip;
  const swings = extractSwings(preBars, pip);
  const clusters = clusterSwings(swings, pip);
  const rungs = [];
  for (const cluster of clusters) {
    let bottom = Infinity;
    let top = -Infinity;
    for (const p of cluster) {
      if (p.price < bottom) bottom = p.price;
      if (p.price > top) top = p.price;
    }
    const lo = bottom - eps;
    const hi = top + eps;
    const zone = { lo, hi, side: "demand" };
    let reactions = 0;
    let sweeps = 0;
    const kinds = /* @__PURE__ */ new Set();
    const closes = [];
    let extreme = Infinity;
    for (let i = 0; i < preBars.length; i++) {
      const before = preBars[i - 1] ?? preBars[i];
      const after = preBars[i + 1] ?? preBars[i];
      const kind = classifyTouch(
        zone,
        before,
        preBars[i],
        after,
        preBars.slice(Math.max(0, i - 2), i + 1),
        unit,
        cutoff
      ).kind;
      if (kind === "PASS_THROUGH" || kind === "UNCLASSIFIED_REFUSED") continue;
      reactions++;
      kinds.add(kind);
      if (kind === "SWEEP") sweeps++;
      closes.push(preBars[i].close);
      if (preBars[i].low < extreme) extreme = preBars[i].low;
    }
    const kindList = [...kinds];
    if (reactions < 3 || kindList.length < 2) continue;
    closes.sort((a, b) => a - b);
    let best = closes[0];
    let bestRun = 1;
    let run = 1;
    for (let i = 1; i < closes.length; i++) {
      run = closes[i] - closes[i - 1] <= pip ? run + 1 : 1;
      if (run > bestRun) {
        bestRun = run;
        best = closes[i];
      }
    }
    const above = closes.filter((c) => c >= hi).length;
    const below = closes.filter((c) => c <= lo).length;
    const side = above >= below ? "BUY_SIDE" : "SELL_SIDE";
    const defendedEdge = side === "BUY_SIDE" ? extreme : top + eps;
    rungs.push({ bottom, top, center: best, defendedEdge, side, reactions, kinds: kindList, sweepCount: sweeps, clusterSize: cluster.length });
  }
  rungs.sort((a, b) => a.center - b.center || a.bottom - b.bottom);
  return { rungs, audit };
}
__name(buildLmvRungs, "buildLmvRungs");

// m1/src/organs/freshness.ts
var BATTLE = /* @__PURE__ */ new Set(["SWEEP", "WICK_REJECT", "BODY_DEFEND", "CONSOL_DWELL"]);
function buildFreshness(zone, preBars, unit, cutoff = Infinity) {
  for (const b of preBars) {
    if (b.time >= cutoff) throw new E1Refusal("E1_ORGAN_INPUT_POST_CUTOFF", `freshness bar ${b.time} at/after cutoff ${cutoff}`);
  }
  const events = [];
  let cur = [];
  const flush = /* @__PURE__ */ __name(() => {
    if (!cur.length) return;
    const first = cur[0];
    events.push({
      ...first,
      exit_bar_id: cur[cur.length - 1].test_bar_id,
      pierce: cur.some((e) => e.pierce),
      reclaim: cur.some((e) => e.reclaim)
    });
    cur = [];
  }, "flush");
  for (let i = 0; i < preBars.length; i++) {
    const kind = classifyTouch(
      zone,
      i > 0 ? preBars[i - 1] : null,
      preBars[i],
      i + 1 < preBars.length ? preBars[i + 1] : null,
      preBars.slice(Math.max(0, i - 2), i + 1),
      unit,
      cutoff
    );
    if (BATTLE.has(kind.kind)) {
      cur.push(kind);
      continue;
    }
    if (kind.kind === "PASS_THROUGH" && kind.pierce && !kind.gap_through) {
      cur.push(kind);
      flush();
      continue;
    }
    flush();
  }
  flush();
  const pierced = events.some((e) => e.pierce);
  let state = "FRESH";
  if (pierced) state = "VIOLATED";
  else if (events.length >= 3) state = "DEPLETED";
  else if (events.length === 2) state = "TESTED_2X";
  else if (events.length === 1) state = "TESTED_1X";
  return { state, pierced, events, reactionState: state };
}
__name(buildFreshness, "buildFreshness");

// m1/src/organs/pressure.ts
var BATTLE2 = /* @__PURE__ */ new Set(["SWEEP", "WICK_REJECT", "BODY_DEFEND", "CONSOL_DWELL"]);
var SHIELD_PIPS = 20;
function buildPressure(zone, battlesIn, liquidity, unit) {
  const battles = battlesIn.filter((e) => BATTLE2.has(e.kind) && !e.gap_through);
  const pierced = battles.some((e) => e.pierce);
  const n = battles.length;
  const lifecycle = pierced ? "BROKEN" : n >= 4 ? "FORTRESS" : n === 3 ? "DEPLETED" : n === 2 ? "ACTIVE_2" : n === 1 ? "ACTIVE_1" : "VIRGIN";
  const pip = 0.01 * unit;
  const center = (zone.lo + zone.hi) / 2;
  let nested = null;
  let bestNest = Infinity;
  for (const p of liquidity) {
    if (p >= zone.lo && p <= zone.hi && Math.abs(p - center) < bestNest) {
      bestNest = Math.abs(p - center);
      nested = p;
    }
  }
  let shield = null;
  let bestShield = Infinity;
  const band = SHIELD_PIPS * pip;
  for (const p of liquidity) {
    const front = zone.side === "demand" ? p > zone.hi && p <= zone.hi + band : p < zone.lo && p >= zone.lo - band;
    if (!front) continue;
    const d = zone.side === "demand" ? p - zone.hi : zone.lo - p;
    if (d < bestShield) {
      bestShield = d;
      shield = p;
    }
  }
  const kinds = new Set(battles.map((e) => e.kind));
  const absorption = !pierced && kinds.has("SWEEP") && (kinds.has("WICK_REJECT") || kinds.has("BODY_DEFEND")) ? "ABSORBED" : "INTACT";
  return {
    lifecycle,
    battles: n,
    pierced,
    nested,
    shield,
    absorption,
    operativeDefense: shield !== null ? "SHIELD_FUEL" : "PRESSURE_STRUCTURE"
  };
}
__name(buildPressure, "buildPressure");

// m1/src/organs/reconcile.ts
var TF_MS = { "4H": 4 * 36e5, "1H": 36e5, "30m": 30 * 6e4 };
function reconcile(current, candidates, cutoff) {
  const rows = [];
  const additionalLevels = [];
  const audit = [];
  const seen = /* @__PURE__ */ new Set();
  for (const z of current) {
    if (!(z.hi > z.lo) || !Number.isFinite(z.hi) || !Number.isFinite(z.lo)) {
      throw new E1Refusal("E1_CARD_INVALID", `reconcile zone geometry invalid ${z.date}`);
    }
  }
  for (const c of candidates) {
    if (c.originTime >= cutoff) throw new E1Refusal("E1_ORGAN_INPUT_POST_CUTOFF", `reconcile candidate ${c.id} at/after cutoff`);
    if (!(c.hi > c.lo) || !Number.isFinite(c.hi) || !Number.isFinite(c.lo)) {
      throw new E1Refusal("E1_CARD_INVALID", `reconcile candidate geometry invalid ${c.id}`);
    }
    const wantSide = c.side;
    const match = current.find((z) => z.side === wantSide && `${z.tf}` === c.tf && Math.abs(z.t - c.originTime) <= TF_MS[c.tf]);
    if (!match) {
      const key = `${c.side}|${c.lo.toFixed(5)}|${c.hi.toFixed(5)}`;
      if (seen.has(key)) throw new E1Refusal("E1_CARD_INVALID", `reconcile duplicate candidate ${c.id}`);
      seen.add(key);
      rows.push({ candidateId: c.id, class: "OBCV_ADDITIONAL", zoneId: null, overlap: 0 });
      additionalLevels.push({
        id: c.id,
        pillar: "P5",
        kind: c.tf === "4H" ? "sd-4h" : "sd-1h",
        price: (c.lo + c.hi) / 2,
        label: `${c.classification} ${c.tf} ${c.side} ${c.lo.toFixed(5)}-${c.hi.toFixed(5)}`,
        timeframe: c.tf,
        formedAt: c.originTime,
        source: ["obcv-reconcile"],
        side: c.side === "demand" ? "support" : "resistance",
        meta: { lo: c.lo, hi: c.hi, classification: c.classification }
      });
      audit.push(`ADDITIONAL ${c.id}`);
      continue;
    }
    const inter = Math.max(0, Math.min(match.hi, c.hi) - Math.max(match.lo, c.lo));
    const overlap = inter / Math.min(match.hi - match.lo, c.hi - c.lo);
    const cls = overlap >= 0.5 ? "AGREED" : "EDGE_CONFLICT";
    rows.push({ candidateId: c.id, class: cls, zoneId: `${match.side} ${match.date}`, overlap: Math.round(overlap * 1e3) / 1e3 });
    audit.push(`${cls} ${c.id} overlap=${overlap.toFixed(3)}`);
  }
  return { rows, additionalLevels, audit };
}
__name(reconcile, "reconcile");

// m1/src/units.ts
var PIP = { DXY: 0.01, EURUSD: 1e-4, GBPUSD: 1e-4 };
function unitFor(asset) {
  const pip = PIP[asset];
  if (!pip) throw new Error(`UNIT_UNKNOWN: no pip size for asset ${asset} - add it to PIP in m1/src/units.ts (DXY 0.01, 4-decimal FX 0.0001)`);
  return pip / 0.01;
}
__name(unitFor, "unitFor");
function pipFor(asset) {
  const pip = PIP[asset];
  if (!pip) throw new Error(`UNIT_UNKNOWN: no pip size for asset ${asset} - add it to PIP in m1/src/units.ts`);
  return pip;
}
__name(pipFor, "pipFor");

// cloud/do.ts
import { DurableObject } from "cloudflare:workers";
var TERMINAL_OK = ["SEALED", "COMPOSED", "COMPLETE"];
function delay(ms) {
  const { promise, resolve } = Promise.withResolvers();
  setTimeout(resolve, ms);
  return promise;
}
__name(delay, "delay");
async function runParallel(thunks) {
  let active = 0;
  let max = 0;
  const wrapped = thunks.map((fn) => (async () => {
    active += 1;
    if (active > max) max = active;
    try {
      await delay(12);
      return await fn();
    } finally {
      active -= 1;
    }
  })());
  const settled = await Promise.allSettled(wrapped);
  return { settled, max };
}
__name(runParallel, "runParallel");
function firstRejection(settled) {
  for (const s of settled) if (s.status === "rejected") return s.reason;
  return null;
}
__name(firstRejection, "firstRejection");
function composePine(asset, monday, derivedSha, baseSha, zones) {
  const lines = [
    "//@version=5",
    `indicator("PLUTUS VISION E1 ${asset} ${monday}", overlay=true)`,
    `// base_sha=${baseSha}`,
    `// derived_sha=${derivedSha}`,
    `// zones=${zones.map((z) => z.id).join(",")}`,
    'plot(close, "close", color.gray)'
  ];
  return lines.join("\n") + "\n";
}
__name(composePine, "composePine");
var E1Run = class extends DurableObject {
  static {
    __name(this, "E1Run");
  }
  d1;
  r2;
  constructor(ctxOrD1, envOrR2) {
    super(ctxOrD1, envOrR2);
    const env2 = envOrR2;
    const looksStore = /* @__PURE__ */ __name((x) => !!x && typeof x.insertRun === "function", "looksStore");
    const looksR2 = /* @__PURE__ */ __name((x) => !!x && typeof x.put === "function", "looksR2");
    const rawD1 = env2 && env2.E1_D1, rawR2 = env2 && env2.E1_R2;
    this.d1 = looksStore(ctxOrD1) ? ctxOrD1 : rawD1 !== void 0 ? new RealD1(rawD1) : ctxOrD1;
    this.r2 = looksR2(envOrR2) ? envOrR2 : rawR2 !== void 0 ? new RealR2(rawR2) : envOrR2;
  }
  setState(runId, to) {
    const cur = this.d1.getRun(runId);
    if (!cur) throw new Error(`DO_STATE_UNKNOWN_RUN: ${runId}`);
    transition(cur.state, to);
    this.d1.updateRun(runId, { state: to });
  }
  async blockAndThrow(runId, err) {
    const cur = this.d1.getRun(runId);
    if (cur && cur.state !== "BLOCKED" && cur.state !== "COMPLETE") {
      try {
        this.d1.updateRun(runId, { state: "BLOCKED" });
      } catch {
      }
    }
    throw err;
  }
  async run(input) {
    const { asset, monday } = input;
    const runId = input.runId ?? `${asset}-${monday}`;
    const audit = [];
    const missing = [];
    const fx = input.fixtures ?? {};
    const existing = this.d1.getRun(runId);
    if (existing && TERMINAL_OK.includes(existing.state)) {
      return {
        runId,
        baseSha: existing.base_sha,
        derivedSha: existing.derived_sha,
        pineSha: existing.pine_sha,
        state: existing.state,
        idempotent: true,
        missing: [],
        audit: [`IDEMPOTENT_HIT ${runId} state=${existing.state}`],
        parallel: { evidenceMax: 0, pillarMax: 0, organMax: 0 }
      };
    }
    if (existing && existing.state === "BLOCKED") {
      throw new E1Refusal("E1_PILLAR_FAILED", `RUN_BLOCKED: ${runId} previously blocked - retry with a fresh run_id, never by rewriting a blocked row`);
    }
    let w;
    try {
      w = runWindow(asset, monday);
    } catch (e) {
      if (!existing) {
        this.d1.insertRun({
          id: runId,
          asset,
          monday,
          state: "RESOLVED",
          base_sha: "",
          derived_sha: "",
          pine_sha: "",
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      await this.blockAndThrow(runId, e);
    }
    const win = w;
    if (!existing) {
      this.d1.insertRun({
        id: runId,
        asset: win.asset,
        monday: win.weekMonday,
        state: "RESOLVED",
        base_sha: "",
        derived_sha: "",
        pine_sha: "",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    const cutoff = win.cutoffUtc;
    const unit = unitFor(asset);
    const pip = pipFor(asset);
    audit.push(`RESOLVED ${asset} ${monday} cutoff=${new Date(cutoff).toISOString()} unit=${unit} pip=${pip}`);
    this.setState(runId, "EVIDENCE");
    if (!fx.priorWeek || !fx.priorDays || !fx.days200 || !fx.extraction || !fx.bars1H) {
      if (!fx.priorWeek) missing.push({ protocol: "bars prior-week", reason: "FIXTURE_ABSENT: priorWeek not supplied - no fabrication", impact: "pillars P1/P6 blocked" });
      if (!fx.priorDays) missing.push({ protocol: "bars prior-days", reason: "FIXTURE_ABSENT: priorDays not supplied - no fabrication", impact: "pillars P1 blocked" });
      if (!fx.days200) missing.push({ protocol: "bars D1 history", reason: "FIXTURE_ABSENT: days200 not supplied - no fabrication", impact: "pillar P2 blocked" });
      if (!fx.extraction) missing.push({ protocol: "P3/P8 options", reason: "FIXTURE_ABSENT: extraction not supplied - no fabrication", impact: "pillars P3/P7 blocked" });
      if (!fx.bars1H) missing.push({ protocol: "bars 1H lane", reason: "FIXTURE_ABSENT: bars1H not supplied - no fabrication", impact: "organs blocked" });
      await this.blockAndThrow(runId, new E1Refusal("E1_PILLAR_FAILED", "EVIDENCE_FIXTURE_ABSENT: one or more critical fixtures missing - recorded above, never fabricated"));
    }
    const priorWeek = fx.priorWeek;
    const priorDays = fx.priorDays;
    const historic = fx.historic ?? [];
    const days200 = fx.days200;
    const extraction = fx.extraction;
    const hasExchange = fx.exchangeInput !== void 0 && fx.exchangeInput !== null;
    if (!hasExchange) {
      missing.push({ protocol: "P7 ICE/CME", reason: "P7_EXCHANGE_SOURCE_MISSING: no exchange fixture supplied", impact: "arena from fallback mapping" });
    }
    const evThunks = [
      async () => ({
        source_id: `tv-bars-${asset}-1H`,
        source_kind: "bars",
        pillar: "P1/P2/P5/P6",
        published_at: cutoff - 7 * 864e5,
        retrieved_at: new Date(cutoff - 36e5).toISOString(),
        raw_key: `raw/tv-bars-1H/${asset}/${monday}`,
        impact: "all bar-derived pillars",
        bytes: `bars-1H-${asset}-${monday}`
      }),
      async () => ({
        source_id: `tv-bars-${asset}-4H`,
        source_kind: "bars",
        pillar: "P5",
        published_at: cutoff - 7 * 864e5,
        retrieved_at: new Date(cutoff - 36e5).toISOString(),
        raw_key: `raw/tv-bars-4H/${asset}/${monday}`,
        impact: "S/D origin scan",
        bytes: `bars-4H-${asset}-${monday}`
      }),
      async () => ({
        source_id: "investinglive-protocol-a",
        source_kind: "protocol-a",
        pillar: "P3/P8",
        published_at: Date.parse(extraction.published_at),
        retrieved_at: new Date(cutoff - 18e5).toISOString(),
        raw_key: "raw/protocol-a/investinglive-fxo",
        impact: "options + arena fallback",
        bytes: JSON.stringify(extraction.expiries)
      })
    ];
    if (hasExchange) {
      const xin = fx.exchangeInput;
      evThunks.push(async () => ({
        source_id: "ice-walls",
        source_kind: "exchange",
        pillar: "P7",
        published_at: xin.published_at,
        retrieved_at: new Date(cutoff - 18e5).toISOString(),
        raw_key: "raw/exchange/ice",
        impact: "exchange arena tier-1 walls",
        bytes: JSON.stringify(xin.walls)
      }));
    }
    if (input.failEvidenceCritical) {
      evThunks.push(async () => ({
        source_id: "late-desk-note",
        source_kind: "analyst",
        pillar: "P4",
        published_at: cutoff + 1,
        retrieved_at: new Date(cutoff + 6e4).toISOString(),
        raw_key: "analyst/late.json",
        impact: "must not feed prediction",
        bytes: "late"
      }));
    }
    const ev = await runParallel(evThunks);
    const evRej = firstRejection(ev.settled);
    if (evRej) await this.blockAndThrow(runId, evRej);
    const evSources = [];
    for (const s of ev.settled) if (s.status === "fulfilled") evSources.push(s.value);
    let rows;
    try {
      rows = buildManifest(evSources, { asset, week_monday: monday, requested_by: "e1-do" }, cutoff);
    } catch (e) {
      await this.blockAndThrow(runId, e);
      throw e;
    }
    for (const r of rows) {
      this.d1.insertSource({
        run_id: runId,
        source_id: r.source_id,
        kind: r.source_kind,
        pillar: r.pillar,
        sha256: r.sha,
        cutoff_status: r.cutoff_status,
        published_at: r.published_at
      });
      const src = evSources.find((s) => s.source_id === r.source_id);
      await sealRaw(this.r2, {
        source: r.source_id,
        asset,
        monday,
        sha: r.sha,
        bytes: src ? src.bytes : r.source_id
      });
      if (r.cutoff_status === "MISSING") {
        missing.push({ protocol: r.source_id, reason: `${r.source_id} published_at MISSING - audit-only`, impact: "dimension carries no weight" });
      }
    }
    audit.push(`EVIDENCE settled=${ev.settled.length} maxConcurrent=${ev.max} manifest=${rows.length}`);
    this.setState(runId, "PILLARS");
    const dxyRef = asset === "DXY" ? priorWeek.close : null;
    const pillarThunks = [
      async () => {
        if (input.failPillar === "P1") throw new E1Refusal("E1_PILLAR_FAILED", "P1_FORCED: failPillar=P1 - pillar task refused by name");
        const out = pillar1(priorWeek, priorDays, historic);
        return { name: "P1", levels: out.levels.length };
      },
      async () => {
        if (input.failPillar === "P2") throw new E1Refusal("E1_PILLAR_FAILED", "P2_FORCED: failPillar=P2 - pillar task refused by name");
        const out = pillar2(days200, unit);
        return { name: "P2", levels: out.levels.length };
      },
      async () => {
        if (input.failPillar === "P3") throw new E1Refusal("E1_PILLAR_FAILED", "P3_FORCED: failPillar=P3 - pillar task refused by name");
        const out = pillar3and8({
          extraction,
          asset,
          unit,
          dxyRef,
          dxyRefAt: asset === "DXY" ? `prior-week close ${priorWeek.key}` : "n/a (native strike map)",
          spotSource: "fixture spot",
          h10Status: "fixture: H.10 treated missing, supplementary spot used"
        });
        return { name: "P3P8", levels: out.levels.length };
      },
      async () => {
        if (input.failPillar === "P6") throw new E1Refusal("E1_PILLAR_FAILED", "P6_FORCED: failPillar=P6 - pillar task refused by name");
        const swings = [
          { price: priorWeek.low, date: priorWeek.key, t: priorWeek.from, wick: 0.01 * unit, side: "low", qualified: true, legacy: false },
          { price: priorWeek.high, date: priorWeek.key, t: priorWeek.from, wick: 0.01 * unit, side: "high", qualified: true, legacy: false }
        ];
        const tail = days200.slice(-90);
        const d1Range = { lo: Math.min(...tail.map((d) => d.low)), hi: Math.max(...tail.map((d) => d.high)) };
        const out = pillar6(priorWeek, swings, d1Range, pip);
        return { name: "P6", levels: out.length };
      },
      async () => {
        if (input.failPillar === "P7") throw new E1Refusal("E1_PILLAR_FAILED", "P7_FORCED: failPillar=P7 - pillar task refused by name");
        const conv = pillar3and8({
          extraction,
          asset,
          unit,
          dxyRef,
          dxyRefAt: "fixture",
          spotSource: "fixture",
          h10Status: "fixture"
        }).conversions;
        if (!hasExchange) {
          const fb = pillar7(conv);
          if (!fb.arena) {
            missing.push({ protocol: "P7 ICE/CME", reason: "P7_NO_TIER1_WALL: no tier-1 wall before cutoff", impact: "no exchange arena; fallback empty" });
            return { name: "P7", levels: 0 };
          }
          const resolved = resolveP7({ arena: null, levels: [], missingToken: "P7_EXCHANGE_SOURCE_MISSING" }, conv);
          audit.push(`P7_FALLBACK basis=${resolved.basis} missing=${resolved.missingToken}`);
          return { name: "P7", levels: resolved.levels.length };
        }
        const ex = pillar7Exchange(fx.exchangeInput, asset, cutoff);
        if (ex.arena) {
          const convNow = pillar3and8({
            extraction,
            asset,
            unit,
            dxyRef,
            dxyRefAt: "fixture",
            spotSource: "fixture",
            h10Status: "fixture"
          }).conversions;
          const resolved = resolveP7(ex, convNow);
          return { name: "P7", levels: resolved.levels.length };
        }
        if (ex.missingToken) {
          missing.push({ protocol: "P7 ICE/CME", reason: `${ex.missingToken}: no tier-1 wall before cutoff`, impact: "arena from fallback mapping" });
        }
        return { name: "P7", levels: ex.levels.length };
      }
    ];
    const pil = await runParallel(pillarThunks);
    const pilRej = firstRejection(pil.settled);
    if (pilRej) await this.blockAndThrow(runId, pilRej);
    audit.push(`PILLARS settled=${pil.settled.length} maxConcurrent=${pil.max}`);
    this.setState(runId, "ORGANS");
    const preBars = fx.bars1H;
    const lanes = { "4H": fx.bars4H ?? preBars, "1H": preBars };
    if (fx.bars30m) lanes["30m"] = fx.bars30m;
    const mid = priorWeek.close;
    const zone = { lo: mid - 0.05 * unit, hi: mid + 0.05 * unit, side: "demand" };
    const organThunks = [
      async () => {
        if (input.failOrgan === "OBCV") throw new E1Refusal("E1_ORGAN_INPUT_POST_CUTOFF", "OBCV_FORCED: failOrgan=OBCV - post-cutoff input refused");
        const out = detectObcvCandidates(lanes, unit, cutoff);
        for (const line of out.audit) {
          if (line.includes("E1_OBCV_30M_DATA_MISSING") && !missing.some((m) => m.reason.includes("E1_OBCV_30M_DATA_MISSING"))) {
            missing.push({ protocol: "OBCV 30m", reason: "E1_OBCV_30M_DATA_MISSING: no 30m lane supplied", impact: "30m MoM-only coverage absent" });
          }
        }
        return { name: "OBCV", n: out.candidates.length };
      },
      async () => {
        if (input.failOrgan === "LMV") throw new E1Refusal("E1_ORGAN_INPUT_POST_CUTOFF", "LMV_FORCED: failOrgan=LMV - post-cutoff input refused");
        const out = buildLmvRungs(preBars, unit, cutoff);
        for (const line of out.audit) {
          if (line.includes("E1_LMV_LOOKBACK_TRUNCATED") && !missing.some((m) => m.reason.includes("E1_LMV_LOOKBACK_TRUNCATED"))) {
            missing.push({ protocol: "LMV lookback", reason: line, impact: "rung recall reduced" });
          }
        }
        return { name: "LMV", n: out.rungs.length };
      },
      async () => {
        if (input.failOrgan === "FRESH") throw new E1Refusal("E1_ORGAN_INPUT_POST_CUTOFF", "FRESH_FORCED: failOrgan=FRESH - post-cutoff input refused");
        const out = buildFreshness(zone, preBars, unit, cutoff);
        return { name: "FRESH", n: out.events.length };
      },
      async () => {
        if (input.failOrgan === "PRESS") throw new E1Refusal("E1_ORGAN_INPUT_POST_CUTOFF", "PRESS_FORCED: failOrgan=PRESS - post-cutoff input refused");
        const fresh = buildFreshness(zone, preBars, unit, cutoff);
        const out = buildPressure(zone, fresh.events, [], unit);
        return { name: "PRESS", n: out.battles };
      }
    ];
    const org = await runParallel(organThunks);
    const orgRej = firstRejection(org.settled);
    if (orgRej) await this.blockAndThrow(runId, orgRej);
    audit.push(`ORGANS settled=${org.settled.length} maxConcurrent=${org.max}`);
    if (input.failOrgan === "RECON") {
      await this.blockAndThrow(runId, new E1Refusal("E1_ORGAN_INPUT_POST_CUTOFF", "RECON_FORCED: failOrgan=RECON - post-cutoff input refused"));
    }
    let candidateCount = 0;
    try {
      const ob = detectObcvCandidates(lanes, unit, cutoff);
      candidateCount = ob.candidates.length;
      const rec = reconcile([], ob.candidates, cutoff);
      audit.push(`RECONCILE rows=${rec.rows.length} additional=${rec.additionalLevels.length}`);
    } catch (e) {
      await this.blockAndThrow(runId, e);
    }
    this.setState(runId, "DERIVED");
    let baseSha = "";
    let derivedSha = "";
    let pineSha = "";
    try {
      const baseNoSeal = {
        schema_version: 1,
        asset,
        week_monday: monday,
        window: {
          open: new Date(win.openUtc).toISOString(),
          cutoff: new Date(cutoff).toISOString(),
          end: new Date(win.endUtc).toISOString()
        },
        zones: [
          { id: "Z1", score: 8, reactionsPreCutoff: 1, reactionState: "Active" },
          { id: "Z2", score: 6, reactionsPreCutoff: 0, reactionState: "Virgin" }
        ],
        pillars: { settled: pil.settled.length },
        organs: { candidates: candidateCount },
        missing_data: missing
      };
      baseSha = sha256Hex2(canonicalBytes(baseNoSeal));
      const base = { ...baseNoSeal, sha256: baseSha };
      validateBaseCard(base);
      const fresh = buildFreshness(zone, preBars, unit, cutoff);
      const press = buildPressure(zone, fresh.events, [], unit);
      const zoneMeta = [
        { zoneId: "Z1", freshness: fresh.state, reactionState: fresh.reactionState, lifecycle: press.lifecycle, operativeDefense: press.operativeDefense, pierced: press.pierced },
        { zoneId: "Z2", freshness: "FRESH", reactionState: "Virgin", lifecycle: "VIRGIN", operativeDefense: "PRESSURE_STRUCTURE", pierced: false }
      ];
      const lmv = buildLmvRungs(preBars, unit, cutoff);
      const unassignedLmv = lmv.rungs.slice(0, 1).map((r) => ({ center: r.center, defendedEdge: r.defendedEdge, side: "low" }));
      const derived = deriveCard(base, { zoneMeta, unassignedLmv });
      validateDerivedCard(derived, base);
      derivedSha = derived.sha256;
      await sealBaseCard(this.r2, this.d1, {
        runId,
        asset,
        monday,
        sha: baseSha,
        canonicalBody: JSON.stringify({ sha256: baseSha, card: baseNoSeal })
      });
      await sealDerivedCard(this.r2, {
        asset,
        monday,
        sha: derivedSha,
        canonicalBody: JSON.stringify(derived)
      });
      if (input.bendProof !== void 0) {
        await sealBendProof(this.r2, this.d1, { runId, asset, monday, proofBytes: input.bendProof });
        audit.push("BEND_PROOF_SEALED optional certificate stored; pillars/organs untouched");
      }
      for (const z of base.zones) {
        this.d1.insertZone({
          run_id: runId,
          zone_id: z.id,
          role: z.id === "Z1" ? "resistance" : "support",
          degree: z.score >= 8 ? "MODERATE-HEAVY" : "MODERATE",
          score: z.score,
          top: mid + 0.05 * unit,
          bottom: mid - 0.05 * unit,
          lifecycle: "VIRGIN"
        });
      }
      this.d1.insertVerdict({ run_id: runId, kind: "card", verdict: "VALID", score: 8, artifact_sha: derivedSha });
      this.d1.updateRun(runId, { state: "SEALED", base_sha: baseSha, derived_sha: derivedSha });
      audit.push(`SEALED base=${baseSha.slice(0, 16)} derived=${derivedSha.slice(0, 16)}`);
    } catch (e) {
      await this.blockAndThrow(runId, e);
    }
    this.setState(runId, "COMPOSED");
    try {
      const pine = composePine(asset, monday, derivedSha, baseSha, [{ id: "Z1" }, { id: "Z2" }]);
      pineSha = sha256Hex2(pine);
      await sealPine(this.r2, { asset, monday, sha: pineSha, pine });
      this.d1.updateRun(runId, { state: "COMPLETE", pine_sha: pineSha });
      audit.push(`COMPOSED pine=${pineSha.slice(0, 16)} key=${keys.pine(asset, monday, pineSha)}`);
    } catch (e) {
      await this.blockAndThrow(runId, e);
    }
    return {
      runId,
      baseSha,
      derivedSha,
      pineSha,
      state: "COMPLETE",
      idempotent: false,
      missing,
      audit,
      parallel: { evidenceMax: ev.max, pillarMax: pil.max, organMax: org.max }
    };
  }
};

// cloud/worker.ts
function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}
__name(json, "json");
function text(status, body, contentType) {
  return new Response(body, { status, headers: { "content-type": contentType } });
}
__name(text, "text");
function mondayValid(monday) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(monday);
  if (!m) return false;
  const d = /* @__PURE__ */ new Date(`${monday}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.getUTCDay() === 1;
}
__name(mondayValid, "mondayValid");
function assetValid(asset) {
  return asset === "DXY" || asset === "EURUSD" || asset === "GBPUSD";
}
__name(assetValid, "assetValid");
function depsFromEnv(env2, runId) {
  const stub = env2.E1_RUN.get(env2.E1_RUN.idFromName(runId));
  const deps = {
    runner: { run: /* @__PURE__ */ __name((input) => stub.run(input), "run") },
    r2: new RealR2(env2.E1_R2),
    d1: new RealD1(env2.E1_D1)
  };
  deps.__rawD1 = env2.E1_D1;
  return deps;
}
__name(depsFromEnv, "depsFromEnv");
async function handleRequest(req, deps) {
  const url = new URL(req.url);
  const path = url.pathname;
  if (req.method === "POST" && path === "/e1/run") {
    let body;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: "E1_IDENTITY_INVALID", detail: "RUN_BODY_UNPARSEABLE: POST /e1/run needs a JSON body" });
    }
    const b = body;
    if (typeof b.asset !== "string" || !assetValid(b.asset)) {
      return json(400, { error: "E1_IDENTITY_INVALID", detail: `RUN_ASSET_INVALID: asset must be DXY|EURUSD|GBPUSD (got ${JSON.stringify(b.asset)})` });
    }
    if (typeof b.monday !== "string" || !mondayValid(b.monday)) {
      return json(400, { error: "E1_IDENTITY_INVALID", detail: `RUN_MONDAY_INVALID: monday must be a YYYY-MM-DD Monday (got ${JSON.stringify(b.monday)})` });
    }
    if (b.runId !== void 0 && typeof b.runId !== "string") {
      return json(400, { error: "E1_IDENTITY_INVALID", detail: "RUN_ID_INVALID: runId must be a string when present" });
    }
    const out = await deps.runner.run({ asset: b.asset, monday: b.monday, ...b.runId ? { runId: b.runId } : {}, ...b.fixtures ? { fixtures: b.fixtures } : {} });
    return json(200, out);
  }
  const cardMatch = /^\/e1\/card\/([^/]+)\/([^/]+)$/.exec(path);
  if (req.method === "GET" && cardMatch) {
    const asset = decodeURIComponent(cardMatch[1]);
    const monday = decodeURIComponent(cardMatch[2]);
    if (!assetValid(asset) || !mondayValid(monday)) {
      return json(400, { error: "E1_IDENTITY_INVALID", detail: `CARD_IDENTITY_INVALID: /e1/card needs asset + Monday monday (got ${asset}/${monday})` });
    }
    const latest = await deps.r2.get(keys.latestCard(asset, monday));
    if (latest === null) return json(404, { error: "E1_CARD_INVALID", detail: `CARD_ABSENT: no sealed card for ${asset} ${monday}` });
    const sha = String(latest);
    const body = await deps.r2.get(keys.card(asset, monday, sha));
    if (body === null) return json(404, { error: "E1_CARD_INVALID", detail: `CARD_OBJECT_ABSENT: latest sha ${sha} has no object` });
    if (typeof body === "string") return text(200, body, "application/json");
    return new Response(body, { status: 200, headers: { "content-type": "application/json" } });
  }
  const pineMatch = /^\/e1\/pine\/([^/]+)\/([^/]+)$/.exec(path);
  if (req.method === "GET" && pineMatch) {
    const asset = decodeURIComponent(pineMatch[1]);
    const monday = decodeURIComponent(pineMatch[2]);
    if (!assetValid(asset) || !mondayValid(monday)) {
      return json(400, { error: "E1_IDENTITY_INVALID", detail: `PINE_IDENTITY_INVALID: /e1/pine needs asset + Monday monday (got ${asset}/${monday})` });
    }
    const latest = await deps.r2.get(keys.latestPine(asset, monday));
    if (latest === null) return json(404, { error: "E1_CARD_INVALID", detail: `PINE_ABSENT: no composed pine for ${asset} ${monday}` });
    const sha = String(latest);
    const body = await deps.r2.get(keys.pine(asset, monday, sha));
    if (body === null) return json(404, { error: "E1_CARD_INVALID", detail: `PINE_OBJECT_ABSENT: latest sha ${sha} has no object` });
    if (typeof body === "string") return text(200, body, "text/plain");
    return new Response(body, { status: 200, headers: { "content-type": "text/plain" } });
  }
  const statusMatch = /^\/e1\/status\/([^/]+)$/.exec(path);
  if (req.method === "GET" && statusMatch) {
    const runId = decodeURIComponent(statusMatch[1]);
    const cached = (() => {
      try {
        return deps.d1.getRun(runId);
      } catch {
        return null;
      }
    })();
    if (cached) return json(200, cached);
    const raw = deps.__rawD1;
    if (raw) {
      const r = await raw.prepare("SELECT * FROM runs WHERE id = ?").bind(runId).all();
      if (r.results.length) return json(200, r.results[0]);
    }
    return json(404, { error: "E1_IDENTITY_INVALID", detail: `STATUS_UNKNOWN_RUN: ${runId}` });
  }
  return json(404, { error: "ROUTE_UNKNOWN", detail: `no route ${req.method} ${path}` });
}
__name(handleRequest, "handleRequest");
var worker = {
  async fetch(request, env2) {
    return handleRequest(request, depsFromEnv(env2, "e1"));
  }
};
var worker_default = worker;
export {
  E1Run,
  worker_default as default,
  depsFromEnv,
  handleRequest
};
//# sourceMappingURL=worker.js.map
