import type { ExactStringTree } from '../types'

const en = {
  presets: { matched: 'Matched pairs', swapped: 'Swapped captions', reordered: 'Reordered pairs' },
  order: 'Batch arrangement', temperature: 'Temperature τ', broad: 'Omit the count from “Two circles”',
  view: 'Matrix values', views: { cosine: 'Cosine', image: 'Image → text', caption: 'Text → image' },
  samples: { circle: 'One circle', duo: 'Two circles', triangle: 'One triangle' }, generic: 'Circular shape',
  image: 'Image', caption: 'Caption', matrix: 'Image–caption matrix', target: 'Labeled positive', comparison: 'Other pair',
  matrixHelp: '◇ marks the labeled pairs. Select a cell to compare its features and retrieval probabilities.',
  cell: 'Image {i}, {image}. Caption {j}, {caption}. {kind}.',
  imageToText: 'P(caption | image)', textToImage: 'P(image | caption)',
  features: 'Feature order', featureOrder: 'circle · triangle · one · two',
  symLoss: 'Symmetric loss', imageLoss: 'Image → text loss', textLoss: 'Text → image loss',
  imageHits: 'Image → text top-1', textHits: 'Text → image top-1', hitHint: 'Correct diagonal matches. Ties go to the first position.',
  lossHint: 'Mean of both directional cross-entropies, in nats.', reference: 'Correctly paired batch', lossDifference: 'Loss change',
  compareHelp: 'The reference uses the same temperature and caption wording.',
  guide: 'Each drawing and caption is encoded with four hand-assigned features. You can inspect each vector as it enters the calculation. CLIP learns its image and text encoders from data; this experiment isolates its batch objective.',
  objective: 'First divide each vector by its L2 norm. The dot product of two resulting unit vectors is their cosine. Divide it by temperature and apply softmax across one image row to retrieve text, or down one caption column to retrieve images.',
  labels: 'The loss uses the diagonals as positive targets. It averages the negative log probability of each labeled caption and each labeled image. Jointly moving an image and its caption preserves these labels.',
  missions: {
    sharp: { title: 'Retrieve the triangle', description: 'Use Matched pairs with full captions. Set τ to 0.20 or lower, then select the triangle and its caption. Can its image-to-text probability exceed 90%?', insight: 'Lowering temperature sharpens the distribution while preserving the cosine ranking.' },
    swap: { title: 'Find the misplaced caption', description: 'Choose Swapped captions with full captions. Select the one-circle image and the caption that actually describes it.', insight: 'The highest-scoring match now sits off the diagonal. The loss still scores the diagonal labels, so both directional losses increase.' },
    joint: { title: 'Move both sides together', description: 'Choose Reordered pairs, keep full captions, and select the two-circle image with its caption. Compare the loss with the correctly paired reference.', insight: 'Moving both axes in the same order changes where a pair appears. Every positive keeps exactly the same probability.' },
  },
}

const zh: ExactStringTree<typeof en> = {
  presets: { matched: '正确配对', swapped: '交换文字', reordered: '成对重排' },
  order: '批次排列', temperature: '温度 τ', broad: '省略“两个圆”中的数量',
  view: '矩阵数值', views: { cosine: '余弦相似度', image: '以图找文', caption: '以文找图' },
  samples: { circle: '一个圆', duo: '两个圆', triangle: '一个三角形' }, generic: '圆形图案',
  image: '图像', caption: '文字', matrix: '图文匹配矩阵', target: '标注的正样本', comparison: '其他组合',
  matrixHelp: '◇ 表示标注的正样本。选择一个格子，可以查看这组图文的特征与双向检索概率。',
  cell: '图像 {i}，{image}。文字 {j}，{caption}。{kind}。',
  imageToText: 'P(文字 | 图像)', textToImage: 'P(图像 | 文字)',
  features: '特征顺序', featureOrder: '圆形 · 三角形 · 一个 · 两个',
  symLoss: '双向平均损失', imageLoss: '以图找文损失', textLoss: '以文找图损失',
  imageHits: '以图找文首选命中', textHits: '以文找图首选命中', hitHint: '统计命中对角线标签的数量。并列时取第一个位置。',
  lossHint: '取两个方向交叉熵的均值，单位为 nat。', reference: '正确配对时的损失', lossDifference: '损失变化',
  compareHelp: '对照组采用相同的温度与文字描述。',
  guide: '这里为每张图和每段文字手工标注四个特征，便于逐项核对计算过程。CLIP 通过数据训练图像与文本编码器，本实验单独演示它在一个批次上的训练目标。',
  objective: '先将每个向量除以自身的 L2 范数，再求两个单位向量的点积，得到余弦相似度。将相似度除以温度，沿某一行做 softmax 就能以图找文，沿某一列做 softmax 就能以文找图。',
  labels: '损失函数把对角线当作正样本标签。每张图找到配对文字、每段文字找到配对图像都有一个概率，损失取这些概率的负对数均值。图文一起移动时，配对关系会保留。',
  missions: {
    sharp: { title: '找到三角形的描述', description: '选择「正确配对」并保留完整文字。把温度降至 0.20 或以下，再选中三角形与对应文字，观察以图找文的概率能否超过 90%。', insight: '温度越低，高分项获得的概率越大，余弦相似度的排名保持不变。' },
    swap: { title: '找回被调换的文字', description: '选择「交换文字」并保留完整文字。选中一个圆的图像，以及真正描述这张图的文字。', insight: '最相似的图文组合落在了对角线以外。损失函数仍按对角线上的标签计分，因此两个方向的损失都会增加。' },
    joint: { title: '把图文一起移动', description: '选择「成对重排」并保留完整文字。选中两个圆的图像与对应文字，对比它与正确配对时的损失。', insight: '用同一顺序重排图像和文字，只会改变图文对的位置。每个正样本的检索概率都保持不变。' },
  },
}

export const contrastiveCopy = { en, zh }
