export const sample = [
 ['Welcome back. Today we’re going to explore how machine learning models learn from data.','今天我们讨论 machine learning 模型如何从数据中学习。','模型通过训练样本调整参数，学习输入与输出之间的规律。','例如，根据房屋面积和售价样本，学习如何预测新房子的价格。'],
 ['Our goal is not simply to memorize the training examples, but to generalize to new, unseen data.','Generalization 指模型对没见过的新数据也能做出准确预测。','记住训练答案不代表学会规律。我们真正关心模型在新样本上的表现。','像备考时理解解题方法，而不只是背熟练习题答案。'],
 ['A very simple model may miss the underlying pattern. We call this underfitting, or high bias.','Underfitting（欠拟合）是模型过于简单，连主要规律都没学到。','High bias 指模型的假设太强，导致训练集和测试集都表现不好。','用一条直线拟合明显弯曲的数据，往往会产生系统性误差。'],
 ['As we increase model complexity, the training error usually decreases.','模型越复杂，通常越容易贴合训练数据，所以 training error 会下降。','训练误差下降只说明对已有数据拟合更好，并不保证对新数据预测更好。','多项式次数越来越高时，曲线能够穿过更多训练点。'],
 ['However, a model that fits every training point can also capture noise. This is called overfitting.','Overfitting（过拟合）是模型连训练数据中的 noise 都记住了。','噪声是偶然变化，而不是可以推广到新数据的规律。过度学习噪声会损害泛化能力。','好比背熟了模拟卷的每个错别字，却不会解新的题目。'],
 ['This increases the variance: small changes in the training data can lead to very different predictions.','这里的 this 指过度拟合：数据稍变，预测就可能大变，这就是 high variance。','结合前一句，复杂模型不仅学到规律，还学到随机噪声，因此对训练样本特别敏感。','换几个训练样本后，拟合曲线就明显改变；这说明模型不够稳定。'],
 ['The bias–variance tradeoff describes the balance between an overly simple model and an overly sensitive one.','Bias–variance tradeoff 是在模型过于简单与过于敏感之间寻找平衡。','模型简单可能欠拟合，模型过于灵活又可能过拟合；目标是让新数据上的误差更小。','就像选择衣服尺码：过松和过紧都不合适，关键是适合实际使用。'],
 ['To evaluate generalization, we hold out a validation set that the model does not see during training.','Validation set（验证集）是在训练时留出的数据，用来检查泛化能力。','它帮助我们比较模型与调节超参数。最终评价还需要独立的 test set。','把部分练习题留到训练结束后再做，检查是否掌握了方法。'],
 ['Regularization adds a penalty for complexity, encouraging the model to find a simpler solution.','Regularization（正则化）通过惩罚复杂度，让模型倾向于更简单的解。','它限制模型过度追随噪声的能力，通常能降低方差，但也可能增加偏差。','L2 regularization 会惩罚过大的权重，让模型预测更平滑。'],
 ['For example, L2 regularization penalizes the sum of squared weights in the loss function.','L2 regularization 在 loss 中加入权重平方和的惩罚项。','目标函数变为原始损失加 λ∑w²；λ 越大，对大权重的惩罚越强。','若两个模型预测相近，L2 会偏好权重整体更小的那个。'],
 ['The regularization strength is a hyperparameter. We choose it using validation performance.','正则化强度是 hyperparameter，通常根据验证集表现选择。','它不是直接从训练损失中学习到的权重，而是控制训练过程的设置。','试几组 λ，选验证误差较低的值，再用独立测试集评估。'],
 ['Remember: the best model is the one that performs well on new data, not just on the examples it has already seen.','选择模型时，应关注新数据上的表现，而不只是 training accuracy。','训练结果、验证结果和最终测试结果各有用途；泛化能力才是本节课的核心。','一个训练准确率略低但测试更好的模型，通常更值得使用。']
].map(([text,short,detail,example],id)=>({id:`sample-${id}`,time:id*8,text,short,detail,example}));
export function contextFor(rows,id) { const i=rows.findIndex(x=>x.id===id); return i<0?[]:rows.slice(Math.max(0,i-3),i+1); }
export function timestamp(seconds=0) {return `${Math.floor(seconds/60).toString().padStart(2,'0')}:${Math.floor(seconds%60).toString().padStart(2,'0')}`;}
export function exportNotes(rows,answers,saved) {
 return '# Lecture Companion · Session notes\n\n'+rows.map(r=>`## ${timestamp(r.time)}${saved.includes(r.id)?' · Saved':''}\n\n${r.text}\n\n${answers[r.id]?.short||''}`).join('\n\n');
}
