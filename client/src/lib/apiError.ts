import { APP_NAME } from "../app/brand.ts";
import { isRecord } from "./isRecord.ts";

export interface FieldIssue {
  path: string;
  message: string;
}

export interface ApiProblem {
  status: number | null;
  code: string;
  message: string;
  fieldIssues: FieldIssue[];
}

const NETWORK_MESSAGE = `Couldn't reach ${APP_NAME}. Check your connection and try again.`;
const TIMEOUT_MESSAGE = `${APP_NAME} is taking too long to answer. Try again.`;
const GENERIC_MESSAGE = "Something went wrong. Please try again.";
const RATE_LIMIT_MESSAGE = "Too many attempts. Wait a minute and try again.";

function readFieldIssues(details: unknown): FieldIssue[] {
  if (!Array.isArray(details)) {
    return [];
  }
  const issues: FieldIssue[] = [];
  for (const item of details) {
    if (
      isRecord(item) &&
      typeof item.path === "string" &&
      typeof item.message === "string"
    ) {
      issues.push({ path: item.path, message: item.message });
    }
  }
  return issues;
}

function fallbackForStatus(status: number): ApiProblem {
  if (status === 429) {
    return {
      status,
      code: "RATE_LIMITED",
      message: RATE_LIMIT_MESSAGE,
      fieldIssues: [],
    };
  }
  return { status, code: "UNKNOWN", message: GENERIC_MESSAGE, fieldIssues: [] };
}

function fromHttpError(status: number, data: unknown): ApiProblem {
  if (!isRecord(data) || !isRecord(data.error)) {
    return fallbackForStatus(status);
  }
  const { code, message, details } = data.error;
  if (typeof code !== "string" || typeof message !== "string") {
    return fallbackForStatus(status);
  }
  return { status, code, message, fieldIssues: readFieldIssues(details) };
}

export function toApiProblem(error: unknown): ApiProblem {
  if (!isRecord(error) || !("status" in error)) {
    return {
      status: null,
      code: "UNKNOWN",
      message: GENERIC_MESSAGE,
      fieldIssues: [],
    };
  }
  const { status } = error;
  if (typeof status === "number") {
    return fromHttpError(status, error.data);
  }
  if (status === "FETCH_ERROR") {
    return {
      status: null,
      code: "NETWORK_ERROR",
      message: NETWORK_MESSAGE,
      fieldIssues: [],
    };
  }
  if (status === "TIMEOUT_ERROR") {
    return {
      status: null,
      code: "TIMEOUT",
      message: TIMEOUT_MESSAGE,
      fieldIssues: [],
    };
  }
  return {
    status: null,
    code: "UNKNOWN",
    message: GENERIC_MESSAGE,
    fieldIssues: [],
  };
}
