"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.YouTube = exports.YTEngineError = void 0;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const url_1 = require("url");
const sourceFile = typeof __filename !== "undefined"
    ? __filename
    // @ts-ignore
    : (0, url_1.fileURLToPath)("");
const sourceDir = typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(sourceFile);
/**
 * A JavaScript Error thrown for every failure surfaced from the Python
 * execution engine. Raw Python tracebacks are never exposed to the caller.
 */
class YTEngineError extends Error {
    constructor(message, code) {
        super(message);
        this.name = "YTEngineError";
        this.code = code;
        Object.setPrototypeOf(this, YTEngineError.prototype);
    }
}
exports.YTEngineError = YTEngineError;
const YOUTUBE_URL_PATTERN = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]+/i;
const venvPython = process.platform === "win32"
    ? path.join(sourceDir, "..", ".venv", "Scripts", "python.exe")
    : path.join(sourceDir, "..", ".venv", "bin", "python");
const PYTHON_CANDIDATES = [
    venvPython,
    ...(process.platform === "win32" ? ["python", "python3"] : ["python3", "python"]),
];
/**
 * YouTube is the entire public SDK. It hides Python, child_process.spawn(),
 * JSON communication, and routing behind a clean, cached, object-oriented API.
 */
class YouTube {
    constructor(url) {
        this.cachedInfo = null;
        this.pythonExecutable = null;
        if (!url || typeof url !== "string") {
            throw new YTEngineError(`Invalid YouTube URL: ${url}`, "INVALID_URL");
        }
        if (!YOUTUBE_URL_PATTERN.test(url.trim())) {
            throw new YTEngineError(`Invalid YouTube URL: ${url}`, "INVALID_URL");
        }
        this.url = url.trim();
    }
    /** Fetches and caches video metadata. Subsequent calls return the cached copy. */
    async getInfo() {
        if (this.cachedInfo) {
            return this.cachedInfo;
        }
        const info = await this.callBridge("getInfo", {});
        this.cachedInfo = info;
        return info;
    }
    /** Lists all available streams (progressive and adaptive, video and audio). */
    async getStreams() {
        return this.callBridge("getStreams", {});
    }
    /** Advanced download with explicit stream selection via itag. */
    async download(options) {
        if (options.itag === undefined) {
            throw new YTEngineError("download() requires an itag option", "MISSING_ITAG");
        }
        return this.callBridge("download", { mode: "custom", ...options });
    }
    /** Convenience method: downloads the best available video quality (720p -> 480p -> 360p -> highest). */
    async downloadVideo(outputDir) {
        return this.callBridge("download", { mode: "video", outputDir });
    }
    /** Convenience method: downloads the highest quality audio-only stream. */
    async downloadAudio(outputDir) {
        return this.callBridge("download", { mode: "audio", outputDir });
    }
    ensureInfoCached(prop) {
        if (!this.cachedInfo) {
            throw new YTEngineError(`Cannot read "${prop}" before getInfo() has been called. Call "await yt.getInfo()" first.`, "INFO_NOT_LOADED");
        }
    }
    get title() {
        this.ensureInfoCached("title");
        return this.cachedInfo.title;
    }
    get author() {
        this.ensureInfoCached("author");
        return this.cachedInfo.author;
    }
    get description() {
        this.ensureInfoCached("description");
        return this.cachedInfo.description;
    }
    get thumbnail() {
        this.ensureInfoCached("thumbnail");
        return this.cachedInfo.thumbnail;
    }
    get views() {
        this.ensureInfoCached("views");
        return this.cachedInfo.views;
    }
    get duration() {
        this.ensureInfoCached("duration");
        return this.cachedInfo.duration;
    }
    get publishDate() {
        this.ensureInfoCached("publishDate");
        return this.cachedInfo.publishDate;
    }
    get channel() {
        this.ensureInfoCached("channel");
        return this.cachedInfo.channelId;
    }
    /**
     * Private bridge: spawns the Python process, sends the action + payload,
     * parses JSON from stdout, and either resolves the data or throws a
     * YTEngineError. This is the single point of contact with Python.
     */
    async callBridge(action, options) {
        const executable = await this.resolvePython();
        const bridgePath = path.join(sourceDir, "bridge.py");
        const payload = JSON.stringify({ url: this.url, options });
        if (action === "download") {
            console.log("Downloading...");
        }
        return new Promise((resolve, reject) => {
            const child = (0, child_process_1.spawn)(executable, [bridgePath, action, payload]);
            let stdout = "";
            let stderr = "";
            child.stdout.on("data", (chunk) => {
                stdout += chunk.toString();
            });
            child.stderr.on("data", (chunk) => {
                stderr += chunk.toString();
            });
            child.on("error", (err) => {
                reject(new YTEngineError(`Failed to start Python process: ${err.message}`, "PROCESS_ERROR"));
            });
            child.on("close", () => {
                if (!stdout.trim()) {
                    reject(new YTEngineError(stderr || "No response from Python bridge", "EMPTY_RESPONSE"));
                    return;
                }
                let parsed;
                try {
                    parsed = JSON.parse(stdout.trim());
                }
                catch {
                    reject(new YTEngineError("Failed to parse response from Python bridge", "PARSE_ERROR"));
                    return;
                }
                if (parsed.error) {
                    reject(new YTEngineError(parsed.message, parsed.code));
                    return;
                }
                if (action === "download") {
                    console.log("Download completed");
                }
                resolve(parsed.data);
            });
        });
    }
    async resolvePython() {
        if (this.pythonExecutable) {
            return this.pythonExecutable;
        }
        for (const candidate of PYTHON_CANDIDATES) {
            const available = await this.checkExecutable(candidate);
            if (available) {
                this.pythonExecutable = candidate;
                return candidate;
            }
        }
        throw new YTEngineError("No Python executable found. Please install Python3 and ensure it is on your PATH.", "PYTHON_NOT_FOUND");
    }
    checkExecutable(command) {
        return new Promise((resolve) => {
            const check = (0, child_process_1.spawn)(command, ["--version"]);
            check.on("error", () => resolve(false));
            check.on("close", (code) => resolve(code === 0));
        });
    }
}
exports.YouTube = YouTube;
//# sourceMappingURL=YouTube.cjs.map