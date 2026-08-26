import api from './client'

/**
 * POST /api/ai/coordinate
 *
 * Sends { requestId } to trigger the full server-side five-agent pipeline.
 * The backend looks up the request, runs matching + all 5 agents, and
 * returns the complete coordination result with agentStatus metadata.
 */
export async function coordinateBloodRequest(requestId) {
  const { data } = await api.post('/api/ai/coordinate', { requestId })
  return data.result
}
