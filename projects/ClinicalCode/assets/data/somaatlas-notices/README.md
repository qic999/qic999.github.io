# SomaAtlas anatomy on the ClinicalCode project page

Source: https://somaatlas.org/ (verified 6 October 2026 against the public
files and the owning SomaAtlas model manifests).

The main gallery contains ten anatomical models, in this order: Heart,
Liver & biliary, Lungs, Kidneys, Stomach, Pancreas, Spleen, Trachea & bronchi,
Muscles & tendons, and Arteries & veins. The five original models are retained;
the five added organ models come from
https://somaatlas.org/data/organs/manifest.json. The ultrasound-guided biopsy
card, image, and catalog entry have been removed. CT/MRI segmentation surfaces
have their own imaging-atlas link and are excluded from the gallery count.

The inspector loads the original, full-resolution GLBs on demand. The models
contain 14/7/5/2/1/1/1/3/176/2 selectable source objects in gallery order,
**212 in total**. Selections correspond to actual source nodes. The muscle
assembly contains 170 muscles and 6 tendons/aponeuroses, grouped by original
anatomical names. The 141 source vascular structures are merged into arteries
and veins, so individual branches cannot be isolated. Source-node names,
geometry, materials and units remain intact. Separation changes display
positions only and is hidden for single-part models; it is not a physical
simulation or anatomical deformation.

ClinicalCode adaptation: ten transparent 600 × 600 WebP renders, totaling
**345,288 bytes**, with camera framing only. The muscle and vascular overview
thumbnails frame the torso; complete original assemblies remain in the viewer.
No anatomy, texture or simulation result was generated for this gallery.
Upstream appearance maps include tissue photographs and generated teaching
illustrations. See `thumbnail-provenance.json` for source URLs and render
hashes, the five new `*-source-record.json` files for original organ metadata,
and `organs-*` notices for source licenses, texture prompts and provenance.
Per-image records also accompany each WebP.

Required atlas attribution: BodyParts3D — The Database Center for Life Science —
CC-BY-SA 2.1 Japan; Z-Anatomy — The libre 3D atlas of anatomy — CC-BY-SA 4.0.
See Z-Anatomy-License.txt and atlas-source.txt for full source notices and
exceptions. Liver and gallbladder photograph credits and generated appearance
map attribution are retained in atlas-preview.txt and atlas-source.txt.
The preview notice is retained for its appearance/provenance information;
the current inspector uses the original GLBs, not those reduced preview meshes.

The kidney source record states that the model may include Lissie Cowley's
CC-BY-NC 4.0 kidney; exact upstream mapping remains unresolved. Noncommercial
use only pending clarification, as retained in `kidneys-source-record.json`,
`organs-source.txt`, and `organs-urinary-source-LICENSE.txt`. The general atlas
license does not remove this source-specific caveat. New kidney and tracheal
appearance maps are upstream generated educational illustrations, not patient
photography, calibrated PBR measurements, or tissue-mechanics parameters.

`biopsy-NOTICE.md` is retained as a historical source notice only; its scene
and image are no longer part of this gallery.

The separate recorded SOFA contact experiment documents its own geometry,
material assumptions, forces and displacement:
https://somaatlas.org/data/physics/README.md. Anatomical appearance does not
establish calibrated mechanical properties for the gallery models.

Historical imaging-source notices are retained for the linked parsing examples:
CT-LICENSE.txt (3D Slicer CTACardio, automatic TotalSegmentator labels) and
MRI-CC0-LICENSE.txt (King’s College London fetal population atlas, original
10-organ label map). Neither collection contributes to the main gallery count.

## CT Parsing overlays

The separate ClinicalCode case explorer adds automated named-muscle segmentation
from [TotalSegmentator](https://github.com/wasserth/TotalSegmentator) and a
conservative CT intensity-based fat estimate on its original stored arterial CT.
They are distinct from the liver and lesion reference annotations. Methods and
input limitations are documented in the [project README](../../../README.md#parsing-tissue-layers)
and [case metadata](../ct-case.json). No new patient identifiers or NIfTI files
are distributed. Cite Wasserthal et al., Radiology: Artificial Intelligence 2023,
[doi:10.1148/ryai.230024](https://pubs.rsna.org/doi/10.1148/ryai.230024), for
TotalSegmentator.


## TACE atlas animation

Z-Anatomy / BodyParts3D, adapted under CC BY-SA 4.0. See [TACE sources and modifications](../tace/README.md) and [full attribution](../tace/ASSETS.md).
