<a href="https://gmdkaio.github.io/glass-box/"><img src=".github/assets/banner.svg" alt="Glass Box" width="100%"></a>

Interactive simulations of how AI systems work, with the math behind each one
and the caveats on where toy models stop matching real LLMs.
[Try it in your browser.](https://gmdkaio.github.io/glass-box/)

## Modules

Each module is one simulation. Click a picture to open it.

<!-- modules:start -->
<table>
<tr>
<td width="50%" valign="top">
<a href="https://gmdkaio.github.io/glass-box/how-it-works"><img src=".github/assets/modules/how-it-works.svg" alt="How it works" width="100%"></a><br>
<b><a href="https://gmdkaio.github.io/glass-box/how-it-works">How it works</a></b><br>
<sub>Using AI · 1 of 7</sub><br>
A tiny network reads one word and gives odds for the next, one word at a time.
</td>
<td width="50%" valign="top">
<a href="https://gmdkaio.github.io/glass-box/sampling"><img src=".github/assets/modules/sampling.svg" alt="Why answers vary" width="100%"></a><br>
<b><a href="https://gmdkaio.github.io/glass-box/sampling">Why answers vary</a></b><br>
<sub>Using AI · 2 of 7</sub><br>
The model picks each word like weighted dice, so the same question gets different answers.
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="https://gmdkaio.github.io/glass-box/compounding"><img src=".github/assets/modules/compounding.svg" alt="Long tasks" width="100%"></a><br>
<b><a href="https://gmdkaio.github.io/glass-box/compounding">Long tasks</a></b><br>
<sub>Using AI · 3 of 7</sub><br>
Small chances of a slip multiply over many steps, and checks between steps win them back.
</td>
<td width="50%" valign="top">
<a href="https://gmdkaio.github.io/glass-box/context"><img src=".github/assets/modules/context.svg" alt="Context" width="100%"></a><br>
<b><a href="https://gmdkaio.github.io/glass-box/context">Context</a></b><br>
<sub>Using AI · 4 of 7</sub><br>
The more text you paste, the smaller the share of attention the answer gets.
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="https://gmdkaio.github.io/glass-box/tokenization"><img src=".github/assets/modules/tokenization.svg" alt="Tokenization" width="100%"></a><br>
<b><a href="https://gmdkaio.github.io/glass-box/tokenization">Tokenization</a></b><br>
<sub>Using AI · 5 of 7</sub><br>
The model reads text as numbered chunks, so the letters inside them are hidden from it.
</td>
<td width="50%" valign="top">
<a href="https://gmdkaio.github.io/glass-box/calibration"><img src=".github/assets/modules/calibration.svg" alt="Calibration" width="100%"></a><br>
<b><a href="https://gmdkaio.github.io/glass-box/calibration">Calibration</a></b><br>
<sub>Using AI · 6 of 7</sub><br>
How sure a model sounds, compared with how often it is right.
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="https://gmdkaio.github.io/glass-box/retrieval"><img src=".github/assets/modules/retrieval.svg" alt="Retrieval" width="100%"></a><br>
<b><a href="https://gmdkaio.github.io/glass-box/retrieval">Retrieval</a></b><br>
<sub>Using AI · 7 of 7</sub><br>
Before the model answers from documents, a search picks the few pages it gets to read.
</td>
<td width="50%" valign="top">
<a href="https://gmdkaio.github.io/glass-box/quantization"><img src=".github/assets/modules/quantization.svg" alt="Shrinking a model" width="100%"></a><br>
<b><a href="https://gmdkaio.github.io/glass-box/quantization">Shrinking a model</a></b><br>
<sub>Under the hood · 1 of 8 · Local models</sub><br>
Rounding every number in a model to fewer values saves memory and costs accuracy.
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="https://gmdkaio.github.io/glass-box/memory"><img src=".github/assets/modules/memory.svg" alt="Fitting in memory" width="100%"></a><br>
<b><a href="https://gmdkaio.github.io/glass-box/memory">Fitting in memory</a></b><br>
<sub>Under the hood · 2 of 8 · Local models</sub><br>
A model needs memory for its numbers and for a cache that grows with every token of the chat.
</td>
<td width="50%" valign="top">
<a href="https://gmdkaio.github.io/glass-box/embeddings"><img src=".github/assets/modules/embeddings.svg" alt="Embeddings" width="100%"></a><br>
<b><a href="https://gmdkaio.github.io/glass-box/embeddings">Embeddings</a></b><br>
<sub>Under the hood · 3 of 8</sub><br>
Words used in similar places get similar numbers, which is how search by meaning works.
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="https://gmdkaio.github.io/glass-box/sampling-settings"><img src=".github/assets/modules/sampling-settings.svg" alt="Sampling settings" width="100%"></a><br>
<b><a href="https://gmdkaio.github.io/glass-box/sampling-settings">Sampling settings</a></b><br>
<sub>Under the hood · 4 of 8 · Local models</sub><br>
Before each pick, top-k, top-p and min-p drop unlikely words, and a repeat penalty lowers words already used.
</td>
<td width="50%" valign="top">
<a href="https://gmdkaio.github.io/glass-box/lora"><img src=".github/assets/modules/lora.svg" alt="LoRA" width="100%"></a><br>
<b><a href="https://gmdkaio.github.io/glass-box/lora">LoRA</a></b><br>
<sub>Under the hood · 5 of 8 · Fine-tuning</sub><br>
LoRA trains a thin patch beside a frozen model, and a low rank is enough for most changes.
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="https://gmdkaio.github.io/glass-box/learning-rate"><img src=".github/assets/modules/learning-rate.svg" alt="Learning rate" width="100%"></a><br>
<b><a href="https://gmdkaio.github.io/glass-box/learning-rate">Learning rate</a></b><br>
<sub>Under the hood · 6 of 8 · Fine-tuning</sub><br>
The learning rate sets how big each training step is: too small barely learns, too big overshoots.
</td>
<td width="50%" valign="top">
<a href="https://gmdkaio.github.io/glass-box/overfitting"><img src=".github/assets/modules/overfitting.svg" alt="Overfitting" width="100%"></a><br>
<b><a href="https://gmdkaio.github.io/glass-box/overfitting">Overfitting</a></b><br>
<sub>Under the hood · 7 of 8 · Fine-tuning</sub><br>
Trained too long on too little text, a model learns it by heart and gets worse at everything else.
</td>
</tr>
</table>

Coming next. **Under the hood:** Evaluating a model
<!-- modules:end -->

## Engine

Pure C, no dependencies beyond the standard library. All math lives here; the
web UI only displays what the engine computes.
