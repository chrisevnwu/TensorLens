import { bpeCopy } from '../i18n/labs/bpe-tokenizer'
import { ropeCopy } from '../i18n/labs/embeddings-rope'
import { attentionCopy } from '../i18n/labs/attention-debugger'
import { normalCopy } from '../i18n/labs/norm-residual'
import { kvCopy } from '../i18n/labs/kv-cache-profiler'
import { flashCopy } from '../i18n/labs/flash-attention'
import { moeCopy } from '../i18n/labs/moe-routing'
import { quantCopy } from '../i18n/labs/quantization'
import { samplingCopy } from '../i18n/labs/decoding-sampling'
import { loraCopy } from '../i18n/labs/lora-svd'
import { optimizerCopy } from '../i18n/labs/backprop-optimizers'
import { diffusionCopy } from '../i18n/labs/diffusion-flow'

type PresetDictionary = { presets: Readonly<Record<string, string>> }
const dictionaries: Record<string, { en: PresetDictionary; zh: PresetDictionary }> = {
  'bpe-tokenizer': bpeCopy,
  'embeddings-rope': ropeCopy,
  'attention-debugger': attentionCopy,
  'norm-residual': normalCopy,
  'kv-cache-profiler': kvCopy,
  'flash-attention': flashCopy,
  'moe-routing': moeCopy,
  'quantization': quantCopy,
  'decoding-sampling': samplingCopy,
  'lora-svd': loraCopy,
  'backprop-optimizers': optimizerCopy,
  'diffusion-flow': diffusionCopy,
}

export function getLabPresets(labId: string) {
  const copy = dictionaries[labId]
  if (!copy) return []
  return Object.entries(copy.en.presets).map(([id, en]) => ({
    id, title: { en, zh: copy.zh.presets[id] ?? en },
  }))
}
