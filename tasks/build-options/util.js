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

module.exports = {
  dictMerge
}
