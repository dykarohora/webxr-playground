

// Attributeインデックス
import { PrimitiveAttribute } from './PrimitiveAttribute'

export const ATTRIB = {
  POSITION: 1,
  NORMAL: 2,
  TANGENT: 3,
  TEXCOORD_0: 4,
  TEXCOORD_1: 5,
  COLOR_0: 6
} as const

export const ATTRIB_MAP = new Map<string, number>()
ATTRIB_MAP.set('POSITION', 1)
ATTRIB_MAP.set('NORMAL', 2)
ATTRIB_MAP.set('TANGENT', 3)
ATTRIB_MAP.set('TEXCOORD_0', 4)
ATTRIB_MAP.set('TEXCOORD_1', 5)
ATTRIB_MAP.set('COLOR_0', 6)

export type AttributeType = keyof typeof ATTRIB
export type AttributeValues = typeof ATTRIB[keyof typeof ATTRIB]

export const ATTRIB_KEYS = [
  'POSITION',
  'NORMAL',
  'TANGENT',
  'TEXCOORD_0',
  'TEXCOORD_1',
  'COLOR_0'
] as const

/**
 * attributeをシェーダと紐づけるためのオブジェクト
 */
export class RenderPrimitiveAttribute {

  // シェーダに紐づくこのattributeのインデックス値
  public readonly attribIndex: AttributeValues
  // 1つのattributeに含まれるデータの数
  // たとえばattributeがvec3なら3になるし、vec4ならば4になる
  public readonly componentCount: number
  // attributeのデータの型
  public readonly componentType: GLenum
  // 頂点データ1つあたりのデータサイズ
  public readonly stride: number
  // このattributeが頂点データのどこにあるかを表す
  public readonly byteOffset: number
  // 正規化されているかどうか
  public readonly normalized: boolean

  public constructor(primitiveAttribute: PrimitiveAttribute) {
    this.attribIndex = ATTRIB[primitiveAttribute.name]
    this.componentCount = primitiveAttribute.componentCount
    this.componentType = primitiveAttribute.componentType
    this.stride = primitiveAttribute.stride
    this.byteOffset = primitiveAttribute.byteOffset
    this.normalized = primitiveAttribute.normalized
  }
}
