# ClinicalCode project page

Static project page for **Animating the Clinical Source Code of Disease Progression for Medical World Models** by Qi Chen, Alan L. Yuille, and Jieneng Chen.

Target URL: https://qic999.github.io/projects/ClinicalCode/

This directory is published through GitHub Pages. To preview locally, serve the repository root with a static HTTP server that supports byte ranges, then open `/projects/ClinicalCode/`. Byte-range support enables video seeking. No package installation or build step is required. JavaScript dependencies, fonts, the liver-case demonstration, and gallery thumbnails are local. The SomaAtlas inspector loads source GLB models from `somaatlas.org` on demand, and its downloads link to the original hosted assets.

## Contents

- `index.html`: the selected Impeccable layout, with the new liver-case film, anatomy-grounded interactive explorer, manuscript result tables, and citation. The explorer retains the Case explorer and Inside the code tabs; the framework tab and its contents were removed at the author’s request.
- `case-film/`: deterministic 34-second workflow animation. `window.__CASE_FILM__.frame(seconds)` is asynchronous; `?render=1` hides playback controls. CT, Parsing, ClinicalCode, Tumor Growth, and Treatment Simulation arrive progressively. The final step displays the selected action, TACE.
- `assets/video/clinicalcode-workflow-steps.mp4`: the current embedded video; 1920 × 1080, 24 fps, H.264, 34 seconds, silent, with English WebVTT captions.
- `assets/js/liver-case.js` and `liver-case-view.js`: recorded CT slices, independently switchable organ/lesion/muscle/fat overlays, synchronized ClinicalCode fields, 3D liver context, lesion detail, and registered CT sections. The shared `workflow-sequence.js` controller starts with CT and only advances the timeline after the visitor presses Play. The example view menu opens the original manual camera controls.
- `assets/images/liver-case-poster.jpg`: still from the new case animation.
- `designs/`: the earlier three-way skill comparison; the selected Impeccable preview also has the new case. The other two studies retain the earlier explorer.
- `demo/`: deterministic 48-second animation. Four simultaneous regions show **CT → Parsing → ClinicalCode → Simulation**. `window.__FILM__.render(seconds)` seeks to a frame; `?render=1` hides playback controls.
- `assets/video/clinicalcode-demo.mp4`: 1920 × 1080, 24 fps, H.264, 48 seconds, silent, with fast-start metadata and English WebVTT captions.
- `assets/images/workflow-real-ct.png`: still exported from the animation, with original CT pixels, corresponding reference masks, and reconstructed mesh.
- `assets/images/workflow-overview.png`: AI-generated concept illustration, on white without an enclosing outer frame.
- `assets/images/clinicalcode-logo.png`: transparent logo created with the native image generation tool: code braces, anatomy, and evolving lesion contours.
- `assets/ct/`: de-identified windowed CT slices and matching liver/lesion reference overlays, copied unchanged from the stored demonstration, plus new data-derived muscle/fat display layers.
- `assets/data/ct-case.json`: sanitized baseline metadata and source measurements; no original case identifier or private source paths.
- `assets/data/anatomy-mesh.json`: surfaces extracted from the same reference segmentation. Smoothing affects display geometry only; measurements come from the source voxel counts.
- `assets/data/trajectories.json`: frozen illustrative rule-driven trajectories, with their original numeric values preserved.
- `assets/data/results.csv`: selected manuscript comparison rows; CT single-model and ensemble configurations are separate.

The pre-rendered MP4s use recorded CT and reference liver/lesion masks. The interactive case and HTML case-film renderer additionally expose automated muscle and estimated fat layers. In the current explorer, both the liver and lesion baseline surfaces come from the same reference segmentation. The displayed future lesion volume is the baseline voxel measurement multiplied by the unchanged rule-contract volume ratio. The inner core schematically encodes necrotic fraction; it is not an observed necrosis segmentation. The uncertainty envelope is illustrative. These rollouts are not fitted forecasts for that CT case and do not demonstrate causal treatment benefit. Manuscript scores are independent of these illustrative fixtures.

The display loader corrects the stored marching-cubes face winding before computing outward normals. It does not change source vertices, mask pixels, or measurements. CT sections use the image-space millimeter transform and orientation of the original slice exporter.

## Parsing tissue layers

The same 46-slice arterial CT now has four independent display layers: **Organ**, **Lesion**, **Muscle**, and **Fat**. The CT pixels, reference liver/lesion masks, baseline measurements, and illustrative lesion dynamics are unchanged. New layers follow the original `np.rot90` orientation and nearest-neighbor 448 × 448 mask export. Color-coded checkbox controls identify each layer; source descriptions are available on the controls without an extra visible paragraph.

