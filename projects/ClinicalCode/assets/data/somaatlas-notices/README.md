# SomaAtlas anatomy on the ClinicalCode project page

Source: https://somaatlas.org/ (verified 6 October 2026 against the public
files and the owning SomaAtlas model manifests).

The main gallery contains five anatomical assemblies: heart, hepatobiliary
anatomy, lungs, superficial muscles/tendons, and major arteries/veins. The
sixth entry links to the existing ultrasound-guided liver biopsy teaching
scene. CT/MRI segmentation surfaces have their own imaging-atlas link and
are not included as anatomical assets in this gallery.

The inspector loads the original, full-resolution GLBs on demand. The 14 heart
parts, 7 hepatobiliary parts, 5 lung lobes, 176 muscle/tendon parts and 2 vascular
groups correspond to actual named source nodes. The 141 source vascular
structures are merged into two meshes, so individual vessel branches cannot
be isolated in this viewer. Original names, geometry, materials and units
remain intact. The separation slider changes display positions only; it is
not a physical simulation or anatomical deformation.

ClinicalCode adaptation: transparent 840 × 600 WebP renders with camera
framing only. The muscle and vascular overview thumbnails frame the torso;
the complete original assemblies are available in the viewer. No anatomy,
texture or simulation result was generated for this gallery. Appearance maps
in the upstream assets include both photographic and generated tissue imagery,
with their original provenance retained. See thumbnail-provenance.json for
source URLs and hashes. Per-image source records also accompany each WebP.

Required atlas attribution: BodyParts3D — The Database Center for Life Science —
CC-BY-SA 2.1 Japan; Z-Anatomy — The libre 3D atlas of anatomy — CC-BY-SA 4.0.
See Z-Anatomy-License.txt and atlas-source.txt for full source notices and
exceptions. Liver and gallbladder photograph credits and generated appearance
map attribution are retained in atlas-preview.txt and atlas-source.txt.
The preview notice is retained for its appearance/provenance information;
the current inspector uses the original GLBs, not those reduced preview meshes.

The biopsy image is the source Blender render at
https://somaatlas.org/data/biopsy/biopsy-clinical.png. Its pixels are unchanged.
The public case contains prescribed kinematic states and an educational
cutaway. It is not a measured ultrasound scan or a validated tissue mechanics
simulation. Full case attribution and limitations: biopsy-NOTICE.md.

The separate recorded SOFA contact experiment documents its own geometry,
material assumptions, forces and displacement:
https://somaatlas.org/data/physics/README.md. Anatomical appearance does not
establish calibrated mechanical properties for the gallery models.

Historical imaging-source notices are retained for the linked parsing examples:
CT-LICENSE.txt (3D Slicer CTACardio, automatic TotalSegmentator labels) and
MRI-CC0-LICENSE.txt (King’s College London fetal population atlas, original
10-organ label map). Neither collection contributes to the main gallery count.
