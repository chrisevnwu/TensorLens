export type LrSchedule='constant'|'cosine'|'warmup-cosine'

/** Step zero is the start of the run. The cosine tail reaches minRate at the final step. */
export function learningRateAt(schedule:LrSchedule, peak:number, step:number, total:number,
  warmup=Math.max(1,Math.round(total*.1)), minRate=peak*.02) {
  if (!Number.isFinite(peak) || !Number.isFinite(minRate) || minRate<0 || peak<minRate ||
      !Number.isFinite(step) || !Number.isSafeInteger(total) || total<1 || !Number.isSafeInteger(warmup) || warmup<0)
    throw new RangeError('Invalid learning-rate schedule')
  if (schedule==='constant') return peak
  const time=Math.max(0,Math.min(total,step))
  const warmSteps=schedule==='warmup-cosine'?Math.min(warmup,total):0
  if(warmSteps && time<=warmSteps) return peak*(time/warmSteps)
  const fraction=(time-warmSteps)/(total-warmSteps)
  return minRate+(peak-minRate)*(1+Math.cos(Math.PI*fraction))/2
}
