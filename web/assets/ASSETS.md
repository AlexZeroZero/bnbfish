# 素材来源与生成记录

图像使用内置 image_gen 工具生成，未使用 CLI。原图保留在 Codex generated_images，本包存放项目副本。

- `lake-dawn.png`：1536 × 1024，晨光湖岸，用于远景平面及水面反射。
- `fish-atlas.png`：1024 × 1536 RGBA 透明鱼类图集，10 种鱼。通过 CSS 分区域显示，未用程序抠图。

## 鱼类初始提示词

Use case: stylized-concept. Create a production-quality game fish inventory atlas, 2 columns by 5 rows, exactly 10 distinct fish, each in its own equal rectangular cell with ample 15 percent transparent padding. Image 1024 wide by 1536 high. GENUINELY TRANSPARENT background, no text, no borders, no shadows outside fish, no props. All fish facing left, beautiful detailed realistic premium 3D rendered collectible assets, visible iridescent scales, translucent ray fins, anatomically distinct. Grid order row 1 left: graceful ivory koi with muted copper patches and long flowing tail; row1 right: slender ice blue speckled trout; row2 left: rainbow trout with subtle pink lateral stripe and natural silver scales; row2 right: rich golden yellow longfin koi; row3 left: silver perch with deep compressed body spiny dorsal fin dark bars; row3 right: olive perch with red orange fins; row4 left: long slender majestic sailfish with huge dark blue sail and spear snout, whole fish fits; row4 right: flat mottled sandy brown flounder shown tilted top view two eyes; row5 left: tall diamond shaped freshwater angelfish cream and black stripes long triangular fins; row5 right: elongated gray sturgeon with bony scutes and heterocercal tail. Quiet sophisticated natural colors, no cartoon faces. Equally sized cells, each fish completely isolated and separated. Detailed high-end game art suitable for a premium tranquil fishing app.

## 鱼类最终编辑提示词

Edit target: this ten fish atlas. Remove all the colored and blurred background behind every fish; replace it with genuine transparent alpha. Preserve all fish identity, shapes, colors, fine translucent fins, scales and eyes. Strict 2 columns x 5 equal rows grid for CSS sprites. Each fish entirely inside its cell with 10 percent transparent margins on all four sides, including long swordfish snout and angelfish fins. Keep layout order unchanged. No shadows outside fish, no scenery, no text. Transparent PNG asset.

## 湖景提示词

Use case: stylized-concept. Asset type: photorealistic atmospheric landscape background for a polished tranquil 3D fishing mobile game. Wide 1536x1024 landscape image. Misty alpine forest lake at early golden dawn, soft sage green, warm stone gray, ivory sky and subtle champagne sunlight. Beautiful layered distant mountains with detailed rocky faces and patches of trees, believable varied dense pine and deciduous forest on opposite shore, wisps of low mist. Sky top 45 percent; mountain and forest middle 40 percent; flat horizontal waterline at 85 percent; bottom 15 percent still sage green water and reflections. No close foreground objects, no rod, no people, no interface, no text, no buildings. Gentle sunrise glow towards upper right, no bright sun disc, quiet finely crafted cinematic nature photography look, rich detailed textures without excessive contrast or saturated colors. Composition usable as distant backdrop behind real-time 3D water.

## 字体和运行库

Noto Sans SC 中文字符子集来自 Google Fonts，权重 400、500、600，许可证见 NotoSansSC-OFL.txt。Three.js 0.158.0 的 MIT 许可证见 vendor/THREE-LICENSE.txt。碳纤维、软木和石头纹理由代码生成。

## 0.7 水域美术

river-mist.png：imagegen 生成的竹林喀斯特河谷，1536×1024，2026-09-13。原始文件 exec-daeba796-36d0-4f5c-818f-fbb7423e3538.png。
sea-dusk.png：imagegen 生成的暮色石灰岩海湾，1536×1024，2026-09-13。原始文件 exec-616e3b5e-5b0f-4476-a6b9-73869d99882f.png。
两者均用于弧形背景、实时反射采样及地图选择卡片。无文字、人物或品牌元素。
