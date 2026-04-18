import { EMPTY_STATE, STORAGE_KEY } from "@/lib/constants";
import { AppState } from "@/lib/types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeState(value: unknown): AppState {
  if (!isObject(value)) {
    return EMPTY_STATE;
  }

  return {
    activeJourneyId:
      typeof value.activeJourneyId === "string" || value.activeJourneyId === null
        ? value.activeJourneyId
        : null,
    interestRatings: Array.isArray(value.interestRatings) ? value.interestRatings : [],
    journeys: Array.isArray(value.journeys) ? value.journeys : [],
    checkIns: Array.isArray(value.checkIns) ? value.checkIns : [],
    parentSupportEntries: Array.isArray(value.parentSupportEntries)
      ? value.parentSupportEntries
      : [],
    historyEntries: Array.isArray(value.historyEntries) ? value.historyEntries : [],
  };
}

export function loadLocalState() {
  if (typeof window === "undefined") {
    return EMPTY_STATE;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return EMPTY_STATE;
    }

    return sanitizeState(JSON.parse(raw));
  } catch {
    return EMPTY_STATE;
  }
}

export function saveLocalState(state: AppState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

type Listener = () => void;

let memoryState: AppState = EMPTY_STATE;
let hasInitializedClientState = false;
const listeners = new Set<Listener>();

export function initializeStoredAppState() {
  if (typeof window === "undefined" || hasInitializedClientState) {
    return memoryState;
  }

  memoryState = loadLocalState();
  hasInitializedClientState = true;

  return memoryState;
}

export function getAppStateSnapshot() {
  if (typeof window === "undefined") {
    return memoryState;
  }

  return initializeStoredAppState();
}

export function getServerAppStateSnapshot() {
  return EMPTY_STATE;
}

export function subscribeToAppState(listener: Listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function updateStoredAppState(updater: (state: AppState) => AppState) {
  const nextState = updater(initializeStoredAppState());
  memoryState = nextState;
  hasInitializedClientState = true;
  saveLocalState(nextState);
  listeners.forEach((listener) => listener());
}
