import { GraphNodeData, GraphEdgeData, WorkspaceData, GraphInsight } from '../types/graph';

export const INITIAL_WORKSPACES: WorkspaceData[] = [
  {
    id: 'ws-llm',
    name: 'LLM Architectures',
    domain: 'Natural Language Processing',
    nodeCount: 5,
    edgeCount: 4,
    lastUpdated: 'Just now',
    icon: 'Network'
  },
  {
    id: 'ws-neuro',
    name: 'Neural Dynamics',
    domain: 'Computational Neuroscience',
    nodeCount: 12,
    edgeCount: 18,
    lastUpdated: '2 hours ago',
    icon: 'Brain'
  },
  {
    id: 'ws-quantum',
    name: 'Quantum Circuits',
    domain: 'Quantum Computing',
    nodeCount: 8,
    edgeCount: 11,
    lastUpdated: 'Yesterday',
    icon: 'Atom'
  }
];

export const INITIAL_NODES: GraphNodeData[] = [
  {
    id: 'node-bert',
    title: 'BERT',
    category: 'MODEL',
    categories: ['Model', 'Algorithm'],
    badge: 'MODEL',
    description: 'Bidirectional Encoder Representations from Transformers pre-trained on deep bidirectional representations from unlabeled text.',
    tags: ['attention', 'nlp', 'encoder', 'transformer'],
    x: 80,
    y: 112, // top-28 (7rem = 112px), left-20 (5rem = 80px)
    glow: false,
    status: 'Verified',
    doi: '10.48550/arXiv.1810.04805',
    source: {
      title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
      citation: 'Devlin et al., 2018 (Google AI Language)',
      url: 'https://arxiv.org/abs/1810.04805',
      doi: '10.48550/arXiv.1810.04805',
      year: 2018
    },
    mechanics: [
      {
        id: 'mech-mlm',
        title: 'Masked Language Modeling (MLM)',
        description: 'Randomly masks 15% of tokens in input sequence for deep bidirectional conditioning.'
      },
      {
        id: 'mech-nsp',
        title: 'Next Sentence Prediction (NSP)',
        description: 'Binary classification task to capture relationships between pairs of sentences.'
      }
    ],
    complexityMatrix: {
      timeComplexity: 'O(n · d² + n² · d)',
      spaceComplexity: 'O(n · d + n²)',
      parallelizable: 'High',
      parameters: '110M (Base) / 340M (Large)',
      type: 'Encoder-Only',
      memoryFootprint: '1.3 GB (FP32)'
    },
    notes: [
      {
        id: 'note-1',
        author: 'Aether Architect',
        content: 'Fine-tuning yields state-of-the-art results on 11 natural language processing tasks including GLUE and SQuAD.',
        createdAt: '2026-08-28 10:15 AM'
      }
    ]
  },
  {
    id: 'node-transformers',
    title: 'Transformers',
    category: 'ARCHITECTURE',
    categories: ['Architecture', 'Deep Learning'],
    badge: 'ARCHITECTURE',
    description: 'A deep learning architecture relying entirely on an attention mechanism to draw global dependencies between input and output without recurrent layers.',
    tags: ['nlp', 'deep-learning', 'attention', 'foundation'],
    x: 360,
    y: 112, // top-28 (112px), left-80 (20rem = 320-360px)
    glow: true,
    status: 'Verified',
    doi: '10.48550/arXiv.1706.03762',
    source: {
      title: 'Attention Is All You Need',
      citation: 'Vaswani et al., 2017 (Google Brain & Google Research)',
      url: 'https://arxiv.org/abs/1706.03762',
      doi: '10.48550/arXiv.1706.03762',
      year: 2017
    },
    mechanics: [
      {
        id: 'mech-sa',
        title: 'Self-Attention',
        description: 'Contextual weighting mechanism for parallelized representations across tokens.',
        targetNodeId: 'node-self-attention'
      },
      {
        id: 'mech-pe',
        title: 'Positional Encoding',
        description: 'Injects sequence order information via sinusoidal or learned spatial functions.',
        targetNodeId: 'node-positional-encoding'
      }
    ],
    complexityMatrix: {
      timeComplexity: 'O(n² · d)',
      spaceComplexity: 'O(n²)',
      parallelizable: 'High',
      parameters: '65M - 175B+',
      type: 'Sequence-to-Sequence',
      memoryFootprint: 'Scale-dependent'
    },
    notes: [
      {
        id: 'note-2',
        author: 'Dr. Evelyn Vance',
        content: 'Eliminates recurrence and convolutions entirely. Multi-head self-attention enables the model to jointly attend to information from different representation subspaces.',
        createdAt: '2026-08-28 11:30 AM'
      },
      {
        id: 'note-3',
        author: 'Systems Lab',
        content: 'Requires FlashAttention kernels for optimal execution memory efficiency on H100/A100 clusters.',
        createdAt: '2026-08-28 01:45 PM'
      }
    ]
  },
  {
    id: 'node-self-attention',
    title: 'Self-Attention',
    category: 'MECHANISM',
    categories: ['Mechanism', 'Operator'],
    badge: 'MECHANISM',
    description: 'Contextual weighting mechanism for parallelized representations mapping Query, Key, and Value matrices into compatibility scores.',
    tags: ['mechanism', 'matrix-op', 'scaled-dot-product'],
    x: 360,
    y: 360, // top-80 (20rem = 320-360px), left-80
    glow: false,
    status: 'Verified',
    doi: '10.48550/arXiv.1706.03762.3.2',
    source: {
      title: 'Attention Is All You Need (Section 3.2)',
      citation: 'Vaswani et al., 2017',
      url: 'https://arxiv.org/abs/1706.03762',
      doi: '10.48550/arXiv.1706.03762',
      year: 2017
    },
    mechanics: [
      {
        id: 'mech-sdpa',
        title: 'Scaled Dot-Product Attention',
        description: 'Computes softmax(Q K^T / sqrt(d_k)) * V across packed vectors.'
      },
      {
        id: 'mech-mha',
        title: 'Multi-Head Projection',
        description: 'Splits vectors across h distinct subspaces for richer contextual attention.'
      }
    ],
    complexityMatrix: {
      timeComplexity: 'O(n² · d)',
      spaceComplexity: 'O(n²)',
      parallelizable: 'High',
      parameters: 'Linear in projection weights',
      type: 'Core Operator',
      memoryFootprint: 'O(n²) attention matrix'
    },
    notes: [
      {
        id: 'note-4',
        author: 'Aether Architect',
        content: 'Softmax temperature scaling sqrt(d_k) prevents vanishing gradients in large dimension vectors.',
        createdAt: '2026-08-28 09:00 AM'
      }
    ]
  },
  {
    id: 'node-positional-encoding',
    title: 'Positional Encoding',
    category: 'MECHANISM',
    categories: ['Mechanism', 'Embedding'],
    badge: 'MECHANISM',
    description: 'Sinusoidal and rotary position embeddings injected into input vectors to preserve permutation order without recurrence.',
    tags: ['embedding', 'position', 'rope'],
    x: 650,
    y: 112,
    glow: false,
    status: 'Verified',
    doi: '10.48550/arXiv.2104.09864',
    source: {
      title: 'RoFormer: Enhanced Transformer with Rotary Position Embedding',
      citation: 'Su et al., 2021',
      url: 'https://arxiv.org/abs/2104.09864',
      doi: '10.48550/arXiv.2104.09864',
      year: 2021
    },
    mechanics: [
      {
        id: 'mech-sinusoid',
        title: 'Sinusoidal Frequencies',
        description: 'PE(pos, 2i) = sin(pos/10000^(2i/d_model))'
      },
      {
        id: 'mech-rope',
        title: 'Rotary Position Embedding (RoPE)',
        description: 'Applies rotational matrix transformation to inner products.'
      }
    ],
    complexityMatrix: {
      timeComplexity: 'O(n · d)',
      spaceComplexity: 'O(1)',
      parallelizable: 'High',
      parameters: '0 (Fixed) or O(max_len · d)',
      type: 'Input Modifier',
      memoryFootprint: 'Minimal'
    },
    notes: []
  },
  {
    id: 'node-roberta',
    title: 'RoBERTa',
    category: 'MODEL',
    categories: ['Model', 'Optimization'],
    badge: 'MODEL',
    description: 'A Robustly Optimized BERT Pretraining Approach demonstrating that hyperparameter tuning and longer training dramatically improves performance.',
    tags: ['nlp', 'optimized-bert', 'dynamic-masking'],
    x: 80,
    y: 360,
    glow: false,
    status: 'Experimental',
    doi: '10.48550/arXiv.1907.11692',
    source: {
      title: 'RoBERTa: A Robustly Optimized BERT Pretraining Approach',
      citation: 'Liu et al., 2019 (Meta AI)',
      url: 'https://arxiv.org/abs/1907.11692',
      doi: '10.48550/arXiv.1907.11692',
      year: 2019
    },
    mechanics: [
      {
        id: 'mech-dyn-mask',
        title: 'Dynamic Masking',
        description: 'Masking pattern generated every time a sequence is fed to the model.'
      }
    ],
    complexityMatrix: {
      timeComplexity: 'O(n · d² + n² · d)',
      spaceComplexity: 'O(n · d + n²)',
      parallelizable: 'High',
      parameters: '125M / 355M',
      type: 'Encoder-Only',
      memoryFootprint: '1.4 GB (FP32)'
    },
    notes: []
  }
];

