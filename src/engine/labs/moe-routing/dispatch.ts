export interface Route {
  token: number
  expert: number
  probability: number
  weight: number
  dropped: boolean
}

/** Rank with the optional balancing bias; combine using the unmodified router probabilities. */
export function dispatch(probs: readonly (readonly number[])[], topK: number, capacityFactor: number, bias?: readonly number[]) {
  const experts = probs[0]?.length ?? 0
  if (!Number.isInteger(topK) || topK < 1 || topK > experts || !(capacityFactor > 0) || !Number.isFinite(capacityFactor)) {
    throw new RangeError('Invalid expert count, fanout or capacity factor')
  }
  if (bias && (bias.length !== experts || !bias.every(Number.isFinite))) throw new RangeError('Invalid expert biases')
  const capacity = Math.max(1, Math.ceil(capacityFactor * probs.length * topK / experts))
  const queues: Route[][] = Array.from({length:experts}, () => [])
  const routes: Route[] = []
  probs.forEach((row, token) => {
    if (row.length !== experts || !row.every(p => Number.isFinite(p) && p >= 0)) throw new RangeError('Invalid probabilities')
    const ranked = row.map((p, expert) => ({expert, score:p+(bias?.[expert] ?? 0)}))
      .sort((a,b) => b.score - a.score || a.expert - b.expert).slice(0, topK)
    const mass = ranked.reduce((sum, r) => sum + row[r.expert]!, 0)
    for (const {expert} of ranked) {
      const probability = row[expert]!
      const route = { token, expert, probability, weight:mass ? probability / mass : 1 / topK, dropped:false }
      routes.push(route)
      queues[expert]!.push(route)
    }
  })
  const assigned = queues.map(q => q.length)
  const accepted = queues.map(queue => {
    queue.sort((a,b) => b.probability - a.probability || a.token - b.token)
    for (const overflow of queue.slice(capacity)) overflow.dropped = true
    return Math.min(queue.length,capacity)
  })
  const dropped = routes.length - accepted.reduce((a,b) => a+b,0)
  return { routes, assigned, accepted, capacity, droppedRate:dropped/routes.length }
}
