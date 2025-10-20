# Page snapshot

```yaml
- application:
  - region "Interactive map":
    - status
    - button "Zoom in"
    - button "Zoom out"
    - button "Reload" [disabled]
    - button "View fullscreen"
    - group "Multiple Extents":
      - checkbox "Multiple Extents" [checked]
      - text: Multiple Extents
      - button "Remove Layer"
      - button "Layer Settings" [expanded]
      - group: Opacity
      - group "Sublayers":
        - group "cbmt":
          - checkbox "cbmt"
          - text: cbmt
          - button "Remove Sub-layer"
          - button "Sub-layer Settings" [expanded]
          - group:
            - text: Opacity
            - slider "Opacity": "0.5"
        - group "alabama_feature":
          - checkbox "alabama_feature" [checked]
          - text: alabama_feature
          - button "Remove Sub-layer"
          - button "Sub-layer Settings"
    - group "One hidden Extent":
      - checkbox "One hidden Extent" [checked]
      - text: One hidden Extent
      - button "Remove Layer"
      - button "Layer Settings"
    - text: 1000 km
    - group "Map data attribution"
    - status: 2.1 centimeters to 1000 kilometers
- textbox
```