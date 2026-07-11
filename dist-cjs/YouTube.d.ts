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
/**
 * A JavaScript Error thrown for every failure surfaced from the Python
 * execution engine. Raw Python tracebacks are never exposed to the caller.
 */
export declare class YTEngineError extends Error {
    readonly code: string;
    constructor(message: string, code: string);
}
/**
 * YouTube is the entire public SDK. It hides Python, child_process.spawn(),
 * JSON communication, and routing behind a clean, cached, object-oriented API.
 */
export declare class YouTube {
    private readonly url;
    private cachedInfo;
    private pythonExecutable;
    constructor(url: string);
    /** Fetches and caches video metadata. Subsequent calls return the cached copy. */
    getInfo(): Promise<VideoInfo>;
    /** Lists all available streams (progressive and adaptive, video and audio). */
    getStreams(): Promise<StreamInfo[]>;
    /** Advanced download with explicit stream selection via itag. */
    download(options: DownloadOptions): Promise<DownloadResult>;
    /** Convenience method: downloads the best available video quality (720p -> 480p -> 360p -> highest). */
    downloadVideo(outputDir?: string): Promise<DownloadResult>;
    /** Convenience method: downloads the highest quality audio-only stream. */
    downloadAudio(outputDir?: string): Promise<DownloadResult>;
    private ensureInfoCached;
    get title(): string;
    get author(): string;
    get description(): string;
    get thumbnail(): string;
    get views(): number;
    get duration(): number;
    get publishDate(): string | null;
    get channel(): string;
    /**
     * Private bridge: spawns the Python process, sends the action + payload,
     * parses JSON from stdout, and either resolves the data or throws a
     * YTEngineError. This is the single point of contact with Python.
     */
    private callBridge;
    private resolvePython;
    private checkExecutable;
}
//# sourceMappingURL=YouTube.d.ts.map