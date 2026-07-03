import type { BrazilSignal } from './types'

export interface ClassifyDocumentInput {
  text: string
  /** Account the upload is contextually associated with, if known (e.g. currently focused marker). */
  relatedAccountId?: string
}

const SIMULATED_LATENCY_MS = 1400

/** Demo fallback so the temperature-update flow has something to exercise when no account is focused. */
const DEFAULT_DEMO_ACCOUNT_ID = 'itau-unibanco'

/**
 * Stand-in for a document-classification call. Simulates latency and
 * returns a mock signal so the upload -> feed -> temperature-update flow
 * can be built and demoed end to end.
 *
 * TODO: replace with AWS Bedrock call via FastAPI backend
 */
export async function classifyDocumentStub(input: ClassifyDocumentInput): Promise<BrazilSignal> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS))

  const snippet = input.text.trim().slice(0, 80)
  const headline = snippet.length > 0 ? `Document flagged: "${snippet}${input.text.length > 80 ? '…' : ''}"` : 'Uploaded document classified'

  return {
    id: `sig-doc-${Date.now()}`,
    timestamp: new Date().toISOString(),
    sourceType: 'document',
    headline,
    summary: 'Uploaded document analysed for relevance to active Brazil accounts. Mock classification pending live Bedrock integration.',
    relatedAccountId: input.relatedAccountId ?? DEFAULT_DEMO_ACCOUNT_ID,
    priority: 2,
  }
}
