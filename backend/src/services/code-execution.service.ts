import { Buffer } from "node:buffer";
import { setTimeout as delay } from "node:timers/promises";
import { z } from "zod";
import { env } from "../config/env.ts";
import { AppError } from "../lib/errors.ts";
import {
  supportedLanguages,
  type SupportedLanguage,
} from "../lib/languages.ts";

const runCodeSchema = z.object({
  code: z.string().trim().min(1, "Code is required").max(200_000),
  language: z.enum(supportedLanguages, {
    errorMap: () => ({ message: "Unsupported language" }),
  }),
  stdin: z.string().max(50_000).optional().default(""),
});

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  compileOutput: string;
  status: string;
  statusCode: number;
  time: string;
  memory: string;
}

interface Judge0Status {
  id?: number | null;
  description?: string | null;
}

interface Judge0SubmissionResponse {
  token?: string;
}

interface Judge0SubmissionResult {
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  time?: string | number | null;
  memory?: string | number | null;
  status?: Judge0Status | null;
}

const DEFAULT_JUDGE0_LANGUAGE_IDS: Record<SupportedLanguage, number> = {
  javascript: 63,
  typescript: 74,
  python: 71,
  java: 62,
  cpp: 54,
};

const JUDGE0_POLL_INTERVAL_MS = 750;
const JUDGE0_MAX_WAIT_MS = 20_000;
const JUDGE0_REQUEST_TIMEOUT_MS = 10_000;
const JUDGE0_PROCESSING_STATUSES = new Set([1, 2]);
const JUDGE0_TIMEOUT_STATUS = 5;
const JUDGE0_COMPILE_ERROR_STATUS = 6;
const JUDGE0_ACCEPTED_STATUS = 3;

const judge0LanguageIdsSchema = z
  .object({
    javascript: z.coerce.number().int().positive().optional(),
    typescript: z.coerce.number().int().positive().optional(),
    python: z.coerce.number().int().positive().optional(),
    java: z.coerce.number().int().positive().optional(),
    cpp: z.coerce.number().int().positive().optional(),
  })
  .partial();

let cachedJudge0LanguageIds: Record<SupportedLanguage, number> | null = null;

function getJudge0BaseUrl() {
  if (!env.judge0BaseUrl) {
    throw new AppError(
      "Code execution is unavailable. Configure JUDGE0_BASE_URL on the backend.",
      503,
    );
  }

  return env.judge0BaseUrl;
}

function getJudge0LanguageIds() {
  if (cachedJudge0LanguageIds) {
    return cachedJudge0LanguageIds;
  }

  if (!env.JUDGE0_LANGUAGE_IDS_JSON) {
    cachedJudge0LanguageIds = DEFAULT_JUDGE0_LANGUAGE_IDS;
    return cachedJudge0LanguageIds;
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(env.JUDGE0_LANGUAGE_IDS_JSON);
  } catch {
    throw new AppError(
      "Invalid JUDGE0_LANGUAGE_IDS_JSON. Provide valid JSON with Judge0 language ids.",
      500,
    );
  }

  const parsedLanguageIds = judge0LanguageIdsSchema.safeParse(parsedJson);

  if (!parsedLanguageIds.success) {
    throw new AppError(
      "Invalid JUDGE0_LANGUAGE_IDS_JSON. Supported keys are javascript, typescript, python, java, and cpp.",
      500,
    );
  }

  cachedJudge0LanguageIds = {
    ...DEFAULT_JUDGE0_LANGUAGE_IDS,
    ...parsedLanguageIds.data,
  };

  return cachedJudge0LanguageIds;
}

function getJudge0Headers() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (env.JUDGE0_API_KEY) {
    headers[env.judge0ApiKeyHeader] = env.JUDGE0_API_KEY;
  }

  return headers;
}

function encodeBase64(value: string) {
  return Buffer.from(value, "utf8").toString("base64");
}

function decodeBase64(value?: string | null) {
  if (!value) {
    return "";
  }

  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return value;
  }
}

function formatTime(value?: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  return `${value}s`;
}

function formatMemory(value?: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  return `${value} KB`;
}

