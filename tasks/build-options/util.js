function deepCopy (obj) {
  if (!(obj instanceof Object)) {
    return obj
  }
  let copy
  if (Array.isArray(obj)) {
    copy = []
  } else {
    copy = {}
  }
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      copy[key] = deepCopy(obj[key])
    }
  }
  return copy
}

function dictMerge (target, ...args) {
  // Merge multiple objects
  if (args.length > 1) {
    for (const obj of args) {
      dictMerge(target, obj)
    }
    return target
  }

  // Recursively merge objects and set non-object values
  const obj = args[0]
  if (!(obj instanceof Object)) {
    return obj
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k in target && (target[k] instanceof Object)) {
      target[k] = dictMerge(target[k], v)
    } else {
      target[k] = deepCopy(v)
    }
  }
  return target
}

/*
 * parseColormapValue: Parses a GIBS ColorMapEntry value attribute such as
 * "[0,1.181e+14)", "[350,+INF)", "[-INF,150)" or "[5]" into a list of numbers.
 *
 * GIBS spells unbounded intervals with "+INF" / "-INF", which parseFloat does
 * not understand (it only accepts "Infinity"), so they are matched explicitly.
 * Infinite bounds are clamped to the largest finite double because JSON has no
 * representation for Infinity (JSON.stringify would otherwise emit null).
 *
 * Parameters:
 * value [string] Raw value attribute, e.g. "[350,+INF)"
 *
 * Returns an array of finite numbers, one per interval bound
 */
function parseColormapValue (value) {
  const items = String(value).replace(/[()[\]]/g, '').split(',')
  return items.map((item) => {
    const token = item.trim()
    if (/^\+?INF(INITY)?$/i.test(token)) {
      return Number.MAX_VALUE
    }
    if (/^-INF(INITY)?$/i.test(token)) {
      return -Number.MAX_VALUE
    }
    const v = parseFloat(token)
    if (Number.isNaN(v)) {
      throw new Error(`Invalid value: ${value}`)
    }
    if (v === Number.POSITIVE_INFINITY) {
      return Number.MAX_VALUE
    }
    if (v === Number.NEGATIVE_INFINITY) {
      return -Number.MAX_VALUE
    }
    return v
  })
}

module.exports = {
  dictMerge,
  parseColormapValue
}
