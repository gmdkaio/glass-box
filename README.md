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
A tiny network reads one word and gives odds for the next. Teach it a text and watch it write.
</td>
<td width="50%" valign="top">
<a href="https://gmdkaio.github.io/glass-box/sampling"><img src=".github/assets/modules/sampling.svg" alt="Why answers vary" width="100%"></a><br>
<b><a href="https://gmdkaio.github.io/glass-box/sampling">Why answers vary</a></b><br>
<sub>Using AI · 2 of 7</sub><br>
The model picks each word like weighted dice. See why the same question gets different answers.
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="https://gmdkaio.github.io/glass-box/compounding"><img src=".github/assets/modules/compounding.svg" alt="Long tasks" width="100%"></a><br>
<b><a href="https://gmdkaio.github.io/glass-box/compounding">Long tasks</a></b><br>
<sub>Using AI · 3 of 7</sub><br>
Small chances of a slip multiply over many steps. See how checks between steps win them back.
</td>
<td width="50%" valign="top">
<a href="https://gmdkaio.github.io/glass-box/context"><img src=".github/assets/modules/context.svg" alt="Context" width="100%"></a><br>
<b><a href="https://gmdkaio.github.io/glass-box/context">Context</a></b><br>
<sub>Using AI · 4 of 7</sub><br>
Paste more text and the sentence that holds the answer gets a smaller share of attention.
</td>
</tr>
<tr>
<td width="50%" valign="top">
<a href="https://gmdkaio.github.io/glass-box/quantization"><img src=".github/assets/modules/quantization.svg" alt="Shrinking a model" width="100%"></a><br>
<b><a href="https://gmdkaio.github.io/glass-box/quantization">Shrinking a model</a></b><br>
<sub>Under the hood · 1 of 7 · Local models</sub><br>
Round every number in a model to fewer allowed values, and see what it costs.
</td>
<td width="50%"></td>
</tr>
</table>

Coming next. **Using AI:** Tokenization · Calibration · Retrieval<br>
**Under the hood:** LoRA · Overfitting · Parrot or thinker? · Scaling laws · Double descent · Contamination
<!-- modules:end -->

## Engine

Pure C, no dependencies beyond the standard library. All math lives here; the
web UI only displays what the engine computes.