async function judge0Request<T>(path: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), JUDGE0_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${getJudge0BaseUrl()}${path}`, {
      ...init,
      headers: {
        ...getJudge0Headers(),
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    });

    const rawBody = await response.text();
    let parsedBody: T | { error?: string } | null = null;

    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody) as T;
      } catch {
        parsedBody = null;
      }
    }

    if (!response.ok) {
      const providerMessage =
        (parsedBody &&
          typeof parsedBody === "object" &&
          "error" in parsedBody &&
          typeof parsedBody.error === "string" &&
          parsedBody.error.trim()) ||
        rawBody.trim() ||
        response.statusText;

      throw new AppError(
        `Code execution provider error: ${providerMessage}`,
        502,
      );
    }

    if (!parsedBody) {
      throw new AppError("Code execution provider returned an empty response.", 502);
    }

    return parsedBody as T;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AppError("Code execution provider request timed out.", 504);
    }

    throw new AppError("Could not reach the code execution provider.", 502);
  } finally {
    clearTimeout(timeoutId);
  }
}

function mapJudge0ResultToExecutionResult(result: Judge0SubmissionResult): ExecutionResult {
  const statusId = result.status?.id ?? 13;
  const statusDescription = result.status?.description?.trim() || "Execution Error";
  const stdout = decodeBase64(result.stdout);
  const stderr = decodeBase64(result.stderr);
  const compileOutput = decodeBase64(result.compile_output);
  const providerMessage = decodeBase64(result.message);

  if (statusId === JUDGE0_ACCEPTED_STATUS) {
    return {
      stdout,
      stderr: "",
      compileOutput: "",
      status: statusDescription,
      statusCode: statusId,
      time: formatTime(result.time),
      memory: formatMemory(result.memory),
    };
  }

  if (statusId === JUDGE0_COMPILE_ERROR_STATUS) {
    return {
      stdout: "",
      stderr: "",
      compileOutput:
        compileOutput || stderr || providerMessage || statusDescription,
      status: statusDescription,
      statusCode: statusId,
      time: formatTime(result.time),
      memory: formatMemory(result.memory),
    };
  }

  if (statusId === JUDGE0_TIMEOUT_STATUS) {
    return {
      stdout,
      stderr: stderr || providerMessage || "Execution timed out.",
      compileOutput: "",
      status: "Timeout",
      statusCode: statusId,
      time: formatTime(result.time),
      memory: formatMemory(result.memory),
    };
  }

  return {
    stdout,
    stderr: stderr || providerMessage || statusDescription,
    compileOutput,
    status: statusDescription,
    statusCode: statusId,
    time: formatTime(result.time),
    memory: formatMemory(result.memory),
  };
}

async function submitToJudge0(input: {
  code: string;
  language: SupportedLanguage;
  stdin: string;
}) {
  const languageIds = getJudge0LanguageIds();
  const response = await judge0Request<Judge0SubmissionResponse>(
    "/submissions?base64_encoded=true&wait=false",
    {
      method: "POST",
      body: JSON.stringify({
        source_code: encodeBase64(input.code),
        language_id: languageIds[input.language],
        stdin: encodeBase64(input.stdin),
      }),
    },
  );

  if (!response.token) {
    throw new AppError("Code execution provider did not return a submission token.", 502);
  }

  return response.token;
}

async function pollJudge0Submission(token: string) {
  const deadline = Date.now() + JUDGE0_MAX_WAIT_MS;

  while (Date.now() < deadline) {
    const result = await judge0Request<Judge0SubmissionResult>(
      `/submissions/${token}?base64_encoded=true`,
      {
        method: "GET",
      },
    );

    const statusId = result.status?.id ?? 13;

    if (!JUDGE0_PROCESSING_STATUSES.has(statusId)) {
      return mapJudge0ResultToExecutionResult(result);
    }

    await delay(JUDGE0_POLL_INTERVAL_MS);
  }

  return {
    stdout: "",
    stderr: "Execution timed out while waiting for the provider response.",
    compileOutput: "",
    status: "Timeout",
    statusCode: JUDGE0_TIMEOUT_STATUS,
    time: "N/A",
    memory: "N/A",
  } satisfies ExecutionResult;
}

export async function executeCode(input: unknown): Promise<ExecutionResult> {
  const { code, language, stdin } = runCodeSchema.parse(input);
  const token = await submitToJudge0({
    code,
    language,
    stdin,
  });

  return pollJudge0Submission(token);
}
