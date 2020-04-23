/**
 * @File   : index.ts
 * @Author : dtysky (dtysky@outlook.com)
 * @Date   : 6/17/2019, 11:26:28 AM
 * @Description:
 */
import * as Sein from 'seinjs';

export function isMaterial(value: Sein.Material): value is Material {
  return (value as Material).isEnhancedPBRMaterial;
}

export interface IMaterialUniforms {
/**
     * 基础颜色
     */
    baseColor?: Sein.Color;

    /**
     * 基础颜色贴图
     */
    baseColorMap?: Sein.Texture;

    /**
     * 金属度
     */
    metallic?: number;

    /**
     * 金属度贴图
     */
    metallicMap?: Sein.Texture;

    /**
     * 粗糙度
     */
    roughness?: number;

    /**
     * 粗糙度贴图
     */
    roughnessMap?: Sein.Texture;

    /**
     * 金属度及粗糙度贴图，金属度为B通道，粗糙度为G通道，可以指定R通道作为环境光遮蔽
     */
    metallicRoughnessMap?: Sein.Texture;

    /**
     * 环境光遮蔽贴图
     */
    occlusionMap?: Sein.Texture;

    /**
     * 环境光遮蔽贴图(occlusionMap)包含在 metallicRoughnessMap 的R通道中
     */
    isOcclusionInMetallicRoughnessMap?: boolean;

    /**
     * 漫反射辐照(Diffuse IBL)贴图
     */
    diffuseEnvMap?: Sein.CubeTexture | Sein.Texture;

    /**
     * BRDF贴图，跟环境反射贴图一起使用 [示例]{@link https://gw.alicdn.com/tfs/TB1EvwBRFXXXXbNXpXXXXXXXXXX-256-256.png}
     */
    brdfLUT?: Sein.Texture;

    /**
     * 环境反射(Specular IBL)贴图
     */
    specularEnvMap?: Sein.CubeTexture | Sein.Texture;

    /**
     * 放射光贴图，或颜色
     */
    emission?: Sein.Texture | Sein.Color;

    /**
     * 是否基于反射光泽度的 PBR，具体见 [KHR_materials_pbrSpecularGlossiness]{@link https://github.com/KhronosGroup/glTF/tree/master/extensions/Khronos/KHR_materials_pbrSpecularGlossiness}
     */
    isSpecularGlossiness?: boolean;

    /**
     * 镜面反射率，针对 isSpecularGlossiness 渲染
     */
    specular?: Sein.Color;

    /**
     * 光泽度，针对 isSpecularGlossiness 渲染，默认PBR无效
     */
    glossiness?: number;

    /**
     * 镜面反射即光泽度贴图，RGB 通道为镜面反射率，A 通道为光泽度
     */
    specularGlossinessMap?: Sein.Texture;

    /**
     * 折射贴图。
     */
    refractionMap?: Sein.Texture;
}

/**
 * @hidden
 */
function processUniforms(uniforms: IMaterialUniforms) {
  const newUniforms: any = {};

  Object.keys(uniforms).forEach(key => {
    newUniforms[key] = uniforms[key].value;
  });

  return newUniforms;
}

@Sein.SMaterial({className: 'EnhancedPBRMaterial'})
export default class Material extends Sein.PBRMaterial {
  public isEnhancedPBRMaterial = true;
  public refractionMap: Sein.Texture;
  public className = 'Material';

  public constructor(options: {
    uniforms: IMaterialUniforms
  }) {
    super(processUniforms((options || {uniforms: null}).uniforms));
  }

  public onBeforeCompile(vs: string, fs: string) {
    fs = fs.replace(/(void\s+main\s*\()/, `
uniform vec2 u_rendererSize;
uniform sampler2D u_refractionMap;
uniform float u_refractionOffsetX;
uniform float u_refractionOffsetY;
$1`);

    fs = fs.replace(/(#ifdef HILO_IGNORE_TRANSPARENT)/, `                       
vec2 screenUV = gl_FragCoord.xy/u_rendererSize;
vec2 bump = normal.xy;
vec4 screenColor = texture2D(u_refractionMap, screenUV - bump * vec2(u_refractionOffsetX, u_refractionOffsetY)).rgba;

if (color.a <= 0.99 && screenColor.a > 0.5) {
    color.rgb *= color.a;
    color.rgb += (1. - color.a) * screenColor.rgb;
}
$1
`);

    return {
        vs: vs,
        fs: fs
    };
  }

  public initCommonOptions() {
    this.premultiplyAlpha = false;
    this.uniforms['u_refractionMap'] = {
      get:function(mesh, material, programInfo){
        return Sein.Semantic.handlerTexture(material.refractionMap, programInfo.textureIndex);
      }
    };
    this.uniforms['u_refractionOffsetX'] = {
      get:function(mesh, material, programInfo){
        return material.refractionOffsetX;
      }
    };
    this.uniforms['u_refractionOffsetY'] = {
      get:function(mesh, material, programInfo){
        return material.refractionOffsetY;
      }
    };

    if ((this as any).workflow === 1) {
      this.isSpecularGlossiness = true;
    }
    delete (this as any).workflow;
  
    if ((this as any).unlit) {
      (this as any).lightType = 'NONE';
    }
    delete (this as any).unlit;

    this.isDirty = true;
  }
}

export interface IRenderSystemOptions {
  textureScale: number;
}

export class RenderSystemActor extends Sein.RenderSystemActor<IRenderSystemOptions> {
  private buffer: Sein.FrameBuffer;

  public onAdd(initOptions: IRenderSystemOptions) {
    const {renderer} = this.getGame();

    this.buffer = new Sein.FrameBuffer(this.getGame(), {
      width: renderer.width * initOptions.textureScale,
      height: renderer.height * initOptions.textureScale
    });
  }

  public onPreRender() {
    const {mainCamera, actors} = this.getWorld();
    const materials: {[id: string]: {side: number}} = {};

    actors.forEach(actor => actor.findComponentsByFilter<Sein.PrimitiveComponent>(Sein.isPrimitiveComponent).forEach(component => {
      component.getMaterials().forEach(material => {
        if (!materials[material.id]) {
          materials[material.id] = {side: material.side};
        }

        material.side = Sein.Constants.BACK
        if (isMaterial(material)) {
          component.getSubMesh((material as any).name).visible = false;
        }
      });
    }));

    mainCamera.render(this.buffer);

    actors.forEach(actor => actor.findComponentsByFilter<Sein.PrimitiveComponent>(Sein.isPrimitiveComponent).forEach(component => {
      component.getMaterials().forEach(material => {
        material.side = materials[material.id].side;
        if (isMaterial(material)) {
          material.refractionMap = this.buffer.texture;
          component.getSubMesh((material as any).name).visible = true;
        }
      });
    }));
  }

  public onDestroy() {
    this.buffer.destroyResource();
  }
}

export function active(game: Sein.Game) {
  game.addActor('EnhancedPBRRenderSystem', RenderSystemActor, {textureScale: 1});
}
