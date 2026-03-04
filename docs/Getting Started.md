# Getting Started

Strut Your Stuff is a library for strut blocks that span between two anchor points, with collision, clipping, and Flywheel-friendly rendering.

## Dependency setup

Add the Aztech Maven repository to `build.gradle`:

```groovy
repositories {
    maven { // Aztech Maven, home of Strut Your Stuff
        name = "Aztech Maven"
        url = "https://maven.azmod.net/releases"
    }
}
```

### External dependency

Add the dependency to `build.gradle`:

```groovy
dependencies {
    implementation "com.cake.struts:struts:<version>+mc1.21.1"
}
```

Declare the dependency in `neoforge.mods.toml`:

```toml
[[dependencies.yourmodid]]
    modId = "struts"
    type = "required"
    versionRange = "[<version>,)"
    ordering = "AFTER"
    side = "BOTH"
```

### Internal dependency (jar-in-jar)

Use jar-in-jar to ship a single mod jar:

```groovy
dependencies {
    implementation "com.cake.struts:struts:<version>+mc1.21.1"
    jarJar "com.cake.struts:struts:<version>+mc1.21.1"
}
```

## Block and block entity setup

Strut blocks are abstract. A concrete block class, block entity type, and renderer registration are required.

### Required classes

A block entity class is needed (unless you are using registrate, in which case the type argument is provided and this class is not needed):

```java
public class MyStrutBlockEntity extends StrutBlockEntity {
    public MyStrutBlockEntity(final BlockPos pos, final BlockState state) {
        super(ModBlockEntities.MY_STRUT.get(), pos, state);
    }
}
```

A block class is needed to then link properly to your block entity type:

```java
public class MyStrutBlock extends StrutBlock {
    public MyStrutBlock(final Properties properties, final StrutModelType modelType) {
        super(properties, modelType);
    }

    @Override
    protected BlockEntityType<? extends StrutBlockEntity> getStrutBlockEntityType() {
        return ModBlockEntities.MY_STRUT.get();
    }
}
```

### Registrate

This section is for registering your block and block entity with registrate. If you are using deferred registers, skip to the next section.

```java
public static final BlockEntry<MyStrutBlock> MY_STRUT = REGISTRATE.block("my_strut",
        props -> new MyStrutBlock(props, MyStrutModels.GIRDER))
    .properties(p -> p.strength(3f, 6f))
    .register();
```

```java
public static final BlockEntityEntry<MyStrutBlockEntity> MY_STRUT_BE = REGISTRATE
    .blockEntity("my_strut", MyStrutBlockEntity::new)
    .validBlocks(MY_STRUT)
    .renderer(() -> StrutBlockEntityRenderer::new)
    //.visual(() -> StrutFlywheelVisual::new, false) // Only use if you know flywheel is installed, otherwise use the optional compat (see client extensions section below)
    .register();
```

### DeferredRegister

Here is the section for non-registrate users (vanilla). You'll need to register a block and block entity type, and then register the renderer in a client setup event:

```java
public static final DeferredRegister<BlockEntityType<?>> BLOCK_ENTITIES =
    DeferredRegister.create(Registries.BLOCK_ENTITY_TYPE, MOD_ID);

public static final RegistryObject<BlockEntityType<MyStrutBlockEntity>> MY_STRUT =
    BLOCK_ENTITIES.register("my_strut", () ->
        BlockEntityType.Builder.of(MyStrutBlockEntity::new, ModBlocks.MY_STRUT.get())
            .build(null));
```

### Client extensions

For users who are:

- Not using registrate
- May not have flywheel installed

You'll need to register the renderer and optional flywheel visual in a client setup event:

```java
@Mod.EventBusSubscriber(modid = MOD_ID, bus = Mod.EventBusSubscriber.Bus.MOD, value = Dist.CLIENT)
public static class ClientEvents {
    @SubscribeEvent
    public static void registerRenderers(final EntityRenderersEvent.RegisterRenderers event) {
        //Only necessary if you aren't using registrate's .renderer() method
        event.registerBlockEntityRenderer(ModBlockEntities.MY_STRUT.get(), StrutBlockEntityRenderer::new);
        //Needed for both registrate and non registrate users, since the compat for flywheel is optional, and wont be registered by default
        FlywheelCompatLoader.registerStrutVisual(ModBlockEntities.MY_STRUT.get());
    }
}
```

> If Flywheel is not present, omit the call to `FlywheelCompatLoader.registerStrutVisual`.
