import { GUI, GUIController } from 'dat.gui'

export function calculateNormals(vs: number[], ind: number[]) {
  const x = 0, y = 1, z = 2
  const ns: number[] = []

  for (let i = 0; i < vs.length; i += 3) {
    ns[i + x] = 0.0
    ns[i + y] = 0.0
    ns[i + z] = 0.0
  }

  for (let i = 0; i < ind.length; i += 3) {
    const v1: number[] = []
    const v2: number[] = []
    const normal: number[] = []

    // p2 - p1
    v1[x] = vs[3 * ind[i + 2] + x] - vs[3 * ind[i + 1] + x]
    v1[y] = vs[3 * ind[i + 2] + y] - vs[3 * ind[i + 1] + y]
    v1[z] = vs[3 * ind[i + 2] + z] - vs[3 * ind[i + 1] + z]

    // p0 - p1
    v2[x] = vs[3 * ind[i] + x] - vs[3 * ind[i + 1] + x]
    v2[y] = vs[3 * ind[i] + y] - vs[3 * ind[i + 1] + y]
    v2[z] = vs[3 * ind[i] + z] - vs[3 * ind[i + 1] + z]

    // Cross product by Sarrus Rule
    normal[x] = v1[y] * v2[z] - v1[z] * v2[y]
    normal[y] = v1[z] * v2[x] - v1[x] * v2[z]
    normal[z] = v1[x] * v2[y] - v1[y] * v2[x]

    // Update the normals of that triangle: sum of vectors
    for (let j = 0; j < 3; j++) {
      ns[3 * ind[i + j] + x] = ns[3 * ind[i + j] + x] + normal[x]
      ns[3 * ind[i + j] + y] = ns[3 * ind[i + j] + y] + normal[y]
      ns[3 * ind[i + j] + z] = ns[3 * ind[i + j] + z] + normal[z]
    }
  }

  // normalize
  for (let i = 0; i < vs.length; i += 3) {
    const nn: number[] = []
    nn[x] = ns[i + x]
    nn[y] = ns[i + y]
    nn[z] = ns[i + z]

    let len = Math.sqrt((nn[x] * nn[x]) + (nn[y] * nn[y]) + (nn[z] * nn[z]))
    if (len === 0) len = 1.0

    nn[x] = nn[x] / len
    nn[y] = nn[y] / len
    nn[z] = nn[z] / len

    ns[i + x] = nn[x]
    ns[i + y] = nn[y]
    ns[i + z] = nn[z]
  }

  return ns
}

export function configureControls(settings: { [key: string]: any }, options: any = {width: 300}) {
  const gui = new GUI()
  const state: { [key: string]: any } = {}

  const isAction = (v: any) => typeof v === 'function'
  const isFolder = (v: any) => !isAction(v) && typeof v === 'object' && (v.value === null || v.value === undefined)
  const isColor = (v: any) => (typeof v === 'string' && ~v.indexOf('#')) || (Array.isArray(v) && v.length >= 3)

  Object.keys(settings).forEach(key => {
    const settingValue = settings[key]

    if (isAction(settingValue)) {
      state[key] = settingValue
      return
    }

    if (isFolder(settingValue)) {

      return
    }

    const {
      value,
      min,
      max,
      step,
      options,
      onChange = () => null
    } = settingValue

    state[key] = value

    let controller: GUIController

    if(options) {
      controller = gui.add(state, key, options)
    } else if(isColor(value)) {
      controller = gui.addColor(state, key)
    } else {
      controller = gui.add(state, key, min, max, step)
    }

    controller.onChange(v => onChange(v, state))
  })
}
