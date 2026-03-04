# Cable Integration

Cable struts render a curved span between two anchors while keeping only the attachment points collidable. This is useful for wire-like connections that need sag and clean selection outlines without a solid collision volume.

## When to use cable struts

Cable integration is a fit for spans that should look like flexible cables or wires, not rigid beams. Use standard struts when a full collision volume is required along the span.

## Block setup

Cable rendering is enabled by passing a `CableStrutInfo` to the `StrutBlock` constructor. A null value (or omission) keeps the default rigid strut behavior.

```java
public class CableStrutBlock extends StrutBlock {
    public CableStrutBlock(final Properties properties, final StrutModelType modelType) {
        super(properties, modelType, new CableStrutInfo(
            0.25f,   // sag amount as a length multiplier
            0.995f,  // tangent dot threshold for merging segments
            0.5f,    // minimum sampling step size in blocks
            64       // maximum segment count
        ));
    }

    @Override
    protected BlockEntityType<? extends StrutBlockEntity> getStrutBlockEntityType() {
        return ModBlockEntities.CABLE_STRUT.get();
    }
}
```

## Rendering parameters

Use the single-argument constructor for defaults and only override values that need tuning.

You are free to just provide "sag" and defaults will be provided.

| Field | Description |
| --- | --- |
| `sag` | Sag amount as a length multiplier scaled by total span length. |
| `tangentDotThreshold` | Curve simplification threshold. Closer to 1 reduces segments. |
| `minStep` | Minimum sampling step size in blocks. |
| `maxSegments` | Maximum number of segments for long spans. |

## Collision and outlines

Cable struts only return collision for the anchor attachments. The span itself has no collision geometry, but outlines and previews still follow the curved cable path.

> Use a non-cable strut model when a solid collision volume is required along the full span.

## Related pages

- [Getting Started](./Getting%20Started.md)
