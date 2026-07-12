import { spawn } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";

const sourceFile = typeof __filename !== "undefined"
  ? __filename
  // @ts-ignore
  : fileURLToPath(import.meta.url as string);
const sourceDir = typeof __dirname !== "undefined"
  ? __dirname
  : path.dirname(sourceFile);

export interface VideoInfo {
  title: string;
  author: string;
  channelId: string;
  channelUrl: string;
  description: string;
  thumbnail: string;
  views: number;
  duration: number;
  publishDate: string | null;
  keywords: string[];
  rating: number | null;
  videoId: string;
  url: string;
}

export interface StreamInfo {
  itag: number;
  mimeType: string;
  type: string;
  resolution: string | null;
  fps: number | null;
  abr: string | null;
  codecs: string[];
  isProgressive: boolean;
  isAdaptive: boolean;
  filesize: number | null;
}

export interface DownloadOptions {
  itag?: number;
  outputDir?: string;
}

export interface DownloadResult {
  path: string;
  quality: string | null;
  itag: number;
  success: boolean;
}

interface BridgeSuccess<T> {
  error: false;
  data: T;
}

interface BridgeFailure {
  error: true;
  message: string;
  code: string;
}

type BridgeResponse<T> = BridgeSuccess<T> | BridgeFailure;

/**
 * A JavaScript Error thrown for every failure surfaced from the Python
 * execution engine. Raw Python tracebacks are never exposed to the caller.
 */
export class NodeYtApiError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "NodeYtApiError";
    this.code = code;
    Object.setPrototypeOf(this, NodeYtApiError.prototype);
  }
}

const YOUTUBE_URL_PATTERN =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]+/i;

const venvPython =
  process.platform === "win32"
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
export class YouTube {
  private readonly url: string;
  private cachedInfo: VideoInfo | null = null;
  private pythonExecutable: string | null = null;

  constructor(url: string) {
    if (!url || typeof url !== "string") {
      throw new NodeYtApiError(`Invalid YouTube URL: ${url}`, "INVALID_URL");
    }

    if (!YOUTUBE_URL_PATTERN.test(url.trim())) {
      throw new NodeYtApiError(`Invalid YouTube URL: ${url}`, "INVALID_URL");
    }

    this.url = url.trim();
  }

  /** Fetches and caches video metadata. Subsequent calls return the cached copy. */
  public async getInfo(): Promise<VideoInfo> {
    if (this.cachedInfo) {
      return this.cachedInfo;
    }
    const info = await this.callBridge<VideoInfo>("getInfo", {});
    this.cachedInfo = info;
    return info;
  }

  /** Lists all available streams (progressive and adaptive, video and audio). */
  public async getStreams(): Promise<StreamInfo[]> {
    return this.callBridge<StreamInfo[]>("getStreams", {});
  }

  /** Advanced download with explicit stream selection via itag. */
  public async download(options: DownloadOptions): Promise<DownloadResult> {
    if (options.itag === undefined) {
      throw new NodeYtApiError("download() requires an itag option", "MISSING_ITAG");
    }
    return this.callBridge<DownloadResult>("download", { mode: "custom", ...options });
  }

  /** Convenience method: downloads the best available video quality (720p -> 480p -> 360p -> highest). */
  public async downloadVideo(outputDir?: string): Promise<DownloadResult> {
    return this.callBridge<DownloadResult>("download", { mode: "video", outputDir });
  }

  /** Convenience method: downloads the highest quality audio-only stream. */
  public async downloadAudio(outputDir?: string): Promise<DownloadResult> {
    return this.callBridge<DownloadResult>("download", { mode: "audio", outputDir });
  }

  private ensureInfoCached(prop: string): void {
    if (!this.cachedInfo) {
      throw new NodeYtApiError(
        `Cannot read "${prop}" before getInfo() has been called. Call "await yt.getInfo()" first.`,
        "INFO_NOT_LOADED"
      );
    }
  }

  public get title(): string {
    this.ensureInfoCached("title");
    return this.cachedInfo!.title;
  }

  public get author(): string {
    this.ensureInfoCached("author");
    return this.cachedInfo!.author;
  }

  public get description(): string {
    this.ensureInfoCached("description");
    return this.cachedInfo!.description;
  }

  public get thumbnail(): string {
    this.ensureInfoCached("thumbnail");
    return this.cachedInfo!.thumbnail;
  }

  public get views(): number {
    this.ensureInfoCached("views");
    return this.cachedInfo!.views;
  }

  public get duration(): number {
    this.ensureInfoCached("duration");
    return this.cachedInfo!.duration;
  }

  public get publishDate(): string | null {
    this.ensureInfoCached("publishDate");
    return this.cachedInfo!.publishDate;
  }

  public get channel(): string {
    this.ensureInfoCached("channel");
    return this.cachedInfo!.channelId;
  }

  /**
   * Private bridge: spawns the Python process, sends the action + payload,
   * parses JSON from stdout, and either resolves the data or throws a
   * NodeYtApiError. This is the single point of contact with Python.
   */
  private async callBridge<T>(action: string, options: Record<string, unknown>): Promise<T> {
    const executable = await this.resolvePython();
    const bridgePath = path.join(sourceDir, "bridge.py");
    const payload = JSON.stringify({ url: this.url, options });

    if (action === "download") {
      console.log("Downloading...");
    }

    return new Promise<T>((resolve, reject) => {
      const child = spawn(executable, [bridgePath, action, payload]);

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      child.on("error", (err) => {
        reject(new NodeYtApiError(`Failed to start Python process: ${err.message}`, "PROCESS_ERROR"));
      });

      child.on("close", () => {
        if (!stdout.trim()) {
          reject(new NodeYtApiError(stderr || "No response from Python bridge", "EMPTY_RESPONSE"));
          return;
        }

        let parsed: BridgeResponse<T>;
        try {
          parsed = JSON.parse(stdout.trim());
        } catch {
          reject(new NodeYtApiError("Failed to parse response from Python bridge", "PARSE_ERROR"));
          return;
        }

        if (parsed.error) {
          reject(new NodeYtApiError(parsed.message, parsed.code));
          return;
        }

        if (action === "download") {
          console.log("Download completed");
        }

        resolve(parsed.data);
      });
    });
  }

  private async resolvePython(): Promise<string> {
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

    throw new NodeYtApiError(
      "No Python executable found. Please install Python3 and ensure it is on your PATH.",
      "PYTHON_NOT_FOUND"
    );
  }

  private checkExecutable(command: string): Promise<boolean> {
    return new Promise((resolve) => {
      const check = spawn(command, ["--version"]);
      check.on("error", () => resolve(false));
      check.on("close", (code) => resolve(code === 0));
    });
  }
}
