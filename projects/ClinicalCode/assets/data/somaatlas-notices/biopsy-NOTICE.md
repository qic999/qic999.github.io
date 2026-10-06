# Ultrasound-guided liver biopsy: interactive teaching case

This is an **interactive procedural/kinematic illustration, not validated
mechanics or acoustics**. It contains a generic patient, bed, drapes, a native
atlas liver, teaching lesion and vessel, ultrasound probe, biopsy gun, coaxial
needle, specimen container and five recorded states from the original LifeCode
`BiopsySimulation` implementation. The lesion is an authored ellipsoid; the
patient and liver are not registered to a patient scan.

`biopsy-clinical-case.glb` is self-contained, including all four texture images.
The original exporter omitted meshes hidden in its one static snapshot. This
export keeps those original meshes so a step selector can show the source
implementation's retained core and specimen at the correct later states. No
anatomy or material is invented for this public case. Stable source-node keys
and explicit state visibility were added for reuse.

The original liver mesh has 12,270 triangles and 32 documented small portal
aperture caps. Its shape and proportions are retained. The abdominal wall
window is an educational cutaway, not a representation of an actual open
biopsy incision. Skin and liver appearance use real source photographs. Fat
and muscle maps are explicitly AI-generated tissue illustrations, not patient
photographs, histology, calibrated PBR or measured mechanical properties.

The five steps use prescribed rigid-needle and stylet/cannula movement. The
target-core length is calculated by the original geometric segment/ellipsoid
intersection. It is not a pathology prediction. The visible scan plane and the
internal application's synthetic B-mode view share geometry; no real ultrasound
scan, acoustic wave solver or image acquisition is provided by this scene.
Needle bending, tissue forces, fracture, respiratory motion, bleeding and
clinical outcomes are not solved. The independent SOFA needle/material research
model is a separate implementation and is not the engine for these states.

## Attribution and licenses

| Part | Source and terms |
| --- | --- |
| Liver and documented caps | Z-Anatomy / BodyParts3D; adapted meshes CC BY-SA 4.0. Credit BodyParts3D / Database Center for Life Science / Kousaku OKUBO and Z-Anatomy / Gauthier KERVYN; see `licenses/atlas.LICENSE.txt` and `atlas-provenance.json`. |
| Generic patient | MakeHuman community base asset, CC0 1.0; full records in `licenses/patient.LICENSE.txt`. |
| Liver photograph | Human Hepar, Suseno, public domain: https://commons.wikimedia.org/wiki/File:Human_Hepar.jpg |
| Skin photograph | Anonymous / Pixnio, CC0: https://commons.wikimedia.org/wiki/File:Image_skin_texture.jpg |
| Fat and muscle textures | LifeCode / OpenAI image generation, CC BY 4.0; original prompts and hashes in `licenses/generated-provenance.json`. |
| Instruments and teaching additions | Original LifeCode geometry, CC BY 4.0. |
| Source implementation and state adapter | Apache-2.0; full license in `licenses/code-Apache-2.0.txt`. |

The mixed scene must not be labeled wholly CC0 or wholly original CC BY 4.0.
Retain the component notices and attribution when reusing or adapting it. Texture
photos are embedded unchanged, with tissue-region UV transforms. The supplied
poster is a factual render of the same source scene, not a patient scan.
