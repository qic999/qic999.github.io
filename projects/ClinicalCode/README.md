# ClinicalCode project page

Static project page for **Animating the Clinical Source Code of Disease Progression for Medical World Models** by Qi Chen, Alan L. Yuille, and Jieneng Chen.

Published location: https://qic999.github.io/projects/ClinicalCode/

Serve the repository root with `python3 -m http.server 8000`, then open `/projects/ClinicalCode/`. No package installation or build step is required. All runtime dependencies, fonts, data, and media are local.

## Contents

- `index.html`: research page, video, interactive trajectories, result tables, and citation.
- `demo/`: deterministic 48-second HTML animation. `window.__FILM__.render(seconds)` seeks to any frame; `?render=1` hides playback controls for capture.
- `assets/video/clinicalcode-demo.mp4`: 1920 × 1080, 24 fps, H.264, 48 seconds, silent, with fast-start metadata.
- `assets/video/clinicalcode-demo.vtt`: English captions.
- `assets/data/trajectories.json`: frozen illustrative rule-driven trajectories, with their original numeric values preserved.
- `assets/data/results.csv`: selected manuscript comparison rows; CT single-model and ensemble configurations are separate.

The interactive example demonstrates the representation. Its procedural geometry, viability proxy, and uncertainty proxy are not learned patient forecasts or evidence of causal treatment effects. The numerical research results come from the manuscript tables and are independent of the demo fixtures.

## Design and dependencies

The page adapts the layout and base/release styles of [4DCodeBench](https://4dcodebench.com/), credited in the footer. ClinicalCode illustration, page content, controls, and walkthrough are specific to this project. Institutional marks identify the authors’ affiliations.

Three.js 0.167.1 is distributed under the MIT license in `assets/vendor/THREE-LICENSE.txt`. Inter is distributed under the SIL Open Font License in `assets/fonts/INTER-LICENSE.txt`.
