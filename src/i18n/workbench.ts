import type { ExactStringTree } from './types'

const en = {
  controls: 'Controls', inspector: 'Inspector & math', challenges: 'Guided challenges',
  inspectorTab: 'Inspector', challengesTab: 'Challenges',
  jumpControls: 'Jump to controls', backToStage: 'Back to visualization',
  stage: 'Visualization', metrics: 'Key metrics', details: 'Live inspector', guide: 'Concept guide',
  presets: 'Presets', share: 'Share URL', export: 'Export PNG', reset: 'Reset',
  copied: 'Experiment link copied.', exported: 'Snapshot downloaded.',
  dismiss: 'Close', manual: 'Select and copy this experiment link.', exportFailed: 'Snapshot export failed. Try again.',
  expandControls: 'Show controls', collapseControls: 'Collapse controls',
  expandInspector: 'Show inspector', collapseInspector: 'Collapse inspector',
  previousLab: 'Previous lab', nextLab: 'Next lab', neighbors: 'Lab navigation',
  playback: 'Playback', step: 'Step', first: 'First step', previous: 'Previous step',
  play: 'Play', pause: 'Pause', next: 'Next step', last: 'Last step', speed: 'Playback speed',
} as const

const zh: ExactStringTree<typeof en> = {
  controls: '参数控制', inspector: '检查器与公式', challenges: '引导挑战',
  inspectorTab: '检查器', challengesTab: '挑战',
  jumpControls: '跳转到参数控制', backToStage: '返回可视化',
  stage: '可视化', metrics: '关键指标', details: '实时检查器', guide: '概念指南',
  presets: '预设', share: '分享链接', export: '导出 PNG', reset: '重置',
  copied: '实验链接已复制。', exported: '快照已下载。',
  dismiss: '关闭', manual: '请选择并复制此实验链接。', exportFailed: '快照导出失败，请重试。',
  expandControls: '展开参数面板', collapseControls: '收起参数面板',
  expandInspector: '展开检查器', collapseInspector: '收起检查器',
  previousLab: '上一个实验', nextLab: '下一个实验', neighbors: '实验导航',
  playback: '播放控制', step: '步骤', first: '第一步', previous: '上一步',
  play: '播放', pause: '暂停', next: '下一步', last: '最后一步', speed: '播放速度',
}

export const workbenchCopy = { en, zh }
