/**
 * Centralized type definitions for simulator-web
 *
 * All domain types are exported from this file.
 * Source files should import from '@/types' instead of defining types inline.
 */

// === Device ===

export interface Device {
  id: string
  name: string
  ocppId: string
  model: string
  status: 'online' | 'offline' | 'charging' | 'fault'
  power: number
  voltage: number
  current: number
  soc: number
  temperature: number
  lastHeartbeat: string
}

// === OCPP ===

/** Incoming OCPP message envelope from the server */
export interface OcppWsMessage {
  messageId: string
  action: string
  type: 'Call' | 'CallResult' | 'CallError'
  payload: Record<string, unknown>
  timestamp: string
  direction: 'inbound' | 'outbound'
  chargePointId: string
}

/** Callback map for message dispatch */
export interface OcppWsCallbacks {
  onOpen?: () => void
  onClose?: () => void
  onError?: (event: Event) => void
  onMessage?: (message: OcppWsMessage) => void
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting') => void
}

// === Charging ===

export interface ChargingData {
  currentSoc: number
  power: number
  energy: number
  voltage: number
  current: number
  temperature: number
  durationSeconds: number
  cost: number
}

// === Chart ===

export interface DeviceLike {
  status: string
}

// === Scenario ===

export type ScenarioStepType =
  | 'CONNECT'
  | 'REMOTE_START'
  | 'WAIT'
  | 'METER_VALUES'
  | 'REMOTE_STOP'
  | 'INJECT_FAULT'

export type ScenarioStatus = 'draft' | 'running' | 'completed' | 'failed'

export interface ScenarioStep {
  id: string
  type: ScenarioStepType
  label: string
  params: Record<string, any>
  order: number
}

export interface Scenario {
  id: string
  name: string
  description: string
  status: ScenarioStatus
  deviceIds: string[]
  steps: ScenarioStep[]
  lastRunTime?: string
  createdAt?: string
  updatedAt?: string
}

export interface ExecutionLog {
  id: string
  scenarioId: string
  scenarioName: string
  status: ScenarioStatus
  startedAt: string
  finishedAt?: string
  currentStepIndex: number
  totalSteps: number
  completedSteps: number
  failedSteps: number
  logs: ExecutionLogEntry[]
}

export interface ExecutionLogEntry {
  timestamp: string
  stepIndex: number
  stepType: string
  status: 'success' | 'failed' | 'running' | 'pending'
  message: string
}

export interface DeviceOption {
  id: string
  name: string
  ocppId: string
  status: string
}
