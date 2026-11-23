export const ATTENTION_PRESETS = [
  { id: 'causal', tokens: ['The', 'cat', 'sat', 'on', 'the', 'mat'], numHeads: 4, useScaling: true, logitScale: 1, maskType: 'causal', windowSize: 3, topology: 'MHA' },
  { id: 'encoder', tokens: ['A', 'masked', 'word', 'needs', 'both', 'neighbors'], numHeads: 4, useScaling: true, logitScale: 1, maskType: 'bidirectional', windowSize: 3, topology: 'MHA' },
  { id: 'saturation', tokens: ['Sharp', 'scores', 'focus', 'on', 'one', 'token'], numHeads: 4, useScaling: false, logitScale: 3, maskType: 'causal', windowSize: 3, topology: 'MHA' },
  { id: 'sliding', tokens: ['Each', 'token', 'sees', 'its', 'recent', 'neighbors'], numHeads: 4, useScaling: true, logitScale: 1, maskType: 'sliding', windowSize: 3, topology: 'GQA' },
] as const

export type AttentionPresetId = typeof ATTENTION_PRESETS[number]['id']
