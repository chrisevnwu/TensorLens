import { expect, it } from 'vitest'
import { createRng } from '../../../math/prng'
import { decode, encode, trainBPE } from '../engine'

it('preserves arbitrary token boundaries and unseen prompt bytes at every learned rank', () => {
  const rng = createRng(4301)
  const alphabet = Array.from('aaβ数学\n\t 987,🙂\u0301')
  const sample = (n: number) => Array.from({ length: n }, () => alphabet[rng.nextInt(0, alphabet.length - 1)]).join('')
  for (const split of [true, false]) {
    for (let trial = 0; trial < 8; trial++) {
      const corpus = sample(30)
      const model = trainBPE(corpus + corpus, 18, split)
      const prompt = sample(16) + '\uFEFF' + '🌀' + corpus
      for (let rank = 0; rank <= model.rules.length; rank++) {
        const ids = encode(prompt, model, rank)
        expect(decode(ids, model.vocab)).toBe(prompt)
        expect(ids.every(id => id >= 0 && id < 256 + rank)).toBe(true)
      }
    }
  }
})
