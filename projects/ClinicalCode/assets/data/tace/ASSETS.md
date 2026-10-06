# TACE animation sources and attribution

## Reference anatomy

[Z-Anatomy / Models-of-human-anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy), source commit `3bdb6a795a5db3c7e6e943d4ad3c4945c354d63e`, recorded in the original demo on 2026-09-12.

- **BodyParts3D — The Database Center for Life Science.** Original model: Kousaku Okubo. Upstream terms: CC BY-SA 2.1 Japan.
- **Z-Anatomy — The libre 3D atlas of anatomy.** Design, 3D and anatomy: Gauthier Kervyn and Z-Anatomy contributors. Terms: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

The adapted anatomical geometry and rendered derivatives use CC BY-SA 4.0. The upstream Blender add-on is by Marcin Zielinski; it is not executed or required by this website.

## Adaptations

The animation is adapted from the original TACE Anatomy Atlas v7 demonstration. Its reference anatomical meshes, catheter, syringe, illustrative hepatic vessels, particle transport and model-time mapping are retained. The access vessels originate in the same Z-Anatomy source and connect to the illustrative hepatic inlet. Muscle surface fibers are procedural visual shading.

This release removes baked interface labels and the enclosing frame, renders the existing scene on white, and presents synchronized whole-body and liver-detail crops with readable HTML labels. The 12-second atlas animation is the final example in the 34-second ClinicalCode workflow.

This website distributes the rendered animations and a frame-to-state timeline. Editable Blender scenes, source object manifests and the source records remain in the original demo archive; they are not included in this web bundle.

The reference atlas is not registered to the adjacent CT example. The transport animation is illustrative and does not encode drug dose, chemotherapy response or patient outcome.
