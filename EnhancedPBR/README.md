# EnhancedPBRMaterial

增强的原生PBR材质，支持一个`RenderSystem`和一个材质，用于提供实时折射和反射功能。

## 使用

### Unity

下载[SeinEnhancedPBR.unitypackage](./SeinEnhancedPBR.unitypackage)导入，配合**SeinJSUnityToolkit**使用。

[视频演示使用方法](https://gw-office.alipayobjects.com/basement_prod/3b62781e-98d0-490c-8f92-660a9a729d9b.mp4)

### TS

```ts
import * as EnhancedPBR  from 'seinjs-materials/EnhancedPBR';

......
game.addActor('EnhancedPBRRenderSystem', EnhancedPBR.RenderSystemActor, {textureScale: 1});
......
```

```json
{
  "materials": {
    {
			"extensions": {
				"Sein_customMaterial": {
					"className": "EnhancedPBRMaterial",
					"cloneForInst": false,
					"uniforms": {
						"metallic": {
							"type": 5126,
							"value": 0
						},
						"roughness": {
							"type": 5126,
							"value": 1
						},
						"baseColor": {
							"type": 35666,
							"value": [0.7907304, 0.7907304, 0.7907304, 0.1]
						},
						"emissive": {
							"type": 35665,
							"value": [0, 0, 0]
						}
					}
				}
			},
			"doubleSided": true,
			"name": "Material"
		}
  }
}
```