- **Muscle:** a new frozen [TotalSegmentator](https://github.com/wasserth/TotalSegmentator) `abdominal_muscles` inference on this exact stored arterial CT. It is the visible union of named muscle labels, not a complete skeletal-muscle segmentation. The existing portal-venous-phase experiment masks were not substituted. Original output shape and affine are checked against the input. Reference liver/lesion annotations have display priority.
- **Fat:** a conservative body-constrained intensity estimate, using the same CT and the model's body mask. The stored scan is cropped and preprocessed to approximately −175 to 600; lower-bound saturation and its immediate interface are excluded because clipped air cannot be distinguished from fat. The remaining fat-range candidates up to −30 undergo an in-plane opening and small-component removal, excluding liver, lesion, and muscle. This is not a reference annotation, a SAT/VAT subdivision, or a quantitative body-composition measurement. The general intensity-based approach is described by [Fully automated body composition analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC7979624/); the conservative filtering is specific to this stored replay.

Method and scope are retained in `assets/data/ct-case.json` and PNG metadata. Only sanitized derived PNG overlays are published; original NIfTI files, source identifiers, server paths, and inference logs stay outside the deployment. TotalSegmentator citation: Wasserthal et al., *TotalSegmentator: Robust Segmentation of 104 Anatomic Structures in CT Images*, [Radiology: Artificial Intelligence (2023)](https://pubs.rsna.org/doi/10.1148/ryai.230024).

## Design and dependencies

The author selected the Impeccable study: a centered research header, linear reading flow, white canvas, medical navy and clinical teal. The workflow preserves the four separate parts requested by the author, with no tinted background or enclosing outer border. The logo and concept illustration were created using native image generation; CT replay and 3D reference meshes were not generated by that tool.

Design references: [4DCodeBench](https://4dcodebench.com/) for the initial code-and-render diagram concept; [VGGT](https://vgg-t.github.io/) and [MoGe](https://wangrc.site/MoGePage/) for bringing visual results and interactive inspection forward; [Nerfies](https://nerfies.github.io/) for a concise explanatory narrative; [SAM 2](https://ai.meta.com/research/sam2/) for capability-to-demo organization. No reference-page CSS is loaded in this version.

## Affiliation logos and SomaAtlas asset gallery

The header uses the existing Johns Hopkins and Stanford SVG wordmarks, preserving author affiliation numbers. The white Impeccable layout remains unchanged outside this addition.

The `#assets` section presents ten anatomical models from [SomaAtlas](https://somaatlas.org/) in the order below. The desktop grid has two rows of five above 1050 px, three columns at 701–1050 px, and two columns at 700 px or below. The selection emphasizes tissue appearance and anatomical structure on the existing white page, without an added tinted background or enclosing frame. The ultrasound-guided biopsy card, image, and catalog entry have been removed.

| Anatomical assembly | Selectable source objects |
| --- | ---: |
| Heart | 14 |
| Liver & biliary | 7 |
| Lungs | 5 |
| Kidneys | 2 |
| Stomach | 1 |
| Pancreas | 1 |
| Spleen | 1 |
| Trachea & bronchi | 3 |
| Muscles & tendons | 176 |
| Arteries & veins | 2 merged groups |

The ten models contain **212 named selectable source objects**. These are anatomical objects, not independent patients or simulation scenarios. The five original models are retained; kidneys, stomach, pancreas, spleen, and trachea/bronchi come from the [SomaAtlas organ manifest](https://somaatlas.org/data/organs/manifest.json). The muscle assembly contains 170 muscles and 6 tendons/aponeuroses, grouped by original anatomical names rather than appearance materials. The vascular source's 141 structures are merged into arteries and veins; individual branches cannot be selected separately.

Selecting an anatomical entry opens an inline, keyboard-accessible inspector with group and individual isolation, show/hide controls, structure search, display-only separation, and reset. Single-surface models use the full viewer width without redundant structure controls. Reset, original GLB download, and close are icon controls with accessible names. Original models load from SomaAtlas on demand. One renderer renders on interaction and keeps at most two source assemblies cached; geometry and materials remain unchanged.

At the author's request, the page omits repeated interaction hints, asset size/topology counters, per-card descriptions, exported-record controls, and expanded source/explanation panels. Asset records, scope, provenance, and notices remain in the catalog and the footer's Sources & credits link. The case explorer keeps its concise illustrative-state label, numerical units, and color legend; the scientific context above remains documented here. Core overview, results, citation, and interaction controls are retained.

The ten transparent WebP anatomy thumbnails are 600 × 600 renders of the unchanged source models and total **345,288 bytes**. The muscle and vascular thumbnails frame the torso; their complete assemblies remain available in the inspector.

The 88 CT label surfaces and 10 fetal MRI atlas surfaces are available through the separate [CT / MRI parsing atlas](https://somaatlas.org/atlas/) link. The recorded [SOFA contact replay](https://somaatlas.org/playground/?mode=mechanics) is a separate contextual link. Neither collection contributes to the anatomical gallery count.

Catalog: `assets/data/somaatlas.json`. Full retained source notices and thumbnail provenance: `assets/data/somaatlas-notices/`, including `thumbnail-provenance.json`, the five new `*-source-record.json` copies, and `organs-*` notices. Upstream appearance maps include tissue photographs and generated teaching illustrations; their original provenance, attribution, licenses, and source exceptions are retained. The kidney source may include Lissie Cowley's CC-BY-NC 4.0 model; the exact upstream mapping is unresolved, so its noncommercial-use caveat remains pending clarification. No anatomy, texture, or simulation result was generated for this gallery extension. Tissue appearance does not establish measured mechanical properties. Historical CT/MRI source notices remain with the linked imaging examples, and original asset downloads remain hosted by SomaAtlas.

New viewer dependency: the official Three.js 0.167.1 `GLTFLoader`, covered by the existing Three.js MIT license. Source and download URLs were verified on 6 October 2026.

Three.js 0.167.1 is distributed under the MIT license in `assets/vendor/THREE-LICENSE.txt`. Inter is distributed under the SIL Open Font License in `assets/fonts/INTER-LICENSE.txt`. Institutional marks identify the authors' affiliations.