export const INITIAL_EDGES: GraphEdgeData[] = [
  {
    id: 'edge-bert-transformers',
    source: 'node-bert',
    target: 'node-transformers',
    label: 'implemented_by',
    type: 'glowing',
    active: true
  },
  {
    id: 'edge-transformers-self-attention',
    source: 'node-transformers',
    target: 'node-self-attention',
    label: 'utilizes',
    type: 'glowing',
    active: true
  },
  {
    id: 'edge-transformers-pos-encoding',
    source: 'node-transformers',
    target: 'node-positional-encoding',
    label: 'requires',
    type: 'solid',
    active: false
  },
  {
    id: 'edge-roberta-transformers',
    source: 'node-roberta',
    target: 'node-transformers',
    label: 'derives_from',
    type: 'dashed',
    active: false
  }
];

export const INITIAL_INSIGHTS: GraphInsight[] = [
  {
    id: 'insight-1',
    type: 'signal',
    title: 'Signal: Potential Connection Detected',
    description: 'Strong architectural convergence detected between BERT and RoBERTa via Dynamic Masking mechanisms.',
    actionText: 'Connect Nodes',
    sourceNodeId: 'node-bert',
    targetNodeId: 'node-roberta'
  },
  {
    id: 'insight-2',
    type: 'gap',
    title: 'Knowledge Gap: Training Data Details Missing',
    description: 'Self-Attention node is missing downstream dataset benchmarks and FLOPs profiling metadata.',
    actionText: 'Add Metadata',
    targetNodeId: 'node-self-attention'
  },
  {
    id: 'insight-3',
    type: 'recommendation',
    title: 'Cluster Recommendation: Attention Family',
    description: 'Add Multi-Head Attention and FlashAttention-2 to complete this sub-graph cluster.',
    actionText: 'Auto-Generate'
  }
];
