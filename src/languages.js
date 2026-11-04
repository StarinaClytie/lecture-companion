export const languages=[
 {id:'en',name:'English',locale:'en-US'}, {id:'zh',name:'中文',locale:'zh-CN'},
 {id:'es',name:'Español',locale:'es-ES'}, {id:'fr',name:'Français',locale:'fr-FR'},
 {id:'de',name:'Deutsch',locale:'de-DE'}, {id:'ja',name:'日本語',locale:'ja-JP'},
 {id:'ko',name:'한국어',locale:'ko-KR'}, {id:'pt',name:'Português',locale:'pt-BR'},
 {id:'it',name:'Italiano',locale:'it-IT'}, {id:'ar',name:'العربية',locale:'ar-SA'},
 {id:'hi',name:'हिन्दी',locale:'hi-IN'}, {id:'ru',name:'Русский',locale:'ru-RU'}
];
export const languageName=id=>languages.find(l=>l.id===id)?.name||'English';
export const defaultPreferences={native:'zh',spoken:'en',display:'original',ui:'en',textSize:18,captionSpacing:30,transcription:'openai'};
export function loadPreferences(){try{const p=JSON.parse(localStorage.getItem('lecture-preferences'));return {...defaultPreferences,...Object.fromEntries(Object.entries(p||{}).filter(([k,v])=>['native','spoken'].includes(k)?languages.some(l=>l.id===v):k==='display'?['original','native','bilingual'].includes(v):k==='ui'?['en','zh'].includes(v):k==='textSize'?[14,16,18,20,22].includes(v):k==='transcription'?['openai','browser'].includes(v):k==='captionSpacing'?Number.isFinite(v)&&v>=0&&v<=100:false))};}catch{return defaultPreferences;}}
export const chineseCaptions=[
 '欢迎回来。今天我们将探讨机器学习模型如何从数据中学习。',
 '我们的目标不只是记住训练样本，而是能够泛化到从未见过的新数据。',
 '过于简单的模型可能无法捕捉潜在规律。我们称之为欠拟合，或高偏差。',
 '随着模型复杂度的提高，训练误差通常会下降。',
 '然而，拟合每一个训练点的模型也可能学到噪声。这叫作过拟合。',
 '这会增加方差：训练数据中的微小变化，可能导致完全不同的预测。',
 '偏差与方差的权衡，描述了在模型过于简单和过于敏感之间寻找平衡。',
 '为了评估泛化能力，我们会留出一组模型训练时看不到的验证数据。',
 '正则化通过惩罚复杂度，鼓励模型找到更简单的解。',
 '例如，L2 正则化会在损失函数中惩罚权重的平方和。',
 '正则化强度是一个超参数。我们根据验证集上的表现来选择它。',
 '记住，最好的模型是在新数据上表现良好的模型，而不只是擅长已经见过的样本。'
];
export const englishExplanations=[
 'Machine learning models learn patterns by adjusting their parameters using examples.',
 'Generalization means applying learned patterns to new examples, rather than memorizing training answers.',
 'Underfitting means the model is too simple to capture the important patterns. This leads to high bias.',
 'More flexible models can fit training examples more closely. Lower training error does not guarantee better predictions on new data.',
 'Overfitting happens when a model learns random noise as well as useful patterns in the training data.',
 '“This” refers to overfitting in the preceding sentence. A model that learns noise becomes sensitive to small changes in its training examples: high variance.',
 'The bias–variance tradeoff balances a model that is too simple against one that is overly sensitive to training data.',
 'A validation set contains examples kept out of training so we can compare models and choose hyperparameters.',
 'Regularization penalizes complexity, discouraging the model from chasing noise in training examples.',
 'L2 regularization adds a penalty proportional to the sum of squared weights, discouraging very large weights.',
 'A hyperparameter is a setting chosen outside the model’s learned weights. Validation results help us choose its value.',
 'We care about predictions on new data. A model that memorizes its training examples may still fail in practice.'
];
export const englishExamples=[
 'For example, a housing model learns from known house sizes and prices to predict the price of a new house.',
 'For example, understanding a method lets you solve a new exam question, even if you have never seen that exact question before.',
 'For example, fitting a straight line to a strongly curved pattern leaves a systematic error.',
 'For example, a higher-degree polynomial can pass through more training points while becoming less reliable between them.',
 'For example, memorizing the quirks of one practice exam may fail to help you solve a different exam.',
 'For example, replacing a few training points can cause an overfitted curve to change dramatically.',
 'For example, a linear model may miss a curve, while a very high-degree polynomial may chase noise. Validation helps choose a useful middle ground.',
 'For example, reserve some examples from training and use them to compare candidate model settings.',
 'For example, L2 regularization discourages very large weights, which can reduce sensitivity to noisy data.',
 'For example, when two models fit similarly, an L2 penalty favors the model with the smaller sum of squared weights.',
 'For example, try several values of the penalty strength λ and compare validation errors before a final test.',
 'For example, a model with slightly lower training accuracy but better test accuracy may be more useful in practice.'
];
